import os
import tempfile
from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..services.flashcards import FlashcardService
from ..services.rag import RAGService
from ..auth.dependencies import get_current_user
from ..auth.models import User
from ..ai import get_llm_config_error, has_llm_configuration

router = APIRouter(tags=["flashcards"])

@router.post("/flashcards/generate", response_model=schemas.FlashcardDeckResponse)
async def generate_flashcards(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not has_llm_configuration():
        raise HTTPException(status_code=500, detail=get_llm_config_error())
        
    flashcard_service = FlashcardService(api_key=None)
    rag_service = RAGService()
    
    # Save uploaded file to temp file
    ext = os.path.splitext(file.filename)[1] if file.filename else ".txt"
    with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix=ext) as temp_file:
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

@router.get("/flashcards/due/all", response_model=List[schemas.FlashcardResponse])
def get_due_flashcards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.utcnow()
    # In a real app we'd filter by user's decks. Assuming current_user context.
    # We will get all flashcards where next_review <= now
    user_decks = db.query(models.FlashcardDeck).all() # Should ideally filter by user_id if Deck gets user_id
    deck_ids = [d.id for d in user_decks]
    
    due_cards = db.query(models.Flashcard).filter(
        models.Flashcard.deck_id.in_(deck_ids),
        models.Flashcard.next_review <= now
    ).all()
    
    return due_cards

@router.post("/flashcards/{flashcard_id}/review", response_model=schemas.FlashcardResponse)
def review_flashcard(
    flashcard_id: int,
    review_data: schemas.FlashcardReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    card = db.query(models.Flashcard).filter(models.Flashcard.id == flashcard_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    score = review_data.score
    if score < 0 or score > 5:
        raise HTTPException(status_code=400, detail="Score must be between 0 and 5")

    # SuperMemo-2 logic
    if score >= 3:
        if card.repetition == 0:
            card.interval = 1
        elif card.repetition == 1:
            card.interval = 6
        else:
            card.interval = round(card.interval * card.efactor)
        card.repetition += 1
    else:
        card.repetition = 0
        card.interval = 1

    card.efactor = card.efactor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02))
    if card.efactor < 1.3:
        card.efactor = 1.3

    card.next_review = datetime.utcnow() + timedelta(days=card.interval)
    
    db.commit()
    db.refresh(card)
    return card
