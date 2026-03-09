from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import schemas, models
from ..database import get_db
from ..services.llm import get_ai_response

router = APIRouter()

@router.post("/ask", response_model=schemas.QueryResponse)
def ask_question(request: schemas.QueryRequest, db: Session = Depends(get_db)):
    # 1. Generate AI Response
    ai_resp = get_ai_response(request.query)
    
    # 2. Log Query and Response directly to Database
    db_log = models.QueryLog(query=request.query, response=ai_resp)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    # 3. Return JSON formatted via Pydantic response_model schema
    return schemas.QueryResponse(
        query=request.query,
        response=ai_resp,
        log_id=db_log.id
    )
