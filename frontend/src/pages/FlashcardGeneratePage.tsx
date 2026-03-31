import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { flashcardService } from '../services/flashcardService';

export default function FlashcardGeneratePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFile = (selectedFile: File) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.md')) {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please upload a PDF, DOCX, or TXT file.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const deck = await flashcardService.generateFlashcards(file);
      navigate(`/flashcards/${deck.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred during generation. Check API keys and backend.');
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto animate-fade-in relative">
        <div className="absolute top-0 right-0 -mr-20 w-96 h-96 bg-violet-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-40 left-0 -ml-20 w-72 h-72 bg-indigo-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="mb-8 hover:transform hover:-translate-x-1 transition-transform inline-block cursor-pointer" onClick={() => navigate('/flashcards')}>
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 font-medium px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Study Hub
            </div>
          </div>
          
          <div className="mb-10 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-700 mb-4 tracking-tight">Generate Magic Decks</h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Upload your study materials (PDF, DOCX, or TXT) and let our AI instantly extract key concepts into a personalized flashcard deck.</p>
          </div>
        </div>


        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 shadow-sm border border-red-100 flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200/60 overflow-hidden relative z-10">
          <div className="p-8 md:p-12">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !file && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 relative overflow-hidden ${
                !file ? 'cursor-pointer hover:border-indigo-400 hover:bg-slate-50/50 hover:shadow-inner' : ''
              } ${
                isDragActive ? 'border-indigo-500 bg-indigo-50/80 scale-[1.02] shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]' : 
                file ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-300'
              }`}
            >
              {isDragActive && <div className="absolute inset-0 bg-indigo-500/5 animate-pulse"></div>}
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])}
                accept=".pdf,.docx,.txt,.md"
                className="hidden" 
              />
              
              {file ? (
                <div className="flex flex-col items-center relative z-10 animate-fade-in">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-emerald-100 transform -rotate-3">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">File Selected</h3>
                  <p className="text-slate-600 font-medium mb-1 text-lg">{file.name}</p>
                  <p className="text-slate-400 text-sm mb-6 font-semibold uppercase tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="text-sm text-rose-500 hover:text-white font-bold px-5 py-2.5 rounded-xl border border-rose-200 hover:bg-rose-500 hover:border-rose-500 transition-all shadow-sm"
                    disabled={loading}
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center relative z-10">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-500 rounded-2xl flex items-center justify-center transform group-hover:-translate-y-2 transition-transform shadow-inner border border-indigo-100/50 rotate-3">
                      <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Drop it like it's hot</h3>
                  <p className="text-slate-500 mb-4 text-lg">or <span className="text-indigo-600 font-semibold underline decoration-2 underline-offset-4 cursor-pointer">click to browse</span> your files</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded bg-white border border-slate-200">PDF</span>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded bg-white border border-slate-200">DOCX</span>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded bg-white border border-slate-200">TXT</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row justify-between items-center gap-6">
              <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Processing uses secure AI analysis
              </p>
              <button
                onClick={handleGenerate}
                disabled={!file || loading}
                className={`flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all w-full sm:w-auto ${
                  !file || loading ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Extracting Knowledge...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Magic Deck
                  </>
                )}
              </button>
            </div>
            {loading && (
              <div className="mt-6 p-4 rounded-lg bg-indigo-50 border border-indigo-100 flex items-start gap-3">
                <svg className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-indigo-900 mb-1">Processing your document...</h4>
                  <p className="text-sm text-indigo-700">This may take 1-3 minutes depending on document length. Our AI is extracting the most important concepts for your flashcards.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
