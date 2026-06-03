import { ApiError, apiRequest, API_BASE_URL } from '../lib/api-client'

export interface SectionConfig {
  type: string
  count: number
  marks_per_question: number
}

export interface PaperGenerateRequest {
  title: string
  total_marks: number
  duration_minutes: number
  difficulty: string
  target_audience: string
  topic_focus: string[]
  sections: SectionConfig[]
}

export interface AnswerKey {
  id: number
  paper_id: number
  question_id: number
  correct_answer: string
  explanation?: string
}

export interface Question {
  id: number
  section_id: number
  question_text: string
  answer: string
  options?: string
  difficulty: string
  source_chunk?: string
  marks: number
  answer_key?: AnswerKey
}

export interface PaperSection {
  id: number
  paper_id: number
  section_type: string
  marks_per_question: number
  order_index: number
  questions: Question[]
}

export interface QuestionPaper {
  id: number
  user_id: number
  title: string
  source_filename: string
  total_marks: number
  duration_minutes: number
  difficulty: string
  target_audience: string
  created_at: string
  sections: PaperSection[]
}

export const paperService = {
  getPapers: () =>
    apiRequest<QuestionPaper[]>('/api/papers', {
      method: 'GET',
      requiresAuth: true,
    }),

  getPaper: (id: number) =>
    apiRequest<QuestionPaper>(`/api/papers/${id}`, {
      method: 'GET',
      requiresAuth: true,
    }),

  deletePaper: (id: number) =>
    apiRequest<{ message: string }>(`/api/papers/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
    }),

  generatePaper: (file: File, config: PaperGenerateRequest) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('payload', JSON.stringify(config))

    return apiRequest<QuestionPaper>('/api/papers/generate', {
      method: 'POST',
      body: formData,
      requiresAuth: true,
    })
  },

  regenerateQuestion: (paperId: number, questionId: number) =>
    apiRequest<Question>(`/api/papers/${paperId}/questions/${questionId}/regenerate`, {
      method: 'POST',
      requiresAuth: true,
    }),

  exportPaperUrl: (paperId: number, format: string, type: string) => {
    const params = new URLSearchParams({ format, type })
    return `${API_BASE_URL}/api/papers/${paperId}/export?${params.toString()}`
  },
}

export { ApiError }
