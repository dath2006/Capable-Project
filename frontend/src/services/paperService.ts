export interface SectionConfig {
  type: string;
  count: number;
  marks_per_question: number;
}

export interface PaperGenerateRequest {
  title: string;
  total_marks: number;
  duration_minutes: number;
  difficulty: string;
  target_audience: string;
  topic_focus: string[];
  sections: SectionConfig[];
}

export interface AnswerKey {
  id: number;
  paper_id: number;
  question_id: number;
  correct_answer: string;
  explanation?: string;
}

export interface Question {
  id: number;
  section_id: number;
  question_text: string;
  answer: string;
  options?: string;
  difficulty: string;
  source_chunk?: string;
  marks: number;
  answer_key?: AnswerKey;
}

export interface PaperSection {
  id: number;
  paper_id: number;
  section_type: string;
  marks_per_question: number;
  order_index: number;
  questions: Question[];
}

export interface QuestionPaper {
  id: number;
  user_id: number;
  title: string;
  source_filename: string;
  total_marks: number;
  duration_minutes: number;
  difficulty: string;
  target_audience: string;
  created_at: string;
  sections: PaperSection[];
}

const API = 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const paperService = {
  getPapers: async (): Promise<QuestionPaper[]> => {
    const res = await fetch(`${API}/papers`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch papers');
    return res.json();
  },

  getPaper: async (id: number): Promise<QuestionPaper> => {
    const res = await fetch(`${API}/papers/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch paper');
    return res.json();
  },

  deletePaper: async (id: number): Promise<void> => {
    const res = await fetch(`${API}/papers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete paper');
  },

  generatePaper: async (file: File, config: PaperGenerateRequest): Promise<QuestionPaper> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('payload', JSON.stringify(config));
    
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const res = await fetch(`${API}/papers/generate`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw { response: { data: err, status: res.status } };
    }
    return res.json();
  },

  regenerateQuestion: async (paperId: number, questionId: number): Promise<Question> => {
    const res = await fetch(`${API}/papers/${paperId}/questions/${questionId}/regenerate`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to regenerate question');
    return res.json();
  },

  exportPaperUrl: (paperId: number, format: string, type: string) => {
    return `${API}/papers/${paperId}/export?format=${format}&type=${type}`;
  }
};
