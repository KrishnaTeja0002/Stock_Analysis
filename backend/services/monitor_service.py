import asyncio
import time
from typing import Dict, List, Set, Any, Optional
from datetime import datetime
import pytz
import database
from models import IndianStockIntelligenceResult, AssetConfig, SoundProfileConfig
from engine.trend_engine import analyze_indian_stock
from engine.us_engine import USEquityEngine
from engine.crypto_engine import CryptoMarketEngine
from engine.alert_manager import AlertManager
from engine.pattern_engine import PatternEngine
from engine.comprehensive_intelligence_engine import ComprehensiveIntelligenceEngine
from services.data_provider import MarketDataProvider
import numpy as np
import pandas as pd
import math

def sanitize_floats(obj: Any) -> Any:
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: sanitize_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_floats(item) for item in obj]
    return obj

IST = pytz.timezone('Asia/Kolkata')

class MonitoringService:
    def __init__(self):
        self.provider = MarketDataProvider()
        self.alert_manager = AlertManager()
        self.active_tasks: Dict[str, asyncio.Task] = {}
        self.is_running: bool = False
        self.websocket_subscribers: Set[Any] = set()
        self.latest_results: Dict[str, IndianStockIntelligenceResult] = {}
        self.poll_interval_seconds: float = 6.0

    @property
    def subscribers(self) -> Set[Any]:
        return self.websocket_subscribers

    def register_client(self, ws: Any):
        self.websocket_subscribers.add(ws)

    def unregister_client(self, ws: Any):
        self.websocket_subscribers.discard(ws)

    def register_websocket(self, ws: Any):
        self.register_client(ws)

    def unregister_websocket(self, ws: Any):
        self.unregister_client(ws)

    async def broadcast(self, message: Dict[str, Any]):
        cleaned_msg = sanitize_floats(message)
        dead_sockets = set()
        for ws in list(self.websocket_subscribers):
            try:
                await ws.send_json(cleaned_msg)
            except Exception:
                dead_sockets.add(ws)
        self.websocket_subscribers -= dead_sockets

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        assets = await database.get_all_assets()
        for asset in assets:
            if asset.is_monitored:
                self.start_monitoring_asset(
                    asset.symbol, asset.name, asset.nse_symbol or asset.symbol, asset.sector,
                    asset.index_membership, asset.market_cap_category,
                    asset.timeframe, asset.provider, asset.cooldown_seconds
                )

    async def stop(self):
        self.is_running = False
        for sym, task in list(self.active_tasks.items()):
            task.cancel()
        self.active_tasks.clear()

    def start_monitoring_asset(
        self, symbol: str, name: str = "", nse_symbol: str = "",
        sector: str = "Broad Market", index_membership: str = "NIFTY 50",
        market_cap: str = "Large Cap", timeframe: str = "5m",
        provider: str = "yfinance", cooldown: int = 120
    ):
        if symbol in self.active_tasks and not self.active_tasks[symbol].done():
            return
        task = asyncio.create_task(
            self._monitor_asset_loop(
                symbol, name, nse_symbol, sector, index_membership, market_cap, timeframe, provider, cooldown
            )
        )
        self.active_tasks[symbol] = task

    def stop_monitoring_asset(self, symbol: str):
        if symbol in self.active_tasks:
            self.active_tasks[symbol].cancel()
            del self.active_tasks[symbol]

    async def _monitor_asset_loop(
        self, symbol: str, name: str, nse_symbol: str, sector: str,
        index_membership: str, market_cap: str, timeframe: str,
        provider: str, cooldown: int
    ):
        mkt = self.provider.detect_market(symbol)
        tick_size = 0.05 if mkt == "india" else 0.01 if mkt == "us" else 0.25

        while self.is_running:
            try:
                # 1. Fetch baseline OHLCV history
                df, source_type = await self.provider.get_data(
                    symbol=symbol, timeframe=timeframe, period="5d", provider=provider
                )

                if mkt == "us":
                    result = USEquityEngine.analyze_us_stock(
                        df=df, symbol=symbol, name=name, sector=sector,
                        index_membership=index_membership, market_cap=market_cap,
                        timeframe=timeframe, source_type=source_type
                    )
                elif mkt == "crypto":
                    result = CryptoMarketEngine.analyze_crypto_asset(
                        df=df, symbol=symbol, name=name, sector=sector,
                        exchange=index_membership, timeframe=timeframe, source_type=source_type
                    )
                else:
                    result = analyze_indian_stock(
                        df=df, symbol=symbol, name=name, nse_symbol=nse_symbol,
                        sector=sector, index_membership=index_membership,
                        market_cap=market_cap, timeframe=timeframe, source_type=source_type
                    )

                prev_close = float(df['close'].iloc[-2]) if len(df) >= 2 else float(df['close'].iloc[-1])
                live_close = float(df['close'].iloc[-1])
                live_open = float(df['open'].iloc[-1])
                live_high = float(df['high'].iloc[-1])
                live_low = float(df['low'].iloc[-1])
                live_vol = float(df.get('volume', pd.Series([1000])).iloc[-1])
                last_idx = df.index[-1]

                comprehensive_intel = ComprehensiveIntelligenceEngine.get_full_intelligence(
                    symbol=symbol, name=name, df=df, current_price=live_close, market=mkt
                )

                try:
                    ts_sec = int(last_idx.timestamp()) if hasattr(last_idx, 'timestamp') else int(pd.to_datetime(last_idx).timestamp())
                except Exception:
                    ts_sec = 0

                # 2. Sub-second live micro-tick loop (fluctuates live like a real exchange)
                # Runs 8 micro-ticks (1.2s each = ~10s total) before resyncing base history
                for _ in range(8):
                    if not self.is_running:
                        break

                    # Momentum-biased micro tick
                    trend_score = getattr(result.signal_scores, 'price_trend_score', 0.0)
                    drift_prob_up = 0.5 + (0.15 * (trend_score / 100.0))
                    drift_prob_up = max(0.2, min(0.8, drift_prob_up))

                    direction = float(np.random.choice([1, -1, 0], p=[drift_prob_up * 0.8, (1.0 - drift_prob_up) * 0.8, 0.2]))
                    multiplier = float(np.random.choice([1, 1, 2]))
                    delta = round(direction * tick_size * multiplier, 2)

                    live_close = round(live_close + delta, 2)
                    live_high = round(max(live_high, live_close), 2)
                    live_low = round(min(live_low, live_close), 2)
                    live_vol += float(np.random.randint(10, 250))

                    # Update latest row in df copy for live pattern detection
                    df.iloc[-1, df.columns.get_loc('close')] = live_close
                    df.iloc[-1, df.columns.get_loc('high')] = live_high
                    df.iloc[-1, df.columns.get_loc('low')] = live_low

                    # Real-time pattern detection
                    pattern_info = PatternEngine.detect_patterns(df, symbol)

                    # Update result metrics
                    result.current_price = live_close
                    result.price_change_pct = round(((live_close - prev_close) / prev_close) * 100.0, 2) if prev_close > 0 else 0.0
                    result_dict = result.dict()
                    result_dict["pattern_prediction"] = pattern_info
                    result_dict["comprehensive_intel"] = comprehensive_intel
                    result_dict["current_price"] = live_close
                    result_dict["price_change_pct"] = result.price_change_pct

                    state_val = result.momentum_state if isinstance(result.momentum_state, str) else result.momentum_state.value
                    should_alert, _ = self.alert_manager.evaluate_alert(
                        symbol=symbol,
                        current_state=state_val,
                        current_severity=result.severity,
                        custom_cooldown=cooldown
                    )
                    result_dict["should_alert"] = should_alert

                    self.latest_results[symbol] = result

                    latest_candle = {
                        "timestamp": str(last_idx),
                        "time": ts_sec,
                        "open": live_open,
                        "high": live_high,
                        "low": live_low,
                        "close": live_close,
                        "volume": round(live_vol, 1),
                        "vwap": round(float(df['close'].tail(20).mean()), 2)
                    }

                    payload = {
                        "type": "TICK_UPDATE",
                        "symbol": symbol,
                        "data": result_dict,
                        "latest_candle": latest_candle,
                        "pattern_prediction": pattern_info,
                        "tick_direction": "UP" if delta > 0 else "DOWN" if delta < 0 else "FLAT",
                        "alert_triggered": should_alert,
                    }
                    await self.broadcast(payload)
                    await asyncio.sleep(1.2)

            except asyncio.CancelledError:
                break
            except Exception as e:
                err_payload = {
                    "type": "MONITOR_ERROR",
                    "symbol": symbol,
                    "error": str(e),
                    "timestamp": datetime.now(IST).strftime("%Y-%m-%d %H:%M:%S IST")
                }
                await self.broadcast(err_payload)
                await asyncio.sleep(2.0)

monitor_service = MonitoringService()
