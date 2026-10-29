from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

import database
from models import (
    AssetConfig, SoundProfileConfig, HistoricalAnalysisRequest,
    HistoricalAnalysisResponse, IndianStockIntelligenceResult,
    MarketOverviewResponse, ScannerQuery, MarketCategory,
    MarketRegimeReport, ScenarioForecast, GlobalMarketSummary
)
from services.data_provider import MarketDataProvider
from services.monitor_service import monitor_service
from engine.trend_engine import analyze_indian_stock
from engine.us_engine import USEquityEngine
from engine.crypto_engine import CryptoMarketEngine
from engine.regime_detector import RegimeDetector
from engine.scenario_engine import ScenarioEngine
from engine.backtester import run_historical_backtest
from engine.pattern_engine import PatternEngine
from engine.comprehensive_intelligence_engine import ComprehensiveIntelligenceEngine

data_provider = MarketDataProvider()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.init_db()
    await monitor_service.start()
    yield
    await monitor_service.stop()

app = FastAPI(
    title="Multi-Market Intelligence Platform API",
    description="Quantitative decision-support engine for Indian Equities, US Equities, and Cryptocurrencies.",
    version="3.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Cross-Market & Regional Market Overviews ---

@app.get("/api/overview")
async def get_cross_market_overview():
    """Returns top-level cross-market intelligence summary across India, US, and Crypto."""
    return await data_provider.get_global_overview()

@app.get("/api/market-overview")
async def get_market_overview(market: str = Query("india")):
    """Returns dedicated market overview for India, US, or Crypto."""
    return await data_provider.get_market_overview(market=market)

@app.get("/api/regime/{market}", response_model=MarketRegimeReport)
async def get_market_regime(market: str):
    cat = MarketCategory.INDIA if market.lower() == "india" else MarketCategory.US if market.lower() == "us" else MarketCategory.CRYPTO
    benchmark_symbol = "^NSEI" if cat == MarketCategory.INDIA else "SPY" if cat == MarketCategory.US else "BTC-USD"
    try:
        df, _ = await data_provider.get_data(benchmark_symbol, timeframe="1d", period="3mo")
    except Exception:
        df, _ = data_provider.generate_synthetic_data(benchmark_symbol, scenario="trend_up", bars=60)
    return RegimeDetector.detect_regime(cat, df)

# --- Asset Management Endpoints ---

@app.get("/api/assets", response_model=List[AssetConfig])
async def list_assets(market: Optional[str] = Query(None)):
    return await database.get_all_assets(market=market)

@app.post("/api/assets", response_model=AssetConfig)
async def upsert_asset(asset: AssetConfig):
    await database.upsert_asset(asset)
    if asset.is_monitored:
        monitor_service.start_monitoring_asset(
            asset.symbol, asset.name, asset.nse_symbol, asset.sector,
            asset.index_membership, asset.market_cap_category,
            asset.timeframe, asset.provider, asset.cooldown_seconds
        )
    else:
        monitor_service.stop_monitoring_asset(asset.symbol)
    return asset

@app.delete("/api/assets/{symbol}")
async def remove_asset(symbol: str):
    monitor_service.stop_monitoring_asset(symbol)
    await database.delete_asset(symbol)
    return {"status": "deleted", "symbol": symbol}

@app.post("/api/assets/{symbol}/toggle")
async def toggle_asset_monitoring(symbol: str, monitored: bool = Query(...)):
    assets = await database.get_all_assets()
    target = next((a for a in assets if a.symbol == symbol), None)
    if not target:
        raise HTTPException(status_code=404, detail="Asset not found")
    target.is_monitored = monitored
    await database.upsert_asset(target)
    if monitored:
        monitor_service.start_monitoring_asset(
            target.symbol, target.name, target.nse_symbol, target.sector,
            target.index_membership, target.market_cap_category,
            target.timeframe, target.provider, target.cooldown_seconds
        )
    else:
        monitor_service.stop_monitoring_asset(target.symbol)
    return {"symbol": symbol, "is_monitored": monitored}

import asyncio
import yfinance as yf

@app.get("/api/search")
async def search_assets(q: str = Query(..., min_length=1)):
    """Search for any company or ticker in India, US, or Crypto markets via yfinance."""
    q_str = q.strip()
    if not q_str:
        return []
    
    results = []
    try:
        loop = asyncio.get_event_loop()
        def _search():
            return yf.Search(q_str, max_results=8).quotes
        quotes = await loop.run_in_executor(None, _search)
        for quote in quotes:
            sym = quote.get("symbol", "")
            if not sym:
                continue
            name = quote.get("longname") or quote.get("shortname") or sym
            exch = quote.get("exchDisp") or quote.get("exchange", "")
            sector = quote.get("sector") or quote.get("sectorDisp") or "Equities"
            mkt = data_provider.detect_market(sym)
            
            nse_sym = sym.replace(".NS", "") if sym.endswith(".NS") else sym
            bse_code = sym.replace(".BO", "") if sym.endswith(".BO") else None
            
            results.append({
                "symbol": sym,
                "name": name,
                "nse_symbol": nse_sym,
                "bse_code": bse_code,
                "sector": sector,
                "exchange": exch,
                "market": mkt,
                "market_cap_category": "Large Cap"
            })
    except Exception as e:
        print("Search error:", e)

    # Provide direct typed ticker option
    upper_q = q_str.upper()
    has_exact = any(r["symbol"].upper() in (upper_q, f"{upper_q}.NS") for r in results)
    if not has_exact:
        default_sym = upper_q if ("." in upper_q or "-" in upper_q) else f"{upper_q}.NS"
        results.insert(0, {
            "symbol": default_sym,
            "name": f"{upper_q} (Add as Ticker)",
            "nse_symbol": upper_q.replace(".NS", ""),
            "bse_code": None,
            "sector": "Equities",
            "exchange": "NSE" if default_sym.endswith(".NS") else "Market",
            "market": data_provider.detect_market(default_sym),
            "market_cap_category": "Equities"
        })

    return results

# --- Sound Profiles ---

@app.get("/api/sound-profiles", response_model=List[SoundProfileConfig])
async def list_sound_profiles(symbol: Optional[str] = None, market: Optional[str] = None):
    return await database.get_sound_profiles(symbol, market=market)

@app.post("/api/sound-profiles")
async def update_sound_profile(profile: SoundProfileConfig):
    await database.save_sound_profile(profile)
    return {"status": "saved", "profile": profile}

# --- Live Analysis & Historical Backtesting ---

import math
import json

def sanitize_floats(obj: Any) -> Any:
    """Recursively converts nan/inf floats to None for valid RFC JSON compliance."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: sanitize_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_floats(item) for item in obj]
    return obj

@app.get("/api/analysis/{symbol}")
async def get_single_analysis(
    symbol: str,
    timeframe: str = Query("5m"),
    period: str = Query("5d"),
    provider: str = Query("yfinance")
):
    assets = await database.get_all_assets()
    target = next((a for a in assets if a.symbol == symbol), None)
    name = target.name if target else symbol
    mkt = target.market if target else data_provider.detect_market(symbol)
    sector = target.sector if target else ("Technology" if mkt == "us" else "Layer 1" if mkt == "crypto" else "Energy")
    index_name = target.index_membership if target else ("S&P 500" if mkt == "us" else "Crypto Top 10" if mkt == "crypto" else "NIFTY 50")
    mcap = target.market_cap_category if target else "Large Cap"
    nse_sym = target.nse_symbol if target else (symbol if mkt != "india" else symbol.replace(".NS", ""))

    # Auto-adjust period for daily, weekly, or 1-minute timeframes to ensure adequate historical bars
    effective_period = period
    if period == "5d":
        if timeframe in ["1d", "1wk"]:
            effective_period = "1y"
        elif timeframe in ["1h", "60m", "30m"]:
            effective_period = "1mo"
        elif timeframe == "1m":
            effective_period = "2d"
        else:
            effective_period = "5d"

    df, source_type = await data_provider.get_data(symbol, timeframe=timeframe, period=effective_period, provider=provider)

    # Sort ascending and remove any duplicate timestamps
    if isinstance(df.index, pd.DatetimeIndex):
        df = df.sort_index()
        df = df[~df.index.duplicated(keep='last')]

    if mkt == "us":
        result = USEquityEngine.analyze_us_stock(
            df, symbol=symbol, name=name, sector=sector,
            index_membership=index_name, market_cap=mcap, timeframe=timeframe, source_type=source_type
        )
    elif mkt == "crypto":
        result = CryptoMarketEngine.analyze_crypto_asset(
            df, symbol=symbol, name=name, sector=sector,
            exchange=target.exchange if target else "Binance", timeframe=timeframe, source_type=source_type
        )
    else:
        result = analyze_indian_stock(
            df, symbol=symbol, name=name, nse_symbol=nse_sym, sector=sector,
            index_membership=index_name, market_cap=mcap, timeframe=timeframe, source_type=source_type
        )

    pattern_prediction = PatternEngine.detect_patterns(df, symbol)
    last_price = float(df['close'].iloc[-1]) if len(df) > 0 else 0.0
    comprehensive_intel = ComprehensiveIntelligenceEngine.get_full_intelligence(
        symbol=symbol, name=name, df=df, current_price=last_price, market=mkt
    )
    result_dict = result.dict()
    result_dict["pattern_prediction"] = pattern_prediction
    result_dict["comprehensive_intel"] = comprehensive_intel

    candles = []
    for idx, r in df.tail(150).iterrows():
        try:
            ts_sec = int(idx.timestamp()) if hasattr(idx, 'timestamp') else int(pd.to_datetime(idx).timestamp())
        except Exception:
            ts_sec = 0
        candles.append({
            "timestamp": str(idx),
            "time": ts_sec,
            "open": round(float(r['open']), 2),
            "high": round(float(r['high']), 2),
            "low": round(float(r['low']), 2),
            "close": round(float(r['close']), 2),
            "volume": round(float(r.get('volume', 0.0)), 1),
            "vwap": round(float(r.get('vwap', r['close'])), 2)
        })

    response_payload = {
        "analysis": result_dict,
        "candles": candles,
        "pattern_prediction": pattern_prediction,
        "comprehensive_intel": comprehensive_intel,
        "source_type": source_type
    }
    return sanitize_floats(response_payload)

@app.get("/api/scenarios/{symbol}")
async def get_symbol_scenarios(symbol: str, timeframe: str = "5m", period: str = "5d"):
    res = await get_single_analysis(symbol, timeframe=timeframe, period=period)
    return res["analysis"].scenario_forecast

@app.post("/api/backtest", response_model=HistoricalAnalysisResponse)
async def run_backtest(req: HistoricalAnalysisRequest):
    df, source_type = await data_provider.get_data(
        symbol=req.symbol, timeframe=req.timeframe, period=req.period, provider=req.provider
    )
    result = run_historical_backtest(
        df=df, symbol=req.symbol, timeframe=req.timeframe, period=req.period
    )
    return result

# --- Multi-Stock & Multi-Market Scanner ---

@app.post("/api/scanner")
async def scan_stocks(query: ScannerQuery):
    assets = await database.get_all_assets(market=query.market if query.market != "all" else None)
    results = []

    for asset in assets:
        if asset.symbol.startswith("^"):
            continue  # skip benchmark indices in individual stock scanner

        # Filter by sector / market cap if requested
        if query.sector and query.sector.lower() != "all":
            if query.sector.lower() not in asset.sector.lower():
                continue
        if query.market_cap and query.market_cap.lower() != "all":
            if query.market_cap.lower() not in asset.market_cap_category.lower():
                continue
        if query.index_name and query.index_name.lower() != "all":
            if query.index_name.lower() not in asset.index_membership.lower():
                continue

        # Fetch latest analysis
        try:
            df, source_type = await data_provider.get_data(asset.symbol, timeframe="5m", period="5d")
            mkt = asset.market or data_provider.detect_market(asset.symbol)

            if mkt == "us":
                analysis = USEquityEngine.analyze_us_stock(
                    df, symbol=asset.symbol, name=asset.name, sector=asset.sector,
                    index_membership=asset.index_membership, market_cap=asset.market_cap_category,
                    timeframe="5m", source_type=source_type
                )
            elif mkt == "crypto":
                analysis = CryptoMarketEngine.analyze_crypto_asset(
                    df, symbol=asset.symbol, name=asset.name, sector=asset.sector,
                    exchange=asset.exchange or "Binance", timeframe="5m", source_type=source_type
                )
            else:
                analysis = analyze_indian_stock(
                    df, symbol=asset.symbol, name=asset.name, nse_symbol=asset.nse_symbol,
                    sector=asset.sector, index_membership=asset.index_membership,
                    market_cap=asset.market_cap_category, timeframe="5m", source_type=source_type
                )

            # Apply quantitative filters
            if query.momentum_state and query.momentum_state.lower() != "all":
                if query.momentum_state.lower() not in analysis.momentum_state.lower():
                    continue

            if query.structural_hypothesis and query.structural_hypothesis.lower() != "all":
                if query.structural_hypothesis.lower() not in analysis.structural_hypothesis.value.lower():
                    continue

            if query.min_relative_volume is not None:
                if analysis.trade_flow.relative_volume_tod < query.min_relative_volume:
                    continue

            if query.above_vwap_only is True:
                if analysis.trade_flow.distance_from_vwap_pct < 0:
                    continue

            results.append(analysis.dict())
        except Exception:
            continue

    # Sorting
    if query.sort_by == "momentum_score":
        results.sort(key=lambda x: x["signal_scores"]["momentum_score"], reverse=(query.sort_order == "desc"))
    elif query.sort_by == "rvol":
        results.sort(key=lambda x: x["trade_flow"]["relative_volume_tod"], reverse=(query.sort_order == "desc"))
    elif query.sort_by == "price_change":
        results.sort(key=lambda x: x["price_change_pct"], reverse=(query.sort_order == "desc"))

    return {
        "count": len(results),
        "results": results
    }

# --- Alert History & Monitoring Controls ---

@app.get("/api/alerts")
async def get_alerts(symbol: Optional[str] = None, limit: int = 50):
    return await database.get_recent_alerts(symbol=symbol, limit=limit)

@app.get("/api/monitor/status")
async def get_monitor_status():
    return {
        "is_running": monitor_service.is_running,
        "monitored_assets": list(monitor_service.monitored_assets.keys()),
        "subscribers_count": len(monitor_service.subscribers)
    }

@app.post("/api/monitor/start")
async def start_monitor():
    await monitor_service.start()
    return {"status": "started"}

@app.post("/api/monitor/stop")
async def stop_monitor():
    await monitor_service.stop()
    return {"status": "stopped"}

# --- WebSocket Streaming ---

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    monitor_service.register_client(websocket)

    try:
        initial_results = {}
        for k, v in monitor_service.latest_results.items():
            initial_results[k] = sanitize_floats(v.dict() if hasattr(v, "dict") else v)

        await websocket.send_json({
            "type": "INITIAL_STATE",
            "is_running": monitor_service.is_running,
            "latest_results": initial_results
        })

        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            else:
                try:
                    client_msg = json.loads(data)
                    if client_msg.get("action") == "subscribe" and "symbol" in client_msg:
                        target_sym = client_msg["symbol"]
                        assets = await database.get_all_assets()
                        asset = next((a for a in assets if a.symbol == target_sym), None)
                        if asset:
                            monitor_service.start_monitoring_asset(
                                asset.symbol, asset.name, asset.nse_symbol, asset.sector,
                                asset.index_membership, asset.market_cap_category,
                                asset.timeframe, asset.provider, asset.cooldown_seconds
                            )
                except Exception:
                    pass
    except WebSocketDisconnect:
        monitor_service.unregister_client(websocket)
    except Exception:
        monitor_service.unregister_client(websocket)
