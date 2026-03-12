import json
import os
import re
import uuid
import random
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq
from ..schemas import QuizQuestion, QuizOption

# Load .env from the backend root folder
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are an expert educational quiz designer.
Your job is to create high-quality MCQ questions from the provided document content.

STRICT RULES:
1. Return ONLY valid JSON — no markdown, no preamble, no explanation outside JSON.
2. Every question must have EXACTLY 4 options labeled A, B, C, D.
3. Only ONE option is correct.
4. The correct_label field must be exactly "A", "B", "C", or "D".
5. Questions must be derived ONLY from the provided content.
6. Cover as many DISTINCT concepts as possible across all questions.
7. Prioritize difficult/complex concepts — they must appear first in the list.
8. Each question must test a DIFFERENT concept — no duplicates.
9. The explanation must be 1-2 sentences explaining why the answer is correct.
10. The concept field must name the specific topic the question tests."""


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

Return a JSON object in this exact format:
{{
  "questions": [
    {{
      "question": "Question text here?",
      "concept": "Name of concept being tested",
      "difficulty": "{difficulty}",
      "options": [
        {{"label": "A", "text": "First option"}},
        {{"label": "B", "text": "Second option"}},
        {{"label": "C", "text": "Third option"}},
        {{"label": "D", "text": "Fourth option"}}
      ],
      "correct_label": "A",
      "explanation": "Brief explanation of why this is correct."
    }}
  ]
}}

IMPORTANT: Sort questions so that the hardest and most complex concepts come first."""


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
    prompt = _build_prompt(content, num_questions, difficulty)

    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                temperature=0.3,
                max_tokens=4000,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": prompt},
                ],
            )

            raw = response.choices[0].message.content.strip()

            # Strip accidental markdown fences if present
            raw = re.sub(r'^```json\s*', '', raw)
            raw = re.sub(r'```\s*$', '', raw)

            parsed = json.loads(raw)
            raw_questions = parsed.get("questions", [])

            questions = []
            for q in raw_questions[:num_questions]:
                # Shuffle options so correct answer isn't always first
                shuffled_options, new_correct_label = _shuffle_options(
                    q["options"], q["correct_label"]
                )
                questions.append(QuizQuestion(
                    id=str(uuid.uuid4()),
                    question=q["question"],
                    options=shuffled_options,
                    correct_label=new_correct_label,
                    explanation=q["explanation"],
                    concept=q.get("concept", "General"),
                    difficulty=q.get("difficulty", difficulty),
                ))
            return questions

        except (json.JSONDecodeError, KeyError):
            if attempt == 1:
                raise ValueError("Quiz generation failed — AI returned invalid output. Please try again.")
            continue

    return []