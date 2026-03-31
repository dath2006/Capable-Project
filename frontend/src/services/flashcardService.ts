const API = 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export interface Flashcard {
  id: number;
  deck_id: number;
  question: string;
  answer: string;
  chunk_source?: string;
  next_review?: string;
  interval?: number;
  repetition?: number;
  efactor?: number;
}

export interface FlashcardDeck {
  id: number;
  title: string;
  source_filename: string;
  created_at: string;
  flashcards: Flashcard[];
}

export const flashcardService = {
  getDecks: async (): Promise<FlashcardDeck[]> => {
    const res = await fetch(`${API}/flashcards`, { headers: getAuthHeaders() });
    if (!res.ok) {
      if (res.status === 401) throw { response: { status: 401 } };
      throw new Error('Failed to fetch decks');
    }
    return res.json();
  },
  getDeck: async (id: number): Promise<FlashcardDeck> => {
    const res = await fetch(`${API}/flashcards/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      if (res.status === 401) throw { response: { status: 401 } };
      throw new Error('Failed to fetch deck');
    }
    return res.json();
  },
  deleteDeck: async (id: number): Promise<void> => {
    const res = await fetch(`${API}/flashcards/${id}`, { 
      method: 'DELETE',
      headers: getAuthHeaders() 
    });
    if (!res.ok) throw new Error('Failed to delete deck');
  },
  generateFlashcards: async (file: File): Promise<FlashcardDeck> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // For FormData, omit Content-Type header so browser boundary gets set
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const res = await fetch(`${API}/flashcards/generate`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw { response: { data: err, status: res.status } }; // Mimic axios error structure for components
    }
    return res.json();
  },
  getDueFlashcards: async (): Promise<Flashcard[]> => {
    const res = await fetch(`${API}/flashcards/due/all`, { headers: getAuthHeaders() });
    if (!res.ok) {
      if (res.status === 401) throw { response: { status: 401 } };
      throw new Error('Failed to fetch due flashcards');
    }
    return res.json();
  },
  reviewFlashcard: async (id: number, score: number): Promise<Flashcard> => {
    const res = await fetch(`${API}/flashcards/${id}/review`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ score })
    });
    if (!res.ok) {
      if (res.status === 401) throw { response: { status: 401 } };
      throw new Error('Failed to review flashcard');
    }
    return res.json();
  }
};
