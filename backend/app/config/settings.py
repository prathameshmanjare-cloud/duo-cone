from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "DuoCon API"
    environment: str = "development"
    debug: bool = True

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/duocone"

    jwt_secret: str = "change-me-in-env"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

    cors_origins: list[str] = ["http://localhost:5173", "https://duo-cone.com"]

    image_base_url: str = "https://raw.githubusercontent.com/duocone/product-images/main/"

    email_provider: str = "sendgrid"  # sendgrid | mailgun
    sendgrid_api_key: str = ""
    mailgun_api_key: str = ""
    mailgun_domain: str = ""
    email_from: str = "no-reply@duo-cone.com"
    sales_email: str = "sales@duo-cone.com"

    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_whatsapp_from: str = ""

    llm_api_key: str = ""

    woo_base_url: str = ""
    woo_consumer_key: str = ""
    woo_consumer_secret: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
