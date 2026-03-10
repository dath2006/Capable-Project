from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    query: str
    response: str
    log_id: int

class FlashcardBase(BaseModel):
    question: str
    answer: str
    chunk_source: Optional[str] = None

class FlashcardCreate(FlashcardBase):
    pass

class FlashcardResponse(FlashcardBase):
    id: int
    deck_id: int

    class Config:
        from_attributes = True

class FlashcardDeckBase(BaseModel):
    title: str
    source_filename: str

class FlashcardDeckCreate(FlashcardDeckBase):
    pass

class FlashcardDeckResponse(FlashcardDeckBase):
    id: int
    created_at: datetime
    flashcards: List[FlashcardResponse] = []

    class Config:
        from_attributes = True

# --- Question Paper Generation Schemas ---

class SectionConfig(BaseModel):
    type: str
    count: int
    marks_per_question: int

class PaperGenerateRequest(BaseModel):
    title: str
    total_marks: int
    duration_minutes: int
    difficulty: str
    target_audience: str
    topic_focus: List[str] = []
    sections: List[SectionConfig]

class AnswerKeyBase(BaseModel):
    correct_answer: str
    explanation: Optional[str] = None

class AnswerKeyResponse(AnswerKeyBase):
    id: int
    paper_id: int
    question_id: int

    class Config:
        from_attributes = True

class QuestionBase(BaseModel):
    question_text: str
    answer: str
    options: Optional[str] = None
    difficulty: str
    source_chunk: Optional[str] = None
    marks: int

class QuestionResponse(QuestionBase):
    id: int
    section_id: int
    answer_key: Optional[AnswerKeyResponse] = None

    class Config:
        from_attributes = True

class PaperSectionBase(BaseModel):
    section_type: str
    marks_per_question: int
    order_index: int

class PaperSectionResponse(PaperSectionBase):
    id: int
    paper_id: int
    questions: List[QuestionResponse] = []

    class Config:
        from_attributes = True

class QuestionPaperBase(BaseModel):
    title: str
    source_filename: str
    total_marks: int
    duration_minutes: int
    difficulty: str
    target_audience: str

class QuestionPaperResponse(QuestionPaperBase):
    id: int
    user_id: int
    created_at: datetime
    sections: List[PaperSectionResponse] = []

    class Config:
        from_attributes = True
