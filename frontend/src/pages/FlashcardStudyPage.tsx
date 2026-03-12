import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { FlashcardDeck } from '../services/flashcardService';
import { flashcardService } from '../services/flashcardService';
import DashboardLayout from '../components/DashboardLayout';

export default function FlashcardStudyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSource, setShowSource] = useState(false);

  useEffect(() => {
    const fetchDeck = async () => {
      try {
        setLoading(true);
        if (id) {
          const data = await flashcardService.getDeck(parseInt(id, 10));
          setDeck(data);
        }
      } catch (err: any) {
        setError('Failed to load this flashcard deck');
        if (err.response?.status === 401) navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchDeck();
  }, [id, navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center flex-col items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading amazing flashcards...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !deck) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 text-red-600 p-4 rounded-lg shadow-sm border border-red-100 max-w-2xl mx-auto mt-8">
          {error || 'Deck not found'}
        </div>
        <div className="text-center mt-6">
          <button onClick={() => navigate('/flashcards')} className="text-indigo-600 font-medium hover:underline">
            &larr; Back to Decks
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!deck.flashcards || deck.flashcards.length === 0) {
    return (
      <DashboardLayout>
        <div className="text-center max-w-2xl mx-auto mt-12 bg-white p-10 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Deck Empty</h2>
          <p className="text-slate-500 mb-6">We couldn't generate any flashcards for this document. It might be too short or lack extractable concepts.</p>
          <button onClick={() => navigate('/flashcards')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            Back to Decks
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const currentCard = deck.flashcards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setShowSource(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % deck.flashcards.length);
    }, 200);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setShowSource(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + deck.flashcards.length) % deck.flashcards.length);
    }, 200);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setShowSource(false);
    
    setTimeout(() => {
      const shuffled = [...deck.flashcards].sort(() => Math.random() - 0.5);
      setDeck({ ...deck, flashcards: shuffled });
      setCurrentIndex(0);
    }, 200);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/flashcards')}
              className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="min-w-0 pr-4">
              <h1 className="text-2xl font-bold text-slate-900 truncate" title={deck.title}>{deck.title}</h1>
              <p className="text-sm text-slate-500 font-medium">Study Session • Card {currentIndex + 1} of {deck.flashcards.length}</p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-2">
            <button 
              onClick={handleShuffle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
              </svg>
              Shuffle
            </button>
          </div>
        </div>

        {/* Global CSS for 3D flip card */}
        <style dangerouslySetInnerHTML={{__html: `
          .perspective-1000 { perspective: 1000px; }
          .transform-style-3d { transform-style: preserve-3d; }
          .backface-hidden { backface-visibility: hidden; }
          .rotate-y-180 { transform: rotateY(180deg); }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 3px; }
        `}} />

        {/* Progress bar */}
        <div className="w-full bg-slate-200 rounded-full h-1.5 mb-8 overflow-hidden">
          <div 
            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / deck.flashcards.length) * 100}%` }}
          ></div>
        </div>

        {/* Flashcard Container */}
        <div className="perspective-1000 w-full mb-10" style={{ minHeight: '380px' }}>
          <div 
            className={`relative w-full h-full min-h-[380px] transition-transform duration-500 transform-style-3d cursor-pointer shadow-lg rounded-2xl ${isFlipped ? 'rotate-y-180' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front of card (Question) */}
            <div className="absolute inset-0 w-full h-full backface-hidden bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-center items-center text-center">
              <span className="absolute top-6 left-6 text-xs font-bold tracking-wider text-indigo-500 uppercase bg-indigo-50 px-2.5 py-1.5 rounded text-left">Question</span>
              <p className="text-2xl sm:text-3xl font-semibold text-slate-800 leading-tight max-w-2xl px-4 mt-8">{currentCard.question}</p>
              <span className="absolute bottom-6 text-sm text-slate-400 font-medium flex items-center gap-1.5">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                Click anywhere to reveal answer
              </span>
            </div>

            {/* Back of card (Answer) */}
            <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-8 flex flex-col justify-start">
              <div className="flex justify-between items-center w-full absolute top-6 left-0 px-6">
                <span className="text-xs font-bold tracking-wider text-indigo-700 uppercase bg-white border border-indigo-100 px-2.5 py-1.5 rounded shadow-sm">Answer</span>
              </div>
              
              <div className="h-full flex flex-col justify-center overflow-y-auto w-full pt-16 pb-16 custom-scrollbar">
                <p className="text-xl sm:text-2xl font-medium text-slate-800 leading-relaxed text-center px-4 max-w-2xl mx-auto">
                  {currentCard.answer}
                </p>
                
                {showSource && currentCard.chunk_source && (
                  <div className="mt-8 pt-6 border-t border-indigo-200 text-left animate-fade-in mx-auto w-full max-w-2xl">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Source Context
                    </h4>
                    <p className="text-sm text-slate-700 italic bg-white p-4 rounded-lg border border-indigo-100 leading-relaxed shadow-sm">"{currentCard.chunk_source}..."</p>
                  </div>
                )}
              </div>

              {!showSource && currentCard.chunk_source && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowSource(true); }}
                  className="absolute bottom-6 right-6 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors bg-white px-3 py-1.5 rounded-md shadow-sm border border-indigo-100 z-10 hover:shadow"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Context
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 w-full max-w-2xl mx-auto">
          <button 
            onClick={handlePrev}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium px-4 py-2 transition-colors focus:outline-none flex-1 sm:flex-none justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          
          <div className="flex gap-4 w-full sm:w-auto sm:flex-1 justify-center">
            {isFlipped && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 px-6 py-3 rounded-xl font-semibold transition-all focus:outline-none border border-rose-200 shadow-sm"
                >
                  Needs Review
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600 px-6 py-3 rounded-xl font-semibold transition-all focus:outline-none shadow-sm shadow-emerald-200"
                >
                  Got It
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </>
            )}
            
            {!isFlipped && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsFlipped(true); }}
                className="w-full sm:max-w-[280px] bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-3 rounded-xl font-semibold transition-all focus:outline-none shadow-sm shadow-indigo-200"
              >
                Reveal Answer
              </button>
            )}
          </div>

          <button 
            onClick={handleNext}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium px-4 py-2 transition-colors focus:outline-none flex-1 sm:flex-none justify-center"
          >
            Next
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Mobile controls */}
        <div className="sm:hidden mt-8 flex justify-center w-full">
           <button 
              onClick={handleShuffle}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 shadow-sm rounded-lg hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
              </svg>
              Shuffle Deck
            </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
