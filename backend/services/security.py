import base64
import hashlib
import hmac
import json
import os
import secrets
import time


_LOCAL_SECRET = secrets.token_bytes(32)
_TOKEN_TTL_SECONDS = 12 * 60 * 60


def _secret() -> bytes:
    secret = os.environ.get("NETASSIST_AUTH_SECRET")
    if secret:
        return secret.encode("utf-8")
    if os.environ.get("VERCEL"):
        raise RuntimeError("NETASSIST_AUTH_SECRET must be configured on Vercel")
    return _LOCAL_SECRET


def create_access_token(user_id: int, username: str) -> str:
    payload = json.dumps(
        {
            "user_id": user_id,
            "username": username,
            "expires_at": int(time.time()) + _TOKEN_TTL_SECONDS,
        },
        separators=(",", ":"),
    ).encode("utf-8")
    encoded = base64.urlsafe_b64encode(payload).rstrip(b"=")
    signature = hmac.new(_secret(), encoded, hashlib.sha256).digest()
    return f"{encoded.decode('ascii')}.{base64.urlsafe_b64encode(signature).rstrip(b'=').decode('ascii')}"


def verify_access_token(token: str) -> bool:
    try:
        encoded, provided_signature = token.split(".", 1)
        expected_signature = base64.urlsafe_b64encode(
            hmac.new(_secret(), encoded.encode("ascii"), hashlib.sha256).digest()
        ).rstrip(b"=")
        if not hmac.compare_digest(provided_signature.encode("ascii"), expected_signature):
            return False

        payload = base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4))
        claims = json.loads(payload)
        return (
            isinstance(claims.get("user_id"), int)
            and isinstance(claims.get("username"), str)
            and isinstance(claims.get("expires_at"), int)
            and claims["expires_at"] > int(time.time())
        )
    except (ValueError, TypeError, KeyError, UnicodeDecodeError, json.JSONDecodeError):
        return False
