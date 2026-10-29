import time
from typing import Dict, Tuple, Optional
from models import IndianMomentumState, AlertSeverity, SoundProfileConfig

DEFAULT_COOLDOWNS = {
    AlertSeverity.LOW: 900,       # 15 minutes (Quiet, Early momentum)
    AlertSeverity.MODERATE: 300,  # 5 minutes (Confirmed, Exhaustion)
    AlertSeverity.HIGH: 120,      # 2 minutes (Accelerating)
    AlertSeverity.URGENT: 45      # 45 seconds (Breakouts, Breakdowns, Reversals)
}

class AssetStateTracker:
    def __init__(self, symbol: str):
        self.symbol = symbol
        self.last_confirmed_state: Optional[IndianMomentumState] = None
        self.candidate_state: Optional[IndianMomentumState] = None
        self.candidate_count: int = 0
        self.last_alert_timestamp: float = 0.0
        self.last_alert_state: Optional[IndianMomentumState] = None
        self.last_alert_severity: Optional[AlertSeverity] = None

class AlertManager:
    def __init__(self):
        self.trackers: Dict[str, AssetStateTracker] = {}
        self.cooldown_overrides: Dict[AlertSeverity, int] = DEFAULT_COOLDOWNS.copy()
        self.global_muted: bool = False
        self.quiet_hours_enabled: bool = False
        self.quiet_hours_start: int = 23  # 11 PM IST
        self.quiet_hours_end: int = 8     # 8 AM IST (before 09:00 pre-open)

    def get_tracker(self, symbol: str) -> AssetStateTracker:
        if symbol not in self.trackers:
            self.trackers[symbol] = AssetStateTracker(symbol)
        return self.trackers[symbol]

    def evaluate_alert(
        self,
        symbol: str,
        current_state: IndianMomentumState,
        current_severity: AlertSeverity,
        current_time: Optional[float] = None,
        custom_cooldown: Optional[int] = None
    ) -> Tuple[bool, str]:
        """
        Evaluates whether an alert should sound based on hysteresis, severity escalation,
        and cooldown noise suppression.
        """
        if self.global_muted:
            return False, "Suppressed: Global audio alerts are currently muted."

        state_str = current_state.value if hasattr(current_state, "value") else str(current_state)

        # Quiet and Sideways states are suppressed from sounding by default
        if any(w in state_str.lower() for w in ["quiet", "sideways", "consolidation"]):
            return False, f"Silent by default for state: {state_str}"

        now = current_time if current_time is not None else time.time()
        tracker = self.get_tracker(symbol)

        # Urgent events (Breakouts, Breakdowns, Reversals) trigger immediately
        is_urgent_event = current_severity == AlertSeverity.URGENT and any(
            w in state_str.lower() for w in ["breakout", "breakdown", "reversal", "liquidation"]
        )

        if not is_urgent_event:
            # Hysteresis confirmation: require 2 consecutive evaluations in the candidate state
            if tracker.candidate_state == current_state:
                tracker.candidate_count += 1
            else:
                tracker.candidate_state = current_state
                tracker.candidate_count = 1

            if tracker.last_confirmed_state != current_state:
                if tracker.candidate_count < 2:
                    return False, f"Waiting for confirmation ({tracker.candidate_count}/2 ticks) for {state_str}."

        tracker.last_confirmed_state = current_state

        # Check severity escalation
        last_severity_val = tracker.last_alert_severity.value if tracker.last_alert_severity else 0
        is_escalation = current_severity.value > last_severity_val

        elapsed = now - tracker.last_alert_timestamp
        required_cooldown = custom_cooldown if custom_cooldown is not None else self.cooldown_overrides.get(current_severity, 120)

        is_new_state = tracker.last_alert_state != current_state

        if is_new_state:
            if elapsed < 15 and not is_escalation:
                return False, f"Suppressed by transition safety buffer (elapsed {elapsed:.1f}s < 15s)."
        else:
            if elapsed < required_cooldown and not is_escalation:
                remaining = int(required_cooldown - elapsed)
                return False, f"Suppressed by cooldown for {state_str} ({remaining}s remaining)."

        # Register alert
        tracker.last_alert_timestamp = now
        tracker.last_alert_state = current_state
        tracker.last_alert_severity = current_severity

        return True, f"Alert confirmed: {state_str} (Severity {current_severity.value})."

    def reset_tracker(self, symbol: str):
        if symbol in self.trackers:
            del self.trackers[symbol]
