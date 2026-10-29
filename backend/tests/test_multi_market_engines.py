import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timezone
from engine.us_engine import USEquityEngine
from engine.crypto_engine import CryptoMarketEngine
from engine.regime_detector import RegimeDetector
from engine.scenario_engine import ScenarioEngine
from services.data_provider import MarketDataProvider
from models import MarketCategory, MarketRegime, USMomentumState, CryptoMomentumState, TrendStability

def generate_sample_bars(n=60, base_price=150.0, trend=0.002):
    timestamps = [datetime.now(timezone.utc) for _ in range(n)]
    prices = [base_price]
    for _ in range(1, n):
        prices.append(prices[-1] * (1.0 + trend) + np.random.normal(0, base_price * 0.001))
    
    records = []
    for p in prices:
        records.append({
            "open": round(p * 0.999, 2),
            "high": round(p * 1.003, 2),
            "low": round(p * 0.997, 2),
            "close": round(p, 2),
            "volume": 75000.0
        })
    return pd.DataFrame(records, index=pd.DatetimeIndex(timestamps))

def test_us_equity_engine():
    df = generate_sample_bars(60, base_price=180.0, trend=0.004)
    res = USEquityEngine.analyze_us_stock(
        df=df, symbol="AAPL", name="Apple Inc.", sector="Technology",
        index_membership="S&P 500", market_cap="Mega Cap", timeframe="5m"
    )
    assert res.market == "us"
    assert res.currency == "USD"
    assert res.timezone == "America/New_York"
    assert res.current_price > 0
    assert res.scenario_forecast is not None
    assert len(res.scenario_forecast.support_levels) >= 2
    assert len(res.scenario_forecast.resistance_levels) >= 2

def test_crypto_market_engine():
    df = generate_sample_bars(60, base_price=68000.0, trend=0.005)
    res = CryptoMarketEngine.analyze_crypto_asset(
        df=df, symbol="BTC-USD", name="Bitcoin", sector="Layer 1",
        exchange="Binance", timeframe="5m"
    )
    assert res.market == "crypto"
    assert res.currency == "USD"
    assert res.timezone == "UTC"
    assert res.session_phase == "24/7"
    assert res.scenario_forecast is not None
    assert "liquidation" in res.scenario_forecast.key_risks_and_missing_data[0].lower() or "24/7" in res.scenario_forecast.key_risks_and_missing_data[0].lower()

def test_regime_detector():
    up_df = generate_sample_bars(60, base_price=500.0, trend=0.006)
    up_report = RegimeDetector.detect_regime(MarketCategory.US, up_df, market_breadth_pct=72.0)
    assert up_report.market == MarketCategory.US
    assert up_report.regime in [MarketRegime.TRENDING_UPWARD, MarketRegime.RANGE_BOUND, MarketRegime.HIGH_VOLATILITY]

    stress_report = RegimeDetector.detect_regime(MarketCategory.INDIA, up_df, market_breadth_pct=18.0, macro_stress_level=0.85)
    assert stress_report.regime == MarketRegime.BROAD_MARKET_STRESS
    assert "stress" in stress_report.individual_stock_interpretation.lower()

def test_scenario_invalidation_levels():
    df = generate_sample_bars(50, base_price=100.0, trend=0.003)
    forecast = ScenarioEngine.generate_scenario(
        symbol="MSFT",
        market="us",
        current_price=110.0,
        momentum_state=USMomentumState.STRONG_BULLISH.value,
        trend_stability=TrendStability.STABLE_UP,
        df=df,
        vwap=108.0,
        rvol=1.5,
        support=105.0,
        resistance=115.0
    )
    assert forecast.short_term_bias == "Bullish"
    assert forecast.invalidation_price <= 110.0
    assert len(forecast.bullish_conditions) >= 2
    assert len(forecast.invalidation_criteria) > 10

def test_data_provider_market_detection():
    provider = MarketDataProvider()
    assert provider.detect_market("RELIANCE.NS") == "india"
    assert provider.detect_market("TCS.NS") == "india"
    assert provider.detect_market("AAPL") == "us"
    assert provider.detect_market("SPY") == "us"
    assert provider.detect_market("BTC-USD") == "crypto"
    assert provider.detect_market("ETH-USD") == "crypto"
