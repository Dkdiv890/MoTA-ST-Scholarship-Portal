import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Ministry of Tribal Affairs - ST Scholarship Portal"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "mota-sih-prototype-super-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for demo ease

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./scholarship_portal.db")

    # Dataset & Storage
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATASET_PATH: str = os.getenv(
        "DATASET_PATH",
        str(Path(__file__).resolve().parent.parent.parent.parent / "SIH_ST_NFST_NOS_1000")
    )
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", str(BASE_DIR / "uploads"))

    # DigiLocker Configuration (Strict Adapter Boundary)
    DIGILOCKER_MODE: str = os.getenv("DIGILOCKER_MODE", "demo")  # 'demo' or 'production'
    DIGILOCKER_CLIENT_ID: str = os.getenv("DIGILOCKER_CLIENT_ID", "mota_scholarship_portal")
    DIGILOCKER_CLIENT_SECRET: str = os.getenv("DIGILOCKER_CLIENT_SECRET", "")
    DIGILOCKER_REDIRECT_URI: str = os.getenv("DIGILOCKER_REDIRECT_URI", "http://localhost:3000/digilocker/callback")
    DIGILOCKER_AUTH_ENDPOINT: str = os.getenv("DIGILOCKER_AUTH_ENDPOINT", "https://digilocker.meripehchan.gov.in/public/oauth2/1/authorize")
    DIGILOCKER_TOKEN_ENDPOINT: str = os.getenv("DIGILOCKER_TOKEN_ENDPOINT", "https://digilocker.meripehchan.gov.in/public/oauth2/1/token")

    # Real SMS Gateway Configuration
    SMS_PROVIDER: str = os.getenv("SMS_PROVIDER", "fast2sms")  # 'fast2sms' or 'twilio'
    FAST2SMS_API_KEY: str = os.getenv("FAST2SMS_API_KEY", "")
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_FROM_NUMBER: str = os.getenv("TWILIO_FROM_NUMBER", "")

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
