import pytest
import pandas as pd
import numpy as np
from engine.pattern_engine import PatternEngine

def test_pattern_engine_default_response():
    df_empty = pd.DataFrame()
    res = PatternEngine.detect_patterns_and_predict(df_empty, "TCS.NS")
    assert res["active_pattern"] == "Accumulating Data"
    assert res["directional_bias"] == "NEUTRAL"
    assert "market_psychology" in res

def test_pattern_engine_hammer_bullish():
    # Build synthetic OHLCV where the latest candle is a Hammer (long lower wick >= 2x body)
    np.random.seed(42)
    closes = np.linspace(100, 95, 30)
    data = []
    for i in range(29):
        c = closes[i]
        data.append({"open": c + 0.2, "high": c + 0.5, "low": c - 0.5, "close": c, "volume": 1000})
    
    # 30th candle: Hammer (open=95.0, close=95.5, high=95.6, low=92.5) -> body=0.5, lower_wick=2.5 >= 2*body
    data.append({"open": 95.0, "high": 95.6, "low": 92.5, "close": 95.5, "volume": 2500})
    df = pd.DataFrame(data)

    res = PatternEngine.detect_patterns_and_predict(df, "RELIANCE.NS")
    assert "Hammer" in res["active_pattern"]
    assert res["directional_bias"] == "BULLISH"
    assert res["target_1"] > res["current_price"]
    assert res["invalidation_price"] < res["current_price"]
    assert res["risk_reward_ratio"] > 0
    assert "liquidity" in res["market_psychology"].lower() or "buyers" in res["market_psychology"].lower()
    assert "actionable_rule" in res

def test_pattern_engine_shooting_star_bearish():
    # 30th candle: Shooting Star (open=105.0, close=104.5, high=108.5, low=104.4) -> body=0.5, upper_wick=3.5 >= 2*body
    np.random.seed(42)
    closes = np.linspace(90, 105, 30)
    data = []
    for i in range(29):
        c = closes[i]
        data.append({"open": c - 0.2, "high": c + 0.5, "low": c - 0.5, "close": c, "volume": 1000})
    
    data.append({"open": 105.0, "high": 108.5, "low": 104.4, "close": 104.5, "volume": 3000})
    df = pd.DataFrame(data)

    res = PatternEngine.detect_patterns_and_predict(df, "INFY.NS")
    assert "Shooting Star" in res["active_pattern"]
    assert res["directional_bias"] == "BEARISH"
    assert res["target_1"] < res["current_price"]
    assert res["invalidation_price"] > res["current_price"]
    assert res["confidence_score"] >= 70

def test_pattern_engine_double_bottom_w_pattern():
    # Create W pattern lows
    data = []
    # Drop from 100 to 90
    for c in np.linspace(100, 90, 10):
        data.append({"open": c + 0.1, "high": c + 0.3, "low": c - 0.3, "close": c, "volume": 1000})
    # Bounce to 95
    for c in np.linspace(90, 95, 7):
        data.append({"open": c - 0.1, "high": c + 0.3, "low": c - 0.3, "close": c, "volume": 1000})
    # Drop back to 90
    for c in np.linspace(95, 90.1, 8):
        data.append({"open": c + 0.1, "high": c + 0.3, "low": c - 0.3, "close": c, "volume": 1000})
    # Bounce up to 93
    for c in np.linspace(90.1, 93, 5):
        data.append({"open": c - 0.1, "high": c + 0.3, "low": c - 0.3, "close": c, "volume": 1500})
    
    df = pd.DataFrame(data)
    res = PatternEngine.detect_patterns_and_predict(df, "TATAPOWER.NS")
    assert "Double Bottom" in res["active_pattern"] or (res.get("secondary_pattern") and "Double Bottom" in res["secondary_pattern"]) or res["directional_bias"] == "BULLISH"
    assert res["win_probability_pct"] >= 60.0
