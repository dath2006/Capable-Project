const API = 'http://localhost:8000'

export interface QuizOption {
    label: string
    text: string
}

export interface QuizQuestion {
    id: string
    question: string
    options: QuizOption[]
    correct_label: string
    explanation: string
    concept: string
    difficulty: string
}

export interface QuizResponse {
    quiz_id: string
    title: string
    difficulty: string
    total_questions: number
    questions: QuizQuestion[]
}

export interface PDFDownloadRequest {
    quiz_id: string
    questions: QuizQuestion[]
    title: string
    difficulty: string
}

export async function generateQuiz(
    file: File,
    difficulty: string,
    numQuestions: number
): Promise<QuizResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('difficulty', difficulty)
    formData.append('num_questions', String(numQuestions))

    const res = await fetch(`${API}/api/quiz/generate`, {
        method: 'POST',
        body: formData,
    })

    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to generate quiz')
    }

    return res.json()
}

export async function downloadQuizPDF(payload: PDFDownloadRequest): Promise<void> {
    const res = await fetch(`${API}/api/quiz/download-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })

    if (!res.ok) {
        throw new Error('Failed to generate PDF')
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quiz_revision_${Date.now()}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}