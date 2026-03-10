# Backend - FastAPI + LangChain + RAG

Modern Python backend with FastAPI, featuring a complete RAG (Retrieval-Augmented Generation) system.

## Features

- 🚀 **FastAPI** - High-performance async web framework
- 🤖 **Complete RAG Pipeline** - Document indexing and intelligent querying
- 🔐 **Authentication** - JWT-based auth system
- 🗄️ **SQLite Database** - SQLAlchemy ORM
- 📦 **uv Package Manager** - Fast dependency management

## Quick Start

1. **Install dependencies**:

   ```bash
   uv sync
   ```

2. **Run the server**:

   ```bash
   uv run fastapi dev app/main.py
   ```

3. **Access the API**:
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs

## RAG System

See [RAG_README.md](RAG_README.md) for complete RAG documentation.

### Quick RAG Example

```bash
# Initialize
curl -X POST "http://localhost:8000/api/rag/init" \
  -H "Content-Type: application/json" \
  -d '{"api_key": "your-google-api-key"}'

# Index a URL
curl -X POST "http://localhost:8000/api/rag/index/url" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Query
curl -X POST "http://localhost:8000/api/rag/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "Your question here"}'
```

### Run Tests

```bash
python test_rag.py
```

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── database.py          # Database configuration
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth/                # Authentication module
│   │   ├── router.py        # Auth endpoints
│   │   ├── models.py        # User model
│   │   ├── schemas.py       # Auth schemas
│   │   └── utils.py         # Auth utilities
│   ├── routers/             # API routers
│   │   ├── query.py         # Query endpoints
│   │   └── rag.py           # RAG endpoints
│   └── services/            # Business logic
│       ├── llm.py           # LLM service
│       └── rag.py           # RAG service
├── pyproject.toml           # Project dependencies
├── RAG_README.md            # RAG documentation
└── test_rag.py             # RAG test script
```

## API Endpoints

### Authentication

- `POST /auth/signup` - Create account
- `POST /auth/login` - Login
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### RAG System

- `POST /api/rag/init` - Initialize RAG service
- `POST /api/rag/index/url` - Index URL
- `POST /api/rag/index/file` - Upload & index file
- `POST /api/rag/index/text` - Index text
- `POST /api/rag/query` - Query RAG system
- `POST /api/rag/search` - Similarity search
- `GET /api/rag/stats` - Get statistics
- `POST /api/rag/clear` - Clear index
- `POST /api/rag/save` - Save vector store
- `POST /api/rag/load` - Load vector store

## Dependencies

Key packages:

- `fastapi[standard]` - Web framework
- `langchain` - RAG orchestration
- `langchain-google-genai` - Gemini integration
- `langchain-community` - Document loaders
- `faiss-cpu` - Vector store
- `pypdf` - PDF parsing
- `python-docx` - Word document parsing
- `bs4` - HTML parsing
- `sqlalchemy` - ORM
- `python-jose` - JWT handling
- `bcrypt` - Password hashing

## Environment Variables

```bash
# Optional - can be set via API
GOOGLE_API_KEY=your-google-api-key
```

## Development

### Add Dependencies

```bash
uv add package-name
```

### Run with Auto-reload

```bash
uv run fastapi dev app/main.py
```

### View Logs

Check the terminal output for request logs and errors.

## Testing

The test script demonstrates all RAG features:

```bash
python test_rag.py
```

## Production Deployment

1. Set environment variables
2. Use production ASGI server:
   ```bash
   uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

## License

Part of the Capable Project.
