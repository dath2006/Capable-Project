# Modern Full-Stack Starter Project

This project provides a robust basis for a modern web application, consisting of a React + Vite TypeScript frontend and a FastAPI backend using the `uv` package manager, configured with LangChain and SQLite.

## Features

✨ **Complete RAG Pipeline** - Retrieval-Augmented Generation system with:

- Google Gemini LLM and embeddings
- FAISS vector store for efficient similarity search
- Multi-format document support (PDF, DOCX, TXT, URLs)
- Advanced querying and retrieval capabilities

🔐 **Authentication** - Full JWT-based authentication system

🎨 **Modern UI** - React + TypeScript + Vite frontend

⚡ **Fast Backend** - FastAPI with LangChain integration

## Project Structure

- **frontend/**: A React + TypeScript project built blazingly fast with [Vite](https://vitejs.dev/).
- **backend/**: A Python backend built with [FastAPI](https://fastapi.tiangolo.com/), featuring:
  - Complete RAG implementation with [LangChain](https://python.langchain.com/)
  - Google Gemini integration
  - FAISS vector store
  - SQLite database
  - JWT authentication
  - Dependencies managed via [uv](https://github.com/astral-sh/uv)

---

## 🚀 Setup Instructions

### 1. Frontend Setup (React + Vite + TS)

The frontend requires [Node.js](https://nodejs.org/) (version 18+ recommended).

1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install the JavaScript package dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the frontend locally at [http://localhost:5173/](http://localhost:5173/).

---

### 2. Backend Setup (FastAPI + LangChain + SQLite + uv)

The backend uses [uv](https://github.com/astral-sh/uv), an extremely fast Python package and environment manager written in Rust.

1. Ensure `uv` is installed on your system.
   - For Linux/Mac: `curl -LsSf https://astral.sh/uv/install.sh | sh`
   - For Windows (PowerShell): `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`
   - Note: Make sure `python` (version 3.10+) is available on your system.

2. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
3. Sync and ensure the environment is fully up-to-date. (This command creates `.venv` automatically if it was missing and installs dependencies defined in `pyproject.toml` or `uv.lock`):
   ```bash
   uv sync
   ```
4. Run the FastAPI development server effortlessly using `uv run`, which automatically uses the local virtual environment:
   ```bash
   uv run fastapi dev app/main.py
   # Or directly run Uvicorn:
   # uv run uvicorn app.main:app --reload
   ```
5. You can view the API running locally at [http://localhost:8000/](http://localhost:8000/).
6. Access the interactive Swagger UI API auto-documentation at [http://localhost:8000/docs](http://localhost:8000/docs).

### Example Endpoint Testing

The backend setup has a pre-configured SQLite database engine inside `main.py` mimicking a small LLM endpoint logging interface utilizing LangChain components.

You can verify the backend interacts with the setup by testing the POST `/api/ask` endpoint:

```bash
curl -X 'POST' \
  'http://localhost:8000/api/ask' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "query": "Hello AI!"
}'
```

This query and its simulated LangChain generation are logged automatically into `app.db` (created within the `backend` folder on startup).
