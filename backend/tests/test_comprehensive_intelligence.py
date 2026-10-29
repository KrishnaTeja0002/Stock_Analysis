import pytest
import pandas as pd
import numpy as np
from engine.comprehensive_intelligence_engine import ComprehensiveIntelligenceEngine

def test_comprehensive_intelligence_engine_full_run():
    # Build synthetic OHLCV history
    np.random.seed(42)
    closes = np.linspace(1000, 1150, 40)
    data = []
    for c in closes:
        data.append({
            "open": c - 2.0,
            "high": c + 5.0,
            "low": c - 5.0,
            "close": c,
            "volume": 25000
        })
    df = pd.DataFrame(data)

    res = ComprehensiveIntelligenceEngine.get_full_intelligence(
        symbol="DIXON.NS",
        name="Dixon Technologies",
        df=df,
        current_price=1150.0,
        market="india"
    )

    # 1. Fundamentals check
    assert "fundamentals" in res
    fund = res["fundamentals"]
    assert fund["pe_ratio"] > 0
    assert "market_cap_str" in fund
    assert "fifty_two_week_high" in fund
    assert "target_mean_price" in fund
    assert fund["fundamental_health_score"] >= 40

    # 2. Technicals check
    assert "technicals" in res
    tech = res["technicals"]
    assert "rsi_14" in tech
    assert 0 <= tech["rsi_14"] <= 100
    assert "ema_20" in tech
    assert "macd" in tech
    assert "bollinger" in tech
    assert "pivots" in tech

    # 3. Benchmark alignment check
    assert "benchmark_alignment" in res
    bench = res["benchmark_alignment"]
    assert bench["benchmark_name"] in ["NIFTY 50", "S&P 500", "Bitcoin Index"]
    assert bench["stock_beta"] > 0
    assert "tailwind_verdict" in bench

    # 4. News & Catalysts check
    assert "news_catalysts" in res
    news = res["news_catalysts"]
    assert len(news["articles"]) >= 1
    assert "sentiment_bias" in news

    # 5. Potential Prediction check
    assert "potential_prediction" in res
    pot = res["potential_prediction"]
    assert "rating" in pot
    assert "conservative_target" in pot
    assert pot["conservative_target"] > 0
    assert "investment_thesis" in pot

    # 6. Cautions check
    assert "cautions" in res
    assert len(res["cautions"]) >= 2
    for c in res["cautions"]:
        assert "category" in c
        assert "warning" in c

    # 7. Order Flow Estimator check
    assert "order_flow_estimator" in res
    of = res["order_flow_estimator"]
    assert of["buyer_volume_pct"] + of["seller_volume_pct"] == 100.0
    assert "depth_explanation" in of
