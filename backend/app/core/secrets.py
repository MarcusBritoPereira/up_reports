import base64
import hashlib
import hmac
import secrets

from app.core.config import settings


def _b64e(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("utf-8")


def _b64d(value: str) -> bytes:
    return base64.urlsafe_b64decode(value.encode("utf-8"))


def _key_material() -> bytes:
    return hashlib.sha256(settings.app_secret.encode("utf-8")).digest()


def _derive_stream(nonce: bytes, length: int) -> bytes:
    out = b""
    counter = 0
    key = _key_material()
    while len(out) < length:
        block = hmac.new(key, nonce + counter.to_bytes(4, "big"), hashlib.sha256).digest()
        out += block
        counter += 1
    return out[:length]


def encrypt_secret(value: str) -> str:
    plaintext = value.encode("utf-8")
    nonce = secrets.token_bytes(16)
    stream = _derive_stream(nonce, len(plaintext))
    ciphertext = bytes([a ^ b for a, b in zip(plaintext, stream)])
    mac = hmac.new(_key_material(), nonce + ciphertext, hashlib.sha256).digest()
    return f"enc:v1:{_b64e(nonce)}:{_b64e(ciphertext)}:{_b64e(mac)}"


def decrypt_secret(value: str) -> str:
    if not value.startswith("enc:v1:"):
        return value

    _, _, nonce_b64, cipher_b64, mac_b64 = value.split(":", 4)
    nonce = _b64d(nonce_b64)
    ciphertext = _b64d(cipher_b64)
    mac = _b64d(mac_b64)

    expected_mac = hmac.new(_key_material(), nonce + ciphertext, hashlib.sha256).digest()
    if not hmac.compare_digest(expected_mac, mac):
        raise ValueError("segredo inválido ou corrompido")

    stream = _derive_stream(nonce, len(ciphertext))
    plaintext = bytes([a ^ b for a, b in zip(ciphertext, stream)])
    return plaintext.decode("utf-8")
