import { apiRequest, ApiError } from "../lib/api-client";

export { ApiError };

export interface QuizAttempt {
  id: number;
  quiz_id: string;
  title: string;
  difficulty: string;
  total_questions: number;
  correct_count: number;
  score_percent: number;
  source_filename?: string;
  completed_at: string;
}

export interface ScoreTrendPoint {
  label: string;
  score_percent: number;
  completed_at: string;
}

export interface AnalyticsSummary {
  flashcards: {
    deck_count: number;
    card_count: number;
    due_count: number;
    reviews_last_7_days: number;
  };
  quiz: {
    attempt_count: number;
    average_score: number;
    best_score: number;
    recent_attempts: QuizAttempt[];
  };
  papers: {
    paper_count: number;
    total_questions: number;
    views_last_7_days: number;
  };
  score_trend: ScoreTrendPoint[];
}

export const analyticsService = {
  getSummary: () =>
    apiRequest<AnalyticsSummary>("/api/analytics/summary", {
      method: "GET",
      requiresAuth: true,
    }),
};
