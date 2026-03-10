"""
RAG (Retrieval-Augmented Generation) Service
Complete end-to-end RAG pipeline with Gemini, FAISS, and multi-format document support.
"""

import os
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import tempfile

# LangChain imports
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import (
    WebBaseLoader,
    PyPDFLoader,
    Docx2txtLoader,
    TextLoader,
)
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.documents import Document
from langchain_core.tools import tool
from langchain.agents import create_agent
import bs4


class RAGService:
    """
    Complete RAG service with document loading, indexing, and querying capabilities.
    Supports multiple document types: PDF, DOCX, TXT, and URLs.
    """

    def __init__(self, api_key: str, model_name: str = "gemini-flash-lite-latest"):
        """
        Initialize the RAG service.
        
        Args:
            api_key: Google API key for Gemini
            model_name: Gemini model to use (default: gemini-flash-lite-latest)
        """
        self.api_key = api_key
        self.model_name = model_name
        
        # Initialize embeddings model
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="gemini-embedding-001",
            google_api_key=api_key
        )
        
        # Initialize LLM
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=0.7,
            convert_system_message_to_human=True
        )
        
        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            add_start_index=True
        )
        
        # Vector store (will be created after indexing)
        self.vector_store: Optional[FAISS] = None
        self.indexed_docs: List[Document] = []

    def load_from_url(self, url: str, bs_kwargs: Optional[Dict] = None) -> List[Document]:
        """
        Load document from a URL.
        
        Args:
            url: The URL to load
            bs_kwargs: Optional BeautifulSoup parsing arguments
            
        Returns:
            List of loaded documents
        """
        if bs_kwargs is None:
            # Default: try to extract main content
            bs_kwargs = {
                "parse_only": bs4.SoupStrainer(
                    ["article", "main", "div", "p", "h1", "h2", "h3", "h4", "h5", "h6"]
                )
            }
        
        loader = WebBaseLoader(
            web_paths=(url,),
            bs_kwargs=bs_kwargs
        )
        docs = loader.load()
        
        # Add metadata
        for doc in docs:
            doc.metadata["source_type"] = "url"
            doc.metadata["url"] = url
        
        return docs

    def load_from_pdf(self, file_path: str) -> List[Document]:
        """
        Load document from a PDF file.
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            List of loaded documents
        """
        loader = PyPDFLoader(file_path)
        docs = loader.load()
        
        # Add metadata
        for doc in docs:
            doc.metadata["source_type"] = "pdf"
            doc.metadata["file_name"] = Path(file_path).name
        
        return docs

    def load_from_docx(self, file_path: str) -> List[Document]:
        """
        Load document from a DOCX file.
        
        Args:
            file_path: Path to the DOCX file
            
        Returns:
            List of loaded documents
        """
        loader = Docx2txtLoader(file_path)
        docs = loader.load()
        
        # Add metadata
        for doc in docs:
            doc.metadata["source_type"] = "docx"
            doc.metadata["file_name"] = Path(file_path).name
        
        return docs

    def load_from_text(self, file_path: str) -> List[Document]:
        """
        Load document from a text file.
        
        Args:
            file_path: Path to the text file
            
        Returns:
            List of loaded documents
        """
        loader = TextLoader(file_path)
        docs = loader.load()
        
        # Add metadata
        for doc in docs:
            doc.metadata["source_type"] = "text"
            doc.metadata["file_name"] = Path(file_path).name
        
        return docs

    def load_from_string(self, content: str, metadata: Optional[Dict] = None) -> List[Document]:
        """
        Create a document from a string.
        
        Args:
            content: The text content
            metadata: Optional metadata dictionary
            
        Returns:
            List containing a single document
        """
        if metadata is None:
            metadata = {"source_type": "string"}
        else:
            metadata["source_type"] = "string"
        
        doc = Document(page_content=content, metadata=metadata)
        return [doc]

    def split_documents(self, documents: List[Document]) -> List[Document]:
        """
        Split documents into chunks.
        
        Args:
            documents: List of documents to split
            
        Returns:
            List of split document chunks
        """
        splits = self.text_splitter.split_documents(documents)
        return splits

    def index_documents(self, documents: List[Document]) -> Tuple[int, int]:
        """
        Index documents into the vector store.
        
        Args:
            documents: List of documents to index
            
        Returns:
            Tuple of (number of original documents, number of chunks)
        """
        # Split documents
        all_splits = self.split_documents(documents)
        
        # Create or update vector store
        if self.vector_store is None:
            self.vector_store = FAISS.from_documents(all_splits, self.embeddings)
        else:
            self.vector_store.add_documents(all_splits)
        
        # Keep track of indexed documents
        self.indexed_docs.extend(documents)
        
        return len(documents), len(all_splits)

    def similarity_search(
        self, 
        query: str, 
        k: int = 4,
        filter_dict: Optional[Dict] = None
    ) -> List[Document]:
        """
        Perform similarity search on indexed documents.
        
        Args:
            query: The search query
            k: Number of documents to return
            filter_dict: Optional metadata filter
            
        Returns:
            List of relevant documents
        """
        if self.vector_store is None:
            raise ValueError("No documents indexed yet. Please index documents first.")
        
        if filter_dict:
            results = self.vector_store.similarity_search(query, k=k, filter=filter_dict)
        else:
            results = self.vector_store.similarity_search(query, k=k)
        
        return results

    def query(
        self, 
        question: str, 
        k: int = 4,
        return_sources: bool = True
    ) -> Dict[str, Any]:
        """
        Query the RAG system with a question.
        
        Args:
            question: The question to ask
            k: Number of documents to retrieve
            return_sources: Whether to include source documents
            
        Returns:
            Dictionary with answer and optionally sources
        """
        if self.vector_store is None:
            raise ValueError("No documents indexed yet. Please index documents first.")
        
        # Retrieve relevant documents
        retrieved_docs = self.similarity_search(question, k=k)
        
        # Format context from retrieved documents
        context = "\n\n".join([
            f"Source {i+1} ({doc.metadata.get('source_type', 'unknown')}):\n{doc.page_content}"
            for i, doc in enumerate(retrieved_docs)
        ])
        
        # Create prompt
        prompt = f"""You are a helpful assistant. Answer the question based on the following context.
If the answer cannot be found in the context, say so clearly.

Context:
{context}

Question: {question}

Answer:"""
        
        # Get response from LLM
        response = self.llm.invoke(prompt)
        answer = response.content
        
        # Prepare result
        result = {
            "answer": answer,
            "question": question
        }
        
        if return_sources:
            result["sources"] = [
                {
                    "content": doc.page_content[:500] + "..." if len(doc.page_content) > 500 else doc.page_content,
                    "metadata": doc.metadata
                }
                for doc in retrieved_docs
            ]
        
        return result

    def create_rag_agent(self):
        """
        Create a RAG agent with tool-based retrieval.
        This allows for multi-step reasoning and multiple retrievals.
        
        Returns:
            Agent configured with retrieval tool
        """
        if self.vector_store is None:
            raise ValueError("No documents indexed yet. Please index documents first.")
        
        # Create retrieval tool
        @tool
        def retrieve_context(query: str) -> str:
            """Retrieve relevant information from the indexed documents to help answer questions."""
            retrieved_docs = self.vector_store.similarity_search(query, k=4)
            serialized = "\n\n".join(
                f"Source: {doc.metadata.get('source_type', 'unknown')}\nContent: {doc.page_content}"
                for doc in retrieved_docs
            )
            return serialized
        
        # Create agent
        tools = [retrieve_context]
        prompt = (
            "You are a helpful assistant with access to a document retrieval tool. "
            "Use the tool to find relevant information before answering questions. "
            "Always cite your sources when providing answers."
        )
        agent = create_agent(self.llm, tools, system_prompt=prompt)
        
        return agent

    def save_vector_store(self, path: str):
        """
        Save the vector store to disk.
        
        Args:
            path: Directory path to save the vector store
        """
        if self.vector_store is None:
            raise ValueError("No vector store to save.")
        
        self.vector_store.save_local(path)

    def load_vector_store(self, path: str):
        """
        Load a previously saved vector store from disk.
        
        Args:
            path: Directory path containing the saved vector store
        """
        self.vector_store = FAISS.load_local(
            path, 
            self.embeddings,
            allow_dangerous_deserialization=True
        )

    def get_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the indexed documents.
        
        Returns:
            Dictionary with statistics
        """
        if self.vector_store is None:
            return {
                "total_documents": 0,
                "total_chunks": 0,
                "is_indexed": False
            }
        
        return {
            "total_documents": len(self.indexed_docs),
            "total_chunks": self.vector_store.index.ntotal,
            "is_indexed": True,
            "embedding_dimension": self.vector_store.index.d
        }

    def clear_index(self):
        """Clear all indexed documents and reset the vector store."""
        self.vector_store = None
        self.indexed_docs = []
