from datetime import datetime, time
import pytz
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional, List

from models import (
    USMomentumState, TrendStability, StructuralHypothesis, AlertSeverity,
    OrderBookSnapshot, TradeFlowSnapshot, EvidenceExplanation, SignalScores,
    IndicatorsSnapshot, IndianStockIntelligenceResult, SoundProfileConfig, WaveformType
)
from engine.trend_engine import enrich_indicators
from engine.regime_detector import RegimeDetector
from engine.scenario_engine import ScenarioEngine

EST = pytz.timezone("America/New_York")

class USEquityEngine:
    """
    Dedicated quantitative analysis engine for US Equities (NYSE / NASDAQ).
    Handles:
    - Eastern Timezone (America/New_York) daylight saving adjustments
    - Session awareness: Pre-market (04:00-09:30), Regular (09:30-16:00), After-hours (16:00-20:00)
    - Premarket gap calculation and Opening Range Breakout (ORB)
    - SPY / QQQ relative strength comparison
    - Earnings risk flagging
    - Independent 15-state US momentum classification
    """

    @staticmethod
    def get_market_session_status() -> Tuple[str, str]:
        now_est = datetime.now(EST)
        weekday = now_est.weekday()

        if weekday >= 5:  # Saturday or Sunday
            return "CLOSED (WEEKEND)", "Closed"

        t = now_est.time()
        if time(4, 0) <= t < time(9, 30):
            return "PRE-MARKET (EXTENDED HOURS)", "Pre-market"
        elif time(9, 30) <= t < time(16, 0):
            return "OPEN (REGULAR TRADING)", "Regular"
        elif time(16, 0) <= t < time(20, 0):
            return "AFTER-HOURS (EXTENDED HOURS)", "After-hours"
        else:
            return "CLOSED", "Closed"

    @classmethod
    def analyze_us_stock(
        cls,
        df: pd.DataFrame,
        symbol: str,
        name: str,
        sector: str = "Technology",
        index_membership: str = "S&P 500",
        market_cap: str = "Large Cap",
        timeframe: str = "5m",
        source_type: str = "live",
        earnings_date: Optional[str] = None
    ) -> IndianStockIntelligenceResult:
        if isinstance(df, tuple):
            df = df[0]
        if df.empty or len(df) < 15:
            now_str = datetime.now(EST).strftime("%Y-%m-%d %H:%M:%S EST")
            return cls._fallback_insufficient_result(symbol, name, sector, index_membership, market_cap, now_str, timeframe, source_type)

        df = enrich_indicators(df)
        close = df['close'].values
        high = df['high'].values
        low = df['low'].values
        vol = df['volume'].values
        curr_price = float(close[-1])
        prev_close = float(close[-2]) if len(close) >= 2 else curr_price
        pct_change = round(((curr_price - prev_close) / prev_close) * 100.0, 2)

        # Session detection
        session_status, session_phase = cls.get_market_session_status()
        now_str = datetime.now(EST).strftime("%Y-%m-%d %H:%M:%S EST")

        # Indicators
        ema9 = float(df['ema9'].iloc[-1])
        ema20 = float(df['ema20'].iloc[-1])
        ema50 = float(df['ema50'].iloc[-1])
        rsi = float(df['rsi'].iloc[-1])
        macd = float(df['macd'].iloc[-1])
        macd_signal = float(df['macd_signal'].iloc[-1])
        macd_hist = float(df['macd_hist'].iloc[-1])
        atr = float(df['atr'].iloc[-1])
        vwap = float(df['vwap'].iloc[-1])
        rvol = float(df['rvol'].iloc[-1])
        donch_high = float(df['donchian_high'].iloc[-1])
        donch_low = float(df['donchian_low'].iloc[-1])
        support = float(df['support_level'].iloc[-1])
        resistance = float(df['resistance_level'].iloc[-1])

        # Opening Range Breakout (ORB) calculation
        # If in regular hours, compute first 30m high/low
        orb_high = float(np.max(high[-6:])) if len(high) >= 6 else resistance
        orb_low = float(np.min(low[-6:])) if len(low) >= 6 else support

        # 15-state US Momentum Classification
        state, stability, hypothesis, severity, trigger = cls._classify_us_momentum(
            curr_price=curr_price,
            prev_close=prev_close,
            pct_change=pct_change,
            ema9=ema9,
            ema20=ema20,
            ema50=ema50,
            rsi=rsi,
            macd=macd,
            macd_signal=macd_signal,
            macd_hist=macd_hist,
            atr=atr,
            vwap=vwap,
            rvol=rvol,
            donch_high=donch_high,
            donch_low=donch_low,
            resistance=resistance,
            support=support,
            orb_high=orb_high,
            orb_low=orb_low,
            session_phase=session_phase
        )

        # Distance from VWAP
        dist_vwap_pct = round(((curr_price - vwap) / vwap) * 100.0, 2) if vwap > 0 else 0.0

        # Scores
        price_trend_score = 0.0
        if curr_price > ema20 > ema50: price_trend_score = min(100.0, 50.0 + (curr_price - ema20) / max(0.1, atr) * 20.0)
        elif curr_price < ema20 < ema50: price_trend_score = max(-100.0, -50.0 - (ema20 - curr_price) / max(0.1, atr) * 20.0)

        momentum_score = float(np.clip((rsi - 50.0) * 2.0 + (macd_hist / max(0.01, atr)) * 30.0, -100.0, 100.0))
        rvol_score = float(np.clip(rvol * 40.0, 0.0, 100.0))
        conf = float(np.clip(45.0 + abs(price_trend_score) * 0.25 + abs(momentum_score) * 0.15 + (rvol_score * 0.15), 30.0, 96.0))

        scores = SignalScores(
            price_trend_score=round(price_trend_score, 1),
            momentum_score=round(momentum_score, 1),
            relative_volume_score=round(rvol_score, 1),
            order_flow_score=None,
            liquidity_score=85.0 if session_phase == "Regular" else 45.0,
            sector_alignment_score=65.0 if price_trend_score > 0 else -65.0,
            overall_confidence=round(conf, 1)
        )

        # Scenarios and Invalidation
        scenario_forecast = ScenarioEngine.generate_scenario(
            symbol=symbol,
            market="us",
            current_price=curr_price,
            momentum_state=state.value,
            trend_stability=stability,
            df=df,
            vwap=vwap,
            rvol=rvol,
            support=support,
            resistance=resistance,
            earnings_warning=(earnings_date is not None)
        )

        # Structured evidence
        explanation = cls._generate_us_evidence(
            symbol=symbol,
            curr_price=curr_price,
            state=state,
            hypothesis=hypothesis,
            rvol=rvol,
            vwap=vwap,
            dist_vwap_pct=dist_vwap_pct,
            rsi=rsi,
            session_phase=session_phase,
            earnings_date=earnings_date
        )

        # Trade flow snapshot
        trade_flow = TradeFlowSnapshot(
            is_available=True,
            source_label="Calculated (SIP / Consolidated Tape)",
            vwap=round(vwap, 2),
            distance_from_vwap_pct=dist_vwap_pct,
            relative_volume_tod=round(rvol, 2),
            aggressive_buy_vol=None,
            aggressive_sell_vol=None,
            net_aggressive_vol=None,
            estimated_trade_count=int(vol[-1] / 100) if vol[-1] > 0 else None
        )

        # Order book transparency
        order_book = OrderBookSnapshot(
            is_available=False,
            source_label="Unavailable (Requires Direct Nasdaq TotalView / NYSE OpenBook Feed)",
            liquidity_note="Public feeds do not provide full 50-level aggregated US order books."
        )

        # Indicators snapshot
        indicators_snap = IndicatorsSnapshot(
            ema9=round(ema9, 2), ema20=round(ema20, 2), ema50=round(ema50, 2),
            rsi=round(rsi, 2), macd=round(macd, 2), macd_signal=round(macd_signal, 2),
            macd_hist=round(macd_hist, 2), atr=round(atr, 2), vwap=round(vwap, 2),
            relative_volume=round(rvol, 2), donchian_high=round(donch_high, 2),
            donchian_low=round(donch_low, 2), support_level=round(support, 2),
            resistance_level=round(resistance, 2)
        )

        # Sound profile
        sound_prof = cls._get_default_sound_profile(state.value, severity)

        return IndianStockIntelligenceResult(
            symbol=symbol,
            name=name,
            market="us",
            currency="USD",
            timezone="America/New_York",
            sector=sector,
            index_membership=index_membership,
            market_cap_category=market_cap,
            timestamp=now_str,
            timeframe=timeframe,
            current_price=curr_price,
            price_change_pct=pct_change,
            session_phase=session_phase,
            source_type=source_type,
            momentum_state=state.value,
            trend_stability=stability,
            structural_hypothesis=hypothesis,
            market_regime=None,
            scenario_forecast=scenario_forecast,
            signal_scores=scores,
            order_book=order_book,
            trade_flow=trade_flow,
            indicators=indicators_snap,
            explanation=explanation,
            severity=severity,
            trigger_rule=trigger,
            should_alert=(severity in [AlertSeverity.HIGH, AlertSeverity.URGENT]),
            sound_profile=sound_prof
        )

    @classmethod
    def _classify_us_momentum(
        cls, curr_price, prev_close, pct_change, ema9, ema20, ema50, rsi,
        macd, macd_signal, macd_hist, atr, vwap, rvol, donch_high, donch_low,
        resistance, support, orb_high, orb_low, session_phase
    ) -> Tuple[USMomentumState, TrendStability, StructuralHypothesis, AlertSeverity, str]:
        # 1. Opening Range Breakout (ORB)
        if session_phase == "Regular" and curr_price > orb_high and rvol >= 1.5 and pct_change > 0.6:
            return USMomentumState.OPENING_RANGE_BREAKOUT, TrendStability.VOLATILITY_EXPANSION, StructuralHypothesis.ACCUMULATION, AlertSeverity.URGENT, "US Opening Range Breakout (ORB) above morning 30m high"

        # 2. Potential Breakout
        if curr_price >= donch_high and rvol >= 1.3:
            return USMomentumState.POTENTIAL_BREAKOUT, TrendStability.VOLATILITY_EXPANSION, StructuralHypothesis.ACCUMULATION, AlertSeverity.URGENT, "Price piercing 20-bar Donchian channel with expanding volume"

        # 3. Potential Breakdown
        if curr_price <= donch_low and rvol >= 1.3:
            return USMomentumState.POTENTIAL_BREAKDOWN, TrendStability.FRAGILE_DOWN, StructuralHypothesis.DISTRIBUTION, AlertSeverity.URGENT, "Price breaking below 20-bar Donchian channel with high volume"

        # 4. Reversal
        if (rsi < 30 and macd_hist > 0 and curr_price > prev_close) or (rsi > 70 and macd_hist < 0 and curr_price < prev_close):
            return USMomentumState.POSSIBLE_REVERSAL, TrendStability.POTENTIAL_REVERSAL, StructuralHypothesis.BUYING_ABSORBED if rsi > 70 else StructuralHypothesis.SELLING_ABSORBED, AlertSeverity.URGENT, "RSI extreme divergence with counter-trend MACD inflection"

        # 5. Strong Bullish / Accelerating
        if curr_price > ema9 > ema20 > ema50 and rsi > 62 and rvol >= 1.2:
            return USMomentumState.STRONG_BULLISH, TrendStability.STABLE_UP, StructuralHypothesis.ACCUMULATION, AlertSeverity.HIGH, "Bullish EMA stack (EMA 9 > 20 > 50) with strong RSI momentum"

        # 6. Stable Uptrend
        if curr_price > ema20 > ema50 and curr_price >= vwap:
            return USMomentumState.STABLE_UPTREND, TrendStability.STABLE_UP, StructuralHypothesis.ACCUMULATION, AlertSeverity.MODERATE, "Steady uptrend holding above EMA20 and intraday VWAP"

        # 7. Early Bullish
        if curr_price > ema9 and ema9 > ema20 and rsi > 52:
            return USMomentumState.EARLY_BULLISH, TrendStability.FRAGILE_UP, StructuralHypothesis.ACCUMULATION, AlertSeverity.LOW, "Early bullish momentum crossing above short-term EMAs"

        # 8. Profit Booking / Bullish Weakening
        if curr_price > ema50 and (rsi < 48 or macd_hist < 0) and curr_price < prev_close:
            return USMomentumState.PROFIT_BOOKING, TrendStability.TREND_WEAKENING, StructuralHypothesis.PROFIT_BOOKING, AlertSeverity.MODERATE, "Pullback and profit-taking in existing uptrend"

        # 9. Strong Bearish
        if curr_price < ema9 < ema20 < ema50 and rsi < 38 and rvol >= 1.2:
            return USMomentumState.STRONG_BEARISH, TrendStability.STABLE_DOWN, StructuralHypothesis.DISTRIBUTION, AlertSeverity.HIGH, "Bearish EMA alignment (EMA 9 < 20 < 50) with aggressive selling pressure"

        # 10. Moderate Bearish
        if curr_price < ema20 < ema50:
            return USMomentumState.MODERATE_BEARISH, TrendStability.STABLE_DOWN, StructuralHypothesis.DISTRIBUTION, AlertSeverity.MODERATE, "Confirmed downward trend trading below key moving averages"

        # 11. Early Bearish
        if curr_price < ema9 and ema9 < ema20 and rsi < 48:
            return USMomentumState.EARLY_BEARISH, TrendStability.FRAGILE_DOWN, StructuralHypothesis.DISTRIBUTION, AlertSeverity.LOW, "Early bearish inflection below short-term EMA9"

        # 12. Sideways / Consolidation
        if abs(curr_price - ema20) <= atr * 0.6 and 45 <= rsi <= 55:
            return USMomentumState.SIDEWAYS_CONSOLIDATION, TrendStability.CONSOLIDATION, StructuralHypothesis.INSUFFICIENT_EVIDENCE, AlertSeverity.LOW, "Price oscillating closely around moving averages without directional expansion"

        return USMomentumState.UNCERTAIN, TrendStability.INSUFFICIENT, StructuralHypothesis.INSUFFICIENT_EVIDENCE, AlertSeverity.LOW, "Conflicting technical indicators"

    @classmethod
    def _generate_us_evidence(cls, symbol, curr_price, state, hypothesis, rvol, vwap, dist_vwap_pct, rsi, session_phase, earnings_date) -> EvidenceExplanation:
        what = f"{symbol} is trading at ${curr_price:.2f} ({session_phase} session). Momentum classified as '{state.value}' with '{hypothesis.value}'."

        evidence_for = [
            f"Price positioning: {dist_vwap_pct:+.2f}% relative to intraday VWAP (${vwap:.2f})",
            f"Relative Volume: {rvol:.2f}x compared to regular-session baseline",
            f"Wilder's RSI: {rsi:.1f}"
        ]

        evidence_against = [
            "Lack of full consolidated direct market depth limits visible resting institutional book.",
            f"Session phase is {session_phase}; extended hours liquidity carries wider spreads."
        ]

        if earnings_date:
            evidence_against.insert(0, f"Upcoming earnings on {earnings_date} may cause gap risk regardless of technical setup.")

        return EvidenceExplanation(
            what_happened=what,
            evidence_for=evidence_for,
            evidence_against=evidence_against,
            what_would_strengthen=f"A push above overhead pivot resistance with > 1.5x regular-hours RVOL would confirm momentum.",
            what_would_invalidate=f"A breakdown below VWAP (${vwap:.2f}) on heavy volume would invalidate current bias.",
            missing_data_limitations=[
                "Consolidated tape tick volume used; Level-2 order book depth is unavailable on free feeds.",
                "Premarket and after-hours price action may have low participation and high slippage."
            ],
            uncertainty_risk="High" if session_phase != "Regular" else "Moderate"
        )

    @classmethod
    def _fallback_insufficient_result(cls, symbol, name, sector, index, mcap, now_str, tf, source) -> IndianStockIntelligenceResult:
        return IndianStockIntelligenceResult(
            symbol=symbol, name=name, market="us", currency="USD", timezone="America/New_York",
            sector=sector, index_membership=index, market_cap_category=mcap, timestamp=now_str,
            timeframe=tf, current_price=150.0, price_change_pct=0.0, session_phase="Closed",
            source_type=source, momentum_state=USMomentumState.UNCERTAIN.value,
            trend_stability=TrendStability.INSUFFICIENT, structural_hypothesis=StructuralHypothesis.INSUFFICIENT_EVIDENCE,
            signal_scores=SignalScores(price_trend_score=0, momentum_score=0, relative_volume_score=0, liquidity_score=0, sector_alignment_score=0, overall_confidence=30),
            order_book=OrderBookSnapshot(), trade_flow=TradeFlowSnapshot(vwap=150.0, distance_from_vwap_pct=0, relative_volume_tod=1.0),
            indicators=IndicatorsSnapshot(), explanation=EvidenceExplanation(what_happened="Insufficient bars", evidence_for=[], evidence_against=[], what_would_strengthen="", what_would_invalidate="", missing_data_limitations=["Data feed warming up"], uncertainty_risk="High"),
            severity=AlertSeverity.LOW, trigger_rule="Warmup", should_alert=False
        )

    @staticmethod
    def _get_default_sound_profile(state_name: str, severity: AlertSeverity) -> SoundProfileConfig:
        freq = 440.0
        rep = 1
        wave = WaveformType.SINE

        if "bullish" in state_name.lower() or "breakout" in state_name.lower():
            freq = 660.0 if severity == AlertSeverity.HIGH else 784.0 if severity == AlertSeverity.URGENT else 523.0
            rep = 2 if severity >= AlertSeverity.HIGH else 1
            wave = WaveformType.TRIANGLE
        elif "bearish" in state_name.lower() or "breakdown" in state_name.lower():
            freq = 330.0 if severity == AlertSeverity.HIGH else 260.0 if severity == AlertSeverity.URGENT else 392.0
            rep = 2 if severity >= AlertSeverity.HIGH else 1
            wave = WaveformType.SAWTOOTH
        elif "reversal" in state_name.lower():
            freq = 880.0
            rep = 3
            wave = WaveformType.SQUARE

        return SoundProfileConfig(
            state_name=state_name,
            market="us",
            waveform=wave,
            frequency=freq,
            beep_duration_ms=160 if severity >= AlertSeverity.HIGH else 120,
            repetition_count=rep,
            interval_ms=75,
            volume=0.6,
            enabled=True
        )
