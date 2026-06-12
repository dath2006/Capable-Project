import { API_BASE_URL, ApiError, apiRequest } from "../lib/api-client";
import { getAccessToken } from "../lib/auth";
import type { FlashcardDeck } from "./flashcardService";

export { ApiError };

export interface AdaptiveDifficulty {
  recommended: string;
  reason: string;
  average_score: number | null;
  attempt_count: number;
}

export interface LessonSummary {
  id: number;
  title: string;
  summary_text: string;
  audio_url: string;
  source_filename?: string;
  created_at: string;
}

export interface YouTubeTranscript {
  video_id: string;
  title: string;
  transcript: string;
  word_count: number;
  source_url: string;
}

export interface KhanSearchResult {
  query: string;
  results: Array<{ title: string; url: string; platform: string }>;
}

export interface DiagramAnalysis {
  analysis: string;
  ocr_text?: string;
  method: string;
}

export const advancedService = {
  getAdaptiveDifficulty: () =>
    apiRequest<AdaptiveDifficulty>("/api/quiz/adaptive-difficulty", {
      method: "GET",
      requiresAuth: true,
    }),

  createLessonFromFile: (file: File, title?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);
    return apiRequest<LessonSummary>("/api/lessons/summary", {
      method: "POST",
      body: formData,
      requiresAuth: true,
    });
  },

  listLessons: () =>
    apiRequest<LessonSummary[]>("/api/lessons", {
      method: "GET",
      requiresAuth: true,
    }),

  lessonAudioFullUrl: (audioUrl: string) =>
    `${API_BASE_URL}${audioUrl.startsWith("/") ? "" : "/"}${audioUrl}`,

  youtubeTranscript: (url: string) =>
    apiRequest<YouTubeTranscript>("/api/sources/youtube/transcript", {
      method: "POST",
      body: { url },
      requiresAuth: true,
    }),

  youtubeIndexToRag: (url: string) =>
    apiRequest<{ success: boolean; message: string; chunks: number }>(
      "/api/sources/youtube/index-to-rag",
      { method: "POST", body: { url }, requiresAuth: true },
    ),

  khanSearch: (query: string) =>
    apiRequest<KhanSearchResult>(
      `/api/sources/khan/search?q=${encodeURIComponent(query)}`,
      { method: "GET", requiresAuth: true },
    ),

  quizletImport: (title: string, cards: Array<Record<string, string>>) =>
    apiRequest<FlashcardDeck>("/api/sources/quizlet/import", {
      method: "POST",
      body: { title, cards },
      requiresAuth: true,
    }),

  analyzeDiagram: async (file: File): Promise<DiagramAnalysis> => {
    const formData = new FormData();
    formData.append("file", file);
    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/api/diagram/analyze`, {
      method: "POST",
      headers,
      body: formData,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && "detail" in payload
          ? String(payload.detail)
          : `Request failed (${response.status})`;
      throw new ApiError(message, response.status, payload);
    }
    return payload as DiagramAnalysis;
  },
};
