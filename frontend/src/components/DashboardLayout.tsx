import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 w-full shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex flex-row items-center justify-between w-full">
          <div className="flex items-center gap-8">
            <h1 
              onClick={() => navigate('/flashcards')}
              className="text-2xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer tracking-tight hover:opacity-80 transition-opacity"
            >
              Capable
            </h1>
            <nav className="hidden md:flex items-center gap-2">
              <Link to="/flashcards" className="text-slate-600 hover:text-indigo-600 font-semibold transition-colors px-4 py-2 rounded-lg hover:bg-indigo-50/50">
                Flashcards
              </Link>
              <Link to="/papers" className="text-slate-600 hover:text-indigo-600 font-semibold transition-colors px-4 py-2 rounded-lg hover:bg-indigo-50/50">
                Question Papers
              </Link>
            </nav>
          </div>
          <button 
            onClick={handleLogout}
            className="text-sm font-semibold text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
