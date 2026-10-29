from datetime import datetime, timezone
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional, List

from models import (
    CryptoMomentumState, TrendStability, StructuralHypothesis, AlertSeverity,
    OrderBookSnapshot, TradeFlowSnapshot, EvidenceExplanation, SignalScores,
    IndicatorsSnapshot, IndianStockIntelligenceResult, SoundProfileConfig, WaveformType
)
from engine.trend_engine import enrich_indicators
from engine.scenario_engine import ScenarioEngine

class CryptoMarketEngine:
    """
    Dedicated quantitative analysis engine for Cryptocurrencies (24/7 continuous markets).
    Handles:
    - Continuous trading without session gaps
    - UTC timestamps with local time conversion options
    - Exchange tagging (Binance, Coinbase, Kraken, or Public REST)
    - Volatility expansion & Bollinger Band Squeeze detection
    - Spot vs Perpetual Futures context (Funding rate & liquidation warning)
    - 11-state Crypto momentum classification
    - Cautious institutional/whale language without unsubstantiated claims
    """

    @staticmethod
    def get_market_session_status() -> Tuple[str, str]:
        return "OPEN (24/7 CONTINUOUS)", "24/7"

    @classmethod
    def analyze_crypto_asset(
        cls,
        df: pd.DataFrame,
        symbol: str,
        name: str,
        sector: str = "Layer 1",
        exchange: str = "Binance",
        timeframe: str = "5m",
        source_type: str = "live",
        funding_rate_pct: Optional[float] = None
    ) -> IndianStockIntelligenceResult:
        now_utc_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        if isinstance(df, tuple):
            df = df[0]
        if df.empty or len(df) < 15:
            return cls._fallback_insufficient_result(symbol, name, sector, exchange, now_utc_str, timeframe, source_type)

        df = enrich_indicators(df)
        close = df['close'].values
        high = df['high'].values
        low = df['low'].values
        vol = df['volume'].values
        curr_price = float(close[-1])
        prev_close = float(close[-2]) if len(close) >= 2 else curr_price
        pct_change = round(((curr_price - prev_close) / prev_close) * 100.0, 2)

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

        # 20-bar volatility & Bollinger Squeeze
        std20 = float(np.std(close[-20:]))
        bb_width_pct = (4.0 * std20 / curr_price) * 100.0 if curr_price > 0 else 0.0

        # Classify Crypto Momentum
        state, stability, hypothesis, severity, trigger = cls._classify_crypto_momentum(
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
            bb_width_pct=bb_width_pct,
            funding_rate_pct=funding_rate_pct
        )

        dist_vwap_pct = round(((curr_price - vwap) / vwap) * 100.0, 2) if vwap > 0 else 0.0

        price_trend_score = 0.0
        if curr_price > ema20 > ema50: price_trend_score = min(100.0, 50.0 + (curr_price - ema20) / max(0.1, atr) * 20.0)
        elif curr_price < ema20 < ema50: price_trend_score = max(-100.0, -50.0 - (ema20 - curr_price) / max(0.1, atr) * 20.0)

        momentum_score = float(np.clip((rsi - 50.0) * 2.0 + (macd_hist / max(0.01, atr)) * 30.0, -100.0, 100.0))
        rvol_score = float(np.clip(rvol * 40.0, 0.0, 100.0))
        conf = float(np.clip(50.0 + abs(price_trend_score) * 0.25 + abs(momentum_score) * 0.15 + (rvol_score * 0.1), 35.0, 95.0))

        scores = SignalScores(
            price_trend_score=round(price_trend_score, 1),
            momentum_score=round(momentum_score, 1),
            relative_volume_score=round(rvol_score, 1),
            order_flow_score=None,
            liquidity_score=90.0,
            sector_alignment_score=60.0 if price_trend_score > 0 else -60.0,
            overall_confidence=round(conf, 1)
        )

        # Scenarios and Invalidation
        scenario_forecast = ScenarioEngine.generate_scenario(
            symbol=symbol,
            market="crypto",
            current_price=curr_price,
            momentum_state=state.value,
            trend_stability=stability,
            df=df,
            vwap=vwap,
            rvol=rvol,
            support=support,
            resistance=resistance
        )

        # Evidence
        explanation = cls._generate_crypto_evidence(
            symbol=symbol,
            curr_price=curr_price,
            state=state,
            hypothesis=hypothesis,
            rvol=rvol,
            vwap=vwap,
            dist_vwap_pct=dist_vwap_pct,
            rsi=rsi,
            exchange=exchange,
            funding_rate=funding_rate_pct
        )

        trade_flow = TradeFlowSnapshot(
            is_available=True,
            source_label=f"Spot Aggregated ({exchange})",
            vwap=round(vwap, 2),
            distance_from_vwap_pct=dist_vwap_pct,
            relative_volume_tod=round(rvol, 2),
            funding_rate_pct=funding_rate_pct,
            estimated_trade_count=int(vol[-1] / 10) if vol[-1] > 0 else None
        )

        order_book = OrderBookSnapshot(
            is_available=False,
            source_label=f"Unavailable (Requires Direct {exchange} WebSocket L2 Stream)",
            liquidity_note=f"Public REST ticker used; multi-level order book depth requires dedicated exchange socket connection."
        )

        indicators_snap = IndicatorsSnapshot(
            ema9=round(ema9, 2), ema20=round(ema20, 2), ema50=round(ema50, 2),
            rsi=round(rsi, 2), macd=round(macd, 2), macd_signal=round(macd_signal, 2),
            macd_hist=round(macd_hist, 2), atr=round(atr, 2), vwap=round(vwap, 2),
            relative_volume=round(rvol, 2), donchian_high=round(donch_high, 2),
            donchian_low=round(donch_low, 2), support_level=round(support, 2),
            resistance_level=round(resistance, 2)
        )

        sound_prof = cls._get_default_sound_profile(state.value, severity)

        return IndianStockIntelligenceResult(
            symbol=symbol,
            name=name,
            market="crypto",
            currency="USD",
            timezone="UTC",
            sector=sector,
            index_membership=exchange,
            market_cap_category="Crypto Large Cap",
            timestamp=now_utc_str,
            timeframe=timeframe,
            current_price=curr_price,
            price_change_pct=pct_change,
            session_phase="24/7",
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
    def _classify_crypto_momentum(
        cls, curr_price, prev_close, pct_change, ema9, ema20, ema50, rsi,
        macd, macd_signal, macd_hist, atr, vwap, rvol, donch_high, donch_low,
        bb_width_pct, funding_rate_pct
    ) -> Tuple[CryptoMomentumState, TrendStability, StructuralHypothesis, AlertSeverity, str]:
        # 1. Potential Liquidation Volatility (sharp move on extreme RVOL with wide candle)
        candle_thrust = abs(curr_price - prev_close)
        if candle_thrust >= atr * 2.2 and rvol >= 2.0:
            return CryptoMomentumState.POTENTIAL_LIQUIDATION_VOLATILITY, TrendStability.VOLATILITY_EXPANSION, StructuralHypothesis.UNCONFIRMED_BREAKOUT if pct_change > 0 else StructuralHypothesis.UNCONFIRMED_BREAKDOWN, AlertSeverity.URGENT, "Massive volatility expansion with 2.0x+ RVOL consistent with forced liquidation cascades"

        # 2. Breakout
        if curr_price >= donch_high and rvol >= 1.4:
            return CryptoMomentumState.POTENTIAL_BREAKOUT, TrendStability.VOLATILITY_EXPANSION, StructuralHypothesis.ACCUMULATION, AlertSeverity.URGENT, "20-bar Donchian channel breakout with volume confirmation"

        # 3. Possible Reversal
        if (rsi < 28 and macd_hist > 0) or (rsi > 74 and macd_hist < 0):
            return CryptoMomentumState.POSSIBLE_REVERSAL, TrendStability.POTENTIAL_REVERSAL, StructuralHypothesis.BUYING_ABSORBED if rsi > 70 else StructuralHypothesis.SELLING_ABSORBED, AlertSeverity.URGENT, "Overextended RSI with opposing MACD momentum inflection"

        # 4. Strong Bullish Momentum
        if curr_price > ema9 > ema20 > ema50 and rsi > 60 and curr_price > vwap:
            return CryptoMomentumState.STRONG_BULLISH_MOMENTUM, TrendStability.STABLE_UP, StructuralHypothesis.ACCUMULATION, AlertSeverity.HIGH, "Strong bullish trend across EMAs and above rolling VWAP"

        # 5. Moderate Bullish
        if curr_price > ema20 > ema50:
            return CryptoMomentumState.MODERATE_BULLISH, TrendStability.STABLE_UP, StructuralHypothesis.ACCUMULATION, AlertSeverity.MODERATE, "Steady upward momentum holding above EMA20"

        # 6. Accumulation-Like Behavior
        if abs(curr_price - vwap) <= atr * 0.5 and rvol >= 1.2 and rsi >= 50:
            return CryptoMomentumState.ACCUMULATION_LIKE, TrendStability.CONSOLIDATION, StructuralHypothesis.ACCUMULATION, AlertSeverity.MODERATE, "Volume absorption clustering around VWAP support"

        # 7. Distribution-Like Behavior
        if curr_price < vwap and rvol >= 1.2 and rsi <= 48:
            return CryptoMomentumState.DISTRIBUTION_LIKE, TrendStability.FRAGILE_DOWN, StructuralHypothesis.DISTRIBUTION, AlertSeverity.MODERATE, "Volume expansion on downside pushes below VWAP"

        # 8. Weakening Bullish
        if curr_price > ema50 and (rsi < 50 or macd_hist < 0) and curr_price < prev_close:
            return CryptoMomentumState.WEAKENING_BULLISH, TrendStability.TREND_WEAKENING, StructuralHypothesis.PROFIT_BOOKING, AlertSeverity.MODERATE, "Bullish momentum fading with bearish MACD histogram"

        # 9. Strong Bearish Momentum
        if curr_price < ema9 < ema20 < ema50 and rsi < 40 and curr_price < vwap:
            return CryptoMomentumState.STRONG_BEARISH_MOMENTUM, TrendStability.STABLE_DOWN, StructuralHypothesis.DISTRIBUTION, AlertSeverity.HIGH, "Sustained downward selling pressure across short and medium EMAs"

        # 10. Consolidation
        if bb_width_pct < 1.8:
            return CryptoMomentumState.CONSOLIDATION, TrendStability.CONSOLIDATION, StructuralHypothesis.INSUFFICIENT_EVIDENCE, AlertSeverity.LOW, "Bollinger band compression with low volatility"

        return CryptoMomentumState.UNCERTAIN, TrendStability.INSUFFICIENT, StructuralHypothesis.INSUFFICIENT_EVIDENCE, AlertSeverity.LOW, "Conflicting technical evidence in continuous 24/7 tape"

    @classmethod
    def _generate_crypto_evidence(cls, symbol, curr_price, state, hypothesis, rvol, vwap, dist_vwap_pct, rsi, exchange, funding_rate) -> EvidenceExplanation:
        what = f"{symbol} is trading at ${curr_price:,.2f} on {exchange}. Market state: '{state.value}' ({hypothesis.value})."

        evidence_for = [
            f"Price distance to rolling VWAP: {dist_vwap_pct:+.2f}% (${vwap:,.2f})",
            f"Relative Volume (RVOL): {rvol:.2f}x",
            f"RSI (14-period): {rsi:.1f}"
        ]

        evidence_against = [
            f"Continuous 24/7 liquidity conditions mean sudden off-hours volatility bursts can happen without pre-warning.",
            f"Exchange: {exchange}. Cross-exchange arbitrage and liquidation engines may cause local price deviations."
        ]

        if funding_rate is not None:
            evidence_for.append(f"Perpetual Funding Rate: {funding_rate:+.4f}%")
        else:
            evidence_against.append("Perpetual funding rate feed is unavailable on standard spot ticker.")

        return EvidenceExplanation(
            what_happened=what,
            evidence_for=evidence_for,
            evidence_against=evidence_against,
            what_would_strengthen=f"A high-volume break above 20-bar Donchian high with funding rate remaining neutral would support continuation.",
            what_would_invalidate=f"A flush below VWAP (${vwap:,.2f}) with expanding RVOL would invalidate the current posture.",
            missing_data_limitations=[
                "Derivative liquidation clusters and multi-exchange order books require premium WebSocket feeds.",
                "Spot volume is analyzed; derivative open interest is not assumed without direct feed."
            ],
            uncertainty_risk="Elevated due to 24/7 leverage and continuous volatility."
        )

    @classmethod
    def _fallback_insufficient_result(cls, symbol, name, sector, exchange, now_str, tf, source) -> IndianStockIntelligenceResult:
        return IndianStockIntelligenceResult(
            symbol=symbol, name=name, market="crypto", currency="USD", timezone="UTC",
            sector=sector, index_membership=exchange, market_cap_category="Crypto", timestamp=now_str,
            timeframe=tf, current_price=50000.0, price_change_pct=0.0, session_phase="24/7",
            source_type=source, momentum_state=CryptoMomentumState.UNCERTAIN.value,
            trend_stability=TrendStability.INSUFFICIENT, structural_hypothesis=StructuralHypothesis.INSUFFICIENT_EVIDENCE,
            signal_scores=SignalScores(price_trend_score=0, momentum_score=0, relative_volume_score=0, liquidity_score=0, sector_alignment_score=0, overall_confidence=30),
            order_book=OrderBookSnapshot(), trade_flow=TradeFlowSnapshot(vwap=50000.0, distance_from_vwap_pct=0, relative_volume_tod=1.0),
            indicators=IndicatorsSnapshot(), explanation=EvidenceExplanation(what_happened="Insufficient bars", evidence_for=[], evidence_against=[], what_would_strengthen="", what_would_invalidate="", missing_data_limitations=["Data feed warming up"], uncertainty_risk="High"),
            severity=AlertSeverity.LOW, trigger_rule="Warmup", should_alert=False
        )

    @staticmethod
    def _get_default_sound_profile(state_name: str, severity: AlertSeverity) -> SoundProfileConfig:
        freq = 480.0
        rep = 1
        wave = WaveformType.SINE

        if "bullish" in state_name.lower() or "breakout" in state_name.lower():
            freq = 720.0 if severity == AlertSeverity.HIGH else 880.0 if severity == AlertSeverity.URGENT else 587.0
            rep = 2 if severity >= AlertSeverity.HIGH else 1
            wave = WaveformType.TRIANGLE
        elif "bearish" in state_name.lower() or "breakdown" in state_name.lower() or "liquidation" in state_name.lower():
            freq = 320.0 if severity == AlertSeverity.HIGH else 220.0 if severity == AlertSeverity.URGENT else 370.0
            rep = 2 if severity >= AlertSeverity.HIGH else 1
            wave = WaveformType.SAWTOOTH
        elif "reversal" in state_name.lower():
            freq = 950.0
            rep = 3
            wave = WaveformType.SQUARE

        return SoundProfileConfig(
            state_name=state_name,
            market="crypto",
            waveform=wave,
            frequency=freq,
            beep_duration_ms=175 if severity >= AlertSeverity.HIGH else 130,
            repetition_count=rep,
            interval_ms=70,
            volume=0.65,
            enabled=True
        )
