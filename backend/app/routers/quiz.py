import uuid
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
import io

from ..schemas import QuizResponse, PDFDownloadRequest
from ..services.extractor import extract_text_from_pdf, extract_text_from_docx
from ..services.quiz_generator import generate_quiz
from ..services.pdf_export import generate_quiz_pdf

router = APIRouter(prefix="/quiz", tags=["quiz"])


@router.post("/generate", response_model=QuizResponse)
async def generate_quiz_endpoint(
    file: UploadFile = File(...),
    difficulty: str = Form(...),
    num_questions: int = Form(...),
):
    # ── Validate difficulty ───────────────────────────────────────────────────
    if difficulty not in ("easy", "medium", "hard"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="difficulty must be 'easy', 'medium', or 'hard'",
        )

    # ── Validate number of questions ──────────────────────────────────────────
    if not (5 <= num_questions <= 15):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="num_questions must be between 5 and 15",
        )

    # ── Validate file type ────────────────────────────────────────────────────
    ext = Path(file.filename or "").suffix.lower()
    if ext not in (".pdf", ".docx"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF and DOCX files are supported.",
        )

    # ── Read file bytes ───────────────────────────────────────────────────────
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

    # ── Extract text ──────────────────────────────────────────────────────────
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

    # ── Generate quiz ─────────────────────────────────────────────────────────
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
    )


@router.post("/download-pdf")
async def download_quiz_pdf(payload: PDFDownloadRequest):
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