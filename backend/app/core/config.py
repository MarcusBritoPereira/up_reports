import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "Meta Dashboard API")
    app_env: str = os.getenv("APP_ENV", "development")
    app_debug: bool = os.getenv("APP_DEBUG", "false").lower() == "true"
    app_cors_origins: str = os.getenv("APP_CORS_ORIGINS", "http://localhost:5173")
    app_secret: str = os.getenv("APP_SECRET", "change-me-in-production")

    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./dashboard.db")

    meta_page_id: str | None = os.getenv("META_PAGE_ID")
    meta_ig_id: str | None = os.getenv("META_IG_ID")
    meta_access_token: str | None = os.getenv("META_ACCESS_TOKEN")
    meta_base_url: str = os.getenv("META_BASE_URL", "https://graph.facebook.com/v21.0")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.app_cors_origins.split(",") if origin.strip()]


settings = Settings()
