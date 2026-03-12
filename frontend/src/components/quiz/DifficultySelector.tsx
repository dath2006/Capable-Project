interface Props {
    selected: string
    onChange: (difficulty: string) => void
}

const difficulties = [
    {
        key: 'easy',
        label: 'Easy',
        desc: 'Definitions & basic recall',
        color: '#22c55e',
        bg: '#f0fdf4',
        border: '#86efac',
    },
    {
        key: 'medium',
        label: 'Medium',
        desc: 'Application & understanding',
        color: '#f59e0b',
        bg: '#fffbeb',
        border: '#fcd34d',
    },
    {
        key: 'hard',
        label: 'Hard',
        desc: 'Analysis & deep reasoning',
        color: '#ef4444',
        bg: '#fef2f2',
        border: '#fca5a5',
    },
]

export default function DifficultySelector({ selected, onChange }: Props) {
    return (
        <div className="difficulty-section">
            <div className="section-label">02 — Select Difficulty</div>
            <div className="difficulty-grid">
                {difficulties.map(d => (
                    <button
                        key={d.key}
                        className={`difficulty-btn ${selected === d.key ? 'selected' : ''}`}
                        style={selected === d.key ? {
                            borderColor: d.color,
                            background: d.bg,
                            color: d.color,
                        } : {}}
                        onClick={() => onChange(d.key)}
                    >
                        <div className="diff-label">{d.label}</div>
                        <div className="diff-desc">{d.desc}</div>
                    </button>
                ))}
            </div>
        </div>
    )
}