from functools import lru_cache
from typing import Any

from .config import (
    EMBEDDING_DEVICE,
    EMBEDDING_MODEL_NAME,
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GROQ_API_KEY,
    GROQ_MODEL,
    LLM_PRIMARY_PROVIDER,
)


def get_llm_config_error() -> str:
    return (
        "No LLM provider configured. Set GOOGLE_API_KEY or GEMINI_API_KEY, "
        "and optionally GROQ_API_KEY for fallback support."
    )


def has_llm_configuration(
    gemini_api_key: str | None = None,
    groq_api_key: str | None = None,
) -> bool:
    return bool(_resolve_provider_order(gemini_api_key, groq_api_key))


def build_chat_model(
    temperature: float = 0.7,
    model_name: str | None = None,
    *,
    gemini_api_key: str | None = None,
    groq_api_key: str | None = None,
    primary_provider: str | None = None,
):
    provider_order = _resolve_provider_order(
        gemini_api_key,
        groq_api_key,
        primary_provider,
    )
    models = [
        _build_provider_model(
            provider=provider,
            temperature=temperature,
            model_name=model_name if index == 0 else None,
            gemini_api_key=gemini_api_key,
            groq_api_key=groq_api_key,
        )
        for index, provider in enumerate(provider_order)
    ]
    return _chain_fallbacks(models)


def build_structured_chat_model(
    output_schema: Any,
    temperature: float = 0.7,
    model_name: str | None = None,
    *,
    gemini_api_key: str | None = None,
    groq_api_key: str | None = None,
    primary_provider: str | None = None,
):
    provider_order = _resolve_provider_order(
        gemini_api_key,
        groq_api_key,
        primary_provider,
    )
    models = [
        _build_provider_model(
            provider=provider,
            temperature=temperature,
            model_name=model_name if index == 0 else None,
            gemini_api_key=gemini_api_key,
            groq_api_key=groq_api_key,
        ).with_structured_output(output_schema)
        for index, provider in enumerate(provider_order)
    ]
    return _chain_fallbacks(models)


@lru_cache(maxsize=1)
def build_embeddings():
    from langchain_huggingface import HuggingFaceEmbeddings

    return HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL_NAME,
        model_kwargs={"device": EMBEDDING_DEVICE},
    )


def _resolve_provider_order(
    gemini_api_key: str | None = None,
    groq_api_key: str | None = None,
    primary_provider: str | None = None,
) -> list[str]:
    resolved_gemini_key = gemini_api_key or GEMINI_API_KEY
    resolved_groq_key = groq_api_key or GROQ_API_KEY
    available_providers: list[str] = []

    if resolved_gemini_key:
        available_providers.append("gemini")
    if resolved_groq_key:
        available_providers.append("groq")

    if not available_providers:
        return []

    preferred_provider = (primary_provider or LLM_PRIMARY_PROVIDER).lower()
    if preferred_provider not in {"gemini", "groq"}:
        preferred_provider = "gemini"

    fallback_provider = "groq" if preferred_provider == "gemini" else "gemini"
    return [
        provider
        for provider in [preferred_provider, fallback_provider]
        if provider in available_providers
    ]


def _build_provider_model(
    *,
    provider: str,
    temperature: float,
    model_name: str | None,
    gemini_api_key: str | None,
    groq_api_key: str | None,
):
    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model=model_name or GEMINI_MODEL,
            google_api_key=gemini_api_key or GEMINI_API_KEY,
            temperature=temperature,
            convert_system_message_to_human=True,
        )

    if provider == "groq":
        from langchain_groq import ChatGroq

        return ChatGroq(
            model=model_name or GROQ_MODEL,
            temperature=temperature,
            api_key=groq_api_key or GROQ_API_KEY,
            max_retries=2,
        )

    raise ValueError(f"Unsupported LLM provider: {provider}")


def _chain_fallbacks(models: list[Any]):
    if not models:
        raise RuntimeError(get_llm_config_error())
    if len(models) == 1:
        return models[0]
    return models[0].with_fallbacks(models[1:])