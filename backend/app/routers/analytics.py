from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth.dependencies import get_current_user
from ..auth.models import User
from ..database import get_db

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=schemas.AnalyticsSummary)
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id = current_user.id
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    deck_ids = [
        row[0]
        for row in db.query(models.FlashcardDeck.id)
        .filter(models.FlashcardDeck.user_id == user_id)
        .all()
    ]

    deck_count = len(deck_ids)
    card_count = 0
    due_count = 0
    if deck_ids:
        card_count = (
            db.query(func.count(models.Flashcard.id))
            .filter(models.Flashcard.deck_id.in_(deck_ids))
            .scalar()
            or 0
        )
        due_count = (
            db.query(func.count(models.Flashcard.id))
            .filter(
                models.Flashcard.deck_id.in_(deck_ids),
                models.Flashcard.next_review <= now,
            )
            .scalar()
            or 0
        )

    reviews_last_7_days = (
        db.query(func.count(models.FlashcardReviewLog.id))
        .filter(
            models.FlashcardReviewLog.user_id == user_id,
            models.FlashcardReviewLog.reviewed_at >= week_ago,
        )
        .scalar()
        or 0
    )

    quiz_attempts = (
        db.query(models.QuizAttempt)
        .filter(models.QuizAttempt.user_id == user_id)
        .order_by(models.QuizAttempt.completed_at.desc())
        .all()
    )
    attempt_count = len(quiz_attempts)
    average_score = (
        sum(a.score_percent for a in quiz_attempts) / attempt_count
        if attempt_count
        else 0.0
    )
    best_score = max((a.score_percent for a in quiz_attempts), default=0.0)

    papers = (
        db.query(models.QuestionPaper)
        .filter(models.QuestionPaper.user_id == user_id)
        .all()
    )
    paper_count = len(papers)
    total_questions = 0
    for paper in papers:
        for section in paper.sections:
            total_questions += len(section.questions)

    views_last_7_days = (
        db.query(func.count(models.PaperView.id))
        .filter(
            models.PaperView.user_id == user_id,
            models.PaperView.viewed_at >= week_ago,
        )
        .scalar()
        or 0
    )

    score_trend = [
        schemas.ScoreTrendPoint(
            label=a.title[:40],
            score_percent=a.score_percent,
            completed_at=a.completed_at,
        )
        for a in quiz_attempts[:10]
    ]
    score_trend.reverse()

    return schemas.AnalyticsSummary(
        flashcards=schemas.FlashcardProgressSummary(
            deck_count=deck_count,
            card_count=card_count,
            due_count=due_count,
            reviews_last_7_days=reviews_last_7_days,
        ),
        quiz=schemas.QuizProgressSummary(
            attempt_count=attempt_count,
            average_score=round(average_score, 1),
            best_score=round(best_score, 1),
            recent_attempts=quiz_attempts[:5],
        ),
        papers=schemas.PaperProgressSummary(
            paper_count=paper_count,
            total_questions=total_questions,
            views_last_7_days=views_last_7_days,
        ),
        score_trend=score_trend,
    )
