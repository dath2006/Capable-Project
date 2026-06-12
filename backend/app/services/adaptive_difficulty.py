"""Recommend quiz difficulty from recent attempt performance."""

from sqlalchemy.orm import Session

from .. import models

DIFFICULTIES = ("easy", "medium", "hard")


def recommend_difficulty(db: Session, user_id: int, lookback: int = 5) -> dict:
    attempts = (
        db.query(models.QuizAttempt)
        .filter(models.QuizAttempt.user_id == user_id)
        .order_by(models.QuizAttempt.completed_at.desc())
        .limit(lookback)
        .all()
    )

    if not attempts:
        return {
            "recommended": "medium",
            "reason": "No quiz history yet — starting at medium difficulty.",
            "average_score": None,
            "attempt_count": 0,
        }

    average_score = sum(a.score_percent for a in attempts) / len(attempts)

    if average_score >= 80:
        recommended = "hard"
        reason = (
            f"Strong recent performance ({average_score:.0f}% average) — "
            "try harder questions."
        )
    elif average_score >= 55:
        recommended = "medium"
        reason = (
            f"Solid progress ({average_score:.0f}% average) — "
            "medium difficulty fits your level."
        )
    else:
        recommended = "easy"
        reason = (
            f"Building fundamentals ({average_score:.0f}% average) — "
            "easier questions will help you improve."
        )

    current = attempts[0].difficulty if attempts else "medium"
    if recommended != current:
        reason += f" Suggested change from your last quiz ({current})."

    return {
        "recommended": recommended,
        "reason": reason,
        "average_score": round(average_score, 1),
        "attempt_count": len(attempts),
    }
