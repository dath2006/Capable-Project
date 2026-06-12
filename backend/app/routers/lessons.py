import os
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..auth.dependencies import get_current_user
from ..auth.models import User
from ..database import get_db
from .. import models, schemas
from ..services.extractor import extract_text_from_pdf, extract_text_from_docx
from ..services.lesson_summary import generate_audio_file, generate_summary_text

router = APIRouter(prefix="/lessons", tags=["lessons"])


def _lesson_audio_url(filename: str) -> str:
    return f"/media/lessons/{filename}"


@router.post("/summary", response_model=schemas.LessonSummaryResponse)
async def create_lesson_summary(
    file: UploadFile = File(...),
    title: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in (".pdf", ".docx", ".txt"):
        raise HTTPException(400, detail="Supported formats: PDF, DOCX, TXT")

    raw = await file.read()
    if len(raw) > 10 * 1024 * 1024:
        raise HTTPException(413, detail="File too large (max 10 MB)")

    try:
        if ext == ".pdf":
            content = extract_text_from_pdf(raw)
        elif ext == ".docx":
            content = extract_text_from_docx(raw)
        else:
            content = raw.decode("utf-8", errors="ignore")
    except Exception as exc:
        raise HTTPException(422, detail=f"Could not read file: {exc}") from exc

    doc_title = title or Path(file.filename or "Lesson").stem.replace("_", " ").title()

    try:
        summary_text = generate_summary_text(content)
        _, audio_path = await generate_audio_file(summary_text)
    except ValueError as exc:
        raise HTTPException(400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(502, detail=f"Summary generation failed: {exc}") from exc

    record = models.LessonSummary(
        user_id=current_user.id,
        title=doc_title,
        source_filename=file.filename,
        summary_text=summary_text,
        audio_filename=audio_path.name,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return schemas.LessonSummaryResponse(
        id=record.id,
        title=record.title,
        summary_text=record.summary_text,
        audio_url=_lesson_audio_url(record.audio_filename),
        source_filename=record.source_filename,
        created_at=record.created_at,
    )


@router.post("/summary/text", response_model=schemas.LessonSummaryResponse)
async def create_lesson_from_text(
    content: str = Form(...),
    title: str = Form("Study lesson"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        summary_text = generate_summary_text(content)
        _, audio_path = await generate_audio_file(summary_text)
    except ValueError as exc:
        raise HTTPException(400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(502, detail=f"Summary generation failed: {exc}") from exc

    record = models.LessonSummary(
        user_id=current_user.id,
        title=title,
        summary_text=summary_text,
        audio_filename=audio_path.name,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return schemas.LessonSummaryResponse(
        id=record.id,
        title=record.title,
        summary_text=record.summary_text,
        audio_url=_lesson_audio_url(record.audio_filename),
        created_at=record.created_at,
    )


@router.get("", response_model=list[schemas.LessonSummaryResponse])
def list_lessons(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(models.LessonSummary)
        .filter(models.LessonSummary.user_id == current_user.id)
        .order_by(models.LessonSummary.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        schemas.LessonSummaryResponse(
            id=r.id,
            title=r.title,
            summary_text=r.summary_text,
            audio_url=_lesson_audio_url(r.audio_filename),
            source_filename=r.source_filename,
            created_at=r.created_at,
        )
        for r in rows
    ]
