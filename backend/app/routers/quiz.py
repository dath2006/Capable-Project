import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
import io
from sqlalchemy.orm import Session

from ..auth.dependencies import get_current_user
from ..auth.models import User
from ..database import get_db
from .. import schemas
from ..schemas import QuizResponse, PDFDownloadRequest
from ..services.extractor import extract_text_from_pdf, extract_text_from_docx
from ..services.quiz_generator import generate_quiz
from ..services.pdf_export import generate_quiz_pdf
from .. import models
from ..services.adaptive_difficulty import recommend_difficulty

router = APIRouter(prefix="/quiz", tags=["quiz"])


@router.get("/adaptive-difficulty", response_model=schemas.AdaptiveDifficultyResponse)
def get_adaptive_difficulty(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = recommend_difficulty(db, current_user.id)
    return schemas.AdaptiveDifficultyResponse(**data)


@router.post("/generate", response_model=QuizResponse)
async def generate_quiz_endpoint(
    file: UploadFile = File(...),
    difficulty: str = Form("medium"),
    num_questions: int = Form(...),
    use_adaptive: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    adaptive_reason: str | None = None
    if use_adaptive:
        adaptive = recommend_difficulty(db, current_user.id)
        difficulty = adaptive["recommended"]
        adaptive_reason = adaptive["reason"]

    if difficulty not in ("easy", "medium", "hard"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="difficulty must be 'easy', 'medium', or 'hard'",
        )

    if not (5 <= num_questions <= 15):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="num_questions must be between 5 and 15",
        )

    ext = Path(file.filename or "").suffix.lower()
    if ext not in (".pdf", ".docx"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF and DOCX files are supported.",
        )

    file_bytes = await file.read()

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum size is 10 MB.",
        )

    try:
        if ext == ".pdf":
            content = extract_text_from_pdf(file_bytes)
        else:
            content = extract_text_from_docx(file_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not extract text from file: {str(e)}",
        )

    if len(content.split()) < 50:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Document has too little text to generate questions from.",
        )

    try:
        questions = generate_quiz(content, num_questions, difficulty)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        )

    doc_title = Path(file.filename or "Document").stem.replace("_", " ").replace("-", " ").title()

    return QuizResponse(
        quiz_id=str(uuid.uuid4()),
        title=doc_title,
        difficulty=difficulty,
        total_questions=len(questions),
        questions=questions,
        adaptive_applied=use_adaptive,
        adaptive_reason=adaptive_reason,
    )


@router.post("/attempts", response_model=schemas.QuizAttemptResponse)
def record_quiz_attempt(
    payload: schemas.QuizAttemptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.total_questions <= 0:
        raise HTTPException(status_code=400, detail="total_questions must be positive")
    if not (0 <= payload.correct_count <= payload.total_questions):
        raise HTTPException(status_code=400, detail="correct_count out of range")

    score_percent = round(
        (payload.correct_count / payload.total_questions) * 100, 1
    )

    attempt = models.QuizAttempt(
        user_id=current_user.id,
        quiz_id=payload.quiz_id,
        title=payload.title,
        difficulty=payload.difficulty,
        total_questions=payload.total_questions,
        correct_count=payload.correct_count,
        score_percent=score_percent,
        source_filename=payload.source_filename,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


@router.get("/attempts", response_model=list[schemas.QuizAttemptResponse])
def list_quiz_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(models.QuizAttempt)
        .filter(models.QuizAttempt.user_id == current_user.id)
        .order_by(models.QuizAttempt.completed_at.desc())
        .limit(20)
        .all()
    )


@router.post("/download-pdf")
async def download_quiz_pdf(
    payload: PDFDownloadRequest,
    _current_user: User = Depends(get_current_user),
):
    if not payload.questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No questions provided.",
        )

    pdf_bytes = generate_quiz_pdf(payload.questions, payload.title, payload.difficulty)

    filename = f"quiz_revision_{payload.quiz_id[:8]}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
