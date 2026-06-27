import logging
from typing import Any

import httpx
from fastapi import HTTPException, status
from jose import ExpiredSignatureError, JWTError, jwt

from app.config import settings

logger = logging.getLogger(__name__)

_jwks_cache: dict[str, Any] | None = None


async def _fetch_jwks() -> dict[str, Any]:
    """Fetch JWKS from Supabase's well-known endpoint and cache it."""
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache

    if not settings.SUPABASE_URL:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="SUPABASE_URL not configured",
        )

    jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    async with httpx.AsyncClient() as client:
        response = await client.get(jwks_url, timeout=10.0)
        response.raise_for_status()
        _jwks_cache = response.json()
        return _jwks_cache


def _verify_with_secret(token: str) -> dict[str, Any]:
    """Legacy HS256 verification using SUPABASE_JWT_SECRET."""
    return jwt.decode(
        token,
        settings.SUPABASE_JWT_SECRET,
        algorithms=["HS256"],
        options={"verify_aud": False},
    )


def _verify_with_jwks(token: str, jwks: dict[str, Any]) -> dict[str, Any]:
    """ES256/RS256 verification using JWKS public keys."""
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")
    alg = unverified_header.get("alg", "ES256")

    key = None
    for k in jwks.get("keys", []):
        if k.get("kid") == kid:
            key = k
            break

    if key is None and jwks.get("keys"):
        key = jwks["keys"][0]

    if key is None:
        raise JWTError("No matching key found in JWKS")

    return jwt.decode(
        token,
        key,
        algorithms=[alg],
        options={"verify_aud": False},
    )


async def verify_supabase_jwt(token: str) -> dict[str, Any]:
    """
    Decode and verify a Supabase-issued JWT.
    Supports both:
    - HS256 (legacy): uses SUPABASE_JWT_SECRET
    - ES256/RS256 (modern): fetches JWKS from Supabase
    """
    if not settings.SUPABASE_URL and not settings.SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT verification is not configured",
        )

    alg = "unknown"
    try:
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg", "HS256")
        logger.info("JWT alg=%s kid=%s", alg, unverified_header.get("kid"))

        if alg == "HS256" and settings.SUPABASE_JWT_SECRET:
            payload = _verify_with_secret(token)
        else:
            jwks = await _fetch_jwks()
            payload = _verify_with_jwks(token, jwks)

        return payload
    except ExpiredSignatureError:
        logger.warning("JWT expired (alg=%s)", alg)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except JWTError as exc:
        logger.error("JWT validation failed (alg=%s): %s", alg, exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate token: {exc}",
        )
    except httpx.HTTPError as exc:
        logger.error("JWKS fetch failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Failed to fetch JWKS: {exc}",
        )
