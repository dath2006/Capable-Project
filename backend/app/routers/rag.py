"""
RAG Router - API endpoints for the RAG system
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any
import tempfile
import os
from pathlib import Path

from ..ai import get_llm_config_error, has_llm_configuration
from ..auth.dependencies import get_current_user
from ..auth.models import User


router = APIRouter(prefix="/rag", tags=["RAG"])


from ..services.rag_state import (
    clear_user_service,
    ensure_rag_service,
    get_rag_service,
    persist_user_store,
)


# Pydantic Schemas
class RAGInitRequest(BaseModel):
    """Initialize RAG service with configured providers."""
    api_key: Optional[str] = None
    model_name: Optional[str] = None
    provider: Optional[str] = None


class IndexURLRequest(BaseModel):
    """Request to index a URL."""
    url: HttpUrl


class IndexTextRequest(BaseModel):
    """Request to index plain text."""
    content: str
    metadata: Optional[Dict[str, Any]] = None


class QueryRequest(BaseModel):
    """Request to query the RAG system."""
    question: str
    k: Optional[int] = 4
    return_sources: Optional[bool] = True


class SearchRequest(BaseModel):
    """Request to search for similar documents."""
    query: str
    k: Optional[int] = 4
    filter_dict: Optional[Dict[str, Any]] = None


class RAGResponse(BaseModel):
    """Generic response model."""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


class QueryResponse(BaseModel):
    """Response from query endpoint."""
    answer: str
    question: str
    sources: Optional[List[Dict[str, Any]]] = None


class SearchResponse(BaseModel):
    """Response from search endpoint."""
    results: List[Dict[str, Any]]
    query: str


class StatsResponse(BaseModel):
    """RAG statistics response."""
    total_documents: int
    total_chunks: int
    is_indexed: bool
    embedding_dimension: Optional[int] = None


class RAGStatusResponse(BaseModel):
    ready: bool
    is_indexed: bool
    total_chunks: int
    message: str


@router.get("/status", response_model=RAGStatusResponse)
async def rag_status(current_user: User = Depends(get_current_user)):
    """Report readiness — service auto-initializes from server configuration."""
    service = ensure_rag_service(current_user.id)
    stats = service.get_stats()
    return RAGStatusResponse(
        ready=True,
        is_indexed=stats.get("is_indexed", False),
        total_chunks=stats.get("total_chunks", 0),
        message=(
            "Ready — add study materials and ask questions."
            if stats.get("is_indexed")
            else "Ready — upload material to start asking questions."
        ),
    )


@router.post("/init", response_model=RAGResponse)
async def initialize_rag(
    request: RAGInitRequest,
    current_user: User = Depends(get_current_user),
):
    """Legacy init — no longer required; ensures per-user service is ready."""
    if not has_llm_configuration(gemini_api_key=request.api_key):
        raise HTTPException(status_code=500, detail=get_llm_config_error())
    ensure_rag_service(current_user.id)
    return RAGResponse(
        success=True,
        message="Study assistant is ready (using server configuration).",
        data={"provider": request.provider or "env"},
    )


@router.post("/index/url", response_model=RAGResponse)
async def index_url(
    request: IndexURLRequest,
    current_user: User = Depends(get_current_user),
):
    service = get_rag_service(current_user.id)

    try:
        docs = service.load_from_url(str(request.url))
        num_docs, num_chunks = service.index_documents(docs)
        persist_user_store(current_user.id)

        return RAGResponse(
            success=True,
            message=f"Successfully indexed {num_docs} document(s) from URL",
            data={
                "url": str(request.url),
                "documents": num_docs,
                "chunks": num_chunks
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to index URL: {str(e)}")


@router.post("/index/file", response_model=RAGResponse)
async def index_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    service = get_rag_service(current_user.id)
    
    # Check file extension
    file_ext = Path(file.filename).suffix.lower()
    supported_extensions = {'.pdf', '.docx', '.txt'}
    
    if file_ext not in supported_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Supported: {', '.join(supported_extensions)}"
        )
    
    try:
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        try:
            # Load documents based on file type
            if file_ext == '.pdf':
                docs = service.load_from_pdf(tmp_path)
            elif file_ext == '.docx':
                docs = service.load_from_docx(tmp_path)
            elif file_ext == '.txt':
                docs = service.load_from_text(tmp_path)
            else:
                raise ValueError(f"Unsupported file type: {file_ext}")
            
            # Index documents
            num_docs, num_chunks = service.index_documents(docs)
            persist_user_store(current_user.id)

            return RAGResponse(
                success=True,
                message=f"Successfully indexed file: {file.filename}",
                data={
                    "filename": file.filename,
                    "file_type": file_ext,
                    "documents": num_docs,
                    "chunks": num_chunks
                }
            )
        finally:
            # Clean up temporary file
            os.unlink(tmp_path)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to index file: {str(e)}")


@router.post("/index/text", response_model=RAGResponse)
async def index_text(
    request: IndexTextRequest,
    current_user: User = Depends(get_current_user),
):
    service = get_rag_service(current_user.id)

    try:
        docs = service.load_from_string(request.content, request.metadata)
        num_docs, num_chunks = service.index_documents(docs)
        persist_user_store(current_user.id)

        return RAGResponse(
            success=True,
            message="Successfully indexed text content",
            data={
                "documents": num_docs,
                "chunks": num_chunks,
                "content_length": len(request.content)
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to index text: {str(e)}")


@router.post("/query", response_model=QueryResponse)
async def query_rag(
    request: QueryRequest,
    current_user: User = Depends(get_current_user),
):
    service = get_rag_service(current_user.id)
    
    try:
        result = service.query(
            question=request.question,
            k=request.k,
            return_sources=request.return_sources
        )
        
        return QueryResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


@router.post("/search", response_model=SearchResponse)
async def search_documents(
    request: SearchRequest,
    current_user: User = Depends(get_current_user),
):
    service = get_rag_service(current_user.id)
    
    try:
        docs = service.similarity_search(
            query=request.query,
            k=request.k,
            filter_dict=request.filter_dict
        )
        
        results = [
            {
                "content": doc.page_content,
                "metadata": doc.metadata
            }
            for doc in docs
        ]
        
        return SearchResponse(
            results=results,
            query=request.query
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/stats", response_model=StatsResponse)
async def get_stats(current_user: User = Depends(get_current_user)):
    service = ensure_rag_service(current_user.id)
    
    try:
        stats = service.get_stats()
        return StatsResponse(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@router.post("/clear", response_model=RAGResponse)
async def clear_index(current_user: User = Depends(get_current_user)):
    service = get_rag_service(current_user.id)

    try:
        service.clear_index()
        persist_user_store(current_user.id)

        return RAGResponse(
            success=True,
            message="Successfully cleared all indexed documents"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear index: {str(e)}")


@router.post("/save", response_model=RAGResponse)
async def save_index(
    path: str = Form(...),
    current_user: User = Depends(get_current_user),
):
    service = get_rag_service(current_user.id)

    try:
        service.save_vector_store(path)
        persist_user_store(current_user.id)
        
        return RAGResponse(
            success=True,
            message=f"Vector store saved to {path}"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save vector store: {str(e)}")


@router.post("/load", response_model=RAGResponse)
async def load_index(
    path: str = Form(...),
    current_user: User = Depends(get_current_user),
):
    service = get_rag_service(current_user.id)

    try:
        service.load_vector_store(path)
        persist_user_store(current_user.id)
        stats = service.get_stats()
        
        return RAGResponse(
            success=True,
            message=f"Vector store loaded from {path}",
            data=stats
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load vector store: {str(e)}")
