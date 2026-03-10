import os
import tempfile
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..services.flashcards import FlashcardService
from ..services.rag import RAGService
from ..auth.dependencies import get_current_user
from ..auth.models import User

router = APIRouter(tags=["flashcards"])

@router.post("/flashcards/generate", response_model=schemas.FlashcardDeckResponse)
async def generate_flashcards(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY not set")
        
    flashcard_service = FlashcardService(api_key=api_key)
    rag_service = RAGService(api_key=api_key)
    
    # Save uploaded file to temp file
    ext = os.path.splitext(file.filename)[1] if file.filename else ".txt"
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_path = temp_file.name
        
    try:
        if file.filename.endswith(".pdf"):
            docs = rag_service.load_from_pdf(temp_path)
        elif file.filename.endswith(".docx"):
            docs = rag_service.load_from_docx(temp_path)
        elif file.filename.endswith(".txt") or file.filename.endswith(".md"):
            docs = rag_service.load_from_text(temp_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use PDF, DOCX, or TXT.")
            
        deck = flashcard_service.generate_from_documents(docs, db, title=file.filename, filename=file.filename)
        return deck
    finally:
        if os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception:
                pass

@router.get("/flashcards", response_model=List[schemas.FlashcardDeckResponse])
def get_decks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decks = db.query(models.FlashcardDeck).order_by(models.FlashcardDeck.created_at.desc()).all()
    return decks

@router.get("/flashcards/{deck_id}", response_model=schemas.FlashcardDeckResponse)
def get_deck(
    deck_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deck = db.query(models.FlashcardDeck).filter(models.FlashcardDeck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck

@router.delete("/flashcards/{deck_id}")
def delete_deck(
    deck_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deck = db.query(models.FlashcardDeck).filter(models.FlashcardDeck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    db.delete(deck)
    db.commit()
    return {"message": "Deck deleted successfully"}
