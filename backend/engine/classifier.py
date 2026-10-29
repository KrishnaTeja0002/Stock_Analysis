import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any, Optional, List
from models import (
    IndianMomentumState, TrendStability, StructuralHypothesis,
    AlertSeverity, EvidenceExplanation, SignalScores
)

def evaluate_indian_momentum(
    current_idx: int,
    df: pd.DataFrame,
    prev_state: Optional[IndianMomentumState] = None
) -> Tuple[
    IndianMomentumState,
    TrendStability,
    StructuralHypothesis,
    SignalScores,
    AlertSeverity,
    str,
    EvidenceExplanation
]:
    """
    Evaluates market conditions for row `current_idx` in `df` strictly without lookahead bias.
    Produces:
    - 14-state Indian Momentum Classification
    - Trend Stability classification
    - Structural Hypothesis (Accumulation, Distribution, Profit-Booking)
    - Signal Confidence Scores
    - Alert Severity
    - Trigger Rule ID
    - Evidence-Based Explanation with supporting/contradicting factors
    """
    if len(df) < 15 or current_idx < 10:
        scores = SignalScores(
            price_trend_score=0.0, momentum_score=0.0, relative_volume_score=0.0,
            order_flow_score=None, liquidity_score=50.0, sector_alignment_score=0.0,
            overall_confidence=20.0
        )
        expl = EvidenceExplanation(
            what_happened="Data feed warming up (< 15 bars).",
            evidence_for=["Data received"],
            evidence_against=["Sample size too small for statistical significance"],
            what_would_strengthen="Accumulate at least 20 historical bars.",
            what_would_invalidate="Persistent lack of ticks.",
            missing_data_limitations=["Historical indicator warmup incomplete"],
            uncertainty_risk="High uncertainty during initial connection."
        )
        return (
            IndianMomentumState.UNCERTAIN,
            TrendStability.INSUFFICIENT,
            StructuralHypothesis.INSUFFICIENT_EVIDENCE,
            scores,
            AlertSeverity.LOW,
            "WARMUP_INSUFFICIENT_DATA",
            expl
        )

    row = df.iloc[current_idx]
    prev_row = df.iloc[current_idx - 1]

    close = float(row['close'])
    open_p = float(row['open'])
    high = float(row['high'])
    low = float(row['low'])
    prev_close = float(prev_row['close'])

    vwap = float(row.get('vwap', close))
    ema9 = float(row.get('ema9', close))
    ema20 = float(row.get('ema20', close))
    ema50 = float(row.get('ema50', close))
    rsi = float(row.get('rsi', 50.0))
    macd_hist = float(row.get('macd_hist', 0.0))
    prev_macd_hist = float(prev_row.get('macd_hist', 0.0))
    atr = max(0.01, float(row.get('atr', 1.0)))
    rvol = float(row.get('rvol', 1.0))
    donchian_high = float(row.get('donchian_high', high))
    donchian_low = float(row.get('donchian_low', low))
    res_level = float(row.get('resistance_level', donchian_high))
    sup_level = float(row.get('support_level', donchian_low))

    # Measurements
    candle_body = abs(close - open_p)
    candle_thrust = max(candle_body, abs(close - prev_close))
    dist_vwap_atr = (close - vwap) / atr
    dist_ema20_atr = (close - ema20) / atr
    price_change_pct = ((close - prev_close) / prev_close) * 100.0 if prev_close > 0 else 0.0

    # 1. Price Trend & Momentum Scores
    trend_score = 0.0
    if close > vwap and close > ema9 > ema20:
        trend_score += 45.0
    elif close > vwap and close > ema20:
        trend_score += 25.0
    elif close < vwap and close < ema9 < ema20:
        trend_score -= 45.0
    elif close < vwap and close < ema20:
        trend_score -= 25.0

    # Slope component
    slope_norm = float(row.get('ema_slope_norm', 0.0))
    trend_score += np.clip(slope_norm / 0.2 * 25.0, -25.0, 25.0)

    # Momentum score from RSI and MACD
    rsi_diff = rsi - 50.0
    mom_score = np.clip((rsi_diff / 20.0) * 50.0, -50.0, 50.0)
    if macd_hist > 0:
        mom_score += 25.0 if macd_hist >= prev_macd_hist else 10.0
    elif macd_hist < 0:
        mom_score -= 25.0 if macd_hist <= prev_macd_hist else -10.0

    rvol_score = float(np.clip(rvol / 2.0 * 100.0, 0.0, 100.0))
    liquidity_score = 80.0  # Normalized liquidity availability
    sector_align_score = 30.0 if trend_score > 0 else -30.0

    confidence = min(95.0, max(25.0, (abs(trend_score) * 0.4 + abs(mom_score) * 0.3 + min(rvol_score, 100) * 0.3)))

    signal_scores = SignalScores(
        price_trend_score=round(float(trend_score), 1),
        momentum_score=round(float(mom_score), 1),
        relative_volume_score=round(rvol_score, 1),
        order_flow_score=None,  # None when Level-2 order book feed is not connected
        liquidity_score=liquidity_score,
        sector_alignment_score=round(sector_align_score, 1),
        overall_confidence=round(confidence, 1)
    )

    evidence_for: List[str] = []
    evidence_against: List[str] = []
    missing_data: List[str] = ["L2 Order-Book Depth (Requires Broker API Token)"]

    # 2. State & Structural Hypothesis Decision Tree

    # Condition: Potential Breakout
    if close > donchian_high and close > prev_close:
        if rvol >= 1.35 and candle_thrust >= 0.9 * atr:
            state = IndianMomentumState.POTENTIAL_BREAKOUT
            stability = TrendStability.VOLATILITY_EXPANSION
            hypothesis = StructuralHypothesis.ACCUMULATION
            severity = AlertSeverity.URGENT
            rule = "CONFIRMED_DONCHIAN_BREAKOUT"
            what_happened = f"Price ₹{close:.2f} broke out above 20-period resistance ₹{donchian_high:.2f} on elevated relative volume ({rvol:.1f}x)."
            evidence_for.append(f"Price cleared resistance ₹{donchian_high:.2f}")
            evidence_for.append(f"Volume expanded to {rvol:.1f}x intraday baseline")
            evidence_for.append(f"Candle expansion {candle_thrust/atr:.1f}x ATR")
            if rsi > 72: evidence_against.append(f"RSI ({rsi:.1f}) approaching overbought threshold")
            what_strengthen = "Follow-through close above breakout level with sustained volume."
            what_invalidate = f"Immediate retracement below previous resistance ₹{donchian_high:.2f}."
            uncertainty = "Breakout success probability depends on broader NIFTY market breadth confirmation."
            return state, stability, hypothesis, signal_scores, severity, rule, EvidenceExplanation(
                what_happened=what_happened, evidence_for=evidence_for, evidence_against=evidence_against,
                what_would_strengthen=what_strengthen, what_would_invalidate=what_invalidate,
                missing_data_limitations=missing_data, uncertainty_risk=uncertainty
            )
        else:
            state = IndianMomentumState.POTENTIAL_BREAKOUT
            stability = TrendStability.FRAGILE_UP
            hypothesis = StructuralHypothesis.UNCONFIRMED_BREAKOUT
            severity = AlertSeverity.MODERATE
            rule = "UNCONFIRMED_LOW_VOLUME_BREAKOUT"
            what_happened = f"Price pierced resistance ₹{donchian_high:.2f} but relative volume ({rvol:.1f}x) lacks institutional expansion."
            evidence_for.append("Price made new high")
            evidence_against.append(f"Volume ({rvol:.1f}x) is below 1.35x breakout threshold")
            return state, stability, hypothesis, signal_scores, severity, rule, EvidenceExplanation(
                what_happened=what_happened, evidence_for=evidence_for, evidence_against=evidence_against,
                what_would_strengthen="Aggressive volume surge to confirm institutional participation.",
                what_would_invalidate=f"Drop back inside consolidation range below ₹{donchian_high:.2f}.",
                missing_data_limitations=missing_data, uncertainty_risk="High risk of false breakout / bull trap."
            )

    # Condition: Potential Breakdown
    if close < donchian_low and close < prev_close:
        if rvol >= 1.35 and candle_thrust >= 0.9 * atr:
            state = IndianMomentumState.POTENTIAL_BREAKDOWN
            stability = TrendStability.VOLATILITY_EXPANSION
            hypothesis = StructuralHypothesis.DISTRIBUTION
            severity = AlertSeverity.URGENT
            rule = "CONFIRMED_DONCHIAN_BREAKDOWN"
            what_happened = f"Price ₹{close:.2f} broke down below 20-period support ₹{donchian_low:.2f} on {rvol:.1f}x relative volume."
            evidence_for.append(f"Breached key support ₹{donchian_low:.2f}")
            evidence_for.append(f"Volume expanded to {rvol:.1f}x baseline")
            if rsi < 28: evidence_against.append(f"RSI ({rsi:.1f}) entering oversold territory")
            return state, stability, hypothesis, signal_scores, severity, rule, EvidenceExplanation(
                what_happened=what_happened, evidence_for=evidence_for, evidence_against=evidence_against,
                what_would_strengthen="Sustained red volume bars keeping price below broken support.",
                what_would_invalidate=f"Rebound back above ₹{donchian_low:.2f}.",
                missing_data_limitations=missing_data, uncertainty_risk="Downside acceleration risk."
            )
        else:
            state = IndianMomentumState.POTENTIAL_BREAKDOWN
            stability = TrendStability.FRAGILE_DOWN
            hypothesis = StructuralHypothesis.UNCONFIRMED_BREAKDOWN
            severity = AlertSeverity.MODERATE
            rule = "UNCONFIRMED_LOW_VOLUME_BREAKDOWN"
            what_happened = f"Price dipped below support ₹{donchian_low:.2f} without high sell volume."
            evidence_for.append("Price made new low")
            evidence_against.append("Relative volume low, lacking aggressive sell pressure")
            return state, stability, hypothesis, signal_scores, severity, rule, EvidenceExplanation(
                what_happened=what_happened, evidence_for=evidence_for, evidence_against=evidence_against,
                what_would_strengthen="Sell volume confirmation.",
                what_would_invalidate=f"Quick recovery above ₹{donchian_low:.2f}.",
                missing_data_limitations=missing_data, uncertainty_risk="Potential bear trap / absorption."
            )

    # Condition: Possible Reversal from Extreme
    if (prev_row.get('rsi', 50.0) < 32.0 and rsi > 34.0 and macd_hist > prev_macd_hist and close > open_p):
        state = IndianMomentumState.POSSIBLE_REVERSAL
        stability = TrendStability.POTENTIAL_REVERSAL
        hypothesis = StructuralHypothesis.SELLING_ABSORBED
        severity = AlertSeverity.URGENT
        rule = "BULLISH_REVERSAL_ABSORPTION"
        what_happened = f"Price bounced from oversold low with hammer/reversal candle; selling pressure absorbed near ₹{low:.2f}."
        evidence_for.append(f"RSI recovered from oversold ({rsi:.1f})")
        evidence_for.append("MACD histogram ticked upwards")
        evidence_against.append(f"Still below VWAP (₹{vwap:.2f})")
        return state, stability, hypothesis, signal_scores, severity, rule, EvidenceExplanation(
            what_happened=what_happened, evidence_for=evidence_for, evidence_against=evidence_against,
            what_would_strengthen=f"Crossing back above VWAP (₹{vwap:.2f}).",
            what_would_invalidate=f"Break below support level ₹{low:.2f}.",
            missing_data_limitations=missing_data, uncertainty_risk="Counter-trend move requires confirmation."
        )

    if (prev_row.get('rsi', 50.0) > 68.0 and rsi < 66.0 and macd_hist < prev_macd_hist and close < open_p):
        state = IndianMomentumState.POSSIBLE_REVERSAL
        stability = TrendStability.POTENTIAL_REVERSAL
        hypothesis = StructuralHypothesis.PROFIT_BOOKING
        severity = AlertSeverity.URGENT
        rule = "BEARISH_REVERSAL_PROFIT_BOOKING"
        what_happened = f"Price rejected near resistance; RSI pulled back from overbought with profit-booking selling."
        evidence_for.append(f"RSI descending from peak ({rsi:.1f})")
        evidence_for.append("MACD histogram momentum contracting")
        evidence_against.append(f"Still above major EMA 20 (₹{ema20:.2f})")
        return state, stability, hypothesis, signal_scores, severity, rule, EvidenceExplanation(
            what_happened=what_happened, evidence_for=evidence_for, evidence_against=evidence_against,
            what_would_strengthen=f"Breakdown below VWAP (₹{vwap:.2f}).",
            what_would_invalidate=f"New high above ₹{high:.2f}.",
            missing_data_limitations=missing_data, uncertainty_risk="May be brief consolidation before continuation."
        )

    # Condition: Accelerating Upward Momentum
    if trend_score >= 50.0 and rsi >= 62.0 and rvol >= 1.4 and (close > vwap):
        state = IndianMomentumState.ACCELERATING_UP
        stability = TrendStability.STABLE_UP
        hypothesis = StructuralHypothesis.ACCUMULATION
        severity = AlertSeverity.HIGH
        rule = "ACCELERATING_BULLISH_MOMENTUM"
        what_happened = f"Strong upward momentum accelerating: Price ₹{close:.2f} firmly above VWAP ₹{vwap:.2f} on {rvol:.1f}x volume with RSI {rsi:.1f}."
        evidence_for.append(f"Price > VWAP by {dist_vwap_atr:.1f}x ATR")
        evidence_for.append("Price > EMA 9 > EMA 20 bullish alignment")
        evidence_for.append(f"Relative volume {rvol:.1f}x confirms buying conviction")
        if dist_vwap_atr > 2.5: evidence_against.append("Price somewhat extended from intraday VWAP")
        return state, stability, hypothesis, signal_scores, severity, rule, EvidenceExplanation(
            what_happened=what_happened, evidence_for=evidence_for, evidence_against=evidence_against,
            what_would_strengthen="Continued higher highs with sustained buying volume.",
            what_would_invalidate=f"Slipping back below EMA 9 (₹{ema9:.2f}).",
            missing_data_limitations=missing_data, uncertainty_risk="Monitor for profit booking near resistance."
        )

    # Condition: Confirmed Upward Momentum
    if (close > vwap) and (close > ema9 > ema20) and (rsi >= 54.0):
        state = IndianMomentumState.CONFIRMED_UP
        stability = TrendStability.STABLE_UP
        hypothesis = StructuralHypothesis.ACCUMULATION
        severity = AlertSeverity.MODERATE
        rule = "CONFIRMED_BULLISH_MOMENTUM"
        what_happened = f"Confirmed upward momentum: Price above VWAP (₹{vwap:.2f}) and moving averages aligned in constructive bullish slope."
        evidence_for.append("Price above VWAP and EMA 20")
        evidence_for.append(f"RSI ({rsi:.1f}) in bullish expansion zone")
        if rvol < 1.0: evidence_against.append(f"Volume ({rvol:.1f}x) slightly below baseline average")
        return state, stability, hypothesis, signal_scores, severity, rule, EvidenceExplanation(
            what_happened=what_happened, evidence_for=evidence_for, evidence_against=evidence_against,
            what_would_strengthen="Volume expansion > 1.3x RVOL.",
            what_would_invalidate=f"Close below VWAP (₹{vwap:.2f}).",
            missing_data_limitations=missing_data, uncertainty_risk="Standard trend risk."
        )

    # Condition: Early Upward Momentum
    if (close > vwap or (prev_close < vwap and close >= vwap)) and (rsi >= 50.0) and (close > ema9):
        state = IndianMomentumState.EARLY_UP
        stability = TrendStability.FRAGILE_UP
        hypothesis = StructuralHypothesis.ACCUMULATION
        severity = AlertSeverity.LOW
        rule = "EARLY_BULLISH_DEVELOPMENT"
        what_happened = f"Early upward move developing: Price crossed above VWAP ₹{vwap:.2f} with short-term EMA 9 turning up."
        evidence_for.append(f"Price crossed VWAP (₹{vwap:.2f})")
        evidence_for.append("Short-term momentum turning positive")
        evidence_against.append("Not yet confirmed by medium-term EMA ribbon")
        return state, stability, hypothesis, signal_scores, severity, rule, EvidenceExplanation(
            what_happened=what_happened, evidence_for=evidence_for, evidence_against=evidence_against,
            what_would_strengthen="EMA 9 crossing above EMA 20 with volume.",
            what_would_invalidate=f"Drop back below VWAP (₹{vwap:.2f}).",
            missing_data_limitations=missing_data, uncertainty_risk="Early move prone to whipsaw."
        )

    # Condition: Accelerating Downward Momentum
    if trend_score <= -50.0 and rsi <= 38.0 and rvol >= 1.4 and (close < vwap):
        state = IndianMomentumState.ACCELERATING_DOWN
        stability = TrendStability.STABLE_DOWN
        hypothesis = StructuralHypothesis.DISTRIBUTION
        severity = AlertSeverity.HIGH
        rule = "ACCELERATING_BEARISH_MOMENTUM"
        what_happened = f"Downward momentum accelerating: Price ₹{close:.2f} trading below VWAP ₹{vwap:.2f} with aggressive selling on {rvol:.1f}x volume."
        evidence_for.append(f"Price below VWAP by {abs(dist_vwap_atr):.1f}x ATR")
        evidence_for.append("Price < EMA 9 < EMA 20 bearish alignment")
        evidence_for.append(f"RVOL {rvol:.1f}x confirms sell pressure")
        return state, stability, hypothesis, signal_scores, severity, rule, EvidenceExplanation(
            what_happened=what_happened, evidence_for=evidence_for, evidence_against=evidence_against,
            what_would_strengthen="Continued lower lows under broken support.",
            what_would_invalidate=f"Rebound crossing above EMA 9 (₹{ema9:.2f}).",
            missing_data_limitations=missing_data, uncertainty_risk="Watch for panic washouts."
        )

    # Condition: Confirmed Downward Momentum
    if (close < vwap) and (close < ema9 < ema20) and (rsi <= 46.0):
        state = IndianMomentumState.CONFIRMED_DOWN
        stability = TrendStability.STABLE_DOWN
        hypothesis = StructuralHypothesis.DISTRIBUTION
        severity = AlertSeverity.MODERATE
        rule = "CONFIRMED_BEARISH_MOMENTUM"
        what_happened = f"Confirmed downward trend: Price below VWAP (₹{vwap:.2f}) with downward sloping moving averages."
        evidence_for.append("Price below VWAP and EMA 20")
        evidence_for.append(f"RSI ({rsi:.1f}) in distribution zone")
        return state, stability, hypothesis, signal_scores, severity, rule, EvidenceExplanation(
            what_happened=what_happened, evidence_for=evidence_for, evidence_against=evidence_against,
            what_would_strengthen="Further volume expansion on red candles.",
            what_would_invalidate=f"Close above VWAP (₹{vwap:.2f}).",
            missing_data_limitations=missing_data, uncertainty_risk="Normal downtrend continuation risk."
        )

    # Condition: Early Downward Momentum
    if (close < vwap or (prev_close > vwap and close <= vwap)) and (rsi <= 50.0) and (close < ema9):
        state = IndianMomentumState.EARLY_DOWN
        stability = TrendStability.FRAGILE_DOWN
        hypothesis = StructuralHypothesis.DISTRIBUTION
        severity = AlertSeverity.LOW
        rule = "EARLY_BEARISH_DEVELOPMENT"
        what_happened = f"Early downward drift developing: Price lost VWAP ₹{vwap:.2f} with short-term EMA 9 sloping down."
        evidence_for.append(f"Price slipped below VWAP (₹{vwap:.2f})")
        evidence_against.append("Medium-term EMAs not yet fully rolled over")
        return state, stability, hypothesis, signal_scores, severity, rule, EvidenceExplanation(
            what_happened=what_happened, evidence_for=evidence_for, evidence_against=evidence_against,
            what_would_strengthen="EMA 9 crossing below EMA 20.",
            what_would_invalidate=f"Reclaiming VWAP (₹{vwap:.2f}).",
            missing_data_limitations=missing_data, uncertainty_risk="May be minor pullback."
        )

    # Condition: Quiet or Low Activity
    if rvol < 0.65 and candle_body < 0.4 * atr:
        state = IndianMomentumState.QUIET
        stability = TrendStability.CONSOLIDATION
        hypothesis = StructuralHypothesis.INSUFFICIENT_EVIDENCE
        severity = AlertSeverity.LOW
        rule = "LOW_ACTIVITY_DORMANT"
        what_happened = f"Low market activity: Stock trading in tight range with muted relative volume ({rvol:.1f}x baseline)."
        evidence_for.append(f"Low volume ({rvol:.1f}x)")
        evidence_for.append("Candle range compressed")
        return state, stability, hypothesis, signal_scores, severity, rule, EvidenceExplanation(
            what_happened=what_happened, evidence_for=evidence_for, evidence_against=evidence_against,
            what_would_strengthen="Sudden volume pickup > 1.2x with directional candle.",
            what_would_invalidate="Continued stagnation.",
            missing_data_limitations=missing_data, uncertainty_risk="Low liquidity risk."
        )

    # Default: Sideways Consolidation
    state = IndianMomentumState.SIDEWAYS
    stability = TrendStability.CONSOLIDATION
    hypothesis = StructuralHypothesis.INSUFFICIENT_EVIDENCE
    severity = AlertSeverity.LOW
    rule = "RANGE_BOUND_CONSOLIDATION"
    what_happened = f"Sideways consolidation: Price oscillating between ₹{sup_level:.2f} and ₹{res_level:.2f} without directional trend."
    evidence_for.append("Moving averages converging")
    evidence_for.append(f"RSI ({rsi:.1f}) hovering near neutral 50 level")
    return state, stability, hypothesis, signal_scores, severity, rule, EvidenceExplanation(
        what_happened=what_happened, evidence_for=evidence_for, evidence_against=evidence_against,
        what_would_strengthen=f"Clear breakout above ₹{res_level:.2f} or breakdown below ₹{sup_level:.2f}.",
        what_would_invalidate="Continued range oscillation.",
        missing_data_limitations=missing_data, uncertainty_risk="Chop and whipsaw inside range."
    )
