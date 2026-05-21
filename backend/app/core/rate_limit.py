"""Rate-limiting configuration via slowapi.

Uses an in-memory backend (MemoryStorage) suitable for single-instance
deployments.

TODO(security): Switch to Redis-backed storage when the app scales horizontally.
The current in-memory limiter is instance-isolated – requests distributed
across multiple workers will each count independently, allowing up to
N × limit requests per window on N workers.
"""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

# Single shared limiter instance imported by the FastAPI app and endpoint modules.
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/minute"],
)
