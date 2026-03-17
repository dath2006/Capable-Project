import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { FlashcardDeck } from '../services/flashcardService';
import { flashcardService } from '../services/flashcardService';
import DashboardLayout from '../components/DashboardLayout';

export default function FlashcardDashboard() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const data = await flashcardService.getDecks();
      setDecks(data);
    } catch (err: any) {
      setError('Failed to load flashcard decks');
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this deck?')) return;
    try {
      await flashcardService.deleteDeck(id);
      setDecks(decks.filter(d => d.id !== id));
    } catch (err) {
      alert('Failed to delete deck');
    }
  };

  return (
    <DashboardLayout>
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-700 rounded-3xl p-8 sm:p-12 mb-10 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="max-w-xl">
            <h1 className="text-4xl font-extrabold tracking-tight mb-3">Your Study Hub</h1>
            <p className="text-indigo-100 text-lg">Master any topic with AI-generated flashcards. Review intelligently using spaced repetition.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link 
              to="/flashcards/due" 
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Study Due
            </Link>
            <Link 
              to="/flashcards/new" 
              className="bg-white text-indigo-700 hover:bg-slate-50 px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Magic
            </Link>
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -m-8 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-10 -m-8 w-40 h-40 bg-indigo-400 opacity-20 rounded-full blur-2xl"></div>
      </div>

      {error && <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-r-lg mb-8 shadow-sm flex items-center gap-3"><span className="text-xl">⚠️</span> {error}</div>}

      {loading ? (
        <div className="flex justify-center flex-col items-center h-48 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading your decks...</p>
        </div>
      ) : decks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No flashcard decks yet</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">Upload a document or PDF to automatically generate interactive flashcards using Gemini AI.</p>
          <Link to="/flashcards/new" className="text-indigo-600 font-medium hover:text-indigo-700 inline-flex items-center gap-1">
            Get started 
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-fade-in">
          {decks.map((deck) => (
            <div key={deck.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(99,102,241,0.12)] transition-all duration-300 hover:-translate-y-1 group flex flex-col overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400 to-indigo-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
              
              <div className="p-8 flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-600 flex items-center justify-center shadow-inner">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <button 
                    onClick={(e) => { e.preventDefault(); handleDelete(deck.id); }}
                    className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-2 hover:bg-rose-50 rounded-full"
                    title="Delete deck"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2" title={deck.title}>{deck.title}</h3>
                <p className="text-sm text-slate-500 mb-6 flex items-center gap-1.5 truncate" title={deck.source_filename}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {deck.source_filename}
                </p>
                
                <div className="flex items-center text-sm font-medium text-slate-600 bg-slate-50/80 rounded-lg py-2px px-4 inline-flex border border-slate-100">
                  <span className="text-indigo-600 text-lg mr-2 font-bold">{deck.flashcards ? deck.flashcards.length : 0}</span> cards
                </div>
              </div>
              
              <div className="px-8 pb-8 mt-auto">
                <Link 
                  to={`/flashcards/${deck.id}`} 
                  className="block w-full text-center bg-slate-50 text-indigo-700 hover:bg-indigo-600 hover:text-white py-3.5 rounded-xl font-bold transition-all duration-300"
                >
                  Start Studying
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
