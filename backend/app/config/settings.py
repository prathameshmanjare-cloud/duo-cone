from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "DuoCon API"
    environment: str = "development"
    debug: bool = True

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/duocone"

    # run Base.metadata.create_all on startup (bridge until Alembic migrations exist)
    auto_create_tables: bool = False
    # insert demo products on startup if the catalog is empty (hosts without a shell)
    auto_seed: bool = False

    @field_validator("database_url", mode="before")
    @classmethod
    def _force_asyncpg(cls, v: str) -> str:
        # managed hosts (Render/Neon/…) hand out `postgres://` or `postgresql://`;
        # our async engine needs the asyncpg driver in the URL.
        if not v:
            return v
        if v.startswith("postgres://"):
            v = "postgresql://" + v[len("postgres://") :]
        if v.startswith("postgresql://"):
            v = "postgresql+asyncpg://" + v[len("postgresql://") :]
        return v

    jwt_secret: str = "change-me-in-env"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    # optional: provision/refresh a single admin account on startup (hosts w/o shell)
    bootstrap_admin_email: str = ""
    bootstrap_admin_password: str = ""

    cors_origins: list[str] = ["http://localhost:5173", "https://duo-cone.com"]

    image_base_url: str = "https://raw.githubusercontent.com/duocone/product-images/main/"

    # public base URL of this API, used to build absolute URLs for uploaded
    # product photos. Leave blank to derive it from the incoming request.
    api_public_url: str = ""

    # public base URL of the storefront, for Stripe success/cancel redirects
    frontend_url: str = "http://localhost:5173"

    # Stripe — leave blank to disable card payments (checkout falls back to invoice)
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""

    email_provider: str = "sendgrid"  # sendgrid | mailgun | smtp
    sendgrid_api_key: str = ""
    mailgun_api_key: str = ""
    mailgun_domain: str = ""
    # generic SMTP (used when email_provider = "smtp")
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_starttls: bool = True
    smtp_ssl: bool = False  # True for implicit TLS on port 465
    email_from: str = "no-reply@duo-cone.com"
    email_from_name: str = "DuoCone"
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
