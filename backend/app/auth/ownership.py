from fastapi import HTTPException
from sqlalchemy.orm import Session

from .. import models


def get_user_deck(db: Session, deck_id: int, user_id: int) -> models.FlashcardDeck:
    deck = (
        db.query(models.FlashcardDeck)
        .filter(
            models.FlashcardDeck.id == deck_id,
            models.FlashcardDeck.user_id == user_id,
        )
        .first()
    )
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck


def get_user_flashcard(db: Session, flashcard_id: int, user_id: int) -> models.Flashcard:
    card = (
        db.query(models.Flashcard)
        .join(models.FlashcardDeck)
        .filter(
            models.Flashcard.id == flashcard_id,
            models.FlashcardDeck.user_id == user_id,
        )
        .first()
    )
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    return card
