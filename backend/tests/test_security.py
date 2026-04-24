import unittest

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)


class SecurityTests(unittest.TestCase):
    def test_password_hash_and_verify(self):
        pw = "S3nha-Forte-123"
        hashed = hash_password(pw)
        self.assertTrue(verify_password(pw, hashed))
        self.assertFalse(verify_password("errada", hashed))

    def test_access_token_roundtrip(self):
        token = create_access_token({"id": 1, "email": "admin@x.com", "role": "admin"}, expires_in=60)
        payload = decode_access_token(token)
        self.assertEqual(payload["sub"]["id"], 1)
        self.assertEqual(payload["type"], "access")

    def test_refresh_token_roundtrip(self):
        token = create_refresh_token({"id": 1}, expires_in=60)
        payload = decode_refresh_token(token)
        self.assertEqual(payload["sub"]["id"], 1)
        self.assertEqual(payload["type"], "refresh")


if __name__ == "__main__":
    unittest.main()
