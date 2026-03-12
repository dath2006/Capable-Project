from pydantic import BaseModel

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

class PDFDownloadRequest(BaseModel):
    quiz_id: str
    questions: list[QuizQuestion]
    title: str
    difficulty: str