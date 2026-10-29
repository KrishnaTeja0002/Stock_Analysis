from typing import Dict, Any, List
import numpy as np
import pandas as pd
from models import ScenarioForecast, TrendStability

class ScenarioEngine:
    """
    Produces transparent, rule-based scenario forecasts for any asset
    in Indian, US, or Crypto markets.
    Distinguishes descriptive classification from probabilistic projection.
    Provides explicit invalidation prices where each thesis fails.
    """

    @staticmethod
    def generate_scenario(
        symbol: str,
        market: str,
        current_price: float,
        momentum_state: str,
        trend_stability: TrendStability,
        df: pd.DataFrame,
        vwap: float,
        rvol: float,
        support: float,
        resistance: float,
        earnings_warning: bool = False
    ) -> ScenarioForecast:
        current_price = float(current_price) if current_price and not np.isnan(current_price) else 100.0

        if support is None or pd.isna(support) or np.isnan(support) or np.isinf(support) or support <= 0:
            support = current_price * 0.985
        else:
            support = float(support)

        if resistance is None or pd.isna(resistance) or np.isnan(resistance) or np.isinf(resistance) or resistance <= 0:
            resistance = current_price * 1.015
        else:
            resistance = float(resistance)

        if vwap is None or pd.isna(vwap) or np.isnan(vwap) or np.isinf(vwap) or vwap <= 0:
            vwap = current_price
        else:
            vwap = float(vwap)

        if rvol is None or pd.isna(rvol) or np.isnan(rvol) or np.isinf(rvol) or rvol <= 0:
            rvol = 1.0
        else:
            rvol = float(rvol)

        close = df['close'].values if 'close' in df.columns and len(df) > 0 else np.array([current_price])
        if len(df) >= 15:
            try:
                calc_atr = float(np.nanmean(np.maximum(
                    df['high'].values[-14:] - df['low'].values[-14:],
                    np.maximum(abs(df['high'].values[-14:] - close[-15:-1]), abs(df['low'].values[-14:] - close[-15:-1]))
                )))
                atr = calc_atr if not np.isnan(calc_atr) and calc_atr > 0 else current_price * 0.015
            except Exception:
                atr = current_price * 0.015
        else:
            atr = current_price * 0.015

        is_bullish = any(w in momentum_state.lower() for w in ["up", "breakout", "bullish"])
        is_bearish = any(w in momentum_state.lower() for w in ["down", "breakdown", "bearish"])

        # Pivot Support & Resistance
        recent_low = float(np.nanmin(df['low'].values[-20:])) if len(df) >= 20 and not np.isnan(np.nanmin(df['low'].values[-20:])) else current_price * 0.97
        recent_high = float(np.nanmax(df['high'].values[-20:])) if len(df) >= 20 and not np.isnan(np.nanmax(df['high'].values[-20:])) else current_price * 1.03
        support_levels = [round(support, 2), round(max(recent_low, support - atr * 1.5), 2)]
        resistance_levels = [round(resistance, 2), round(min(recent_high, resistance + atr * 1.5), 2)]

        # Specific Invalidation Logic
        if is_bullish:
            short_term_bias = "Bullish"
            short_term_scenario = f"Anticipating bullish continuation towards overhead pivot resistance at {resistance_levels[0]}. Pullbacks into VWAP ({vwap:.2f}) provide structural support."
            medium_term_bias = "Bullish" if "accelerating" in momentum_state.lower() or "confirmed" in momentum_state.lower() else "Neutral"
            medium_term_scenario = f"Sustained acceptance above {vwap:.2f} targets multi-day liquidity pool at {resistance_levels[-1]}."
            
            invalidation_price = round(max(support_levels[0], vwap - atr * 0.8), 2)
            invalidation_criteria = f"Hourly close below key support / VWAP threshold {invalidation_price:.2f} confirms buyer exhaustion and invalidates the bullish thesis."

            bullish_cond = [
                f"Sustained trading volume > 1.2x RVOL with price holding above VWAP ({vwap:.2f})",
                f"Breakout candle close above immediate resistance at {resistance_levels[0]}",
                "Higher lows established on intraday pullbacks"
            ]
            neutral_cond = [
                f"Compression between VWAP ({vwap:.2f}) and resistance ({resistance_levels[0]}) on declining volume",
                "RSI consolidating within 50-60 band without aggressive selling"
            ]
            bearish_cond = [
                f"Loss of VWAP ({vwap:.2f}) with volume acceleration",
                f"Bearish breakdown below key pivot support {invalidation_price:.2f}"
            ]
            reversal_cond = [
                f"Rejection wick at {resistance_levels[0]} followed by consecutive lower highs",
                "Bearish MACD histogram divergence while price tests upper channel"
            ]

        elif is_bearish:
            short_term_bias = "Bearish"
            short_term_scenario = f"Downside momentum targeting lower support at {support_levels[0]}. Rallies into VWAP ({vwap:.2f}) expected to be met with selling pressure."
            medium_term_bias = "Bearish" if "accelerating" in momentum_state.lower() or "confirmed" in momentum_state.lower() else "Neutral"
            medium_term_scenario = f"Failure to reclaim {vwap:.2f} risks further cascade towards macro floor at {support_levels[-1]}."

            invalidation_price = round(min(resistance_levels[0], vwap + atr * 0.8), 2)
            invalidation_criteria = f"Decisive hourly close above {invalidation_price:.2f} breaks lower-high structure and invalidates the bearish continuation thesis."

            bullish_cond = [
                f"Reclaim of VWAP ({vwap:.2f}) with strong volume expansion",
                f"Breakout above swing resistance at {invalidation_price:.2f}"
            ]
            neutral_cond = [
                f"Consolidation near lower boundary {support_levels[0]} without follow-through selling",
                "Relative volume dropping below 0.8x reflecting seller fatigue"
            ]
            bearish_cond = [
                f"Continued trading below VWAP ({vwap:.2f}) with RVOL > 1.0x",
                f"Clean breakdown below key support {support_levels[0]}"
            ]
            reversal_cond = [
                f"Bullish absorption hammer candle at {support_levels[0]} with high volume",
                "RSI bullish divergence below 30"
            ]
        else:
            short_term_bias = "Neutral"
            short_term_scenario = f"Range-bound consolidation between support {support_levels[0]} and resistance {resistance_levels[0]}. Awaiting directional volume trigger."
            medium_term_bias = "Neutral"
            medium_term_scenario = "Volatility coiling. Symmetrical breakout or breakdown expected upon decisive boundary violation."

            invalidation_price = round(support_levels[0], 2)
            invalidation_criteria = f"Violation of the {support_levels[0]} - {resistance_levels[0]} range defines the direction of the subsequent expansion."

            bullish_cond = [f"Decisive breakout close above {resistance_levels[0]} with RVOL > 1.5x"]
            neutral_cond = [f"Oscillation between {support_levels[0]} and {resistance_levels[0]}"]
            bearish_cond = [f"Breakdown close below {support_levels[0]} on expanding volume"]
            reversal_cond = ["Failed boundary breakout followed by immediate reclaim of range midpoint"]

        # Risks & Limitations
        key_risks = [
            "Level-2 market depth imbalance is synthetic/unavailable; displayed support/resistance relies on historical price pivots rather than resting institutional book.",
            "Execution slippage during sudden volatility spikes may widen the effective invalidation distance."
        ]
        if earnings_warning and market == "us":
            key_risks.insert(0, "Upcoming US corporate earnings announcement poses non-linear gap risk.")
        if market == "crypto":
            key_risks.insert(0, "Continuous 24/7 liquidity swings and perpetual funding arbitrage can trigger sudden liquidation cascades.")

        return ScenarioForecast(
            symbol=symbol,
            market=market,
            current_classification=momentum_state,
            short_term_scenario=short_term_scenario,
            short_term_bias=short_term_bias,
            medium_term_scenario=medium_term_scenario,
            medium_term_bias=medium_term_bias,
            bullish_conditions=bullish_cond,
            neutral_conditions=neutral_cond,
            bearish_conditions=bearish_cond,
            reversal_conditions=reversal_cond,
            support_levels=support_levels,
            resistance_levels=resistance_levels,
            invalidation_price=invalidation_price,
            invalidation_criteria=invalidation_criteria,
            key_risks_and_missing_data=key_risks
        )
