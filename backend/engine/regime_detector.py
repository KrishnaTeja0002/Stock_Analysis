import numpy as np
import pandas as pd
from typing import Dict, Any, List
from models import MarketCategory, MarketRegime, MarketRegimeReport

class RegimeDetector:
    """
    Evaluates broader market regime across India, US, and Crypto.
    Determines whether the market environment favors breakouts, trend-following,
    mean-reversion, or capital preservation during broad market stress.
    """

    @staticmethod
    def detect_regime(
        market: MarketCategory,
        benchmark_df: pd.DataFrame,
        market_breadth_pct: float = 50.0,
        macro_stress_level: float = 0.0
    ) -> MarketRegimeReport:
        if benchmark_df.empty or len(benchmark_df) < 20:
            return MarketRegimeReport(
                market=market,
                regime=MarketRegime.UNCERTAIN_MIXED,
                confidence=50.0,
                breadth_pct=market_breadth_pct,
                volatility_zscore=0.0,
                primary_driver="Insufficient historical benchmark bars",
                individual_stock_interpretation="Mixed regime: Exercise position-size discipline."
            )

        close = benchmark_df['close'].values
        high = benchmark_df['high'].values
        low = benchmark_df['low'].values

        # EMA20 and EMA50
        ema20 = pd.Series(close).ewm(span=20, adjust=False).mean().values[-1]
        ema50 = pd.Series(close).ewm(span=50, adjust=False).mean().values[-1] if len(close) >= 50 else ema20
        curr_price = close[-1]

        # Historical Volatility (20-bar ATR%)
        tr = np.maximum(high[1:] - low[1:], np.maximum(abs(high[1:] - close[:-1]), abs(low[1:] - close[:-1])))
        atr = float(np.mean(tr[-14:])) if len(tr) >= 14 else float(np.mean(tr))
        atr_pct = (atr / curr_price) * 100.0 if curr_price > 0 else 1.0

        # Bollinger Bandwidth
        std20 = float(np.std(close[-20:]))
        bb_width = (4.0 * std20 / curr_price) * 100.0 if curr_price > 0 else 0.0

        # Volatility Z-score (compared to 1.5% typical daily benchmark ATR)
        vol_zscore = round((atr_pct - 1.2) / 0.6, 2)

        # 20-bar Return
        ret_20 = ((curr_price - close[max(0, len(close) - 20)]) / close[max(0, len(close) - 20)]) * 100.0

        # Classify
        if macro_stress_level > 0.7 or (market_breadth_pct < 25.0 and ret_20 < -3.5):
            regime = MarketRegime.BROAD_MARKET_STRESS
            confidence = 88.0
            driver = "Sharp benchmark drawdown with broad-based market selling pressure"
            interp = "Breakouts have an elevated failure rate during market stress. Prioritize capital preservation or tight trailing stops."
        elif vol_zscore > 1.8:
            regime = MarketRegime.HIGH_VOLATILITY
            confidence = 82.0
            driver = f"Volatility expansion (ATR% at {atr_pct:.2f}%, z-score +{vol_zscore})"
            interp = "Wide swings expected. Reduce position sizes and widen stops to avoid whipsaws."
        elif bb_width < 1.4:
            regime = MarketRegime.LOW_VOLATILITY
            confidence = 78.0
            driver = f"Extreme volatility compression (Bandwidth {bb_width:.2f}%)"
            interp = "Market is in an energy-coiling phase. Watch for sudden directional breakout with volume expansion."
        elif curr_price > ema20 and ema20 > ema50 and market_breadth_pct >= 58.0 and ret_20 > 0.5:
            regime = MarketRegime.TRENDING_UPWARD
            confidence = min(92.0, 60.0 + market_breadth_pct * 0.35)
            driver = f"Benchmark holding above EMA20/50 with healthy {market_breadth_pct:.1f}% market breadth"
            interp = "Favorable tailwind for long setups and momentum pullbacks to key support levels."
        elif curr_price < ema20 and ema20 < ema50 and market_breadth_pct <= 42.0 and ret_20 < -0.5:
            regime = MarketRegime.TRENDING_DOWNWARD
            confidence = min(92.0, 60.0 + (100 - market_breadth_pct) * 0.35)
            driver = f"Benchmark below key moving averages with weak {market_breadth_pct:.1f}% market breadth"
            interp = "Headwind for long trades. Bearish continuation and short setups have higher statistical follow-through."
        else:
            regime = MarketRegime.RANGE_BOUND
            confidence = 72.0
            driver = "Benchmark oscillating within defined 20-bar price channels"
            interp = "Mean-reversion strategies favored over breakout chasing. Expect false thrusts at boundaries."

        return MarketRegimeReport(
            market=market,
            regime=regime,
            confidence=round(confidence, 1),
            breadth_pct=round(market_breadth_pct, 1),
            volatility_zscore=vol_zscore,
            primary_driver=driver,
            individual_stock_interpretation=interp
        )
