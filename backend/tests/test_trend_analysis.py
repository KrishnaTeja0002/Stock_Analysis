import pytest
import pandas as pd
import numpy as np
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models import IndianMomentumState, AlertSeverity
from engine.indicators import (
    calculate_ema, calculate_atr, calculate_rsi, calculate_macd,
    calculate_bollinger_bands, calculate_donchian_channels,
    calculate_intraday_vwap, calculate_relative_volume_tod
)
from engine.classifier import evaluate_indian_momentum
from engine.trend_engine import enrich_indicators, analyze_indian_stock
from engine.alert_manager import AlertManager
from engine.backtester import run_historical_backtest
from services.data_provider import MarketDataProvider
from services.validator import validate_ohlcv_dataframe

provider = MarketDataProvider()

def test_indicators_math():
    """Verify indicators output shapes and numerical stability."""
    close = pd.Series([2500.0 + i for i in range(50)])
    high = close + 5.0
    low = close - 5.0
    volume = pd.Series([10000 + i * 500 for i in range(50)])
    df = pd.DataFrame({'open': close, 'high': high, 'low': low, 'close': close, 'volume': volume})
    
    ema = calculate_ema(close, 9)
    assert len(ema) == 50
    assert ema.iloc[-1] > ema.iloc[0]

    atr = calculate_atr(high, low, close, 14)
    assert len(atr) == 50
    assert (atr > 0).all()

    rsi = calculate_rsi(close, 14)
    assert len(rsi) == 50
    assert (rsi >= 0).all() and (rsi <= 100).all()
    assert rsi.iloc[-1] > 90.0

    vwap = calculate_intraday_vwap(df)
    assert len(vwap) == 50
    assert (vwap > 0).all()

    macd, sig, hist = calculate_macd(close)
    assert len(hist) == 50

    up, mid, low_bb, bw, pct_b = calculate_bollinger_bands(close, 20)
    assert (up >= mid).all()
    assert (up[1:] > mid[1:]).all()

def test_indian_momentum_states():
    """Verify 14-state momentum classification across Indian equity market scenarios."""
    # 1. Upward Momentum
    df_up, _ = provider.generate_synthetic_data(scenario="trend_up", bars=100)
    enriched_up = enrich_indicators(df_up)
    state, stability, hyp, scores, severity, rule, exp = evaluate_indian_momentum(len(enriched_up) - 1, enriched_up)
    assert state in [IndianMomentumState.CONFIRMED_UP, IndianMomentumState.ACCELERATING_UP, IndianMomentumState.EARLY_UP, IndianMomentumState.POTENTIAL_BREAKOUT]
    assert scores.price_trend_score > 0
    assert len(exp.evidence_for) > 0

    # 2. Downward Momentum
    df_down, _ = provider.generate_synthetic_data(scenario="trend_down", bars=100)
    enriched_down = enrich_indicators(df_down)
    state, stability, hyp, scores, severity, rule, exp = evaluate_indian_momentum(len(enriched_down) - 1, enriched_down)
    assert state in [IndianMomentumState.CONFIRMED_DOWN, IndianMomentumState.ACCELERATING_DOWN, IndianMomentumState.EARLY_DOWN, IndianMomentumState.POTENTIAL_BREAKDOWN]
    assert scores.price_trend_score < 0

    # 3. Sideways Market
    df_side, _ = provider.generate_synthetic_data(scenario="sideways", bars=100)
    enriched_side = enrich_indicators(df_side)
    state, stability, hyp, scores, severity, rule, exp = evaluate_indian_momentum(len(enriched_side) - 1, enriched_side)
    assert state in [IndianMomentumState.SIDEWAYS, IndianMomentumState.QUIET, IndianMomentumState.EARLY_UP, IndianMomentumState.EARLY_DOWN, IndianMomentumState.CONFIRMED_DOWN, IndianMomentumState.CONFIRMED_UP]

    # 4. Breakout
    df_break, _ = provider.generate_synthetic_data(scenario="breakout", bars=75)
    enriched_break = enrich_indicators(df_break)
    state, stability, hyp, scores, severity, rule, exp = evaluate_indian_momentum(70, enriched_break)
    assert state == IndianMomentumState.POTENTIAL_BREAKOUT
    assert severity in [AlertSeverity.HIGH, AlertSeverity.URGENT]

    # 5. Breakdown
    df_dump, _ = provider.generate_synthetic_data(scenario="breakdown", bars=75)
    enriched_dump = enrich_indicators(df_dump)
    state, stability, hyp, scores, severity, rule, exp = evaluate_indian_momentum(70, enriched_dump)
    assert state == IndianMomentumState.POTENTIAL_BREAKDOWN
    assert severity in [AlertSeverity.HIGH, AlertSeverity.URGENT]

def test_alert_hysteresis_and_cooldown():
    """Verify alert manager confirmation logic and escalation."""
    mgr = AlertManager()
    sym = "RELIANCE.NS"

    # Bar 1: Early Up (first tick, waiting confirmation)
    t0 = 1000.0
    triggered, reason = mgr.evaluate_alert(sym, IndianMomentumState.EARLY_UP, AlertSeverity.LOW, current_time=t0)
    assert not triggered
    assert "Waiting for confirmation" in reason

    # Bar 2: Early Up confirmed
    t1 = 1060.0
    triggered, reason = mgr.evaluate_alert(sym, IndianMomentumState.EARLY_UP, AlertSeverity.LOW, current_time=t1)
    assert triggered

    # Bar 3: Immediate repeat within cooldown -> suppressed
    t2 = 1070.0
    triggered, reason = mgr.evaluate_alert(sym, IndianMomentumState.EARLY_UP, AlertSeverity.LOW, current_time=t2)
    assert not triggered
    assert "Suppressed by cooldown" in reason

    # Bar 4: Escalation to Urgent Breakout! Must bypass lower severity cooldown
    t3 = 1080.0
    triggered, reason = mgr.evaluate_alert(sym, IndianMomentumState.POTENTIAL_BREAKOUT, AlertSeverity.URGENT, current_time=t3)
    assert triggered
    assert "Alert confirmed" in reason

def test_data_validation():
    """Test data validation for Indian stock feeds."""
    df, _ = provider.generate_synthetic_data(scenario="trend_up", bars=50)
    is_valid, msg = validate_ohlcv_dataframe(df)
    assert is_valid

    # Corrupt High < Low
    bad_df = df.copy()
    bad_df.loc[bad_df.index[5], 'high'] = bad_df.loc[bad_df.index[5], 'low'] - 100.0
    is_valid, msg = validate_ohlcv_dataframe(bad_df)
    assert not is_valid
    assert "Integrity violation" in msg

def test_indian_backtest_with_cost_drag():
    """Test walk-forward backtest calculates continuation and slippage/cost drag correctly."""
    df, _ = provider.generate_synthetic_data(scenario="trend_up", bars=100)
    res = run_historical_backtest(df, symbol="RELIANCE.NS", timeframe="5m", period="5d")
    
    assert "metrics" in res
    assert res["metrics"].total_bars == 100
    assert res["metrics"].slippage_and_cost_drag_pct == 0.08
    assert res["metrics"].trend_continuation_rate_5bar >= 0.0
