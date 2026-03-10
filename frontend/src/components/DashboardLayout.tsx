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
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 
              onClick={() => navigate('/flashcards')}
              className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer"
            >
              Capable
            </h1>
            <nav className="hidden md:flex space-x-2 ml-6">
              <Link to="/flashcards" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors px-3 py-2 rounded-md hover:bg-slate-50">
                Flashcards
              </Link>
              <Link to="/papers" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors px-3 py-2 rounded-md hover:bg-slate-50">
                Question Papers
              </Link>
            </nav>
          </div>
          <button 
            onClick={handleLogout}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
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
