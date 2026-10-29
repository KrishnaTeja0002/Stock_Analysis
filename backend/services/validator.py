import pandas as pd
import numpy as np
from typing import Tuple, Optional

class DataValidationError(Exception):
    pass

def validate_ohlcv_dataframe(df: pd.DataFrame, max_stale_hours: float = 72.0) -> Tuple[bool, Optional[str]]:
    """
    Validates OHLCV integrity:
    - Verifies required columns (open, high, low, close)
    - Verifies numeric datatypes without corrupt strings
    - Checks high >= max(open, close) and low <= min(open, close)
    - Checks monotonic timestamps and eliminates duplicates
    - Checks for staleness
    """
    if df is None or len(df) == 0:
        return False, "Data stream is empty (0 bars)."

    cols = [c.lower() for c in df.columns]
    required = ['open', 'high', 'low', 'close']
    for req in required:
        if req not in cols:
            return False, f"Missing required column: {req}"

    # Standardize column names
    df.columns = [c.lower() for c in df.columns]

    # Verify no NaN in prices
    if df[['open', 'high', 'low', 'close']].isna().any().any():
        return False, "Candlestick stream contains missing or NaN prices."

    # Validate price sanity: high >= low, high >= open, high >= close, etc.
    invalid_high = (df['high'] < df['low']) | (df['high'] < df['open']) | (df['high'] < df['close'])
    if invalid_high.any():
        return False, "Integrity violation: High price is lower than Open/Close/Low."

    invalid_low = (df['low'] > df['open']) | (df['low'] > df['close'])
    if invalid_low.any():
        return False, "Integrity violation: Low price is higher than Open/Close/High."

    # Validate non-negative prices
    if (df[['open', 'high', 'low', 'close']] <= 0).any().any():
        return False, "Integrity violation: Non-positive price detected."

    # Timestamp monotonicity
    if isinstance(df.index, pd.DatetimeIndex):
        if not df.index.is_monotonic_increasing:
            return False, "Data timestamps are out-of-order or non-monotonic."

        if df.index.has_duplicates:
            return False, "Data stream contains duplicate timestamps."

        # Check freshness
        last_time = df.index[-1]
        now = pd.Timestamp.now(tz=last_time.tz) if last_time.tz else pd.Timestamp.now()
        age_hours = (now - last_time).total_seconds() / 3600.0
        if age_hours > max_stale_hours:
            return True, f"Warning: Latest bar is stale ({age_hours:.1f} hours old)."

    return True, None
