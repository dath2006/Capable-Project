"""Diagram and image analysis via Gemini vision and Google Cloud Vision OCR."""

import base64
import os
from io import BytesIO

import httpx
from langchain_core.messages import HumanMessage
from PIL import Image

from ..ai import build_chat_model, has_llm_configuration
from ..config import GEMINI_API_KEY, LLM_PRIMARY_PROVIDER, NVIDIA_VISION_MODEL


def _gemini_vision_analyze(image_bytes: bytes, mime_type: str, prompt: str) -> str:
    if not has_llm_configuration():
        raise ValueError("LLM not configured for diagram analysis.")

    b64 = base64.standard_b64encode(image_bytes).decode("ascii")
    
    # Use specified vision model if primary provider is nvidia
    model_name = None
    if LLM_PRIMARY_PROVIDER == "nvidia":
        model_name = NVIDIA_VISION_MODEL

    llm = build_chat_model(temperature=0.2, model_name=model_name)
    message = HumanMessage(
        content=[
            {"type": "text", "text": prompt},
            {
                "type": "image_url",
                "image_url": {"url": f"data:{mime_type};base64,{b64}"},
            },
        ]
    )
    response = llm.invoke([message])
    return response.content.strip()


def _google_vision_ocr(image_bytes: bytes) -> str:
    api_key = GEMINI_API_KEY or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return ""

    payload = {
        "requests": [
            {
                "image": {"content": base64.standard_b64encode(image_bytes).decode("ascii")},
                "features": [{"type": "TEXT_DETECTION"}, {"type": "LABEL_DETECTION"}],
            }
        ]
    }
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"https://vision.googleapis.com/v1/images:annotate?key={api_key}",
                json=payload,
            )
            if response.status_code != 200:
                return ""
            data = response.json()
            annotations = data.get("responses", [{}])[0]
            text_ann = annotations.get("fullTextAnnotation", {})
            return text_ann.get("text", "").strip()
    except httpx.HTTPError:
        return ""


def analyze_educational_image(image_bytes: bytes, filename: str) -> dict:
    ext = (filename or "").lower().split(".")[-1]
    mime = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp",
        "gif": "image/gif",
    }.get(ext, "image/png")

    # Normalize large images
    try:
        img = Image.open(BytesIO(image_bytes))
        img.thumbnail((1280, 1280))
        buf = BytesIO()
        img.save(buf, format=img.format or "PNG")
        image_bytes = buf.getvalue()
    except Exception:
        pass

    ocr_text = _google_vision_ocr(image_bytes)
    prompt = (
        "You are an educational tutor analyzing a diagram, chart, or whiteboard image. "
        "Respond in clean Markdown only (no code fences):\n"
        "## Overview\n"
        "One short paragraph.\n\n"
        "## Key elements\n"
        "- bullet list of labels, parts, or data series\n\n"
        "## What to learn\n"
        "- 3-5 study takeaways as bullets."
    )
    if ocr_text:
        prompt += f"\n\nOCR extracted text:\n{ocr_text[:2000]}"

    try:
        analysis = _gemini_vision_analyze(image_bytes, mime, prompt)
        method = "gemini_vision"
    except Exception as exc:
        if ocr_text:
            analysis = f"Diagram text (OCR):\n{ocr_text}"
            method = "google_vision_ocr"
        else:
            raise ValueError(f"Could not analyze image: {exc}") from exc

    return {
        "analysis": analysis,
        "ocr_text": ocr_text or None,
        "method": method,
    }
