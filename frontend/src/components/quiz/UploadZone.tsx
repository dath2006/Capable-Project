import { useRef, useState } from 'react'

interface Props {
    file: File | null
    onFileSelect: (file: File) => void
    onFileRemove: () => void
    error: string
}

export default function UploadZone({ file, onFileSelect, onFileRemove, error }: Props) {
    const [dragOver, setDragOver] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFile = (f: File | undefined) => {
        if (!f) return
        const ext = f.name.split('.').pop()?.toLowerCase()
        if (!['pdf', 'docx'].includes(ext || '')) {
            alert('Only PDF and DOCX files are supported.')
            return
        }
        if (f.size > 10 * 1024 * 1024) {
            alert('File must be under 10 MB.')
            return
        }
        onFileSelect(f)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        handleFile(e.dataTransfer.files[0])
    }

    return (
        <div className="upload-section">
            <div className="section-label">01 — Upload Document</div>
            <div
                className={`upload-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !file && inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.docx"
                    style={{ display: 'none' }}
                    onChange={e => handleFile(e.target.files?.[0])}
                />

                {!file ? (
                    <>
                        <div className="upload-icon">⬆</div>
                        <div className="upload-title">Drop your file here</div>
                        <div className="upload-sub">
                            or click to browse — PDF &amp; DOCX supported · Max 10 MB
                        </div>
                    </>
                ) : (
                    <>
                        <div className="upload-icon">📄</div>
                        <div className="file-chip">
                            <span>{file.name}</span>
                            <button
                                onClick={e => { e.stopPropagation(); onFileRemove() }}
                                className="remove-btn"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="upload-sub" style={{ marginTop: 8 }}>
                            {(file.size / 1024).toFixed(1)} KB · click ✕ to change file
                        </div>
                    </>
                )}
            </div>

            {error && (
                <div className="error-box">
                    ⚠️ {error}
                </div>
            )}
        </div>
    )
}