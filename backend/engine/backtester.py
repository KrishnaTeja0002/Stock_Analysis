import pandas as pd
import numpy as np
from typing import Dict, Any, List
from engine.trend_engine import enrich_indicators
from engine.classifier import evaluate_indian_momentum
from engine.alert_manager import AlertManager
from models import IndianMomentumState, AlertSeverity, BacktestMetrics, Candle

def run_historical_backtest(
    df: pd.DataFrame,
    symbol: str,
    timeframe: str,
    period: str,
    horizon_bars: int = 5
) -> Dict[str, Any]:
    """
    Simulates trend classification and alert rules across historical candles strictly
    without lookahead bias, tracking forward continuation and false alert statistics.
    """
    if len(df) < 25:
        raise ValueError(f"Insufficient historical data ({len(df)} bars). Minimum 25 required.")

    enriched = enrich_indicators(df)
    n = len(enriched)

    alert_mgr = AlertManager()
    alerts_timeline: List[Dict[str, Any]] = []
    state_durations: List[int] = []
    current_state_run = 0
    prev_state: IndianMomentumState = None

    alerts_by_state: Dict[str, int] = {}
    alerts_by_severity: Dict[int, int] = {1: 0, 2: 0, 3: 0, 4: 0}

    successful_continuations_5 = 0
    successful_continuations_15 = 0
    evaluated_alerts_count = 0
    false_alerts = 0

    # Determine market-specific transaction cost drag
    market = "india"
    cost_drag = 0.08
    if symbol.endswith("-USD") or symbol.endswith("USDT") or "BTC" in symbol or "ETH" in symbol or "SOL" in symbol:
        market = "crypto"
        cost_drag = 0.05
    elif "." not in symbol or symbol in ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "TSLA", "META", "SPY", "QQQ"]:
        market = "us"
        cost_drag = 0.015

    for i in range(15, n):
        row = enriched.iloc[i]
        sim_time = i * 60.0

        state, stability, hypothesis, scores, severity, rule, explanation = evaluate_indian_momentum(
            i, enriched, prev_state
        )

        if state == prev_state:
            current_state_run += 1
        else:
            if current_state_run > 0:
                state_durations.append(current_state_run)
            current_state_run = 1
            prev_state = state

        triggered, status_reason = alert_mgr.evaluate_alert(
            symbol=symbol,
            current_state=state,
            current_severity=severity,
            current_time=sim_time
        )

        if triggered:
            alerts_by_state[state.value] = alerts_by_state.get(state.value, 0) + 1
            alerts_by_severity[severity.value] = alerts_by_severity.get(severity.value, 0) + 1

            curr_close = float(row['close'])
            alert_entry = {
                "bar_index": i,
                "timestamp": str(row.name if isinstance(row.name, (pd.Timestamp, str)) else f"Bar-{i}"),
                "price": curr_close,
                "trend_state": state.value,
                "trend_score": scores.price_trend_score,
                "severity": severity.value,
                "rule": rule,
                "reason": explanation.what_happened,
            }

            if i + horizon_bars < n:
                fwd_close_5 = float(enriched.iloc[i + horizon_bars]['close'])
                fwd_ret_5 = ((fwd_close_5 - curr_close) / curr_close) * 100.0
                alert_entry["forward_return_5bar"] = round(fwd_ret_5, 2)
                evaluated_alerts_count += 1

                # Bullish criteria
                if "up" in state.value.lower() or "breakout" in state.value.lower() or "bullish" in state.value.lower():
                    if fwd_ret_5 > cost_drag:  # Net of market-specific friction
                        successful_continuations_5 += 1
                    else:
                        false_alerts += 1

                # Bearish criteria
                elif "down" in state.value.lower() or "breakdown" in state.value.lower() or "bearish" in state.value.lower():
                    if fwd_ret_5 < -cost_drag:
                        successful_continuations_5 += 1
                    else:
                        false_alerts += 1

            if i + 15 < n:
                fwd_close_15 = float(enriched.iloc[i + 15]['close'])
                fwd_ret_15 = ((fwd_close_15 - curr_close) / curr_close) * 100.0
                alert_entry["forward_return_15bar"] = round(fwd_ret_15, 2)
                if (("up" in state.value.lower() or "breakout" in state.value.lower() or "bullish" in state.value.lower()) and fwd_ret_15 > cost_drag) or \
                   (("down" in state.value.lower() or "breakdown" in state.value.lower() or "bearish" in state.value.lower()) and fwd_ret_15 < -cost_drag):
                    successful_continuations_15 += 1

            alerts_timeline.append(alert_entry)

    if current_state_run > 0:
        state_durations.append(current_state_run)

    atr_series = enriched['atr'].dropna()
    atr_rolling_median = atr_series.rolling(30, min_periods=5).median()
    vol_regimes = int(((atr_series / atr_rolling_median) > 1.8).sum())

    continuation_rate_5 = (successful_continuations_5 / evaluated_alerts_count * 100.0) if evaluated_alerts_count > 0 else 0.0
    continuation_rate_15 = (successful_continuations_15 / evaluated_alerts_count * 100.0) if evaluated_alerts_count > 0 else 0.0
    false_alert_rate = (false_alerts / evaluated_alerts_count * 100.0) if evaluated_alerts_count > 0 else 0.0
    avg_duration = float(np.mean(state_durations)) if state_durations else 1.0

    limitations = {
        "india": "Evaluated strictly without lookahead bias. Indian cash equity round-trip cost drag (STT, NSE turnover charges, SEBI fee, GST, stamp duty) set at 0.08% hurdle rate.",
        "us": "Evaluated strictly without lookahead bias. US equity friction (SEC/FINRA fees, estimated bid-ask spread drag) set at 0.015% hurdle rate.",
        "crypto": "Evaluated strictly without lookahead bias. Crypto maker/taker fee drag and network slippage set at 0.05% hurdle rate."
    }

    metrics = BacktestMetrics(
        total_bars=n,
        total_alerts=len(alerts_timeline),
        alerts_by_state=alerts_by_state,
        alerts_by_severity=alerts_by_severity,
        trend_continuation_rate_5bar=round(continuation_rate_5, 1),
        trend_continuation_rate_15bar=round(continuation_rate_15, 1),
        false_alert_rate=round(false_alert_rate, 1),
        avg_trend_duration_bars=round(avg_duration, 1),
        volatility_regime_changes=vol_regimes,
        evaluated_horizon_bars=horizon_bars,
        slippage_and_cost_drag_pct=cost_drag,
        limitations_note=limitations.get(market, limitations["india"])
    )

    candles_out = []
    for idx, r in enriched.iterrows():
        candles_out.append(Candle(
            timestamp=str(idx if isinstance(idx, (pd.Timestamp, str)) else f"Bar-{idx}"),
            open=round(float(r['open']), 2),
            high=round(float(r['high']), 2),
            low=round(float(r['low']), 2),
            close=round(float(r['close']), 2),
            volume=round(float(r.get('volume', 0.0)), 1),
            vwap=round(float(r.get('vwap', r['close'])), 2)
        ))

    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "period": period,
        "candles": candles_out,
        "timeline_alerts": alerts_timeline,
        "metrics": metrics
    }
