"""Generate spoken lesson summaries with edge-tts audio files."""

import uuid
from pathlib import Path

import edge_tts
from langchain_core.prompts import PromptTemplate

from ..ai import build_chat_model, has_llm_configuration

AUDIO_DIR = Path(__file__).resolve().parents[2] / "media" / "lessons"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

SUMMARY_PROMPT = PromptTemplate.from_template(
    "Create a clear spoken study summary (200-350 words) for a student based on this content. "
    "Use short sentences suitable for text-to-speech. Cover main topics, key definitions, "
    "and one practical takeaway.\n\nContent:\n{content}"
)


def generate_summary_text(content: str) -> str:
    if not has_llm_configuration():
        raise ValueError("LLM not configured for lesson summaries.")
    if len(content.split()) < 30:
        raise ValueError("Content too short for a lesson summary.")

    llm = build_chat_model(temperature=0.4)
    response = llm.invoke(SUMMARY_PROMPT.format(content=content[:12000]))
    return response.content.strip()


async def _synthesize_audio(text: str, output_path: Path) -> None:
    # Limit TTS length for performance
    spoken = text[:4000]
    communicate = edge_tts.Communicate(spoken, voice="en-US-AriaNeural")
    await communicate.save(str(output_path))


async def generate_audio_file(text: str) -> tuple[str, Path]:
    file_id = uuid.uuid4().hex[:12]
    path = AUDIO_DIR / f"lesson_{file_id}.mp3"
    await _synthesize_audio(text, path)
    return file_id, path
