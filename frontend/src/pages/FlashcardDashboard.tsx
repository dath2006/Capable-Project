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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Your Flashcard Decks</h1>
          <p className="text-slate-500 text-sm">Review your generated flashcards or create a new deck.</p>
        </div>
        <Link 
          to="/flashcards/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all hover:shadow flex items-center gap-2 flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Generate New
        </Link>
      </div>

      {error && <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg mb-6 shadow-sm">{error}</div>}

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {decks.map((deck) => (
            <div key={deck.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <button 
                    onClick={(e) => { e.preventDefault(); handleDelete(deck.id); }}
                    className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete deck"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1 truncate" title={deck.title}>{deck.title}</h3>
                <p className="text-sm text-slate-500 mb-4 truncate" title={deck.source_filename}>Source: {deck.source_filename}</p>
                <div className="flex items-center text-sm text-slate-600 bg-slate-50 rounded-md py-2 px-3 mb-6 inline-block">
                  <span className="font-semibold text-indigo-600 mr-1.5">{deck.flashcards ? deck.flashcards.length : 0}</span> cards generated
                </div>
              </div>
              <div className="px-6 pb-6 mt-auto">
                <Link 
                  to={`/flashcards/${deck.id}`} 
                  className="block w-full text-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-2.5 rounded-lg font-medium transition-colors"
                >
                  Study Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
