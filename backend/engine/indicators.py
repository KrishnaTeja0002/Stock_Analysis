import numpy as np
import pandas as pd
from typing import Tuple, Optional

def calculate_ema(series: pd.Series, period: int) -> pd.Series:
    """Exponential Moving Average."""
    return series.ewm(span=period, adjust=False).mean()

def calculate_atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    """Wilder's Average True Range (ATR)."""
    prev_close = close.shift(1)
    tr1 = high - low
    tr2 = (high - prev_close).abs()
    tr3 = (low - prev_close).abs()
    true_range = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    
    atr = true_range.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
    fallback = true_range.rolling(period, min_periods=1).mean()
    return atr.combine_first(fallback)

def calculate_rsi(close: pd.Series, period: int = 14) -> pd.Series:
    """Wilder's Relative Strength Index (RSI) with zero-loss/gain protection."""
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    
    avg_gain = gain.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
    
    rs = np.where(avg_loss == 0, np.where(avg_gain > 0, np.inf, 1.0), avg_gain / avg_loss)
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return pd.Series(rsi, index=close.index).fillna(50.0)

def calculate_macd(
    close: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9
) -> Tuple[pd.Series, pd.Series, pd.Series]:
    """MACD line, signal line, histogram."""
    ema_fast = calculate_ema(close, fast)
    ema_slow = calculate_ema(close, slow)
    macd_line = ema_fast - ema_slow
    signal_line = calculate_ema(macd_line, signal)
    hist = macd_line - signal_line
    return macd_line, signal_line, hist

def calculate_bollinger_bands(
    close: pd.Series, period: int = 20, num_std: float = 2.0
) -> Tuple[pd.Series, pd.Series, pd.Series, pd.Series, pd.Series]:
    """Bollinger Bands: Upper, Mid, Lower, Bandwidth, %B."""
    mid = close.rolling(window=period, min_periods=1).mean()
    std = close.rolling(window=period, min_periods=1).std(ddof=0).fillna(0)
    upper = mid + (std * num_std)
    lower = mid - (std * num_std)
    
    bandwidth = ((upper - lower) / mid.replace(0, np.nan)).fillna(0)
    spread = (upper - lower).replace(0, np.nan)
    pct_b = ((close - lower) / spread).fillna(0.5)
    return upper, mid, lower, bandwidth, pct_b

def calculate_donchian_channels(
    high: pd.Series, low: pd.Series, period: int = 20
) -> Tuple[pd.Series, pd.Series]:
    """Donchian Channels shifted by 1 bar to prevent lookahead bias."""
    upper = high.shift(1).rolling(window=period, min_periods=1).max()
    lower = low.shift(1).rolling(window=period, min_periods=1).min()
    return upper, lower

def calculate_intraday_vwap(df: pd.DataFrame) -> pd.Series:
    """
    Intraday Volume Weighted Average Price (VWAP).
    Resets at 09:15:00 IST of each trading day.
    Typical Price = (High + Low + Close) / 3
    VWAP = Cumulative(Typical Price * Volume) / Cumulative(Volume)
    """
    typical_price = (df['high'] + df['low'] + df['close']) / 3.0
    vol = df.get('volume', pd.Series(1, index=df.index)).replace(0, 1)

    # Check if index has dates for daily grouping
    if isinstance(df.index, pd.DatetimeIndex):
        dates = df.index.tz_convert('Asia/Kolkata').date if df.index.tz else df.index.date
        cum_tp_vol = (typical_price * vol).groupby(dates).cumsum()
        cum_vol = vol.groupby(dates).cumsum()
        vwap = (cum_tp_vol / cum_vol).fillna(df['close'])
    else:
        cum_tp_vol = (typical_price * vol).cumsum()
        cum_vol = vol.cumsum()
        vwap = (cum_tp_vol / cum_vol).fillna(df['close'])

    return vwap

def calculate_relative_volume_tod(df: pd.DataFrame, window_days: int = 5) -> pd.Series:
    """
    Time-of-day normalized relative volume (RVOL).
    Compares current volume with median volume of the same intraday time bucket.
    Falls back to 20-period rolling volume average if timestamps are non-intraday.
    """
    vol = df.get('volume', pd.Series(0, index=df.index))
    if not isinstance(df.index, pd.DatetimeIndex) or len(df) < 20:
        vol_sma = vol.rolling(20, min_periods=1).mean().replace(0, 1)
        return (vol / vol_sma).fillna(1.0)

    try:
        times = df.index.tz_convert('Asia/Kolkata').time if df.index.tz else df.index.time
        # Group by time of day
        rvol = []
        for i in range(len(df)):
            curr_time = times[i]
            # Match previous bars with same time of day (up to window_days)
            same_time_mask = (times[:i] == curr_time)
            if same_time_mask.sum() >= 2:
                historical_vol = vol.iloc[:i][same_time_mask].tail(window_days)
                median_vol = max(1.0, float(historical_vol.median()))
                rvol.append(float(vol.iloc[i]) / median_vol)
            else:
                # Fallback to rolling mean of recent 20 bars
                rolling_avg = max(1.0, float(vol.iloc[max(0, i - 20):i + 1].mean()))
                rvol.append(float(vol.iloc[i]) / rolling_avg)
        return pd.Series(rvol, index=df.index)
    except Exception:
        vol_sma = vol.rolling(20, min_periods=1).mean().replace(0, 1)
        return (vol / vol_sma).fillna(1.0)

def calculate_support_resistance(df: pd.DataFrame, window: int = 20) -> Tuple[pd.Series, pd.Series]:
    """Calculates dynamic nearby support and resistance levels using rolling pivots."""
    high = df['high']
    low = df['low']
    close = df['close']
    resistance = high.shift(1).rolling(window, min_periods=1).max()
    support = low.shift(1).rolling(window, min_periods=1).min()
    resistance = resistance.fillna(high * 1.01).fillna(close * 1.01)
    support = support.fillna(low * 0.99).fillna(close * 0.99)
    return support, resistance

def calculate_normalized_slope(series: pd.Series, atr: pd.Series, window: int = 5) -> pd.Series:
    """Rate of change of series normalized by ATR."""
    delta = series - series.shift(window)
    norm = (window * atr).replace(0, np.nan)
    res = (delta / norm).fillna(0.0)
    return res.replace([np.inf, -np.inf], 0.0)
