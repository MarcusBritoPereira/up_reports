import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, List


def _load_dotenv() -> None:
    env_path = Path(".env")
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        cleaned = line.strip()
        if not cleaned or cleaned.startswith("#") or "=" not in cleaned:
            continue
        key, value = cleaned.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ[key] = value


_load_dotenv()


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "UP REPORTS API")
    app_env: str = os.getenv("APP_ENV", "development")
    app_debug: bool = os.getenv("APP_DEBUG", "false").lower() == "true"
    app_cors_origins: str = os.getenv("APP_CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174")
    app_secret: str = os.getenv("APP_SECRET", "change-me-in-production")

    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./dashboard.db")

    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    auth_access_token_ttl_seconds: int = int(os.getenv("AUTH_ACCESS_TOKEN_TTL_SECONDS", "3600"))
    auth_refresh_token_ttl_seconds: int = int(os.getenv("AUTH_REFRESH_TOKEN_TTL_SECONDS", "604800"))
    auth_allow_public_registration: bool = os.getenv("AUTH_ALLOW_PUBLIC_REGISTRATION", "false").lower() == "true"
    oauth_session_ttl_seconds: int = int(os.getenv("OAUTH_SESSION_TTL_SECONDS", "900"))

    meta_app_id: Optional[str] = os.getenv("META_APP_ID")
    meta_app_secret: Optional[str] = os.getenv("META_APP_SECRET")
    meta_oauth_redirect_uri: Optional[str] = os.getenv("META_OAUTH_REDIRECT_URI")
    meta_page_id: Optional[str] = os.getenv("META_PAGE_ID")
    meta_ig_id: Optional[str] = os.getenv("META_IG_ID")
    meta_access_token: Optional[str] = os.getenv("META_ACCESS_TOKEN")
    meta_base_url: str = os.getenv("META_BASE_URL", "https://graph.facebook.com/v21.0")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.app_cors_origins.split(",") if origin.strip()]


settings = Settings()
