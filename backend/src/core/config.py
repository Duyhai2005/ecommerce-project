from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    api_prefix: str = "/api/v1"
    app_base_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    database_url: str = Field(
        default="mysql+asyncmy://user:password@localhost:3306/ecommerce",
        validation_alias=AliasChoices("DATABASE_URL", "database_url"),
    )

    jwt_secret: str = Field(
        default="change-me-access-secret",
        validation_alias=AliasChoices("JWT_SECRET", "ACCESS_TOKEN_SECRET", "jwt_secret"),
    )
    jwt_algorithm: str = "HS256"
    jwt_issuer: str = "shepoo_ecommerce-platform"
    jwt_audience: str = "shepoo_ecommerce-platform"
    access_token_expire_minutes: int = Field(
        default=15,
        validation_alias=AliasChoices(
            "ACCESS_TOKEN_TTL_MINUTES",
            "ACCESS_TOKEN_EXPIRE_MINUTES",
            "access_token_expire_minutes",
        ),
    )
    refresh_token_expire_days: int = Field(
        default=30,
        validation_alias=AliasChoices(
            "REFRESH_TOKEN_TTL_DAYS",
            "REFRESH_TOKEN_EXPIRE_DAYS",
            "refresh_token_expire_days",
        ),
    )
    token_hash_pepper: str = Field(
        default="change-me-token-pepper",
        validation_alias=AliasChoices("TOKEN_HASH_PEPPER", "token_hash_pepper"),
    )

    email_verification_token_expire_minutes: int = 30
    phone_otp_expire_minutes: int = 10
    password_reset_token_expire_minutes: int = 30

    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_from_name: str = "Shepoo"
    smtp_use_tls: bool = True
    smtp_timeout_seconds: int = 10

    access_token_cookie_name: str = "access_token"
    refresh_token_cookie_name: str = "refresh_token"
    cookie_secure: bool = False
    cookie_same_site: str = "lax"
    cookie_domain: str | None = None

    dev_auth_debug: bool = False
    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def async_database_url(self) -> str:
        if self.database_url.startswith("mysql://"):
            return self.database_url.replace("mysql://", "mysql+asyncmy://", 1)
        return self.database_url

    @property
    def cors_origin_list(self) -> list[str]:
        origins = [origin.strip() for origin in self.cors_origins.split(",")]
        if self.frontend_url:
            origins.append(self.frontend_url)
        return sorted({origin for origin in origins if origin})


settings = Settings()
