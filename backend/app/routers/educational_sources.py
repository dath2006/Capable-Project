from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth.dependencies import get_current_user
from ..auth.models import User
from ..database import get_db
from .. import models, schemas
from ..services.khan_source import get_topic_children, search_khan_topics
from ..services.quizlet_import import parse_quizlet_export
from ..services.youtube_source import fetch_transcript
from ..services.rag_state import get_rag_service, persist_user_store

router = APIRouter(prefix="/sources", tags=["educational-sources"])


class YouTubeIndexRequest(BaseModel):
    url: str


class KhanTopicRequest(BaseModel):
    slug: str


@router.post("/youtube/transcript", response_model=schemas.YouTubeTranscriptResponse)
def youtube_transcript(
    payload: schemas.YouTubeTranscriptRequest,
    _current_user: User = Depends(get_current_user),
):
    try:
        data = fetch_transcript(payload.url)
        return schemas.YouTubeTranscriptResponse(**data)
    except ValueError as exc:
        raise HTTPException(400, detail=str(exc)) from exc


@router.post("/youtube/index-to-rag")
def youtube_index_to_rag(
    payload: YouTubeIndexRequest,
    _current_user: User = Depends(get_current_user),
):
    try:
        data = fetch_transcript(payload.url)
        service = get_rag_service(_current_user.id)
        docs = service.load_from_string(
            data["transcript"],
            metadata={
                "source": data["source_url"],
                "title": data["title"],
                "platform": "youtube_education",
            },
        )
        num_docs, num_chunks = service.index_documents(docs)
        persist_user_store(_current_user.id)
        return {
            "success": True,
            "message": f"Indexed YouTube transcript ({num_chunks} chunks)",
            "video_id": data["video_id"],
            "chunks": num_chunks,
        }
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(500, detail=str(exc)) from exc


@router.get("/khan/search", response_model=schemas.KhanSearchResponse)
def khan_search(
    q: str,
    _current_user: User = Depends(get_current_user),
):
    if not q.strip():
        raise HTTPException(400, detail="Query parameter q is required")
    results = search_khan_topics(q.strip())
    return schemas.KhanSearchResponse(query=q.strip(), results=results)


@router.get("/khan/topic/{slug}")
def khan_topic(
    slug: str,
    _current_user: User = Depends(get_current_user),
):
    children = get_topic_children(slug)
    return {"slug": slug, "topics": children}


@router.post("/quizlet/import", response_model=schemas.FlashcardDeckResponse)
def quizlet_import(
    payload: schemas.QuizletImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        cards = parse_quizlet_export({"cards": payload.cards})
    except ValueError as exc:
        raise HTTPException(400, detail=str(exc)) from exc

    deck = models.FlashcardDeck(
        title=payload.title or "Quizlet import",
        source_filename="quizlet_export.json",
        user_id=current_user.id,
    )
    db.add(deck)
    db.commit()
    db.refresh(deck)

    for item in cards:
        db.add(
            models.Flashcard(
                deck_id=deck.id,
                question=item["question"],
                answer=item["answer"],
                chunk_source="quizlet_import",
            )
        )
    db.commit()
    db.refresh(deck)
    return deck
