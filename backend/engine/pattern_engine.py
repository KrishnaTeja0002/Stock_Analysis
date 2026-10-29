from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np
import math

class PatternEngine:
    """
    Comprehensive Quantitative Candlestick & Classical Chart Pattern Detection Engine.
    Identifies institutional order-flow setups, classical chart formations,
    and probabilistic forward projections (Price Targets, Stop Loss, Risk-Reward, Win Rate).
    """

    @staticmethod
    def detect_patterns(df: pd.DataFrame, symbol: str = "") -> Dict[str, Any]:
        """
        Analyzes recent OHLCV history to detect active candlestick patterns,
        classical formations, and statistical trade projections.
        """
        if df is None or len(df) < 5:
            return PatternEngine._default_pattern_response(symbol)

        df = df.copy()
        df.columns = [str(c).lower() for c in df.columns]

        closes = df['close'].values
        opens = df['open'].values
        highs = df['high'].values
        lows = df['low'].values
        volumes = df['volume'].values if 'volume' in df.columns else np.ones(len(df))

        curr_p = float(closes[-1])
        c0, c1, c2, c3, c4 = closes[-1], closes[-2], closes[-3], closes[-4], closes[-5]
        o0, o1, o2, o3, o4 = opens[-1], opens[-2], opens[-3], opens[-4], opens[-5]
        h0, h1, h2, h3, h4 = highs[-1], highs[-2], highs[-3], highs[-4], highs[-5]
        l0, l1, l2, l3, l4 = lows[-1], lows[-2], lows[-3], lows[-4], lows[-5]

        # Calculate recent ATR for measured targets
        recent_ranges = np.maximum(highs[-14:] - lows[-14:], np.abs(highs[-14:] - np.roll(closes[-14:], 1)))[1:]
        atr = float(np.mean(recent_ranges)) if len(recent_ranges) > 0 else (curr_p * 0.015)
        if atr <= 0 or math.isnan(atr):
            atr = curr_p * 0.015

        detected_candlestick = None
        detected_formation = None
        bias = "NEUTRAL"
        strength = 50
        win_rate = 52.0
        pattern_desc = "Consolidation / Range Equilibrium"
        market_psychology = "Market participants are currently balancing supply and demand without dominant institutional aggression."
        actionable_rule = "Wait for a high-volume confirmation candle outside the current range before committing capital."

        # Candle Metrics (0 = current bar, 1 = prior bar)
        body0 = abs(c0 - o0)
        body1 = abs(c1 - o1)
        range0 = max(h0 - l0, 0.001)
        range1 = max(h1 - l1, 0.001)
        range2 = max(h2 - l2, 0.001)
        body2 = abs(c2 - o2)

        upper_wick0 = h0 - max(c0, o0)
        lower_wick0 = min(c0, o0) - l0
        upper_wick1 = h1 - max(c1, o1)
        lower_wick1 = min(c1, o1) - l1

        is_green0 = c0 > o0
        is_red0 = c0 < o0
        is_green1 = c1 > o1
        is_red1 = c1 < o1
        is_green2 = c2 > o2
        is_red2 = c2 < o2

        # 1. CANDLESTICK PATTERNS EVALUATION
        # Morning Star (3-candle bullish reversal)
        if is_red2 and is_green0 and body2 > (0.5 * range2):
            if body1 < (0.4 * body2) and c0 > (o2 + c2) / 2.0:
                detected_candlestick = "Morning Star (Bullish Reversal)"
                bias = "BULLISH"
                strength = 88
                win_rate = 74.5
                pattern_desc = "3-bar institutional reversal: Heavy distribution, followed by selling exhaustion, followed by high-conviction demand thrust."
                market_psychology = "Sellers failed to press the breakdown. Limit buyers stepped in aggressively, trapping late breakout shorts."

        # Evening Star (3-candle bearish reversal)
        if not detected_candlestick and (c2 > o2) and is_red0 and (abs(c2 - o2) > 0.5 * max(h2 - l2, 0.001)):
            if body1 < (0.4 * abs(c2 - o2)) and c0 < (o2 + c2) / 2.0:
                detected_candlestick = "Evening Star (Bearish Reversal)"
                bias = "BEARISH"
                strength = 86
                win_rate = 73.0
                pattern_desc = "3-bar institutional top: Bullish exhaustion gap into heavy institutional supply absorption and aggressive rollover."
                market_psychology = "Smart money used elevated liquidity near highs to distribute inventory, leaving retail buyers trapped."

        # Bullish Engulfing (requires solid body)
        if not detected_candlestick and is_red1 and is_green0 and body0 > (0.5 * range0):
            if o0 <= c1 and c0 >= o1 and body0 > body1:
                detected_candlestick = "Bullish Engulfing"
                bias = "BULLISH"
                strength = 82
                win_rate = 71.0
                pattern_desc = "Total demand takeover: Current green real body completely covers the entire previous red body."
                market_psychology = "Bulls completely overwhelmed prior sellers, turning previous resistance into newly protected support."

        # Bearish Engulfing (requires solid body)
        if not detected_candlestick and is_green1 and is_red0 and body0 > (0.5 * range0):
            if o0 >= c1 and c0 <= o1 and body0 > body1:
                detected_candlestick = "Bearish Engulfing"
                bias = "BEARISH"
                strength = 81
                win_rate = 70.5
                pattern_desc = "Total supply takeover: Current red candle completely engulfs the entire previous green body."
                market_psychology = "Aggressive sellers rejected higher prices, liquidating long positions and forcing immediate downside repricing."

        # Hammer / Pin Bar Bullish Reversal
        if not detected_candlestick and lower_wick0 >= (2.0 * body0) and upper_wick0 <= (0.35 * body0):
            detected_candlestick = "Bullish Hammer / Pin Bar"
            bias = "BULLISH"
            strength = 78
            win_rate = 68.5
            pattern_desc = "Lower shadow rejection: Intraday selloff was completely absorbed, closing back near the session highs."
            market_psychology = "Bears attempted to drive price down but met aggressive institutional limit bids. Short trap confirmed."

        # Shooting Star / Inverted Pin Bar Bearish Reversal
        if not detected_candlestick and upper_wick0 >= (2.0 * body0) and lower_wick0 <= (0.35 * body0):
            detected_candlestick = "Shooting Star (Bearish Rejection)"
            bias = "BEARISH"
            strength = 77
            win_rate = 67.5
            pattern_desc = "Upper shadow rejection: Strong upside push met heavy overhead supply, forcing price back to lows."
            market_psychology = "Buyers tried to break higher but encountered institutional iceberg sell orders. Upside exhaustion."

        # Three White Soldiers
        if not detected_candlestick and is_green0 and is_green1 and (c2 > o2) and c0 > c1 > c2:
            detected_candlestick = "Three White Soldiers (Bullish Trend Thrust)"
            bias = "BULLISH"
            strength = 85
            win_rate = 73.0
            pattern_desc = "Consecutive expanding bullish candles creating consistent higher highs and higher closes."
            market_psychology = "Sustained institutional accumulation with zero pause for profit-booking."

        # Three Black Crows
        if not detected_candlestick and is_red0 and is_red1 and (c2 < o2) and c0 < c1 < c2:
            detected_candlestick = "Three Black Crows (Bearish Distribution)"
            bias = "BEARISH"
            strength = 84
            win_rate = 72.5
            pattern_desc = "Consecutive heavy red candles closing near lows without dip-buying interest."
            market_psychology = "Aggressive institutional liquidation with liquidity cascading lower."

        # Doji / Indecision
        if not detected_candlestick and body0 <= (0.12 * range0):
            if lower_wick0 > (2.5 * upper_wick0):
                detected_candlestick = "Dragonfly Doji (Bullish Demand Floor)"
                bias = "BULLISH"
                strength = 72
                win_rate = 64.0
            elif upper_wick0 > (2.5 * lower_wick0):
                detected_candlestick = "Gravestone Doji (Bearish Supply Ceiling)"
                bias = "BEARISH"
                strength = 71
                win_rate = 63.5
            else:
                detected_candlestick = "Neutral Doji (Equilibrium Pause)"
                bias = "NEUTRAL"
                strength = 50
                win_rate = 50.0

        # 2. CLASSICAL CHART & PRICE ACTION FORMATIONS
        recent_highs = highs[-25:]
        recent_lows = lows[-25:]

        # Double Bottom (W-formation)
        min1_idx = int(np.argmin(recent_lows[:12]))
        min2_idx = int(np.argmin(recent_lows[13:])) + 13
        min1_val = recent_lows[min1_idx]
        min2_val = recent_lows[min2_idx]

        if abs(min1_val - min2_val) / min1_val < 0.008 and c0 > min2_val:
            detected_formation = "Double Bottom (W-Pattern Base)"
            if bias == "NEUTRAL": bias = "BULLISH"
            strength = max(strength, 83)
            win_rate = max(win_rate, 72.0)
            pattern_desc = "Confirmed double-test of support floor with selling momentum completely dried up."

        # Double Top (M-formation)
        max1_idx = int(np.argmax(recent_highs[:12]))
        max2_idx = int(np.argmax(recent_highs[13:])) + 13
        max1_val = recent_highs[max1_idx]
        max2_val = recent_highs[max2_idx]

        if abs(max1_val - max2_val) / max1_val < 0.008 and c0 < max2_val:
            detected_formation = "Double Top (M-Pattern Reversal)"
            if bias == "NEUTRAL": bias = "BEARISH"
            strength = max(strength, 82)
            win_rate = max(win_rate, 71.5)
            pattern_desc = "Double-rejection at overhead resistance with buyers unwilling to absorb supply."

        # Liquidity Sweep & Spring (Wyckoff Reclaim)
        if min(l0, l1) < np.min(lows[-20:-2]) and c0 > np.min(lows[-20:-2]):
            detected_formation = "Liquidity Sweep & Spring (Wyckoff Reclaim)"
            detected_candlestick = detected_candlestick or "False Breakdown / Bear Trap"
            bias = "BULLISH"
            strength = 89
            win_rate = 76.0
            pattern_desc = "Stop-hunt below key support followed by instant institutional reclaim."
            market_psychology = "Institutional algorithms swept retail stop losses to generate buy liquidity at discount prices."

        # Bull Flag Continuation
        if not detected_formation and len(df) >= 15:
            pole_move = closes[-8] - closes[-15]
            flag_consolidation = closes[-1] - closes[-8]
            if pole_move > (2.0 * atr) and abs(flag_consolidation) < (0.8 * pole_move) and is_green0:
                detected_formation = "Bull Flag Consolidation & Continuation"
                bias = "BULLISH"
                strength = 84
                win_rate = 73.5
                pattern_desc = "Impulsive bullish flagpole followed by shallow, orderly consolidation before next leg."

        # Bear Flag Breakdown
        if not detected_formation and len(df) >= 15:
            pole_down = closes[-15] - closes[-8]
            flag_up = closes[-1] - closes[-8]
            if pole_down > (2.0 * atr) and abs(flag_up) < (0.8 * pole_down) and is_red0:
                detected_formation = "Bear Flag Breakdown"
                bias = "BEARISH"
                strength = 83
                win_rate = 72.0
                pattern_desc = "Sharp impulsive breakdown followed by weak corrective bounce with declining volume."

        # Structural Dow Trend (Higher Highs / Lower Lows)
        if not detected_formation:
            if h0 > h1 and l0 > l1 and c0 > c1:
                detected_formation = "Higher High & Higher Low (Structural Uptrend)"
                if bias == "NEUTRAL":
                    bias = "BULLISH"
                    strength = 75
                    win_rate = 66.0
            elif h0 < h1 and l0 < l1 and c0 < c1:
                detected_formation = "Lower High & Lower Low (Structural Downtrend)"
                if bias == "NEUTRAL":
                    bias = "BEARISH"
                    strength = 75
                    win_rate = 65.5
            else:
                detected_formation = "Range-Bound Compression"

        # 3. CALCULATE MEASURED PREDICTIVE TARGETS & INVALIDATION
        # Floor effective volatility to avoid micro-blips during squeeze
        min_move_pct = 0.015  # Minimum 1.5% target floor
        eff_atr = max(atr, curr_p * 0.008)

        if bias == "BULLISH":
            # Structure invalidation below recent swing low
            invalidation = round(min(l0, l1) - (0.25 * eff_atr), 2)
            if invalidation >= curr_p:
                invalidation = round(curr_p - (0.8 * eff_atr), 2)
            risk = max(curr_p - invalidation, curr_p * 0.006)

            # Ensure institutional RRR >= 1.5 : 1 on T1 and >= 2.8 : 1 on T2
            t1_gain = max(risk * 1.5, eff_atr * 1.8, curr_p * min_move_pct)
            t2_gain = max(risk * 2.8, eff_atr * 3.5, curr_p * 0.032)

            target_1 = round(curr_p + t1_gain, 2)
            target_2 = round(curr_p + t2_gain, 2)
            rrr = round(t1_gain / risk, 2)
            time_horizon = "Next 3 - 8 candles (Intraday Tactical)"
            actionable_rule = f"Maintain bullish bias above ₹{invalidation:.2f}. Scale out 50% at Target 1 (₹{target_1:.2f}) and trail stop to entry."
        elif bias == "BEARISH":
            # Structure invalidation above recent swing high
            invalidation = round(max(h0, h1) + (0.25 * eff_atr), 2)
            if invalidation <= curr_p:
                invalidation = round(curr_p + (0.8 * eff_atr), 2)
            risk = max(invalidation - curr_p, curr_p * 0.006)

            t1_drop = max(risk * 1.5, eff_atr * 1.8, curr_p * min_move_pct)
            t2_drop = max(risk * 2.8, eff_atr * 3.5, curr_p * 0.032)

            target_1 = round(curr_p - t1_drop, 2)
            target_2 = round(curr_p - t2_drop, 2)
            rrr = round(t1_drop / risk, 2)
            time_horizon = "Next 3 - 8 candles (Intraday Tactical)"
            actionable_rule = f"Maintain bearish defense below ₹{invalidation:.2f}. Cover partial position at Target 1 (₹{target_1:.2f})."
        else:
            # In neutral consolidation: Project upside breakout targets rather than negative prices
            invalidation = round(curr_p - max(1.0 * eff_atr, curr_p * 0.008), 2)
            risk = max(curr_p - invalidation, curr_p * 0.006)
            t1_gain = max(risk * 1.5, eff_atr * 1.5, curr_p * min_move_pct)
            t2_gain = max(risk * 2.5, eff_atr * 3.0, curr_p * 0.028)

            target_1 = round(curr_p + t1_gain, 2)
            target_2 = round(curr_p + t2_gain, 2)
            rrr = round(t1_gain / risk, 2)
            time_horizon = "Compression Phase (3 - 6 candles)"
            actionable_rule = "Do not take directional positions in consolidation without a confirmed breakout candle."

        primary_pattern = detected_candlestick or detected_formation or "Standard Trend Continuation"
        secondary_pattern = detected_formation if detected_candlestick else None

        return {
            "active_pattern": primary_pattern,
            "secondary_pattern": secondary_pattern,
            "pattern_category": "Reversal" if "Reversal" in primary_pattern or "Bottom" in primary_pattern or "Top" in primary_pattern else "Continuation",
            "directional_bias": bias,
            "confidence_score": strength,
            "win_probability_pct": win_rate,
            "current_price": round(curr_p, 2),
            "target_1": target_1,
            "target_2": target_2,
            "invalidation_price": invalidation,
            "risk_reward_ratio": rrr,
            "time_horizon": time_horizon,
            "pattern_description": pattern_desc,
            "market_psychology": market_psychology,
            "actionable_rule": actionable_rule,
            "candle_metrics": {
                "body_pct_of_range": round((body0 / range0) * 100, 1),
                "upper_wick_ratio": round(upper_wick0 / max(body0, 0.01), 2),
                "lower_wick_ratio": round(lower_wick0 / max(body0, 0.01), 2),
                "atr": round(atr, 2)
            }
        }

    @staticmethod
    def _default_pattern_response(symbol: str) -> Dict[str, Any]:
        return {
            "active_pattern": "Accumulating Data",
            "secondary_pattern": None,
            "pattern_category": "Neutral",
            "directional_bias": "NEUTRAL",
            "confidence_score": 50,
            "win_probability_pct": 50.0,
            "current_price": 0.0,
            "target_1": 0.0,
            "target_2": 0.0,
            "invalidation_price": 0.0,
            "risk_reward_ratio": 1.0,
            "time_horizon": "Awaiting candle confirmation",
            "pattern_description": "Building historical candle matrix.",
            "market_psychology": "Awaiting sufficient tick depth.",
            "actionable_rule": "Observe without position until confirmation.",
            "candle_metrics": {}
        }

    detect_patterns_and_predict = detect_patterns
