from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    query: str
    response: str
    log_id: int


# ─── Quiz Schemas ─────────────────────────────────────────────────────────────

class QuizOption(BaseModel):
    label: str   # "A", "B", "C", or "D"
    text: str

class QuizQuestion(BaseModel):
    id: str
    question: str
    options: list[QuizOption]
    correct_label: str
    explanation: str
    concept: str
    difficulty: str

class QuizResponse(BaseModel):
    quiz_id: str
    title: str
    difficulty: str
    total_questions: int
    questions: list[QuizQuestion]
    adaptive_applied: bool = False
    adaptive_reason: Optional[str] = None

class PDFDownloadRequest(BaseModel):
    quiz_id: str
    questions: list[QuizQuestion]
    title: str
    difficulty: str
      
class FlashcardBase(BaseModel):
    question: str
    answer: str
    chunk_source: Optional[str] = None

class FlashcardCreate(FlashcardBase):
    pass

class FlashcardResponse(FlashcardBase):
    id: int
    deck_id: int
    next_review: datetime
    interval: int
    repetition: int
    efactor: float

    class Config:
        from_attributes = True

class FlashcardReview(BaseModel):
    score: int # 0 to 5

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


# --- Analytics & progress tracking ---

class QuizAttemptCreate(BaseModel):
    quiz_id: str
    title: str
    difficulty: str
    total_questions: int
    correct_count: int
    source_filename: Optional[str] = None


class QuizAttemptResponse(BaseModel):
    id: int
    quiz_id: str
    title: str
    difficulty: str
    total_questions: int
    correct_count: int
    score_percent: float
    source_filename: Optional[str] = None
    completed_at: datetime

    class Config:
        from_attributes = True


class ScoreTrendPoint(BaseModel):
    label: str
    score_percent: float
    completed_at: datetime


class FlashcardProgressSummary(BaseModel):
    deck_count: int
    card_count: int
    due_count: int
    reviews_last_7_days: int


class QuizProgressSummary(BaseModel):
    attempt_count: int
    average_score: float
    best_score: float
    recent_attempts: List[QuizAttemptResponse]


class PaperProgressSummary(BaseModel):
    paper_count: int
    total_questions: int
    views_last_7_days: int


class AnalyticsSummary(BaseModel):
    flashcards: FlashcardProgressSummary
    quiz: QuizProgressSummary
    papers: PaperProgressSummary
    score_trend: List[ScoreTrendPoint]


# --- Adaptive quiz ---

class AdaptiveDifficultyResponse(BaseModel):
    recommended: str
    reason: str
    average_score: Optional[float] = None
    attempt_count: int = 0


# --- Lesson summaries ---

class LessonSummaryResponse(BaseModel):
    id: int
    title: str
    summary_text: str
    audio_url: str
    source_filename: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Educational sources ---

class YouTubeTranscriptRequest(BaseModel):
    url: str


class YouTubeTranscriptResponse(BaseModel):
    video_id: str
    title: str
    transcript: str
    word_count: int
    source_url: str


class KhanSearchResponse(BaseModel):
    query: str
    results: List[dict]


class QuizletImportRequest(BaseModel):
    title: str
    cards: List[dict]


class DiagramAnalysisResponse(BaseModel):
    analysis: str
    ocr_text: Optional[str] = None
    method: str
