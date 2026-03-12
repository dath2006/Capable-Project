import { useState } from 'react'
import UploadZone from '../components/quiz/UploadZone'
import DifficultySelector from '../components/quiz/DifficultySelector'
import QuestionCard from '../components/quiz/QuestionCard'
import ScoreScreen from '../components/quiz/ScoreScreen'
import './QuizPage.css'
import { generateQuiz } from '../services/quizApi'

interface QuizOption {
    label: string
    text: string
}

interface QuizQuestion {
    id: string
    question: string
    options: QuizOption[]
    correct_label: string
    explanation: string
    concept: string
    difficulty: string
}

interface QuizResponse {
    quiz_id: string
    title: string
    difficulty: string
    total_questions: number
    questions: QuizQuestion[]
}


type Stage = 'setup' | 'loading' | 'quiz' | 'result'

interface Answer {
    selectedLabel: string
    wasCorrect: boolean
}

export default function QuizPage() {
    // ── Setup state ───────────────────────────────────────────────────────────
    const [file, setFile] = useState<File | null>(null)
    const [difficulty, setDifficulty] = useState('medium')
    const [numQuestions, setNumQuestions] = useState(10)
    const [error, setError] = useState('')

    // ── Quiz state ────────────────────────────────────────────────────────────
    const [stage, setStage] = useState<Stage>('setup')
    const [quizData, setQuizData] = useState<QuizResponse | null>(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState<Answer[]>([])

    const sliderPct = ((numQuestions - 5) / 10) * 100

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!file) {
            setError('Please upload a document first.')
            return
        }
        setError('')
        setStage('loading')

        try {
            const data = await generateQuiz(file, difficulty, numQuestions)
            setQuizData(data)
            setCurrentIndex(0)
            setAnswers([])
            setStage('quiz')
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.')
            setStage('setup')
        }
    }

    const handleAnswer = (selectedLabel: string, wasCorrect: boolean) => {
        setAnswers(prev => [...prev, { selectedLabel, wasCorrect }])
    }

    const handleNext = () => {
        if (!quizData) return
        if (currentIndex < quizData.questions.length - 1) {
            setCurrentIndex(i => i + 1)
        } else {
            setStage('result')
        }
    }

    const handleRestart = () => {
        setStage('setup')
        setFile(null)
        setQuizData(null)
        setCurrentIndex(0)
        setAnswers([])
        setError('')
    }

    const correctCount = answers.filter(a => a.wasCorrect).length
    const currentQuestion = quizData?.questions[currentIndex]
    const isLastQuestion = quizData ? currentIndex === quizData.questions.length - 1 : false
    const currentAnswered = answers.length > currentIndex

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="quiz-page">
            <div className="quiz-inner">

                {/* Header */}
                <div className="quiz-header">
                    <div className="quiz-badge">📚 AI Quiz Generator</div>
                    <h1 className="quiz-title">
                        Turn any doc into a <span>smart quiz</span>
                    </h1>
                    <p className="quiz-subtitle">
                        Upload → Configure → Learn. Answers revealed only after submission.
                    </p>
                </div>

                {/* ── SETUP ─────────────────────────────────────────────── */}
                {stage === 'setup' && (
                    <div className="setup-card">
                        <UploadZone
                            file={file}
                            onFileSelect={setFile}
                            onFileRemove={() => setFile(null)}
                            error={error}
                        />

                        <DifficultySelector
                            selected={difficulty}
                            onChange={setDifficulty}
                        />

                        {/* Number of questions slider */}
                        <div className="slider-section">
                            <div className="section-label">03 — Number of Questions</div>
                            <div className="slider-row">
                                <div className="slider-value">{numQuestions}</div>
                                <div className="slider-wrap">
                                    <input
                                        type="range"
                                        min={5}
                                        max={15}
                                        value={numQuestions}
                                        style={{ '--pct': `${sliderPct}%` } as React.CSSProperties}
                                        onChange={e => setNumQuestions(Number(e.target.value))}
                                    />
                                    <div className="slider-labels">
                                        <span>5 min</span>
                                        <span>15 max</span>
                                    </div>
                                </div>
                            </div>
                            <p className="slider-hint">
                                Complex concepts are prioritised — broad coverage guaranteed.
                            </p>
                        </div>

                        <button
                            className="generate-btn"
                            onClick={handleGenerate}
                            disabled={!file}
                        >
                            Generate Quiz →
                        </button>
                    </div>
                )}

                {/* ── LOADING ───────────────────────────────────────────── */}
                {stage === 'loading' && (
                    <div className="loading-card">
                        <div className="loading-emoji">🧠</div>
                        <div className="loading-title">Generating your quiz...</div>
                        <div className="loading-sub">
                            Analysing document and crafting questions. This takes 15–30 seconds.
                        </div>
                        <div className="loading-bar-wrap">
                            <div className="loading-bar" />
                        </div>
                    </div>
                )}

                {/* ── QUIZ ──────────────────────────────────────────────── */}
                {stage === 'quiz' && quizData && currentQuestion && (
                    <div className="quiz-card">
                        <QuestionCard
                            key={currentQuestion.id}
                            question={currentQuestion}
                            questionNumber={currentIndex + 1}
                            totalQuestions={quizData.total_questions}
                            onAnswer={handleAnswer}
                        />

                        {/* Next / Finish button — appears after answer submitted */}
                        {currentAnswered && (
                            <button
                                className="next-btn"
                                onClick={handleNext}
                            >
                                {isLastQuestion ? 'View My Results 🏁' : 'Next Question →'}
                            </button>
                        )}
                    </div>
                )}

                {/* ── RESULT ────────────────────────────────────────────── */}
                {stage === 'result' && quizData && (
                    <ScoreScreen
                        quizId={quizData.quiz_id}
                        title={quizData.title}
                        difficulty={quizData.difficulty}
                        questions={quizData.questions}
                        correctCount={correctCount}
                        onRestart={handleRestart}
                    />
                )}

            </div>
        </div>
    )
}