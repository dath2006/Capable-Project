import { useState } from 'react'
import { downloadQuizPDF } from '../../services/quizApi'

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
    quizId: string
    title: string
    difficulty: string
    questions: QuizQuestion[]
    correctCount: number
    onRestart: () => void
}

export default function ScoreScreen({ quizId, title, difficulty, questions, correctCount, onRestart }: Props) {
    const [downloading, setDownloading] = useState(false)
    const [downloadError, setDownloadError] = useState('')

    const total = questions.length
    const pct = Math.round((correctCount / total) * 100)

    const getScoreColor = () => {
        if (pct >= 80) return '#22c55e'
        if (pct >= 50) return '#f59e0b'
        return '#ef4444'
    }

    const getScoreMessage = () => {
        if (pct === 100) return '🏆 Perfect score! Outstanding!'
        if (pct >= 80) return '🎉 Excellent work! Well done!'
        if (pct >= 60) return '👍 Good effort! Keep it up.'
        if (pct >= 40) return '📚 Keep studying — you will get there!'
        return '💪 Don\'t give up! Review and retry.'
    }

    const handleDownload = async () => {
        setDownloading(true)
        setDownloadError('')
        try {
            await downloadQuizPDF({ quiz_id: quizId, questions, title, difficulty })
        } catch (err) {
            setDownloadError('PDF download failed. Please try again.')
        } finally {
            setDownloading(false)
        }
    }

    return (
        <div className="score-screen">
            {/* Trophy */}
            <div className="trophy-wrap">🏆</div>

            {/* Score */}
            <div className="score-pct" style={{ color: getScoreColor() }}>
                {pct}%
            </div>
            <div className="score-label">Quiz Complete</div>
            <div className="score-fraction">
                {correctCount} of {total} correct
            </div>

            {/* Message */}
            <div className="score-message">{getScoreMessage()}</div>

            {/* Breakdown */}
            <div className="score-breakdown">
                <div className="score-stat">
                    <div className="score-stat-num" style={{ color: '#22c55e' }}>
                        {correctCount}
                    </div>
                    <div className="score-stat-label">Correct</div>
                </div>
                <div className="score-stat">
                    <div className="score-stat-num" style={{ color: '#ef4444' }}>
                        {total - correctCount}
                    </div>
                    <div className="score-stat-label">Incorrect</div>
                </div>
            </div>

            {/* Download error */}
            {downloadError && (
                <div className="error-box">{downloadError}</div>
            )}

            {/* Actions */}
            <div className="action-row">
                <button
                    className="download-btn"
                    onClick={handleDownload}
                    disabled={downloading}
                >
                    {downloading ? 'Generating PDF...' : '⬇ Download Revision PDF'}
                </button>
                <button className="restart-btn" onClick={onRestart}>
                    ↺ Take Another Quiz
                </button>
            </div>
        </div>
    )
}