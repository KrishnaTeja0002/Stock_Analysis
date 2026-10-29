import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, Optional
from datetime import datetime
import pytz

from engine.indicators import (
    calculate_ema,
    calculate_atr,
    calculate_rsi,
    calculate_macd,
    calculate_bollinger_bands,
    calculate_donchian_channels,
    calculate_intraday_vwap,
    calculate_relative_volume_tod,
    calculate_support_resistance,
    calculate_normalized_slope
)
from engine.classifier import evaluate_indian_momentum
from models import (
    IndianStockIntelligenceResult, IndicatorsSnapshot, IndianMomentumState,
    TrendStability, StructuralHypothesis, AlertSeverity, OrderBookSnapshot,
    TradeFlowSnapshot, DepthLevel, SignalScores, EvidenceExplanation
)

IST = pytz.timezone('Asia/Kolkata')

def enrich_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Enriches OHLCV DataFrame with complete quantitative indicators."""
    df = df.copy()
    if len(df) == 0:
        return df

    df.columns = [str(c).lower() for c in df.columns]

    close = df['close']
    high = df['high']
    low = df['low']

    # Moving Averages
    df['ema9'] = calculate_ema(close, 9)
    df['ema20'] = calculate_ema(close, 20)
    df['ema50'] = calculate_ema(close, 50)
    if len(df) >= 200:
        df['ema200'] = calculate_ema(close, 200)
    else:
        df['ema200'] = calculate_ema(close, len(df))

    # Intraday VWAP
    df['vwap'] = calculate_intraday_vwap(df)

    # Volatility & Momentum
    df['atr'] = calculate_atr(high, low, close, 14)
    df['rsi'] = calculate_rsi(close, 14)
    macd_line, macd_sig, macd_hist = calculate_macd(close, 12, 26, 9)
    df['macd'] = macd_line
    df['macd_signal'] = macd_sig
    df['macd_hist'] = macd_hist

    # Bands & Channels
    bb_up, bb_mid, bb_low, bb_w, pct_b = calculate_bollinger_bands(close, 20, 2.0)
    df['bb_upper'] = bb_up
    df['bb_mid'] = bb_mid
    df['bb_lower'] = bb_low
    df['bb_width'] = bb_w
    df['pct_b'] = pct_b

    dh_high, dh_low = calculate_donchian_channels(high, low, 20)
    df['donchian_high'] = dh_high
    df['donchian_low'] = dh_low

    # Support & Resistance
    sup, res = calculate_support_resistance(df, 20)
    df['support_level'] = sup
    df['resistance_level'] = res

    # Relative Volume & Slope
    df['rvol'] = calculate_relative_volume_tod(df, 5)
    df['ema_slope_norm'] = calculate_normalized_slope(df['ema20'], df['atr'], 5)

    return df

def generate_simulated_order_book(current_price: float, state: IndianMomentumState) -> OrderBookSnapshot:
    """Generates a realistic 5-level Indian market depth for simulated exploration."""
    tick_size = 0.05
    spread = tick_size * np.random.choice([1, 2, 3])
    best_bid = round(current_price - spread / 2.0, 2)
    best_ask = round(current_price + spread / 2.0, 2)

    # Imbalance bias based on momentum state
    bias = 0.0
    if "up" in state.value.lower() or "breakout" in state.value.lower():
        bias = 0.35
    elif "down" in state.value.lower() or "breakdown" in state.value.lower():
        bias = -0.35

    bids: list[DepthLevel] = []
    asks: list[DepthLevel] = []
    total_bid_qty = 0
    total_ask_qty = 0

    weights = [5, 4, 3, 2, 1]
    weighted_bids = 0.0
    weighted_asks = 0.0

    for i in range(5):
        p_bid = round(best_bid - i * tick_size, 2)
        p_ask = round(best_ask + i * tick_size, 2)
        q_bid = int(np.random.randint(500, 3500) * (1.0 + bias))
        q_ask = int(np.random.randint(500, 3500) * (1.0 - bias))
        orders_b = int(np.random.randint(3, 25))
        orders_a = int(np.random.randint(3, 25))

        bids.append(DepthLevel(price=p_bid, quantity=q_bid, orders_count=orders_b))
        asks.append(DepthLevel(price=p_ask, quantity=q_ask, orders_count=orders_a))

        total_bid_qty += q_bid
        total_ask_qty += q_ask
        weighted_bids += weights[i] * q_bid
        weighted_asks += weights[i] * q_ask

    imbalance = (weighted_bids - weighted_asks) / (weighted_bids + weighted_asks) if (weighted_bids + weighted_asks) > 0 else 0.0

    return OrderBookSnapshot(
        is_available=True,
        source_label="Microstructure Simulator (5-Level Depth)",
        best_bid=best_bid,
        best_ask=best_ask,
        spread=round(best_ask - best_bid, 2),
        spread_pct=round(((best_ask - best_bid) / current_price) * 100.0, 3),
        total_bid_qty=total_bid_qty,
        total_ask_qty=total_ask_qty,
        imbalance=round(float(imbalance), 2),
        bids=bids,
        asks=asks,
        liquidity_note=f"Spread {spread:.2f} ({(spread/current_price)*100:.3f}%). Displayed depth shows {'bid' if imbalance > 0 else 'ask'} concentration."
    )

def analyze_indian_stock(
    df: pd.DataFrame,
    symbol: str,
    name: str = "",
    nse_symbol: str = "",
    sector: str = "Broad Market",
    index_membership: str = "NIFTY 50",
    market_cap: str = "Large Cap",
    timeframe: str = "5m",
    source_type: str = "delayed"
) -> IndianStockIntelligenceResult:
    """Runs complete end-to-end intelligence analysis for an Indian equity."""
    clean_nse = nse_symbol or symbol.replace(".NS", "").replace("^", "")

    if len(df) < 5:
        now_ist = datetime.now(IST).isoformat()
        return IndianStockIntelligenceResult(
            symbol=symbol,
            nse_symbol=clean_nse,
            name=name or clean_nse,
            sector=sector,
            index_membership=index_membership,
            market_cap_category=market_cap,
            timestamp=now_ist,
            timeframe=timeframe,
            current_price=float(df['close'].iloc[-1]) if len(df) > 0 else 0.0,
            price_change_pct=0.0,
            source_type=source_type,
            momentum_state=IndianMomentumState.UNCERTAIN,
            trend_stability=TrendStability.INSUFFICIENT,
            structural_hypothesis=StructuralHypothesis.INSUFFICIENT_EVIDENCE,
            signal_scores=SignalScores(
                price_trend_score=0.0, momentum_score=0.0, relative_volume_score=0.0,
                liquidity_score=50.0, sector_alignment_score=0.0, overall_confidence=10.0
            ),
            order_book=OrderBookSnapshot(is_available=False, source_label="Insufficient Data"),
            trade_flow=TradeFlowSnapshot(is_available=False, source_label="Warmup", vwap=0.0, distance_from_vwap_pct=0.0, relative_volume_tod=1.0),
            indicators=IndicatorsSnapshot(),
            explanation=EvidenceExplanation(
                what_happened="Data feed initialising.",
                evidence_for=[], evidence_against=[],
                what_would_strengthen="Wait for 15+ candles.",
                what_would_invalidate="No data feed.",
                missing_data_limitations=["Initial connection"],
                uncertainty_risk="High"
            ),
            severity=AlertSeverity.LOW,
            trigger_rule="INITIAL_WARMUP",
            should_alert=False,
            sound_profile=None
        )

    enriched = enrich_indicators(df)
    last_idx = len(enriched) - 1

    state, stability, hypothesis, scores, severity, rule, explanation = evaluate_indian_momentum(
        last_idx, enriched
    )

    row = enriched.iloc[-1]
    prev_close = float(enriched.iloc[-2]['close']) if len(enriched) > 1 else float(row['close'])
    curr_close = float(row['close'])
    pct_change = ((curr_close - prev_close) / prev_close) * 100.0 if prev_close > 0 else 0.0

    vwap_val = float(row.get('vwap', curr_close))
    dist_vwap = ((curr_close - vwap_val) / vwap_val) * 100.0 if vwap_val > 0 else 0.0
    rvol_val = float(row.get('rvol', 1.0))

    # Order book determination
    if source_type == "simulated" or symbol.startswith("SYNTH-"):
        order_book = generate_simulated_order_book(curr_close, state)
    else:
        # Transparently declare Level-2 Depth unavailable when using zero-key provider without broker token
        order_book = OrderBookSnapshot(
            is_available=False,
            source_label="Unavailable (Requires Zerodha Kite / Upstox L2 Token)",
            best_bid=None,
            best_ask=None,
            spread=None,
            spread_pct=None,
            total_bid_qty=None,
            total_ask_qty=None,
            imbalance=None,
            bids=[],
            asks=[],
            liquidity_note="Multi-level depth feed requires broker API credentials. Analysis currently relies on verified tick/bar volume."
        )

    # Trade Flow snapshot
    trade_flow = TradeFlowSnapshot(
        is_available=True,
        source_label="Intraday Bar Flow & VWAP",
        vwap=round(vwap_val, 2),
        distance_from_vwap_pct=round(dist_vwap, 2),
        relative_volume_tod=round(rvol_val, 2),
        aggressive_buy_vol=round(float(row['volume'] * 0.55), 1) if curr_close >= float(row['open']) else round(float(row['volume'] * 0.45), 1),
        aggressive_sell_vol=round(float(row['volume'] * 0.45), 1) if curr_close >= float(row['open']) else round(float(row['volume'] * 0.55), 1),
        net_aggressive_vol=round(float(row['volume'] * 0.1), 1) if curr_close >= float(row['open']) else round(-float(row['volume'] * 0.1), 1),
        estimated_trade_count=int(max(10, row['volume'] / 150.0)),
        delivery_pct=None
    )

    indicators_snap = IndicatorsSnapshot(
        ema9=round(float(row['ema9']), 2) if pd.notna(row['ema9']) else None,
        ema20=round(float(row['ema20']), 2) if pd.notna(row['ema20']) else None,
        ema50=round(float(row['ema50']), 2) if pd.notna(row['ema50']) else None,
        ema200=round(float(row['ema200']), 2) if pd.notna(row['ema200']) else None,
        rsi=round(float(row['rsi']), 1) if pd.notna(row['rsi']) else None,
        macd=round(float(row['macd']), 2) if pd.notna(row['macd']) else None,
        macd_signal=round(float(row['macd_signal']), 2) if pd.notna(row['macd_signal']) else None,
        macd_hist=round(float(row['macd_hist']), 2) if pd.notna(row['macd_hist']) else None,
        atr=round(float(row['atr']), 2) if pd.notna(row['atr']) else None,
        vwap=round(vwap_val, 2),
        relative_volume=round(rvol_val, 2),
        donchian_high=round(float(row['donchian_high']), 2) if pd.notna(row['donchian_high']) else None,
        donchian_low=round(float(row['donchian_low']), 2) if pd.notna(row['donchian_low']) else None,
        support_level=round(float(row['support_level']), 2) if pd.notna(row['support_level']) else None,
        resistance_level=round(float(row['resistance_level']), 2) if pd.notna(row['resistance_level']) else None,
    )

    # Format timestamp to IST string
    ts = row.name
    if isinstance(ts, pd.Timestamp):
        ts_ist = ts.tz_convert(IST) if ts.tz else IST.localize(ts)
        ts_str = ts_ist.strftime("%Y-%m-%d %H:%M:%S IST")
    else:
        ts_str = str(ts)

    from engine.scenario_engine import ScenarioEngine
    scenario_forecast = ScenarioEngine.generate_scenario(
        symbol=symbol,
        market="india",
        current_price=curr_close,
        momentum_state=state.value,
        trend_stability=stability,
        df=enriched,
        vwap=vwap_val,
        rvol=rvol_val,
        support=float(row['support_level']),
        resistance=float(row['resistance_level'])
    )

    return IndianStockIntelligenceResult(
        symbol=symbol,
        nse_symbol=clean_nse,
        name=name or clean_nse,
        market="india",
        currency="INR",
        timezone="Asia/Kolkata",
        sector=sector,
        index_membership=index_membership,
        market_cap_category=market_cap,
        timestamp=ts_str,
        timeframe=timeframe,
        current_price=round(curr_close, 2),
        price_change_pct=round(pct_change, 2),
        session_phase="Regular",
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
        trigger_rule=rule,
        should_alert=False,
        sound_profile=None
    )
