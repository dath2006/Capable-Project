from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..auth.dependencies import get_current_user
from ..auth.models import User
from .. import schemas
from ..services.diagram_analysis import analyze_educational_image

router = APIRouter(prefix="/diagram", tags=["diagram"])

ALLOWED = {".png", ".jpg", ".jpeg", ".webp", ".gif"}


@router.post("/analyze", response_model=schemas.DiagramAnalysisResponse)
async def analyze_diagram(
    file: UploadFile = File(...),
    _current_user: User = Depends(get_current_user),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED:
        raise HTTPException(
            415,
            detail=f"Supported image types: {', '.join(sorted(ALLOWED))}",
        )

    raw = await file.read()
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(413, detail="Image too large (max 8 MB)")

    try:
        result = analyze_educational_image(raw, file.filename or "image.png")
        return schemas.DiagramAnalysisResponse(**result)
    except ValueError as exc:
        raise HTTPException(400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(502, detail=f"Analysis failed: {exc}") from exc
