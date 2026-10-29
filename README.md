# SonarTrend Pro: Intelligent Real-Time Trend Analysis System with Custom Sound Alerts

**SonarTrend Pro** is an institutional-grade, real-time quantitative trend analysis and acoustic monitoring system. It continuously analyzes market dynamics across US Equities, Indices, Cryptocurrencies, and Forex pairs, detecting trend direction, momentum acceleration, consolidation, explosive breakouts, and turning points—translating every market regime change into distinct, customizable sound alerts.

---

## Key Highlights & Capabilities

1. **11-State Quantitative Trend Engine**:
   - Classifies price action strictly without lookahead bias across 11 documented market conditions:
     1. Strong upward trend
     2. Moderate upward trend
     3. Weak upward movement
     4. Sideways or consolidating market
     5. Weak downward movement
     6. Moderate downward trend
     7. Strong downward trend
     8. Sudden upward breakout (Donchian resistance breach + expansion candle + volume)
     9. Sudden downward breakdown (Donchian support breach + expansion candle + volume)
     10. Possible trend reversal (Oversold/overbought Bollinger excursion + RSI recovery + MACD histogram tick)
     11. Insufficient data or uncertain trend
   - Calculates a continuous **Composite Trend Score** (-100 to +100) combining EMA ribbon alignment (EMA 9/21/50), ATR-normalized EMA slope, Wilder's RSI(14), MACD(12, 26, 9) histogram direction, Bollinger Bandwidth, and volume expansion.

2. **Intelligent Web Audio Sound Synthesizer Studio**:
   - Zero-latency native Web Audio API tone synthesizer.
   - Fully customizable per trend state:
     - Oscillator waveforms: `sine`, `triangle`, `square`, `sawtooth`
     - Frequency/pitch control (100 Hz to 1,600 Hz)
     - Pulse duration (50 ms to 600 ms)
     - Repetition count (1x to 5x)
     - Pulse interval gap (30 ms to 300 ms)
     - Master volume slider (0% to 100%)
     - Enable / mute toggles
     - Custom audio file upload (`.mp3`, `.wav`)
     - Instant interactive test preview button
   - Directional pitch contouring: descending pitch for downward alerts, ascending pitch for upward alerts, two-tone warning for reversals.

3. **Severity-Based Alert Suppression & Hysteresis Logic**:
   - Prevents alarm fatigue and noise:
     - **Hysteresis confirmation**: Requires 2 consecutive bar confirmations before declaring trend transitions.
     - **Urgent event escalation**: Sudden breakouts, breakdowns, and reversals immediately bypass lower-severity cooldowns.
     - **Configurable cooldowns**: Severity 1 (15m), Severity 2 (5m), Severity 3 (2m), Severity 4 (45s).
     - Master mute switch and quiet hours schedule.
     - Transparent mathematical explanation for every triggered alert.

4. **Multi-Asset Watchlist & Real-Time Monitoring**:
   - Pre-loaded with major US equities and indices (SPY, QQQ, AAPL, NVDA, TSLA) and crypto (BTC-USD).
   - Instant search across hundreds of symbols or custom ticker entries.
   - Built-in synthetic dataset generator for reproducible offline testing (`SYNTH-BULL`, `SYNTH-BEAR`, `SYNTH-SIDE`, `SYNTH-BREAKOUT`, `SYNTH-BREAKDOWN`, `SYNTH-REV`).
   - Clear data freshness labeling: `LIVE`, `DELAYED`, `HISTORICAL`, `SIMULATED`.

5. **Walk-Forward Historical Backtesting & Evaluation**:
   - Simulates alert rules and trend transitions chronologically without lookahead bias.
   - Computes:
     - 5-bar and 15-bar forward continuation rate (%)
     - False alert rate (%)
     - Average trend regime duration (bars)
     - Volatility regime shifts (ATR shocks)
     - Historical alert timeline plotted directly on interactive TradingView charts.

---

## Technical Architecture

```
stock analysis/
├── backend/
│   ├── main.py                  # FastAPI server, REST routes, WebSocket hub & static mounting
│   ├── database.py              # SQLite persistence (WAL mode) for assets, sounds & alerts
│   ├── models.py                # Pydantic data schemas & enums
│   ├── engine/
│   │   ├── indicators.py        # EMA, ATR, RSI, MACD, Bollinger Bands, Donchian, Volume SMA
│   │   ├── classifier.py        # 11-state classifier & continuous -100 to +100 trend scorer
│   │   ├── trend_engine.py      # DataFrame indicator enrichment & latest candle analyzer
│   │   ├── alert_manager.py     # Hysteresis, escalation & cooldown noise suppression
│   │   └── backtester.py        # Walk-forward historical simulator & continuation metrics
│   ├── services/
│   │   ├── data_provider.py     # Yahoo Finance (yfinance), Binance public API & synthetic data
│   │   ├── validator.py         # Timestamp monotonicity, stale check & OHLCV sanity validation
│   │   └── monitor_service.py   # Continuous background polling loop & WebSocket dispatch
│   ├── tests/
│   │   ├── test_trend_analysis.py            # Automated tests for indicators, classification & alerts
│   │   └── test_reliability_and_edge_cases.py# Lookahead bias, duplicate data & warmup validation
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── audio/soundEngine.ts # Web Audio API oscillator synthesis & custom audio playback
│   │   ├── components/
│   │   │   ├── CandleChart.tsx  # TradingView Lightweight Charts (Candlesticks, Volume, Markers)
│   │   │   ├── SoundConfigModal.tsx  # Sound Studio preview, waveform & slider configuration
│   │   │   ├── WatchlistPanel.tsx    # Watchlist search, monitoring toggle & ticker management
│   │   │   └── HistoricalBacktestView.tsx # Historical backtesting metrics & alert timeline
│   │   ├── App.tsx              # Main dashboard application
│   │   └── index.css            # Dark theme design system, glassmorphism & typography
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## Installation & Quickstart

### Prerequisites
- Python 3.9+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# Clone or navigate to the repository directory
cd "stock analysis"

# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Run automated tests
PYTHONPATH=backend pytest backend/tests/
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run build
cd ..
```

### 3. Launching the System

You can run the full-stack system in either of two modes:

#### Option A: Unified Server (Production Mode)
Run the FastAPI backend, which serves both the REST API, WebSocket feed, and built React application from a single port:
```bash
source .venv/bin/activate
PYTHONPATH=backend uvicorn main:app --host 127.0.0.1 --port 8000
```
Open your browser at: **`http://localhost:8000`**

#### Option B: Developer Mode (Hot Reloading)
In terminal 1 (Backend):
```bash
source .venv/bin/activate
PYTHONPATH=backend uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
In terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```
Open your browser at: **`http://localhost:5173`**

---

## Sound Alert Usage & Browser Audio Notice

1. **Browser Autoplay Policy**: Modern browsers (Chrome, Safari, Firefox, Edge) restrict audio playback until the user interacts with the page. Upon opening the application, click the **"Enable Browser Sound Alerts"** button in the top bar to unlock the Web Audio context.
2. **Previewing Sounds**: Click the **"Sound Studio"** button to preview any of the 11 trend states, adjust pitch (Hz), duration (ms), repetition count, or volume, and click **"Save Profile"**.
3. **Background Tabs**: If the browser tab is minimized or inactive, browsers may throttle timers and Web Audio execution. Keep the tab open or pinned for uninterrupted audio monitoring.

---

## Data Providers & Extensibility

- **Yahoo Finance (`yfinance`)**: Free, zero-key default for all US equities (SPY, QQQ, AAPL, NVDA, TSLA), global indices (^GSPC, ^IXIC), commodities (GC=F, CL=F), and forex pairs.
- **Binance Public API**: Free, zero-key public REST endpoint for real-time crypto pairs (BTCUSDT, ETHUSDT).
- **Synthetic Data Generator**: Deterministic & stochastic simulation of 6 market regimes (`SYNTH-BULL`, `SYNTH-BEAR`, `SYNTH-SIDE`, `SYNTH-BREAKOUT`, `SYNTH-BREAKDOWN`, `SYNTH-REV`) for offline demonstrations and testing.
- **Optional API Key Support**: The `MarketDataProvider` architecture in `backend/services/data_provider.py` is designed with pluggable adapters, allowing users to configure Alpha Vantage or Polygon.io API keys in environment variables if higher tick frequency is desired.

---

## Limitations & Future Roadmap

1. **Market Hours & Weekend Gaps**: Equities only trade during exchange hours (9:30 AM - 4:00 PM EST). Outside regular hours, Yahoo Finance serves delayed or last-close prices.
2. **Slippage & Execution**: Historical backtesting isolates bar prices without lookahead bias, but does not model order book depth, execution slippage, or bid-ask spread.
3. **Future Improvements**:
   - Order execution webhook integration (e.g., triggering paper trades on confirmed breakout alerts).
   - Multi-monitor pop-out chart windows.
   - Push notifications via Web Push API for mobile devices.
