"""In-memory sliding-window rate limiter.

Suitable for the single-process deployment described in docs/01-architecture.md.
Multiple workers would each keep their own counters.
"""

import math
import threading
import time
from collections import deque


class SlidingWindowLimiter:
    def __init__(self, clock=time.monotonic) -> None:
        self._clock = clock
        self._hits: dict[str, deque[float]] = {}
        self._lock = threading.Lock()
        self._calls = 0

    def hit(self, key: str, limit: int, window_seconds: float) -> int | None:
        """Record a hit. Returns None if allowed, else seconds until the next hit is allowed."""
        now = self._clock()
        with self._lock:
            hits = self._hits.setdefault(key, deque())
            while hits and hits[0] <= now - window_seconds:
                hits.popleft()
            if len(hits) >= limit:
                return max(1, math.ceil(hits[0] + window_seconds - now))
            hits.append(now)
            self._calls += 1
            if self._calls % 1000 == 0:
                self._prune(now, window_seconds)
            return None

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()

    def _prune(self, now: float, window_seconds: float) -> None:
        stale = [k for k, v in self._hits.items() if not v or v[-1] <= now - window_seconds]
        for key in stale:
            del self._hits[key]


limiter = SlidingWindowLimiter()
