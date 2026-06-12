"""Import flashcards from Quizlet-style JSON exports."""

from typing import Any


def parse_quizlet_export(data: dict[str, Any]) -> list[dict[str, str]]:
    """
    Accept common export shapes:
    - {"cards": [{"term": "...", "definition": "..."}]}
    - {"terms": [{"front": "...", "back": "..."}]}
    - [{"front": "...", "back": "..."}]
    """
    cards: list[dict[str, str]] = []

    if isinstance(data, list):
        raw = data
    elif isinstance(data, dict):
        raw = data.get("cards") or data.get("terms") or data.get("items") or []
    else:
        raise ValueError("Unsupported Quizlet export format.")

    for item in raw:
        if not isinstance(item, dict):
            continue
        question = (
            item.get("term")
            or item.get("front")
            or item.get("question")
            or ""
        ).strip()
        answer = (
            item.get("definition")
            or item.get("back")
            or item.get("answer")
            or ""
        ).strip()
        if question and answer:
            cards.append({"question": question, "answer": answer})

    if not cards:
        raise ValueError("No valid flashcards found in export.")
    return cards
