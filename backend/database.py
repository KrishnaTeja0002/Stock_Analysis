import os
import aiosqlite
import json
from typing import List, Dict, Optional, Any
from models import SoundProfileConfig, WaveformType, AssetConfig, IndianMomentumState, USMomentumState, CryptoMomentumState

DB_PATH = os.path.join(os.path.dirname(__file__), "trend_analysis.db")

DEFAULT_SOUND_PROFILES = [
    # Indian Market Profiles
    {"state_name": IndianMomentumState.EARLY_UP.value, "market": "india", "waveform": WaveformType.SINE.value, "frequency": 580.0, "beep_duration_ms": 90, "repetition_count": 1, "interval_ms": 60, "volume": 0.45, "enabled": True},
    {"state_name": IndianMomentumState.CONFIRMED_UP.value, "market": "india", "waveform": WaveformType.SINE.value, "frequency": 680.0, "beep_duration_ms": 130, "repetition_count": 2, "interval_ms": 70, "volume": 0.65, "enabled": True},
    {"state_name": IndianMomentumState.ACCELERATING_UP.value, "market": "india", "waveform": WaveformType.TRIANGLE.value, "frequency": 920.0, "beep_duration_ms": 180, "repetition_count": 3, "interval_ms": 80, "volume": 0.85, "enabled": True},
    {"state_name": IndianMomentumState.EXHAUSTION_UP.value, "market": "india", "waveform": WaveformType.SINE.value, "frequency": 540.0, "beep_duration_ms": 160, "repetition_count": 2, "interval_ms": 100, "volume": 0.6, "enabled": True},
    {"state_name": IndianMomentumState.EARLY_DOWN.value, "market": "india", "waveform": WaveformType.SINE.value, "frequency": 300.0, "beep_duration_ms": 110, "repetition_count": 1, "interval_ms": 80, "volume": 0.5, "enabled": True},
    {"state_name": IndianMomentumState.CONFIRMED_DOWN.value, "market": "india", "waveform": WaveformType.TRIANGLE.value, "frequency": 260.0, "beep_duration_ms": 160, "repetition_count": 2, "interval_ms": 90, "volume": 0.7, "enabled": True},
    {"state_name": IndianMomentumState.ACCELERATING_DOWN.value, "market": "india", "waveform": WaveformType.SAWTOOTH.value, "frequency": 180.0, "beep_duration_ms": 320, "repetition_count": 3, "interval_ms": 100, "volume": 0.9, "enabled": True},
    {"state_name": IndianMomentumState.EXHAUSTION_DOWN.value, "market": "india", "waveform": WaveformType.SINE.value, "frequency": 350.0, "beep_duration_ms": 160, "repetition_count": 2, "interval_ms": 100, "volume": 0.6, "enabled": True},
    {"state_name": IndianMomentumState.POTENTIAL_BREAKOUT.value, "market": "india", "waveform": WaveformType.TRIANGLE.value, "frequency": 988.0, "beep_duration_ms": 90, "repetition_count": 4, "interval_ms": 45, "volume": 0.95, "enabled": True},
    {"state_name": IndianMomentumState.POTENTIAL_BREAKDOWN.value, "market": "india", "waveform": WaveformType.SQUARE.value, "frequency": 165.0, "beep_duration_ms": 350, "repetition_count": 4, "interval_ms": 80, "volume": 1.0, "enabled": True},
    {"state_name": IndianMomentumState.POSSIBLE_REVERSAL.value, "market": "india", "waveform": WaveformType.SINE.value, "frequency": 494.0, "beep_duration_ms": 220, "repetition_count": 2, "interval_ms": 140, "volume": 0.75, "enabled": True},
    {"state_name": IndianMomentumState.SIDEWAYS.value, "market": "india", "waveform": WaveformType.SINE.value, "frequency": 440.0, "beep_duration_ms": 80, "repetition_count": 1, "interval_ms": 50, "volume": 0.2, "enabled": False},
    {"state_name": IndianMomentumState.QUIET.value, "market": "india", "waveform": WaveformType.SINE.value, "frequency": 400.0, "beep_duration_ms": 60, "repetition_count": 1, "interval_ms": 50, "volume": 0.1, "enabled": False},
    {"state_name": IndianMomentumState.UNCERTAIN.value, "market": "india", "waveform": WaveformType.TRIANGLE.value, "frequency": 247.0, "beep_duration_ms": 350, "repetition_count": 1, "interval_ms": 100, "volume": 0.6, "enabled": True},

    # US Market Profiles
    {"state_name": USMomentumState.STRONG_BULLISH.value, "market": "us", "waveform": WaveformType.TRIANGLE.value, "frequency": 784.0, "beep_duration_ms": 150, "repetition_count": 2, "interval_ms": 70, "volume": 0.75, "enabled": True},
    {"state_name": USMomentumState.OPENING_RANGE_BREAKOUT.value, "market": "us", "waveform": WaveformType.TRIANGLE.value, "frequency": 1046.0, "beep_duration_ms": 120, "repetition_count": 3, "interval_ms": 50, "volume": 0.9, "enabled": True},
    {"state_name": USMomentumState.STRONG_BEARISH.value, "market": "us", "waveform": WaveformType.SAWTOOTH.value, "frequency": 220.0, "beep_duration_ms": 280, "repetition_count": 3, "interval_ms": 90, "volume": 0.85, "enabled": True},
    {"state_name": USMomentumState.PROFIT_BOOKING.value, "market": "us", "waveform": WaveformType.SINE.value, "frequency": 440.0, "beep_duration_ms": 150, "repetition_count": 2, "interval_ms": 80, "volume": 0.55, "enabled": True},

    # Crypto Market Profiles
    {"state_name": CryptoMomentumState.STRONG_BULLISH_MOMENTUM.value, "market": "crypto", "waveform": WaveformType.TRIANGLE.value, "frequency": 880.0, "beep_duration_ms": 160, "repetition_count": 3, "interval_ms": 60, "volume": 0.8, "enabled": True},
    {"state_name": CryptoMomentumState.POTENTIAL_LIQUIDATION_VOLATILITY.value, "market": "crypto", "waveform": WaveformType.SQUARE.value, "frequency": 150.0, "beep_duration_ms": 400, "repetition_count": 4, "interval_ms": 70, "volume": 1.0, "enabled": True},
    {"state_name": CryptoMomentumState.ACCUMULATION_LIKE.value, "market": "crypto", "waveform": WaveformType.SINE.value, "frequency": 523.0, "beep_duration_ms": 140, "repetition_count": 1, "interval_ms": 60, "volume": 0.5, "enabled": True},
]

DEFAULT_INDIAN_ASSETS = [
    {
        "symbol": "RELIANCE.NS", "name": "Reliance Industries Ltd", "market": "india", "currency": "INR", "timezone": "Asia/Kolkata", "exchange": "NSE",
        "nse_symbol": "RELIANCE", "bse_code": "500325", "sector": "Energy", "industry": "Oil & Gas / Telecom",
        "index_membership": "NIFTY 50", "market_cap_category": "Large Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "TCS.NS", "name": "Tata Consultancy Services Ltd", "market": "india", "currency": "INR", "timezone": "Asia/Kolkata", "exchange": "NSE",
        "nse_symbol": "TCS", "bse_code": "532540", "sector": "Information Technology", "industry": "IT Services",
        "index_membership": "NIFTY 50", "market_cap_category": "Large Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "HDFCBANK.NS", "name": "HDFC Bank Ltd", "market": "india", "currency": "INR", "timezone": "Asia/Kolkata", "exchange": "NSE",
        "nse_symbol": "HDFCBANK", "bse_code": "500180", "sector": "Financial Services", "industry": "Private Bank",
        "index_membership": "NIFTY 50", "market_cap_category": "Large Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "INFY.NS", "name": "Infosys Ltd", "market": "india", "currency": "INR", "timezone": "Asia/Kolkata", "exchange": "NSE",
        "nse_symbol": "INFY", "bse_code": "500209", "sector": "Information Technology", "industry": "IT Services",
        "index_membership": "NIFTY 50", "market_cap_category": "Large Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "ICICIBANK.NS", "name": "ICICI Bank Ltd", "market": "india", "currency": "INR", "timezone": "Asia/Kolkata", "exchange": "NSE",
        "nse_symbol": "ICICIBANK", "bse_code": "532174", "sector": "Financial Services", "industry": "Private Bank",
        "index_membership": "NIFTY 50", "market_cap_category": "Large Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "SBIN.NS", "name": "State Bank of India", "market": "india", "currency": "INR", "timezone": "Asia/Kolkata", "exchange": "NSE",
        "nse_symbol": "SBIN", "bse_code": "500112", "sector": "Financial Services", "industry": "PSU Bank",
        "index_membership": "NIFTY 50", "market_cap_category": "Large Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "MARUTI.NS", "name": "Maruti Suzuki India Ltd", "market": "india", "currency": "INR", "timezone": "Asia/Kolkata", "exchange": "NSE",
        "nse_symbol": "MARUTI", "bse_code": "532500", "sector": "Automobile", "industry": "Passenger Vehicles",
        "index_membership": "NIFTY 50", "market_cap_category": "Large Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "ITC.NS", "name": "ITC Ltd", "market": "india", "currency": "INR", "timezone": "Asia/Kolkata", "exchange": "NSE",
        "nse_symbol": "ITC", "bse_code": "500875", "sector": "Consumer Goods", "industry": "FMCG / Cigarettes",
        "index_membership": "NIFTY 50", "market_cap_category": "Large Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "SUNPHARMA.NS", "name": "Sun Pharmaceutical Industries", "market": "india", "currency": "INR", "timezone": "Asia/Kolkata", "exchange": "NSE",
        "nse_symbol": "SUNPHARMA", "bse_code": "524715", "sector": "Healthcare", "industry": "Pharmaceuticals",
        "index_membership": "NIFTY 50", "market_cap_category": "Large Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "TATASTEEL.NS", "name": "Tata Steel Ltd", "market": "india", "currency": "INR", "timezone": "Asia/Kolkata", "exchange": "NSE",
        "nse_symbol": "TATASTEEL", "bse_code": "500470", "sector": "Metals", "industry": "Iron & Steel",
        "index_membership": "NIFTY 50", "market_cap_category": "Large Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "DIXON.NS", "name": "Dixon Technologies (India) Ltd", "market": "india", "currency": "INR", "timezone": "Asia/Kolkata", "exchange": "NSE",
        "nse_symbol": "DIXON", "bse_code": "540699", "sector": "Consumer Electronics", "industry": "EMS",
        "index_membership": "NIFTY MIDCAP 100", "market_cap_category": "Mid Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "POLYCAB.NS", "name": "Polycab India Ltd", "market": "india", "currency": "INR", "timezone": "Asia/Kolkata", "exchange": "NSE",
        "nse_symbol": "POLYCAB", "bse_code": "542652", "sector": "Capital Goods", "industry": "Wires & Cables",
        "index_membership": "NIFTY MIDCAP 100", "market_cap_category": "Mid Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "SUZLON.NS", "name": "Suzlon Energy Ltd", "market": "india", "currency": "INR", "timezone": "Asia/Kolkata", "exchange": "NSE",
        "nse_symbol": "SUZLON", "bse_code": "532667", "sector": "Renewable Energy", "industry": "Wind Equipment",
        "index_membership": "NIFTY SMALLCAP 250", "market_cap_category": "Small Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 0, "cooldown_seconds": 120
    },
    {
        "symbol": "^NSEI", "name": "NIFTY 50 Benchmark Index", "market": "india", "currency": "INR", "timezone": "Asia/Kolkata", "exchange": "NSE",
        "nse_symbol": "NIFTY50", "bse_code": None, "sector": "Broad Market", "industry": "Benchmark Index",
        "index_membership": "Index", "market_cap_category": "Benchmark Index",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "^NSEBANK", "name": "NIFTY BANK Sectoral Index", "market": "india", "currency": "INR", "timezone": "Asia/Kolkata", "exchange": "NSE",
        "nse_symbol": "BANKNIFTY", "bse_code": None, "sector": "Banking", "industry": "Sectoral Index",
        "index_membership": "Index", "market_cap_category": "Sectoral Index",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
]

DEFAULT_US_ASSETS = [
    {
        "symbol": "AAPL", "name": "Apple Inc.", "market": "us", "currency": "USD", "timezone": "America/New_York", "exchange": "NASDAQ",
        "nse_symbol": "AAPL", "bse_code": None, "sector": "Technology", "industry": "Consumer Electronics",
        "index_membership": "S&P 500 / NASDAQ 100", "market_cap_category": "Mega Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "MSFT", "name": "Microsoft Corporation", "market": "us", "currency": "USD", "timezone": "America/New_York", "exchange": "NASDAQ",
        "nse_symbol": "MSFT", "bse_code": None, "sector": "Technology", "industry": "Software Infrastructure",
        "index_membership": "S&P 500 / NASDAQ 100", "market_cap_category": "Mega Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "NVDA", "name": "NVIDIA Corporation", "market": "us", "currency": "USD", "timezone": "America/New_York", "exchange": "NASDAQ",
        "nse_symbol": "NVDA", "bse_code": None, "sector": "Technology", "industry": "Semiconductors / AI",
        "index_membership": "S&P 500 / NASDAQ 100", "market_cap_category": "Mega Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "AMZN", "name": "Amazon.com Inc.", "market": "us", "currency": "USD", "timezone": "America/New_York", "exchange": "NASDAQ",
        "nse_symbol": "AMZN", "bse_code": None, "sector": "Consumer Discretionary", "industry": "E-Commerce / Cloud",
        "index_membership": "S&P 500 / NASDAQ 100", "market_cap_category": "Mega Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "GOOGL", "name": "Alphabet Inc.", "market": "us", "currency": "USD", "timezone": "America/New_York", "exchange": "NASDAQ",
        "nse_symbol": "GOOGL", "bse_code": None, "sector": "Communication Services", "industry": "Internet Search / Advertising",
        "index_membership": "S&P 500 / NASDAQ 100", "market_cap_category": "Mega Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "TSLA", "name": "Tesla Inc.", "market": "us", "currency": "USD", "timezone": "America/New_York", "exchange": "NASDAQ",
        "nse_symbol": "TSLA", "bse_code": None, "sector": "Consumer Discretionary", "industry": "EV & Clean Energy",
        "index_membership": "S&P 500 / NASDAQ 100", "market_cap_category": "Large Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "META", "name": "Meta Platforms Inc.", "market": "us", "currency": "USD", "timezone": "America/New_York", "exchange": "NASDAQ",
        "nse_symbol": "META", "bse_code": None, "sector": "Communication Services", "industry": "Social Media / Metaverse",
        "index_membership": "S&P 500 / NASDAQ 100", "market_cap_category": "Large Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "SPY", "name": "SPDR S&P 500 ETF Trust", "market": "us", "currency": "USD", "timezone": "America/New_York", "exchange": "NYSE Arca",
        "nse_symbol": "SPY", "bse_code": None, "sector": "Broad Market", "industry": "S&P 500 Benchmark ETF",
        "index_membership": "Benchmark ETF", "market_cap_category": "Mega Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "QQQ", "name": "Invesco QQQ Trust", "market": "us", "currency": "USD", "timezone": "America/New_York", "exchange": "NASDAQ",
        "nse_symbol": "QQQ", "bse_code": None, "sector": "Technology", "industry": "Nasdaq-100 Benchmark ETF",
        "index_membership": "Benchmark ETF", "market_cap_category": "Mega Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
]

DEFAULT_CRYPTO_ASSETS = [
    {
        "symbol": "BTC-USD", "name": "Bitcoin", "market": "crypto", "currency": "USD", "timezone": "UTC", "exchange": "Binance / Coinbase",
        "nse_symbol": "BTC", "bse_code": None, "sector": "Layer 1 / Store of Value", "industry": "Cryptocurrency",
        "index_membership": "Crypto Top 10", "market_cap_category": "Mega Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "ETH-USD", "name": "Ethereum", "market": "crypto", "currency": "USD", "timezone": "UTC", "exchange": "Binance / Coinbase",
        "nse_symbol": "ETH", "bse_code": None, "sector": "Smart Contracts / DeFi", "industry": "Cryptocurrency",
        "index_membership": "Crypto Top 10", "market_cap_category": "Mega Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "SOL-USD", "name": "Solana", "market": "crypto", "currency": "USD", "timezone": "UTC", "exchange": "Binance / Coinbase",
        "nse_symbol": "SOL", "bse_code": None, "sector": "High Throughput L1", "industry": "Cryptocurrency",
        "index_membership": "Crypto Top 10", "market_cap_category": "Large Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
    {
        "symbol": "BNB-USD", "name": "BNB", "market": "crypto", "currency": "USD", "timezone": "UTC", "exchange": "Binance",
        "nse_symbol": "BNB", "bse_code": None, "sector": "Exchange Ecosystem", "industry": "Cryptocurrency",
        "index_membership": "Crypto Top 10", "market_cap_category": "Large Cap",
        "provider": "yfinance", "timeframe": "5m", "is_monitored": 1, "cooldown_seconds": 120
    },
]

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA journal_mode=WAL;")

        # Auto-migration check: ensure assets table has market and currency columns
        cursor = await db.execute("PRAGMA table_info(assets)")
        cols = [r[1] for r in await cursor.fetchall()]
        if cols and ("market" not in cols or "currency" not in cols):
            await db.execute("DROP TABLE assets")

        await db.execute("""
            CREATE TABLE IF NOT EXISTS assets (
                symbol TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                market TEXT NOT NULL DEFAULT 'india',
                currency TEXT NOT NULL DEFAULT 'INR',
                timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
                exchange TEXT DEFAULT 'NSE',
                nse_symbol TEXT,
                bse_code TEXT,
                asset_class TEXT NOT NULL DEFAULT 'equity',
                sector TEXT NOT NULL,
                industry TEXT NOT NULL,
                index_membership TEXT NOT NULL,
                market_cap_category TEXT NOT NULL,
                provider TEXT NOT NULL,
                timeframe TEXT NOT NULL,
                is_monitored INTEGER NOT NULL DEFAULT 1,
                cooldown_seconds INTEGER NOT NULL DEFAULT 120,
                earnings_date TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS sound_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_symbol TEXT,
                state_name TEXT NOT NULL,
                market TEXT NOT NULL DEFAULT 'india',
                waveform TEXT NOT NULL,
                frequency REAL NOT NULL,
                beep_duration_ms INTEGER NOT NULL,
                repetition_count INTEGER NOT NULL,
                interval_ms INTEGER NOT NULL,
                volume REAL NOT NULL,
                enabled INTEGER NOT NULL DEFAULT 1,
                custom_audio_url TEXT,
                UNIQUE(asset_symbol, state_name)
            );
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS alert_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                symbol TEXT NOT NULL,
                timeframe TEXT NOT NULL,
                price REAL NOT NULL,
                trend_state TEXT NOT NULL,
                trend_score REAL NOT NULL,
                severity INTEGER NOT NULL,
                rule_triggered TEXT NOT NULL,
                reason_summary TEXT NOT NULL,
                indicators_snapshot TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Clean old profiles if count is insufficient
        cursor = await db.execute("SELECT COUNT(*) FROM sound_profiles WHERE asset_symbol IS NULL")
        row = await cursor.fetchone()
        if not row or row[0] < 15:
            await db.execute("DELETE FROM sound_profiles WHERE asset_symbol IS NULL")
            for p in DEFAULT_SOUND_PROFILES:
                await db.execute("""
                    INSERT INTO sound_profiles 
                    (asset_symbol, state_name, market, waveform, frequency, beep_duration_ms, repetition_count, interval_ms, volume, enabled)
                    VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    p["state_name"], p.get("market", "india"), p["waveform"], p["frequency"],
                    p["beep_duration_ms"], p["repetition_count"],
                    p["interval_ms"], p["volume"], 1 if p["enabled"] else 0
                ))

        # Seed assets if table is empty or missing US / Crypto
        cursor = await db.execute("SELECT COUNT(*) FROM assets")
        row = await cursor.fetchone()
        if not row or row[0] < 15:
            await db.execute("DELETE FROM assets")
            all_assets = DEFAULT_INDIAN_ASSETS + DEFAULT_US_ASSETS + DEFAULT_CRYPTO_ASSETS
            for a in all_assets:
                await db.execute("""
                    INSERT INTO assets 
                    (symbol, name, market, currency, timezone, exchange, nse_symbol, bse_code, asset_class, sector, industry, index_membership, market_cap_category, provider, timeframe, is_monitored, cooldown_seconds)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    a["symbol"], a["name"], a.get("market", "india"), a.get("currency", "INR"), a.get("timezone", "Asia/Kolkata"),
                    a.get("exchange", "NSE"), a.get("nse_symbol"), a.get("bse_code"), a.get("asset_class", "equity"),
                    a["sector"], a["industry"], a["index_membership"], a["market_cap_category"],
                    a["provider"], a["timeframe"], a["is_monitored"], a["cooldown_seconds"]
                ))

        await db.commit()

async def get_all_assets(market: Optional[str] = None) -> List[AssetConfig]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if market and market.lower() != "all":
            query = "SELECT * FROM assets WHERE market = ? ORDER BY symbol ASC"
            params = (market.lower(),)
        else:
            query = "SELECT * FROM assets ORDER BY market ASC, symbol ASC"
            params = ()

        async with db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
            return [
                AssetConfig(
                    symbol=r["symbol"],
                    name=r["name"],
                    market=r["market"] if "market" in r.keys() else "india",
                    currency=r["currency"] if "currency" in r.keys() else "INR",
                    timezone=r["timezone"] if "timezone" in r.keys() else "Asia/Kolkata",
                    exchange=r["exchange"] if "exchange" in r.keys() else "NSE",
                    nse_symbol=r["nse_symbol"],
                    bse_code=r["bse_code"],
                    asset_class=r["asset_class"],
                    sector=r["sector"],
                    industry=r["industry"],
                    index_membership=r["index_membership"],
                    market_cap_category=r["market_cap_category"],
                    provider=r["provider"],
                    timeframe=r["timeframe"],
                    is_monitored=bool(r["is_monitored"]),
                    cooldown_seconds=r["cooldown_seconds"],
                    earnings_date=r["earnings_date"] if "earnings_date" in r.keys() else None
                )
                for r in rows
            ]

async def upsert_asset(asset: AssetConfig):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO assets 
            (symbol, name, market, currency, timezone, exchange, nse_symbol, bse_code, asset_class, sector, industry, index_membership, market_cap_category, provider, timeframe, is_monitored, cooldown_seconds, earnings_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(symbol) DO UPDATE SET
                name=excluded.name,
                market=excluded.market,
                currency=excluded.currency,
                timezone=excluded.timezone,
                exchange=excluded.exchange,
                nse_symbol=excluded.nse_symbol,
                bse_code=excluded.bse_code,
                sector=excluded.sector,
                industry=excluded.industry,
                index_membership=excluded.index_membership,
                market_cap_category=excluded.market_cap_category,
                provider=excluded.provider,
                timeframe=excluded.timeframe,
                is_monitored=excluded.is_monitored,
                cooldown_seconds=excluded.cooldown_seconds,
                earnings_date=excluded.earnings_date
        """, (
            asset.symbol, asset.name, asset.market, asset.currency, asset.timezone, asset.exchange,
            asset.nse_symbol, asset.bse_code, asset.asset_class, asset.sector, asset.industry,
            asset.index_membership, asset.market_cap_category, asset.provider, asset.timeframe,
            1 if asset.is_monitored else 0, asset.cooldown_seconds, asset.earnings_date
        ))
        await db.commit()

async def delete_asset(symbol: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM assets WHERE symbol = ?", (symbol,))
        await db.execute("DELETE FROM sound_profiles WHERE asset_symbol = ?", (symbol,))
        await db.commit()

async def get_sound_profiles(asset_symbol: Optional[str] = None, market: Optional[str] = None) -> List[SoundProfileConfig]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if asset_symbol:
            cursor_global = await db.execute("SELECT * FROM sound_profiles WHERE asset_symbol IS NULL")
            global_rows = {r["state_name"]: r for r in await cursor_global.fetchall()}

            cursor_asset = await db.execute("SELECT * FROM sound_profiles WHERE asset_symbol = ?", (asset_symbol,))
            asset_rows = {r["state_name"]: r for r in await cursor_asset.fetchall()}

            profiles = []
            for state_name, row in global_rows.items():
                target = asset_rows.get(state_name, row)
                profiles.append(SoundProfileConfig(
                    id=target["id"],
                    asset_symbol=asset_symbol if state_name in asset_rows else None,
                    state_name=target["state_name"],
                    market=target["market"] if "market" in target.keys() else "india",
                    waveform=WaveformType(target["waveform"]),
                    frequency=target["frequency"],
                    beep_duration_ms=target["beep_duration_ms"],
                    repetition_count=target["repetition_count"],
                    interval_ms=target["interval_ms"],
                    volume=target["volume"],
                    enabled=bool(target["enabled"]),
                    custom_audio_url=target["custom_audio_url"],
                ))
            return profiles
        else:
            if market and market.lower() != "all":
                cursor = await db.execute("SELECT * FROM sound_profiles WHERE asset_symbol IS NULL AND market = ?", (market.lower(),))
            else:
                cursor = await db.execute("SELECT * FROM sound_profiles WHERE asset_symbol IS NULL")
            rows = await cursor.fetchall()
            profiles = []
            for r in rows:
                profiles.append(SoundProfileConfig(
                    id=r["id"],
                    asset_symbol=None,
                    state_name=r["state_name"],
                    market=r["market"] if "market" in r.keys() else "india",
                    waveform=WaveformType(r["waveform"]),
                    frequency=r["frequency"],
                    beep_duration_ms=r["beep_duration_ms"],
                    repetition_count=r["repetition_count"],
                    interval_ms=r["interval_ms"],
                    volume=r["volume"],
                    enabled=bool(r["enabled"]),
                    custom_audio_url=r["custom_audio_url"],
                ))
            return profiles

async def save_sound_profile(p: SoundProfileConfig):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO sound_profiles 
            (asset_symbol, state_name, market, waveform, frequency, beep_duration_ms, repetition_count, interval_ms, volume, enabled, custom_audio_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(asset_symbol, state_name) DO UPDATE SET
                market=excluded.market,
                waveform=excluded.waveform,
                frequency=excluded.frequency,
                beep_duration_ms=excluded.beep_duration_ms,
                repetition_count=excluded.repetition_count,
                interval_ms=excluded.interval_ms,
                volume=excluded.volume,
                enabled=excluded.enabled,
                custom_audio_url=excluded.custom_audio_url
        """, (
            p.asset_symbol, p.state_name, p.market, p.waveform.value, p.frequency,
            p.beep_duration_ms, p.repetition_count, p.interval_ms, p.volume,
            1 if p.enabled else 0, p.custom_audio_url
        ))
        await db.commit()

async def record_alert(
    timestamp: str, symbol: str, timeframe: str, price: float,
    trend_state: str, trend_score: float, severity: int,
    rule_triggered: str, reason_summary: str, indicators: Dict[str, Any]
):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO alert_history 
            (timestamp, symbol, timeframe, price, trend_state, trend_score, severity, rule_triggered, reason_summary, indicators_snapshot)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            timestamp, symbol, timeframe, price, trend_state, trend_score, severity,
            rule_triggered, reason_summary, json.dumps(indicators)
        ))
        await db.commit()

async def get_recent_alerts(symbol: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if symbol:
            query = "SELECT * FROM alert_history WHERE symbol = ? ORDER BY id DESC LIMIT ?"
            params = (symbol, limit)
        else:
            query = "SELECT * FROM alert_history ORDER BY id DESC LIMIT ?"
            params = (limit,)
        
        async with db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                try:
                    item["indicators_snapshot"] = json.loads(item["indicators_snapshot"])
                except Exception:
                    pass
                results.append(item)
            return results
