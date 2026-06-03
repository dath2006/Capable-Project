import { apiRequest } from "../lib/api-client";

interface RAGEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface RAGStats {
  total_documents: number;
  total_chunks: number;
  is_indexed: boolean;
  embedding_dimension: number;
}

export interface RAGSource {
  source: string;
  chunk_id?: string;
  content?: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface RAGQueryResponse {
  answer: string;
  question: string;
  sources: RAGSource[];
}

export interface RAGSearchResult {
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface RAGSearchResponse {
  query: string;
  results: RAGSearchResult[];
}

export interface RAGInitRequest {
  provider?: string;
  model_name?: string;
  api_key?: string;
}

export interface IndexTextRequest {
  content: string;
  metadata?: Record<string, unknown>;
}

export interface QueryRequest {
  question: string;
  k?: number;
  return_sources?: boolean;
}

export interface SearchRequest {
  query: string;
  k?: number;
  filter_dict?: Record<string, unknown>;
}

export const ragService = {
  init: (payload: RAGInitRequest) =>
    apiRequest<RAGEnvelope>("/api/rag/init", {
      method: "POST",
      body: payload,
    }),

  indexUrl: (url: string) =>
    apiRequest<RAGEnvelope>("/api/rag/index/url", {
      method: "POST",
      body: { url },
    }),

  indexFile: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest<RAGEnvelope>("/api/rag/index/file", {
      method: "POST",
      body: formData,
    });
  },

  indexText: (payload: IndexTextRequest) =>
    apiRequest<RAGEnvelope>("/api/rag/index/text", {
      method: "POST",
      body: payload,
    }),

  query: (payload: QueryRequest) =>
    apiRequest<RAGQueryResponse>("/api/rag/query", {
      method: "POST",
      body: payload,
    }),

  search: (payload: SearchRequest) =>
    apiRequest<RAGSearchResponse>("/api/rag/search", {
      method: "POST",
      body: payload,
    }),

  stats: () =>
    apiRequest<RAGStats>("/api/rag/stats", {
      method: "GET",
    }),

  clear: () =>
    apiRequest<RAGEnvelope>("/api/rag/clear", {
      method: "POST",
    }),

  save: (path: string) =>
    apiRequest<RAGEnvelope>("/api/rag/save", {
      method: "POST",
      body: new URLSearchParams({ path }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }),

  load: (path: string) =>
    apiRequest<RAGEnvelope>("/api/rag/load", {
      method: "POST",
      body: new URLSearchParams({ path }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }),
};
