import { getAccessToken } from "../lib/auth";
import { API_BASE_URL, ApiError, apiRequest } from "../lib/api-client";

export { ApiError };

export interface QuizOption {
  label: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correct_label: string;
  explanation: string;
  concept: string;
  difficulty: string;
}

export interface QuizResponse {
  quiz_id: string;
  title: string;
  difficulty: string;
  total_questions: number;
  questions: QuizQuestion[];
  adaptive_applied?: boolean;
  adaptive_reason?: string | null;
}

export interface PDFDownloadRequest {
  quiz_id: string;
  questions: QuizQuestion[];
  title: string;
  difficulty: string;
}

export interface QuizAttemptCreate {
  quiz_id: string;
  title: string;
  difficulty: string;
  total_questions: number;
  correct_count: number;
  source_filename?: string;
}

export interface QuizAttempt {
  id: number;
  quiz_id: string;
  title: string;
  difficulty: string;
  total_questions: number;
  correct_count: number;
  score_percent: number;
  completed_at: string;
}

export const quizService = {
  generate: (
    file: File,
    difficulty: string,
    numQuestions: number,
    useAdaptive = false,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("difficulty", difficulty);
    formData.append("num_questions", String(numQuestions));
    formData.append("use_adaptive", String(useAdaptive));

    return apiRequest<QuizResponse>("/api/quiz/generate", {
      method: "POST",
      body: formData,
      requiresAuth: true,
    });
  },

  recordAttempt: (payload: QuizAttemptCreate) =>
    apiRequest<QuizAttempt>("/api/quiz/attempts", {
      method: "POST",
      body: payload,
      requiresAuth: true,
    }),

  downloadPDF: async (payload: PDFDownloadRequest): Promise<void> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/api/quiz/download-pdf`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to generate PDF");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `quiz_revision_${Date.now()}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  },
};
