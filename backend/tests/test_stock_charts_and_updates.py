import pytest
import pandas as pd
import numpy as np
import json
import math
import asyncio
from datetime import datetime, timezone
from services.data_provider import MarketDataProvider
from engine.trend_engine import enrich_indicators, analyze_indian_stock
from engine.indicators import calculate_support_resistance, calculate_normalized_slope
from models import TrendStability
from engine.scenario_engine import ScenarioEngine
from main import sanitize_floats

provider = MarketDataProvider()

def run_async(coro):
    return asyncio.run(coro)

def test_stock_selection_isolation():
    """Verify selecting Stock A vs Stock B loads strictly distinct data and never overlaps."""
    df_rel, _ = run_async(provider.fetch_yfinance_data("RELIANCE.NS", timeframe="5m", period="5d"))
    df_tcs, _ = run_async(provider.fetch_yfinance_data("TCS.NS", timeframe="5m", period="5d"))

    assert len(df_rel) > 0
    assert len(df_tcs) > 0

    # Ensure prices are distinct and not cross-contaminated
    rel_close = df_rel['close'].iloc[-1]
    tcs_close = df_tcs['close'].iloc[-1]
    assert rel_close != tcs_close

    analysis_rel = analyze_indian_stock(df_rel, "RELIANCE.NS")
    analysis_tcs = analyze_indian_stock(df_tcs, "TCS.NS")

    assert analysis_rel.symbol == "RELIANCE.NS"
    assert analysis_tcs.symbol == "TCS.NS"
    assert analysis_rel.current_price == pytest.approx(rel_close, rel=1e-3)
    assert analysis_tcs.current_price == pytest.approx(tcs_close, rel=1e-3)

def test_timeframe_switching_and_indicators():
    """Verify switching timeframes (1m, 5m, 15m, 1h, 1d) calculates valid candles and indicators without NaN."""
    timeframes = ["1m", "5m", "15m", "1h", "1d"]
    periods = {
        "1m": "2d",
        "5m": "5d",
        "15m": "1mo",
        "1h": "1mo",
        "1d": "1y"
    }

    for tf in timeframes:
        df, _ = run_async(provider.fetch_yfinance_data("INFY.NS", timeframe=tf, period=periods[tf]))
        assert len(df) >= 5, f"Expected at least 5 candles for {tf}"
        enriched = enrich_indicators(df)
        
        # Verify essential columns exist and have non-NaN values at the latest bar
        for col in ['ema9', 'ema20', 'rsi', 'macd', 'macd_hist', 'bb_upper', 'bb_lower', 'atr']:
            assert col in enriched.columns
            val = enriched[col].iloc[-1]
            assert not pd.isna(val), f"Column {col} is NaN for timeframe {tf}"
            assert not math.isinf(val), f"Column {col} is Inf for timeframe {tf}"

def test_short_series_support_resistance_safety():
    """Verify that short series (< 6 bars) does not produce NaN or break JSON serialization."""
    short_df = pd.DataFrame({
        "open": [100.0, 102.0, 101.0, 103.0],
        "high": [103.0, 104.0, 103.5, 105.0],
        "low": [99.0, 101.0, 100.0, 102.0],
        "close": [102.0, 101.5, 103.0, 104.5],
        "volume": [1000.0, 1500.0, 1200.0, 1800.0]
    })
    
    sup, res = calculate_support_resistance(short_df, window=5)
    assert not sup.isna().any(), "Support should not have NaNs even on short series"
    assert not res.isna().any(), "Resistance should not have NaNs even on short series"

    scenario = ScenarioEngine.generate_scenario(
        symbol="TEST.NS",
        market="india",
        current_price=104.5,
        momentum_state="Confirmed upward momentum",
        trend_stability=TrendStability.STABLE_UP,
        df=short_df,
        vwap=103.0,
        rvol=1.2,
        support=float(sup.iloc[-1]),
        resistance=float(res.iloc[-1]),
    )

    scenario_dict = scenario.model_dump() if hasattr(scenario, "model_dump") else scenario.dict()
    sanitized = sanitize_floats(scenario_dict)
    
    # Must serialize with allow_nan=False without raising ValueError
    dumped = json.dumps(sanitized, allow_nan=False)
    assert "invalidation_price" in dumped

def test_sanitize_floats_handles_nan_and_inf():
    """Verify sanitize_floats strips NaNs and Infinities cleanly."""
    data = {
        "valid": 123.45,
        "nan_val": float('nan'),
        "inf_val": float('inf'),
        "nested": {
            "neg_inf": float('-inf'),
            "arr": [1.0, float('nan'), 3.0]
        }
    }
    cleaned = sanitize_floats(data)
    assert cleaned["valid"] == 123.45
    assert cleaned["nan_val"] is None
    assert cleaned["inf_val"] is None
    assert cleaned["nested"]["neg_inf"] is None
    assert cleaned["nested"]["arr"] == [1.0, None, 3.0]
    
    # JSON serialization test
    json_str = json.dumps(cleaned, allow_nan=False)
    assert "null" in json_str
