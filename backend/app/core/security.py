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


def _jwt_signing_input(header: dict[str, Any], payload: dict[str, Any]) -> str:
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    return f"{header_b64}.{payload_b64}"


def _create_token(subject: dict[str, Any], token_type: str, expires_in: int) -> str:
    now = int(time.time())
    payload = {
        "sub": subject,
        "iat": now,
        "nbf": now,
        "exp": now + expires_in,
        "iss": settings.app_name,
        "type": token_type,
        "jti": secrets.token_urlsafe(16),
    }
    header = {"alg": "HS256", "typ": "JWT"}
    signing_input = _jwt_signing_input(header, payload)
    signature = hmac.new(_token_secret(), signing_input.encode("utf-8"), hashlib.sha256).digest()
    return f"{signing_input}.{_b64url_encode(signature)}"


def create_access_token(subject: dict[str, Any], expires_in: int | None = None) -> str:
    return _create_token(subject, token_type="access", expires_in=expires_in or settings.auth_access_token_ttl_seconds)


def create_refresh_token(subject: dict[str, Any], expires_in: int | None = None) -> str:
    return _create_token(subject, token_type="refresh", expires_in=expires_in or settings.auth_refresh_token_ttl_seconds)


def decode_token(token: str, expected_type: str | None = None) -> dict[str, Any]:
    try:
        header_b64, payload_b64, sig_b64 = token.split(".", 2)
    except ValueError as exc:
        raise ValueError("token malformado") from exc

    signing_input = f"{header_b64}.{payload_b64}"
    expected_sig = hmac.new(_token_secret(), signing_input.encode("utf-8"), hashlib.sha256).digest()
    provided_sig = _b64url_decode(sig_b64)
    if not hmac.compare_digest(expected_sig, provided_sig):
        raise ValueError("assinatura inválida")

    payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
    now = int(time.time())
    if payload.get("nbf", 0) > now:
        raise ValueError("token ainda não válido")
    if payload.get("exp", 0) < now:
        raise ValueError("token expirado")

    if expected_type and payload.get("type") != expected_type:
        raise ValueError("tipo de token inválido")

    return payload


def decode_access_token(token: str) -> dict[str, Any]:
    return decode_token(token, expected_type="access")


def decode_refresh_token(token: str) -> dict[str, Any]:
    return decode_token(token, expected_type="refresh")
