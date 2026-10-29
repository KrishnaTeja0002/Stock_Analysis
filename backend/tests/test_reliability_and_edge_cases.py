import pytest
import pandas as pd
import numpy as np
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models import IndianMomentumState
from engine.trend_engine import enrich_indicators, analyze_indian_stock
from engine.classifier import evaluate_indian_momentum
from services.data_provider import MarketDataProvider
from services.validator import validate_ohlcv_dataframe

provider = MarketDataProvider()

def test_no_lookahead_bias():
    """
    Critical requirement: verify that indicators and momentum classification for bar N
    are strictly identical whether evaluated on a truncated DataFrame [0..N]
    or on the full historical series [0..N+50].
    """
    df, _ = provider.generate_synthetic_data(scenario="trend_up", bars=100)
    
    # Analyze full
    full_enriched = enrich_indicators(df)
    state_full, _, _, scores_full, _, rule_full, _ = evaluate_indian_momentum(45, full_enriched)

    # Analyze truncated at bar 45
    truncated_df = df.iloc[:46].copy()
    trunc_enriched = enrich_indicators(truncated_df)
    state_trunc, _, _, scores_trunc, _, rule_trunc, _ = evaluate_indian_momentum(45, trunc_enriched)

    assert state_full == state_trunc
    assert abs(scores_full.price_trend_score - scores_trunc.price_trend_score) < 1e-4
    assert rule_full == rule_trunc

def test_duplicate_and_out_of_order_detection():
    """Detect non-monotonic or duplicated timestamps."""
    df, _ = provider.generate_synthetic_data(bars=40)
    
    df_dup = df.copy()
    idx = list(df_dup.index)
    idx[5] = idx[4]
    df_dup.index = pd.DatetimeIndex(idx)

    is_valid, msg = validate_ohlcv_dataframe(df_dup)
    assert not is_valid
    assert "duplicate" in msg.lower() or "out-of-order" in msg.lower()

def test_insufficient_data_warmup():
    """If fewer than 15 bars are provided, engine safely returns UNCERTAIN without crashing."""
    df, _ = provider.generate_synthetic_data(bars=8)
    res = analyze_indian_stock(df, symbol="RELIANCE.NS", timeframe="5m")
    assert res.momentum_state == IndianMomentumState.UNCERTAIN
    assert "WARMUP" in res.trigger_rule or "INITIAL" in res.trigger_rule
