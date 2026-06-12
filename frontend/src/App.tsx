import "./App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AnalyticsDashboardPage from "./pages/AnalyticsDashboardPage";
import LessonsPage from "./pages/LessonsPage";
import SourcesPage from "./pages/SourcesPage";
import FlashcardDashboard from "./pages/FlashcardDashboard";
import FlashcardGeneratePage from "./pages/FlashcardGeneratePage";
import FlashcardStudyPage from "./pages/FlashcardStudyPage";
import LoginPage from "./pages/LoginPage";
import PaperDashboard from "./pages/PaperDashboard";
import PaperGeneratePage from "./pages/PaperGeneratePage";
import PaperPreviewPage from "./pages/PaperPreviewPage";
import QuizPage from "./pages/QuizPage";
import RAGWorkspacePage from "./pages/RAGWorkspacePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SignupPage from "./pages/SignupPage";
import { isAuthenticated } from "./lib/auth";

function HomeRedirect() {
  return (
    <Navigate
      to={isAuthenticated() ? "/dashboard" : "/login"}
      replace
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AnalyticsDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flashcards"
          element={
            <ProtectedRoute>
              <FlashcardDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flashcards/new"
          element={
            <ProtectedRoute>
              <FlashcardGeneratePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flashcards/:id"
          element={
            <ProtectedRoute>
              <FlashcardStudyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/papers"
          element={
            <ProtectedRoute>
              <PaperDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/papers/new"
          element={
            <ProtectedRoute>
              <PaperGeneratePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/papers/:id"
          element={
            <ProtectedRoute>
              <PaperPreviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rag"
          element={
            <ProtectedRoute>
              <RAGWorkspacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lessons"
          element={
            <ProtectedRoute>
              <LessonsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sources"
          element={
            <ProtectedRoute>
              <SourcesPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
