from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class MarketCategory(str, Enum):
    INDIA = "india"
    US = "us"
    CRYPTO = "crypto"

class IndianMomentumState(str, Enum):
    QUIET = "Quiet or low activity"
    EARLY_UP = "Early upward momentum"
    CONFIRMED_UP = "Confirmed upward momentum"
    ACCELERATING_UP = "Accelerating upward momentum"
    EXHAUSTION_UP = "Exhaustion or weakening upward momentum"
    EARLY_DOWN = "Early downward momentum"
    CONFIRMED_DOWN = "Confirmed downward momentum"
    ACCELERATING_DOWN = "Accelerating downward momentum"
    EXHAUSTION_DOWN = "Exhaustion or weakening downward momentum"
    SIDEWAYS = "Sideways consolidation"
    POTENTIAL_BREAKOUT = "Potential breakout"
    POTENTIAL_BREAKDOWN = "Potential breakdown"
    POSSIBLE_REVERSAL = "Possible reversal"
    UNCERTAIN = "Uncertain or insufficient evidence"

class USMomentumState(str, Enum):
    STRONG_BULLISH = "Strong bullish"
    MODERATE_BULLISH = "Moderate bullish"
    EARLY_BULLISH = "Early bullish momentum"
    STABLE_UPTREND = "Stable uptrend"
    SIDEWAYS_CONSOLIDATION = "Sideways consolidation"
    BULLISH_WEAKENING = "Bullish momentum weakening"
    PROFIT_BOOKING = "Possible profit-booking"
    EARLY_BEARISH = "Early bearish momentum"
    MODERATE_BEARISH = "Moderate bearish"
    STRONG_BEARISH = "Strong bearish"
    OPENING_RANGE_BREAKOUT = "Opening range breakout (ORB)"
    POTENTIAL_BREAKOUT = "Potential breakout"
    POTENTIAL_BREAKDOWN = "Potential breakdown"
    POSSIBLE_REVERSAL = "Possible reversal"
    UNCERTAIN = "Insufficient or conflicting evidence"

class CryptoMomentumState(str, Enum):
    STRONG_BULLISH_MOMENTUM = "Strong bullish momentum"
    MODERATE_BULLISH = "Moderate bullish momentum"
    ACCUMULATION_LIKE = "Accumulation-like behavior"
    CONSOLIDATION = "Consolidation"
    DISTRIBUTION_LIKE = "Distribution-like behavior"
    WEAKENING_BULLISH = "Weakening bullish momentum"
    STRONG_BEARISH_MOMENTUM = "Strong bearish momentum"
    POTENTIAL_LIQUIDATION_VOLATILITY = "Potential liquidation-driven volatility"
    POTENTIAL_BREAKOUT = "Potential breakout or breakdown"
    POSSIBLE_REVERSAL = "Possible reversal"
    UNCERTAIN = "Uncertain or conflicting evidence"

class MarketRegime(str, Enum):
    TRENDING_UPWARD = "Trending upward"
    TRENDING_DOWNWARD = "Trending downward"
    RANGE_BOUND = "Range-bound"
    HIGH_VOLATILITY = "High-volatility"
    LOW_VOLATILITY = "Low-volatility"
    BROAD_MARKET_STRESS = "Broad market stress"
    UNCERTAIN_MIXED = "Uncertain or mixed conditions"

class MarketRegimeReport(BaseModel):
    market: MarketCategory
    regime: MarketRegime
    confidence: float
    breadth_pct: float
    volatility_zscore: float
    primary_driver: str
    individual_stock_interpretation: str

class ScenarioForecast(BaseModel):
    symbol: str
    market: str
    current_classification: str
    short_term_scenario: str
    short_term_bias: str  # "Bullish", "Neutral", "Bearish"
    medium_term_scenario: str
    medium_term_bias: str
    bullish_conditions: List[str]
    neutral_conditions: List[str]
    bearish_conditions: List[str]
    reversal_conditions: List[str]
    support_levels: List[float]
    resistance_levels: List[float]
    invalidation_price: float
    invalidation_criteria: str
    key_risks_and_missing_data: List[str]

class TrendStability(str, Enum):
    STABLE_UP = "Stable uptrend"
    STABLE_DOWN = "Stable downtrend"
    FRAGILE_UP = "Fragile uptrend"
    FRAGILE_DOWN = "Fragile downtrend"
    CONSOLIDATION = "Consolidation"
    VOLATILITY_EXPANSION = "Volatility expansion"
    TREND_WEAKENING = "Trend weakening"
    POTENTIAL_REVERSAL = "Potential reversal"
    INSUFFICIENT = "Insufficient evidence"

class StructuralHypothesis(str, Enum):
    ACCUMULATION = "Accumulation-like behavior"
    DISTRIBUTION = "Distribution-like behavior"
    PROFIT_BOOKING = "Possible profit-booking"
    BUYING_ABSORBED = "Buying pressure being absorbed"
    SELLING_ABSORBED = "Selling pressure being absorbed"
    UNCONFIRMED_BREAKOUT = "Breakout without sufficient confirmation"
    UNCONFIRMED_BREAKDOWN = "Breakdown without sufficient confirmation"
    INSUFFICIENT_EVIDENCE = "Insufficient evidence"

class AlertSeverity(int, Enum):
    LOW = 1       # Quiet, Weak, Early
    MODERATE = 2  # Confirmed, Exhaustion
    HIGH = 3      # Accelerating, Strong
    URGENT = 4    # Breakouts, Breakdowns, Reversals, Liquidity Crises

class WaveformType(str, Enum):
    SINE = "sine"
    TRIANGLE = "triangle"
    SQUARE = "square"
    SAWTOOTH = "sawtooth"

class SoundProfileConfig(BaseModel):
    id: Optional[int] = None
    asset_symbol: Optional[str] = None  # None = Global Default
    state_name: str
    market: str = "india"
    waveform: WaveformType = WaveformType.SINE
    frequency: float = 440.0
    beep_duration_ms: int = 150
    repetition_count: int = 1
    interval_ms: int = 80
    volume: float = 0.5
    enabled: bool = True
    custom_audio_url: Optional[str] = None

class DepthLevel(BaseModel):
    price: float
    quantity: int
    orders_count: int

class OrderBookSnapshot(BaseModel):
    is_available: bool = False
    source_label: str = "Unavailable"
    best_bid: Optional[float] = None
    best_ask: Optional[float] = None
    spread: Optional[float] = None
    spread_pct: Optional[float] = None
    total_bid_qty: Optional[int] = None
    total_ask_qty: Optional[int] = None
    imbalance: Optional[float] = None  # -1.0 (heavy ask) to +1.0 (heavy bid)
    bids: List[DepthLevel] = []
    asks: List[DepthLevel] = []
    liquidity_note: str = ""

class TradeFlowSnapshot(BaseModel):
    is_available: bool = False
    source_label: str = "Unavailable"
    vwap: float
    distance_from_vwap_pct: float
    relative_volume_tod: float  # Time-of-day normalized relative volume
    aggressive_buy_vol: Optional[float] = None
    aggressive_sell_vol: Optional[float] = None
    net_aggressive_vol: Optional[float] = None
    estimated_trade_count: Optional[int] = None
    delivery_pct: Optional[float] = None  # EOD delivery percentage if available
    funding_rate_pct: Optional[float] = None  # Crypto perpetual funding rate if available
    open_interest: Optional[float] = None

class EvidenceExplanation(BaseModel):
    what_happened: str
    evidence_for: List[str]
    evidence_against: List[str]
    what_would_strengthen: str
    what_would_invalidate: str
    missing_data_limitations: List[str]
    uncertainty_risk: str

class SignalScores(BaseModel):
    price_trend_score: float     # -100 to +100
    momentum_score: float        # -100 to +100
    relative_volume_score: float # 0 to 100
    order_flow_score: Optional[float] = None  # -100 to +100 if L2 available
    liquidity_score: float       # 0 to 100
    sector_alignment_score: float# -100 to +100
    overall_confidence: float    # 0 to 100%

class AssetConfig(BaseModel):
    symbol: str               # e.g., "RELIANCE.NS", "AAPL", "BTC-USD"
    name: str                 # "Reliance Industries Ltd"
    market: str = "india"     # "india", "us", "crypto"
    currency: str = "INR"     # "INR", "USD", "USDT"
    timezone: str = "Asia/Kolkata" # "Asia/Kolkata", "America/New_York", "UTC"
    exchange: Optional[str] = "NSE"
    nse_symbol: Optional[str] = None
    bse_code: Optional[str] = None
    asset_class: str = "equity"
    sector: str = "Energy"
    industry: str = "Oil & Gas"
    index_membership: str = "NIFTY 50"
    market_cap_category: str = "Large Cap" # Large Cap, Mid Cap, Small Cap
    provider: str = "yfinance"
    timeframe: str = "5m"
    is_monitored: bool = True
    cooldown_seconds: int = 120
    earnings_date: Optional[str] = None

class Candle(BaseModel):
    timestamp: str  # ISO string in market timezone
    open: float
    high: float
    low: float
    close: float
    volume: float
    vwap: Optional[float] = None

class IndicatorsSnapshot(BaseModel):
    ema9: Optional[float] = None
    ema20: Optional[float] = None
    ema50: Optional[float] = None
    ema200: Optional[float] = None
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_hist: Optional[float] = None
    atr: Optional[float] = None
    vwap: Optional[float] = None
    relative_volume: Optional[float] = None
    donchian_high: Optional[float] = None
    donchian_low: Optional[float] = None
    support_level: Optional[float] = None
    resistance_level: Optional[float] = None

class IndianStockIntelligenceResult(BaseModel):
    symbol: str
    nse_symbol: Optional[str] = None
    name: str
    market: str = "india"
    currency: str = "INR"
    timezone: str = "Asia/Kolkata"
    sector: str
    index_membership: str
    market_cap_category: str
    timestamp: str
    timeframe: str
    current_price: float
    price_change_pct: float
    session_phase: str = "Regular"
    source_type: str  # live, delayed, simulated, historical
    momentum_state: str  # Accepts any momentum state string
    trend_stability: TrendStability
    structural_hypothesis: StructuralHypothesis
    market_regime: Optional[MarketRegime] = None
    scenario_forecast: Optional[ScenarioForecast] = None
    signal_scores: SignalScores
    order_book: OrderBookSnapshot
    trade_flow: TradeFlowSnapshot
    indicators: IndicatorsSnapshot
    explanation: EvidenceExplanation
    severity: AlertSeverity
    trigger_rule: str
    should_alert: bool
    sound_profile: Optional[SoundProfileConfig] = None

class SectorPerformance(BaseModel):
    sector_name: str
    symbol: str
    price: float
    change_pct: float
    advances: int
    declines: int
    top_driver: str

class MarketOverviewResponse(BaseModel):
    timestamp: str
    market: str = "india"
    market_session_status: str  # OPEN, CLOSED, PRE-OPEN, AFTER-HOURS
    nifty50_price: Optional[float] = None
    nifty50_change_pct: Optional[float] = None
    niftybank_price: Optional[float] = None
    niftybank_change_pct: Optional[float] = None
    advances: Optional[int] = None
    declines: Optional[int] = None
    unchanged: Optional[int] = None
    advance_decline_ratio: Optional[float] = None
    fii_net_flow_crores: Optional[float] = None
    dii_net_flow_crores: Optional[float] = None
    fii_dii_date: Optional[str] = None
    sectors: List[SectorPerformance] = []
    benchmarks: List[Dict[str, Any]] = []
    macro_indicators: Dict[str, Any] = {}

class ScannerQuery(BaseModel):
    market: Optional[str] = "all"  # all, india, us, crypto
    sector: Optional[str] = None
    market_cap: Optional[str] = None
    index_name: Optional[str] = None
    momentum_state: Optional[str] = None
    structural_hypothesis: Optional[str] = None
    min_relative_volume: Optional[float] = None
    above_vwap_only: Optional[bool] = None
    sort_by: str = "momentum_score"  # momentum_score, rvol, price_change
    sort_order: str = "desc"

class HistoricalAnalysisRequest(BaseModel):
    symbol: str
    timeframe: str = "15m"
    period: str = "1mo"
    provider: str = "yfinance"
    market: Optional[str] = None

class BacktestMetrics(BaseModel):
    total_bars: int
    total_alerts: int
    alerts_by_state: Dict[str, int]
    alerts_by_severity: Dict[int, int]
    trend_continuation_rate_5bar: float
    trend_continuation_rate_15bar: float
    false_alert_rate: float
    avg_trend_duration_bars: float
    volatility_regime_changes: int
    evaluated_horizon_bars: int
    slippage_and_cost_drag_pct: float = 0.08
    limitations_note: str

class HistoricalAnalysisResponse(BaseModel):
    symbol: str
    timeframe: str
    period: str
    candles: List[Candle]
    timeline_alerts: List[Dict[str, Any]]
    metrics: BacktestMetrics

class GlobalMarketSummary(BaseModel):
    timestamp: str
    india: Dict[str, Any]
    us: Dict[str, Any]
    crypto: Dict[str, Any]
    macro: Dict[str, Any]
    top_gainers: List[Dict[str, Any]]
    top_losers: List[Dict[str, Any]]
    unusual_volume: List[Dict[str, Any]]
    active_alerts_count: int
    data_health: Dict[str, Any]
