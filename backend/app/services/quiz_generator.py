import os
import uuid
import random
from pathlib import Path
from pydantic import BaseModel, Field
from ..schemas import QuizQuestion, QuizOption
from ..ai import build_structured_chat_model, has_llm_configuration

class QuizGeneratorOption(BaseModel):
    label: str = Field(description="Option label, e.g. A, B, C, or D")
    text: str = Field(description="Option text")

class QuizGeneratorQuestion(BaseModel):
    question: str = Field(description="The question text derived from the content")
    concept: str = Field(description="Name of the specific concept tested")
    difficulty: str = Field(description="The difficulty level of the question")
    options: list[QuizGeneratorOption] = Field(description="List of options")
    correct_label: str = Field(description="Label of the correct option, e.g. A, B, C, or D")
    explanation: str = Field(description="1-2 sentences explanation of why the answer is correct")

class QuizGeneratorResponse(BaseModel):
    questions: list[QuizGeneratorQuestion]

SYSTEM_PROMPT = """You are an expert educational quiz designer.
Your job is to create high-quality MCQ questions from the provided document content.

STRICT RULES:
1. Every question must have EXACTLY 4 options labeled A, B, C, D.
2. Only ONE option is correct.
3. The correct_label field must be exactly "A", "B", "C", or "D".
4. Questions must be derived ONLY from the provided content.
5. Cover as many DISTINCT concepts as possible across all questions.
6. Prioritize difficult/complex concepts — they must appear first in the list.
7. Each question must test a DIFFERENT concept — no duplicates.
8. The explanation must be 1-2 sentences explaining why the answer is correct.
9. The concept field must name the specific topic the question tests."""


def _build_prompt(content: str, num_questions: int, difficulty: str) -> str:
    guidance = {
        "easy":   "Focus on definitions, basic facts, and straightforward recall.",
        "medium": "Focus on application and understanding. Connect ideas from the content.",
        "hard":   "Focus on analysis, synthesis, and nuanced distinctions. Require deep understanding.",
    }

    return f"""Document Content:
---
{content}
---

Generate exactly {num_questions} MCQ questions at {difficulty.upper()} difficulty.
Difficulty guidance: {guidance[difficulty]}

Return a structured output with a list of questions where hardest and most complex concepts come first."""


def _shuffle_options(options: list, correct_label: str) -> tuple[list[QuizOption], str]:
    """Randomly shuffle options and return new options + updated correct label."""
    # Find the correct answer text
    correct_text = next(opt["text"] for opt in options if opt["label"] == correct_label)

    # Shuffle the option texts
    texts = [opt["text"] for opt in options]
    random.shuffle(texts)

    # Reassign labels A, B, C, D
    labels = ["A", "B", "C", "D"]
    new_options = [QuizOption(label=labels[i], text=texts[i]) for i in range(len(texts))]

    # Find where the correct answer ended up
    new_correct_label = next(opt.label for opt in new_options if opt.text == correct_text)

    return new_options, new_correct_label


def generate_quiz(content: str, num_questions: int, difficulty: str) -> list[QuizQuestion]:
    if not has_llm_configuration():
        raise ValueError("LLM not configured for quiz generation.")

    prompt = _build_prompt(content, num_questions, difficulty)
    llm = build_structured_chat_model(output_schema=QuizGeneratorResponse, temperature=0.3)

    for attempt in range(2):
        try:
            response = llm.invoke([
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": prompt},
            ])

            if isinstance(response, QuizGeneratorResponse):
                raw_questions = response.questions
            elif isinstance(response, dict):
                raw_questions = response.get("questions", [])
            else:
                raise ValueError("Invalid structured response type")

            questions = []
            for q in raw_questions[:num_questions]:
                q_dict = q if isinstance(q, dict) else q.model_dump()
                shuffled_options, new_correct_label = _shuffle_options(
                    q_dict["options"], q_dict["correct_label"]
                )
                questions.append(QuizQuestion(
                    id=str(uuid.uuid4()),
                    question=q_dict["question"],
                    options=shuffled_options,
                    correct_label=new_correct_label,
                    explanation=q_dict["explanation"],
                    concept=q_dict.get("concept", "General"),
                    difficulty=q_dict.get("difficulty", difficulty),
                ))
            return questions

        except Exception as exc:
            if attempt == 1:
                raise ValueError(f"Quiz generation failed: {exc}")
            continue

    return []