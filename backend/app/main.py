from fastapi import FastAPI
from .database import engine, Base
from .routers import query

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Capable Project AI API", version="1.0.0")

app.include_router(query.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to Modular FastAPI + LangChain + SQLite"}
