import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

import QuizPage from './pages/QuizPage'          // ← ADD THIS
import FlashcardDashboard from './pages/FlashcardDashboard'
import FlashcardGeneratePage from './pages/FlashcardGeneratePage'
import FlashcardStudyPage from './pages/FlashcardStudyPage'
import PaperDashboard from './pages/PaperDashboard'
import PaperGeneratePage from './pages/PaperGeneratePage'
import PaperPreviewPage from './pages/PaperPreviewPage'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/flashcards" replace />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/quiz" element={<QuizPage />} />   {/* ← ADD THIS */}
        <Route path="/flashcards" element={<FlashcardDashboard />} />
        <Route path="/flashcards/new" element={<FlashcardGeneratePage />} />
        <Route path="/flashcards/:id" element={<FlashcardStudyPage />} />
        <Route path="/papers" element={<PaperDashboard />} />
        <Route path="/papers/new" element={<PaperGeneratePage />} />
        <Route path="/papers/:id" element={<PaperPreviewPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
