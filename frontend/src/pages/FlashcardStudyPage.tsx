import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { FlashcardDeck } from '../services/flashcardService';
import { flashcardService } from '../services/flashcardService';
import { ttsService } from '../services/ttsService';
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

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setIsListening(false);
        // If they speak the answer while it's flipped or we can match keywords, but keeping it simple: just show an alert or automatically reveal/score.
        // For here, just flip the card when they speak, acting as a voice trigger
        if (!isFlippedRef.current) {
          setIsFlipped(true);
        } else {
           // Basic mapping voice commands to scores
           if (transcript.includes('easy') || transcript.includes('got it')) handleScore(5);
           else if (transcript.includes('hard') || transcript.includes('review')) handleScore(1);
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  // We need a ref for the flipped state to use inside the recognition callback
  const isFlippedRef = useRef(isFlipped);
  useEffect(() => { isFlippedRef.current = isFlipped; }, [isFlipped]);

  useEffect(() => {
    const fetchDeck = async () => {
      try {
        setLoading(true);
        if (id === 'due') {
          const cards = await flashcardService.getDueFlashcards();
          setDeck({
            id: 0,
            title: "Due Fast Review",
            source_filename: "Spaced Repetition Algorithm",
            created_at: new Date().toISOString(),
            flashcards: cards
          });
        } else if (id) {
          const data = await flashcardService.getDeck(parseInt(id, 10));
          setDeck(data);
        }
      } catch (err: any) {
        setError('Failed to load flashcards');
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
    ttsService.stop();
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % deck.flashcards.length);
    }, 200);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setShowSource(false);
    ttsService.stop();
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + deck.flashcards.length) % deck.flashcards.length);
    }, 200);
  };

  const handleScore = async (score: number) => {
    try {
      await flashcardService.reviewFlashcard(currentCard.id, score);
    } catch (e) {
      console.error("Failed to submit score", e);
    }
    // Remove the card if we're in 'due' mode and it's handled properly
    if (id === 'due') {
      const updatedCards = deck.flashcards.filter((_, idx) => idx !== currentIndex);
      if (updatedCards.length === 0) {
        setDeck({ ...deck, flashcards: [] });
      } else {
        setDeck({ ...deck, flashcards: updatedCards });
        // Stay on current index, but limit to new length
        setIsFlipped(false);
        setShowSource(false);
        ttsService.stop();
        setCurrentIndex(prev => prev >= updatedCards.length ? 0 : prev);
      }
    } else {
      handleNext();
    }
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setShowSource(false);
    ttsService.stop();
    
    setTimeout(() => {
      const shuffled = [...deck.flashcards].sort(() => Math.random() - 0.5);
      setDeck({ ...deck, flashcards: shuffled });
      setCurrentIndex(0);
    }, 200);
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Voice input not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const playTTS = (text: string) => {
    ttsService.speak(text);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/flashcards')}
              className="w-12 h-12 flex flex-shrink-0 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="min-w-0 pr-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-700 truncate" title={deck.title}>{deck.title}</h1>
              <p className="text-sm sm:text-base text-slate-500 font-medium flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Study Session {/* Card {currentIndex + 1} of {deck.flashcards.length} */}
              </p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-3">
            <button 
              onClick={toggleVoiceInput}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all shadow-sm border ${isListening ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'}`}
              title="Voice Controls: Say 'Flip' or 'Got it' / 'Review'"
            >
              <div className="relative">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-14 0m14 0V8m0 0a7 7 0 00-14 0v3m14 0a7 7 0 01-14 0m7 4v3m-3 0h6M12 4a3 3 0 00-3 3v4a3 3 0 006 0V7a3 3 0 00-3-3z" />
                </svg>
                {isListening && <span className="absolute top-0 right-0 -mt-1 -mr-1 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>}
              </div>
              {isListening ? 'Listening' : 'Voice Agent'}
            </button>
            <button 
              onClick={handleShuffle}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
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
        <div className="w-full bg-slate-100/80 backdrop-blur-sm rounded-full h-2.5 mb-8 overflow-hidden shadow-inner border border-slate-200/50">
          <div 
            className="bg-gradient-to-r from-violet-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${((currentIndex + 1) / deck.flashcards.length) * 100}%` }}
          >
            <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 blur-md translate-x-1/2"></div>
          </div>
        </div>
        
        <div className="text-center mb-4 text-sm font-bold text-slate-400">
          CARD {currentIndex + 1} OF {deck.flashcards.length}
        </div>

        {/* Flashcard Container */}
        <div className="perspective-1000 w-full mb-10" style={{ minHeight: '420px' }}>
          <div 
            className={`relative w-full h-full min-h-[420px] transition-transform duration-700 ease-in-out transform-style-3d cursor-pointer shadow-2xl rounded-3xl ${isFlipped ? 'rotate-y-180' : 'hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(99,102,241,0.15)]'}`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front of card (Question) */}
            <div className="absolute inset-0 w-full h-full backface-hidden bg-white border border-slate-100 rounded-3xl p-10 flex flex-col justify-center items-center text-center">
              <span className="absolute top-8 left-8 text-[11px] font-bold tracking-widest text-indigo-400 uppercase bg-indigo-50/50 border border-indigo-100/50 px-3 py-1.5 rounded-full text-left">Question</span>
              <button 
                onClick={(e) => { e.stopPropagation(); playTTS(currentCard.question); }}
                className="absolute top-6 right-6 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all p-3 rounded-full"
                title="Listen to question"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.49 9.49 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.56.276 2.56-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                   <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                </svg>
              </button>
              
              <div className="w-20 h-20 mb-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <span className="text-4xl text-indigo-400">🤔</span>
              </div>
              
              <p className="text-2xl sm:text-4xl font-bold text-slate-800 leading-snug max-w-2xl px-4">{currentCard.question}</p>
              
              <span className="absolute bottom-8 text-sm text-slate-400 font-semibold flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                Tap anywhere to reveal answer
              </span>
            </div>

            {/* Back of card (Answer) */}
            <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 shadow-[inset_0_0_100px_rgba(0,0,0,0.2)] rounded-3xl p-10 flex flex-col justify-start text-white border-2 border-indigo-400/30">
              <div className="flex justify-between items-center w-full absolute top-8 left-0 px-8">
                <span className="text-[11px] font-bold tracking-widest text-indigo-100 uppercase bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-full shadow-sm">Answer & Explanation</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); playTTS(currentCard.answer); }}
                  className="text-indigo-200 hover:text-white hover:bg-white/10 transition-all p-3 rounded-full backdrop-blur-sm"
                  title="Listen to answer"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.49 9.49 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.56.276 2.56-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                     <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                  </svg>
                </button>
              </div>
              
              <div className="h-full flex flex-col justify-center overflow-y-auto w-full pt-16 pb-16 custom-scrollbar text-white">
                <div className="bg-white/5 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/10 mx-auto w-full max-w-2xl">
                  <p className="text-xl sm:text-2xl font-medium leading-relaxed text-center">
                    {currentCard.answer}
                  </p>
                </div>
                
                {showSource && currentCard.chunk_source && (
                  <div className="mt-8 pt-6 border-t border-white/10 text-left animate-fade-in mx-auto w-full max-w-2xl">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Original Context Reference
                    </h4>
                    <p className="text-sm text-indigo-100 italic bg-black/20 p-5 rounded-xl border border-white/5 leading-relaxed shadow-inner">"{currentCard.chunk_source}..."</p>
                  </div>
                )}
              </div>

              {!showSource && currentCard.chunk_source && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowSource(true); }}
                  className="absolute bottom-8 right-8 text-sm text-white hover:text-indigo-200 font-bold flex items-center gap-2 transition-all bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-white/10 z-10 hover:scale-105 backdrop-blur-md"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Reveal Context
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 w-full max-w-2xl mx-auto">
          <button 
            onClick={handlePrev}
            className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm flex-shrink-0"
            title="Previous Card"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex gap-4 w-full sm:flex-1 justify-center">            {isFlipped && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleScore(1); }}
                  className="flex-1 flex flex-col items-center justify-center gap-1 bg-white border-2 border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-300 py-3 rounded-2xl font-bold transition-all focus:outline-none shadow-sm shadow-rose-100/50 hover:scale-[1.02]"
                >
                  <span className="text-xl">😓</span>
                  Hard (Need Review)
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleScore(5); }}
                  className="flex-1 flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-emerald-400 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-600 py-3 rounded-2xl font-bold transition-all focus:outline-none shadow-lg shadow-emerald-200 hover:scale-[1.02] border border-emerald-500"
                >
                  <span className="text-xl">😎</span>
                  Easy (Got It)
                </button>
              </>
            )}
            
            {!isFlipped && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsFlipped(true); }}
                className="w-full bg-gradient-to-b from-indigo-500 to-indigo-700 text-white hover:from-indigo-600 hover:to-indigo-800 py-4 rounded-2xl font-extrabold text-lg transition-all focus:outline-none shadow-lg shadow-indigo-200 hover:scale-[1.02]"
              >
                Reveal Answer Mode
              </button>
            )}
          </div>

          <button 
            onClick={handleNext}
            className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm flex-shrink-0"
            title="Next Card"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
