from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class QueryLog(Base):
    __tablename__ = "query_logs"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, index=True)
    response = Column(String)

class FlashcardDeck(Base):
    __tablename__ = "flashcard_decks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    source_filename = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    flashcards = relationship("Flashcard", back_populates="deck", cascade="all, delete-orphan")

class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("flashcard_decks.id"))
    question = Column(String)
    answer = Column(String)
    chunk_source = Column(String, nullable=True)
    next_review = Column(DateTime, default=datetime.utcnow)
    interval = Column(Integer, default=0)
    repetition = Column(Integer, default=0)
    efactor = Column(Float, default=2.5)

    deck = relationship("FlashcardDeck", back_populates="flashcards")

class QuestionPaper(Base):
    __tablename__ = "question_papers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, index=True)
    source_filename = Column(String)
    total_marks = Column(Integer)
    duration_minutes = Column(Integer)
    difficulty = Column(String)
    target_audience = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    sections = relationship("PaperSection", back_populates="paper", cascade="all, delete-orphan")
    answer_keys = relationship("AnswerKey", back_populates="paper", cascade="all, delete-orphan")

class PaperSection(Base):
    __tablename__ = "paper_sections"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("question_papers.id"))
    section_type = Column(String)
    marks_per_question = Column(Integer)
    order_index = Column(Integer)

    paper = relationship("QuestionPaper", back_populates="sections")
    questions = relationship("Question", back_populates="section", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("paper_sections.id"))
    question_text = Column(String)
    answer = Column(String) 
    options = Column(String, nullable=True) # JSON string for MCQ
    difficulty = Column(String)
    source_chunk = Column(String, nullable=True)
    marks = Column(Integer)

    section = relationship("PaperSection", back_populates="questions")
    answer_key = relationship("AnswerKey", back_populates="question", uselist=False, cascade="all, delete-orphan")

class AnswerKey(Base):
    __tablename__ = "answer_keys"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("question_papers.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    correct_answer = Column(String)
    explanation = Column(String, nullable=True)

    paper = relationship("QuestionPaper", back_populates="answer_keys")
    question = relationship("Question", back_populates="answer_key")
