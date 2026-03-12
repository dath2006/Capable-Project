
import { useState } from 'react'

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

interface Props {
    question: QuizQuestion
    questionNumber: number
    totalQuestions: number
    onAnswer: (selectedLabel: string, wasCorrect: boolean) => void
}

export default function QuestionCard({ question, questionNumber, totalQuestions, onAnswer }: Props) {
    const [selected, setSelected] = useState<string | null>(null)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = () => {
        if (!selected) return
        setSubmitted(true)
        onAnswer(selected, selected === question.correct_label)
    }

    const getOptionStyle = (label: string) => {
        if (!submitted) {
            return selected === label ? 'option-btn selected' : 'option-btn'
        }
        if (label === question.correct_label) return 'option-btn correct'
        if (label === selected && selected !== question.correct_label) return 'option-btn wrong'
        return 'option-btn dimmed'
    }

    const diffColors: Record<string, string> = {
        easy: '#22c55e',
        medium: '#f59e0b',
        hard: '#ef4444',
    }

    return (
        <div className="question-card">
            {/* Progress */}
            <div className="progress-header">
                <span className="progress-title">Question {questionNumber} of {totalQuestions}</span>
                <span className="progress-fraction">{questionNumber}/{totalQuestions}</span>
            </div>
            <div className="progress-bar-wrap">
                <div
                    className="progress-bar"
                    style={{ width: `${((questionNumber - 1) / totalQuestions) * 100}%` }}
                />
            </div>

            {/* Meta tags */}
            <div className="question-meta">
                <span className="q-number-tag">Q{questionNumber}</span>
                <span className="q-concept-tag">{question.concept}</span>
                <span
                    className="q-diff-tag"
                    style={{ color: diffColors[question.difficulty] || '#6366f1' }}
                >
                    {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                </span>
            </div>

            {/* Question text */}
            <div className="question-text">{question.question}</div>

            {/* Options */}
            <div className="options-list">
                {question.options.map(opt => (
                    <button
                        key={opt.label}
                        className={getOptionStyle(opt.label)}
                        onClick={() => { if (!submitted) setSelected(opt.label) }}
                        disabled={submitted}
                    >
                        <span className="opt-label">{opt.label}</span>
                        <span className="opt-text">{opt.text}</span>
                        {submitted && opt.label === question.correct_label && (
                            <span className="opt-icon">✓</span>
                        )}
                        {submitted && opt.label === selected && selected !== question.correct_label && (
                            <span className="opt-icon">✗</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Result feedback */}
            {submitted && (
                <div className={`result-feedback ${selected === question.correct_label ? 'correct' : 'wrong'}`}>
                    {selected === question.correct_label
                        ? '✓ Correct! Well done.'
                        : `✗ Incorrect — correct answer is ${question.correct_label}`
                    }
                </div>
            )}

            {/* Explanation — only shown after submit */}
            {submitted && (
                <div className="explanation-box">
                    <div className="explanation-label">💡 Explanation</div>
                    <div className="explanation-text">{question.explanation}</div>
                </div>
            )}

            {/* Submit button */}
            {!submitted && (
                <button
                    className="submit-btn"
                    onClick={handleSubmit}
                    disabled={!selected}
                >
                    Submit Answer
                </button>
            )}
        </div>
    )
}