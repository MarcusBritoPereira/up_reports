import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Any

from app.core.config import settings


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=2**14,
        r=8,
        p=1,
    )
    return f"scrypt${_b64url_encode(salt)}${_b64url_encode(digest)}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        scheme, salt_b64, digest_b64 = encoded.split("$", 2)
        if scheme != "scrypt":
            return False
        salt = _b64url_decode(salt_b64)
        expected = _b64url_decode(digest_b64)
    except ValueError:
        return False

    candidate = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1)
    return hmac.compare_digest(candidate, expected)


def _token_secret() -> bytes:
    return settings.app_secret.encode("utf-8")


def create_access_token(subject: dict[str, Any], expires_in: int = 3600) -> str:
    payload = {
        "sub": subject,
        "iat": int(time.time()),
        "exp": int(time.time()) + expires_in,
        "iss": settings.app_name,
    }
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    payload_b64 = _b64url_encode(payload_bytes)
    signature = hmac.new(_token_secret(), payload_b64.encode("utf-8"), hashlib.sha256).digest()
    return f"{payload_b64}.{_b64url_encode(signature)}"


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload_b64, sig_b64 = token.split(".", 1)
    except ValueError as exc:
        raise ValueError("token malformado") from exc

    expected_sig = hmac.new(_token_secret(), payload_b64.encode("utf-8"), hashlib.sha256).digest()
    provided_sig = _b64url_decode(sig_b64)
    if not hmac.compare_digest(expected_sig, provided_sig):
        raise ValueError("assinatura inválida")

    payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
    if payload.get("exp", 0) < int(time.time()):
        raise ValueError("token expirado")

    return payload
