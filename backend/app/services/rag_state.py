"""Per-user RAG service lifecycle — auto-init from server config, persist FAISS stores."""

from pathlib import Path
from typing import Optional

from fastapi import HTTPException

from ..ai import get_llm_config_error, has_llm_configuration
from ..config import GEMINI_MODEL, LLM_PRIMARY_PROVIDER
from .rag import RAGService

RAG_STORES_DIR = Path(__file__).resolve().parents[2] / "media" / "rag_stores"
RAG_STORES_DIR.mkdir(parents=True, exist_ok=True)

_user_services: dict[int, RAGService] = {}


def _user_store_path(user_id: int) -> Path:
    return RAG_STORES_DIR / f"user_{user_id}"


def _store_exists(path: Path) -> bool:
    return path.is_dir() and any(path.iterdir())


def ensure_rag_service(user_id: int) -> RAGService:
    """Create or return the RAG service for a user; load saved index if present."""
    if user_id in _user_services:
        return _user_services[user_id]

    if not has_llm_configuration():
        raise HTTPException(status_code=500, detail=get_llm_config_error())

    service = RAGService(
        model_name=GEMINI_MODEL,
        provider=LLM_PRIMARY_PROVIDER,
    )

    store_path = _user_store_path(user_id)
    if _store_exists(store_path):
        try:
            service.load_vector_store(str(store_path))
        except Exception:
            pass

    _user_services[user_id] = service
    return service


def get_rag_service(user_id: int) -> RAGService:
    return ensure_rag_service(user_id)


def persist_user_store(user_id: int) -> None:
    service = _user_services.get(user_id)
    if service is None or service.vector_store is None:
        return
    store_path = _user_store_path(user_id)
    store_path.mkdir(parents=True, exist_ok=True)
    service.save_vector_store(str(store_path))


def clear_user_service(user_id: int) -> None:
    _user_services.pop(user_id, None)
