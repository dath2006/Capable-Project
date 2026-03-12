import json
from typing import List
from langchain_core.prompts import PromptTemplate
from sqlalchemy.orm import Session
from .. import models
from .rag import RAGService
from ..ai import build_chat_model

class FlashcardService:
    def __init__(self, api_key: str | None = None, model_name: str | None = None):
        self.api_key = api_key
        self.llm = build_chat_model(
            temperature=0.3,
            model_name=model_name,
            gemini_api_key=api_key,
        )

    def generate_from_documents(self, documents: List, db: Session, title: str, filename: str) -> models.FlashcardDeck:
        rag = RAGService(api_key=self.api_key)
        chunks = rag.split_documents(documents)
        
        # Limit to 20 chunks for optimal performance and rate limit avoidance
        if len(chunks) > 20:
            chunks = chunks[:20]
        
        deck = models.FlashcardDeck(title=title, source_filename=filename)
        db.add(deck)
        db.commit()
        db.refresh(deck)

        prompt = PromptTemplate.from_template(
            "Extract one key concept from the following text and create a concise flashcard question and answer. "
            "Return the result ONLY as a valid JSON object with 'question' and 'answer' keys. "
            "Text: {text}"
        )
        
        cards = []
        for chunk in chunks:
            try:
                response = self.llm.invoke(prompt.format(text=chunk.page_content))
                text = response.content.strip()
                if text.startswith("```json"):
                    text = text[7:-3].strip()
                elif text.startswith("```"):
                    text = text[3:-3].strip()
                    
                data = json.loads(text)
                
                if "question" in data and "answer" in data:
                    fc = models.Flashcard(
                        deck_id=deck.id,
                        question=data["question"],
                        answer=data["answer"],
                        chunk_source=chunk.page_content[:200]
                    )
                    cards.append(fc)
            except Exception as e:
                print(f"Failed to generate flashcard for chunk: {e}")
                continue
                
        if cards:
            db.bulk_save_objects(cards)
            db.commit()
            
        db.refresh(deck)
        return deck
