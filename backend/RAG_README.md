# RAG (Retrieval-Augmented Generation) API

Complete end-to-end RAG pipeline with Google Gemini, FAISS vector store, and support for multiple document formats.

## Features

✨ **Multi-Format Document Support**

- 📄 PDF files
- 📝 DOCX (Word documents)
- 📃 TXT (Plain text)
- 🌐 Web URLs
- ✍️ Direct text input

🔍 **Powerful Retrieval**

- FAISS vector store for efficient similarity search
- Google Gemini embeddings (models/embedding-001)
- Configurable chunk size and overlap
- Metadata filtering support

🤖 **Flexible Querying**

- Google Gemini LLM (gemini-1.5-flash by default)
- RAG-based question answering
- Direct similarity search
- Source citation support
- Configurable retrieval count (k)

## Installation

The required dependencies are already installed if you've set up the project. If not, run:

```bash
cd backend
uv add langchain-google-genai faiss-cpu pypdf python-docx
```

## API Endpoints

### 1. Initialize RAG Service

**POST** `/api/rag/init`

Initialize the RAG service with your Google API key.

**Request:**

```json
{
  "api_key": "your-google-api-key",
  "model_name": "gemini-1.5-flash" // optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "RAG service initialized with model gemini-1.5-flash",
  "data": {
    "model": "gemini-1.5-flash"
  }
}
```

### 2. Index a URL

**POST** `/api/rag/index/url`

Index content from a web URL.

**Request:**

```json
{
  "url": "https://lilianweng.github.io/posts/2023-06-23-agent/"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully indexed 1 document(s) from URL",
  "data": {
    "url": "https://lilianweng.github.io/posts/2023-06-23-agent/",
    "documents": 1,
    "chunks": 66
  }
}
```

### 3. Index a File

**POST** `/api/rag/index/file`

Upload and index a file (PDF, DOCX, or TXT).

**Request:** (multipart/form-data)

- `file`: The file to upload

**Response:**

```json
{
  "success": true,
  "message": "Successfully indexed file: document.pdf",
  "data": {
    "filename": "document.pdf",
    "file_type": ".pdf",
    "documents": 1,
    "chunks": 42
  }
}
```

### 4. Index Plain Text

**POST** `/api/rag/index/text`

Index plain text content directly.

**Request:**

```json
{
  "content": "Your text content here...",
  "metadata": {
    "title": "My Document",
    "category": "notes"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully indexed text content",
  "data": {
    "documents": 1,
    "chunks": 3,
    "content_length": 1234
  }
}
```

### 5. Query the RAG System

**POST** `/api/rag/query`

Ask a question and get an AI-generated answer based on indexed documents.

**Request:**

```json
{
  "question": "What is task decomposition?",
  "k": 4, // optional, number of chunks to retrieve
  "return_sources": true // optional, include source documents
}
```

**Response:**

```json
{
  "answer": "Task decomposition is a technique where complex tasks are broken down into smaller, manageable steps...",
  "question": "What is task decomposition?",
  "sources": [
    {
      "content": "Task decomposition can be done...",
      "metadata": {
        "source_type": "url",
        "url": "https://example.com"
      }
    }
  ]
}
```

### 6. Search Similar Documents

**POST** `/api/rag/search`

Perform similarity search without generating an answer.

**Request:**

```json
{
  "query": "machine learning algorithms",
  "k": 4,
  "filter_dict": {
    "source_type": "pdf"
  }
}
```

**Response:**

```json
{
  "results": [
    {
      "content": "Content of the matched chunk...",
      "metadata": {
        "source_type": "pdf",
        "file_name": "ml_book.pdf",
        "page": 42
      }
    }
  ],
  "query": "machine learning algorithms"
}
```

### 7. Get Statistics

**GET** `/api/rag/stats`

Get statistics about indexed documents.

**Response:**

```json
{
  "total_documents": 5,
  "total_chunks": 156,
  "is_indexed": true,
  "embedding_dimension": 768
}
```

### 8. Clear Index

**POST** `/api/rag/clear`

Clear all indexed documents.

**Response:**

```json
{
  "success": true,
  "message": "Successfully cleared all indexed documents"
}
```

### 9. Save Vector Store

**POST** `/api/rag/save`

Save the vector store to disk for later use.

**Request:** (form-data)

- `path`: Directory path to save

**Response:**

```json
{
  "success": true,
  "message": "Vector store saved to /path/to/store"
}
```

### 10. Load Vector Store

**POST** `/api/rag/load`

Load a previously saved vector store.

**Request:** (form-data)

- `path`: Directory path to load from

**Response:**

```json
{
  "success": true,
  "message": "Vector store loaded from /path/to/store",
  "data": {
    "total_documents": 5,
    "total_chunks": 156,
    "is_indexed": true
  }
}
```

## Usage Examples

### Python Example

```python
import requests

BASE_URL = "http://localhost:8000/api/rag"

# 1. Initialize the service
init_response = requests.post(f"{BASE_URL}/init", json={
    "api_key": "your-google-api-key",
    "model_name": "gemini-1.5-flash"
})
print(init_response.json())

# 2. Index a URL
index_response = requests.post(f"{BASE_URL}/index/url", json={
    "url": "https://lilianweng.github.io/posts/2023-06-23-agent/"
})
print(index_response.json())

# 3. Index a PDF file
with open("document.pdf", "rb") as f:
    files = {"file": f}
    file_response = requests.post(f"{BASE_URL}/index/file", files=files)
    print(file_response.json())

# 4. Query the system
query_response = requests.post(f"{BASE_URL}/query", json={
    "question": "What is task decomposition?",
    "k": 4,
    "return_sources": True
})
result = query_response.json()
print(f"Answer: {result['answer']}")
print(f"Sources: {len(result['sources'])}")

# 5. Get statistics
stats_response = requests.get(f"{BASE_URL}/stats")
print(stats_response.json())
```

### cURL Examples

```bash
# Initialize
curl -X POST "http://localhost:8000/api/rag/init" \
  -H "Content-Type: application/json" \
  -d '{"api_key": "your-api-key"}'

# Index URL
curl -X POST "http://localhost:8000/api/rag/index/url" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Upload file
curl -X POST "http://localhost:8000/api/rag/index/file" \
  -F "file=@document.pdf"

# Query
curl -X POST "http://localhost:8000/api/rag/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is machine learning?", "k": 4}'

# Get stats
curl -X GET "http://localhost:8000/api/rag/stats"
```

## Configuration

### Environment Variables

Set your Google API key as an environment variable (optional, can also be passed via API):

```bash
export GOOGLE_API_KEY="your-google-api-key"
```

### Text Splitter Settings

The default text splitter configuration:

- **Chunk Size**: 1000 characters
- **Chunk Overlap**: 200 characters
- **Add Start Index**: True (tracks position in original document)

These can be modified in `app/services/rag.py`.

### Gemini Models

Available models:

- `gemini-1.5-flash` (default) - Fast and efficient
- `gemini-1.5-pro` - More capable, higher quality
- `gemini-2.0-flash-exp` - Latest experimental

## Architecture

```
┌─────────────────┐
│  User Request   │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  RAG Router     │  (FastAPI endpoints)
└────────┬────────┘
         │
         v
┌─────────────────┐
│  RAG Service    │
│                 │
│ ┌─────────────┐ │
│ │ Document    │ │  PDF, DOCX, TXT, URL loaders
│ │ Loaders     │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ Text        │ │  RecursiveCharacterTextSplitter
│ │ Splitter    │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ Embeddings  │ │  Google Gemini Embeddings
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ Vector      │ │  FAISS (CPU)
│ │ Store       │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ LLM         │ │  Google Gemini
│ └─────────────┘ │
└─────────────────┘
```

## Best Practices

1. **Initialize Once**: Call `/init` at the start of your session
2. **Batch Indexing**: Index multiple documents before querying
3. **Tune k Parameter**: Adjust the number of retrieved chunks based on your needs
4. **Use Metadata**: Add meaningful metadata when indexing for better filtering
5. **Save Progress**: Use `/save` to persist your vector store
6. **Source Citation**: Enable `return_sources` to verify answers

## Troubleshooting

**Error: "RAG service not initialized"**

- Make sure to call `/api/rag/init` with your API key first

**Error: "No documents indexed yet"**

- Index at least one document before querying

**Slow indexing**

- Large documents are split into chunks and embedded individually
- Consider indexing in batches during off-peak hours

**Poor answer quality**

- Increase the `k` parameter to retrieve more context
- Ensure your documents contain relevant information
- Try a more capable model like `gemini-1.5-pro`

## Getting Google API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and use it in the `/init` endpoint

## License

This RAG implementation is part of the Capable Project.
