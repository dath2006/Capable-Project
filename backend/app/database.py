from datetime import datetime

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

from .config import DATABASE_URL

engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _migrate_flashcard_sm2_columns() -> None:
    """Add spaced-repetition columns when the DB predates the model change."""
    inspector = inspect(engine)
    if "flashcards" not in inspector.get_table_names():
        return

    existing = {col["name"] for col in inspector.get_columns("flashcards")}
    additions = [
        ("next_review", "DATETIME"),
        ("interval", "INTEGER DEFAULT 0 NOT NULL"),
        ("repetition", "INTEGER DEFAULT 0 NOT NULL"),
        ("efactor", "REAL DEFAULT 2.5 NOT NULL"),
    ]

    with engine.begin() as conn:
        for name, ddl in additions:
            if name not in existing:
                conn.execute(text(f'ALTER TABLE flashcards ADD COLUMN "{name}" {ddl}'))

        conn.execute(
            text("UPDATE flashcards SET next_review = :now WHERE next_review IS NULL"),
            {"now": datetime.utcnow().isoformat()},
        )


def _migrate_user_scoped_columns() -> None:
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    if "flashcard_decks" in table_names:
        existing = {col["name"] for col in inspector.get_columns("flashcard_decks")}
        if "user_id" not in existing:
            with engine.begin() as conn:
                conn.execute(
                    text('ALTER TABLE flashcard_decks ADD COLUMN "user_id" INTEGER')
                )


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _migrate_flashcard_sm2_columns()
    _migrate_user_scoped_columns()
