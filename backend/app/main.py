import warnings
warnings.filterwarnings("ignore", message="The default value of `allowed_objects` will change")

from dotenv import load_dotenv
load_dotenv()
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import init_db
from .routers import query
#from .routers import rag
from .routers import quiz                    
from .routers import rag
from .routers import flashcards
from .routers import papers
from .routers import analytics
from .routers import lessons
from .routers import educational_sources
from .routers import diagram
from .config import CORS_ORIGINS
from .auth.router import router as auth_router
from .auth import models as auth_models  # noqa: F401

init_db()

MEDIA_DIR = Path(__file__).resolve().parent.parent / "media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)
(MEDIA_DIR / "lessons").mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Capable Project AI API", version="1.0.0")
app.mount("/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(query.router, prefix="/api")
#app.include_router(rag.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(rag.router, prefix="/api")
app.include_router(flashcards.router, prefix="/api")
app.include_router(papers.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(lessons.router, prefix="/api")
app.include_router(educational_sources.router, prefix="/api")
app.include_router(diagram.router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "Welcome to Capable Project API"}