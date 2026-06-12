import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[1]

# Load backend/.env first, then fall back to repository root .env if present.
load_dotenv(BASE_DIR / ".env", override=False)
load_dotenv(BASE_DIR.parent / ".env", override=False)


def get_api_key() -> str | None:
    return os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()

_secret_from_env = os.getenv("SECRET_KEY", "").strip()
if ENVIRONMENT == "production":
    if not _secret_from_env or _secret_from_env == "capable-project-secret-change-in-production":
        raise RuntimeError(
            "SECRET_KEY must be set to a strong value when ENVIRONMENT=production"
        )
    SECRET_KEY = _secret_from_env
else:
    SECRET_KEY = _secret_from_env or "capable-project-dev-only-not-for-production"

_cors_raw = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173",
)
CORS_ORIGINS = [origin.strip() for origin in _cors_raw.split(",") if origin.strip()]
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
TOKEN_EXPIRE_MINUTES = int(os.getenv("TOKEN_EXPIRE_MINUTES", "60"))
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
LLM_PRIMARY_PROVIDER = os.getenv("LLM_PRIMARY_PROVIDER", "gemini").strip().lower()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "meta/llama-3.3-70b-instruct")
NVIDIA_VISION_MODEL = os.getenv("NVIDIA_VISION_MODEL", "mistralai/mistral-large-3-675b-instruct-2512")
EMBEDDING_MODEL_NAME = os.getenv(
    "EMBEDDING_MODEL_NAME",
    "sentence-transformers/all-MiniLM-L6-v2",
)
EMBEDDING_DEVICE = os.getenv("EMBEDDING_DEVICE", "cpu")
