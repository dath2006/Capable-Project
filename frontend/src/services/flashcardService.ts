import { ApiError, apiRequest } from '../lib/api-client'

export interface Flashcard {
  id: number
  deck_id: number
  question: string
  answer: string
  chunk_source?: string
  next_review?: string
  interval?: number
  repetition?: number
  efactor?: number
}

export interface FlashcardDeck {
  id: number
  title: string
  source_filename: string
  created_at: string
  flashcards: Flashcard[]
}

export const flashcardService = {
  getDecks: () =>
    apiRequest<FlashcardDeck[]>('/api/flashcards', {
      method: 'GET',
      requiresAuth: true,
    }),

  getDeck: (id: number) =>
    apiRequest<FlashcardDeck>(`/api/flashcards/${id}`, {
      method: 'GET',
      requiresAuth: true,
    }),

  deleteDeck: (id: number) =>
    apiRequest<{ message: string }>(`/api/flashcards/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
    }),

  generateFlashcards: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    return apiRequest<FlashcardDeck>('/api/flashcards/generate', {
      method: 'POST',
      body: formData,
      requiresAuth: true,
    })
  },

  getDueFlashcards: () =>
    apiRequest<Flashcard[]>('/api/flashcards/due/all', {
      method: 'GET',
      requiresAuth: true,
    }),

  reviewFlashcard: (id: number, score: number) =>
    apiRequest<Flashcard>(`/api/flashcards/${id}/review`, {
      method: 'POST',
      body: { score },
      requiresAuth: true,
    }),
}

export { ApiError }
