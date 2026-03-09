from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import query
from .auth.router import router as auth_router
from .auth import models as auth_models  # noqa: F401

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Capable Project AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(query.router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "Welcome to Capable Project API"}
