import time
from collections import defaultdict

from fastapi import HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

# Paths that are exempt from rate limiting
_EXEMPT_PATHS = frozenset({"/health", "/", "/docs", "/redoc", "/openapi.json"})


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiter: tracks requests per client IP in a
    rolling 60-second window.

    For production deployments with multiple workers, replace the in-memory
    store with a shared Redis backend (e.g. slowapi + redis-py).
    """

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        if request.url.path in _EXEMPT_PATHS:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window_start = now - 60.0

        # Drop timestamps outside the current window
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if t > window_start
        ]

        if len(self.requests[client_ip]) >= self.requests_per_minute:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later.",
            )

        self.requests[client_ip].append(now)
        return await call_next(request)
