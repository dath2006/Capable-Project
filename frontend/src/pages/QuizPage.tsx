import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import DashboardLayout from "../components/DashboardLayout";
import QuestionCard from "../components/quiz/QuestionCard";
import ScoreScreen from "../components/quiz/ScoreScreen";
import { advancedService } from "../services/advancedService";
import {
  quizService,
  ApiError,
  type QuizResponse,
} from "../services/quizService";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { cn } from "../lib/utils";

const VALID_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const DIFFICULTIES = [
  { key: "easy", label: "Easy", desc: "Definitions and basic recall" },
  { key: "medium", label: "Medium", desc: "Application and understanding" },
  { key: "hard", label: "Hard", desc: "Analysis and deep reasoning" },
] as const;

type Stage = "setup" | "quiz" | "result";

interface Answer {
  selectedLabel: string;
  wasCorrect: boolean;
}

export default function QuizPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [useAdaptive, setUseAdaptive] = useState(false);
  const [numQuestions, setNumQuestions] = useState(10);
  const [error, setError] = useState("");

  const [stage, setStage] = useState<Stage>("setup");
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [attemptSaved, setAttemptSaved] = useState(false);

  const saveAttemptMutation = useMutation({
    mutationFn: quizService.recordAttempt,
    onError: (err: Error) => {
      toast.error(err.message || "Could not save quiz result");
    },
  });

  const adaptiveQuery = useQuery({
    queryKey: ["quiz", "adaptive-difficulty"],
    queryFn: advancedService.getAdaptiveDifficulty,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      quizService.generate(file as File, difficulty, numQuestions, useAdaptive),
    onSuccess: (data) => {
      setQuizData(data);
      if (data.adaptive_applied && data.difficulty) {
        setDifficulty(data.difficulty);
      }
      setCurrentIndex(0);
      setAnswers([]);
      setAttemptSaved(false);
      setStage("quiz");
      toast.success(
        data.adaptive_applied
          ? `Quiz generated (${data.difficulty} — adaptive)`
          : "Quiz generated",
      );
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.status === 401) {
        navigate("/login");
        return;
      }
      const message = err.message || "Failed to generate quiz";
      setError(message);
      toast.error(message);
    },
  });

  const handleFile = (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (
      VALID_TYPES.includes(selectedFile.type) ||
      ext === "pdf" ||
      ext === "docx"
    ) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File must be under 10 MB.");
        return;
      }
      setFile(selectedFile);
      setError("");
      return;
    }
    setError("Please upload a PDF or DOCX file.");
  };

  const handleGenerate = () => {
    if (!file) {
      toast.error("Select a file first");
      return;
    }
    setError("");
    generateMutation.mutate();
  };

  const handleAnswer = (selectedLabel: string, wasCorrect: boolean) => {
    setAnswers((prev) => [...prev, { selectedLabel, wasCorrect }]);
  };

  const handleNext = () => {
    if (!quizData) return;
    if (currentIndex < quizData.questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setStage("result");
    }
  };

  useEffect(() => {
    if (stage !== "result" || !quizData || attemptSaved) return;
    const correct = answers.filter((a) => a.wasCorrect).length;
    saveAttemptMutation.mutate({
      quiz_id: quizData.quiz_id,
      title: quizData.title,
      difficulty: quizData.difficulty,
      total_questions: quizData.total_questions,
      correct_count: correct,
      source_filename: file?.name,
    });
    setAttemptSaved(true);
  }, [stage, quizData, attemptSaved, answers, file?.name]);

  const handleRestart = () => {
    setStage("setup");
    setFile(null);
    setQuizData(null);
    setCurrentIndex(0);
    setAnswers([]);
    setError("");
    setAttemptSaved(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const correctCount = answers.filter((a) => a.wasCorrect).length;
  const currentQuestion = quizData?.questions[currentIndex];
  const isLastQuestion = quizData
    ? currentIndex === quizData.questions.length - 1
    : false;
  const currentAnswered = answers.length > currentIndex;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl animate-fade-in">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">AI Quiz</h1>
          <p className="mt-1 text-[var(--muted-foreground)]">
            Upload study material, choose difficulty, and practice with
            instant feedback after each answer.
          </p>
        </div>

        {stage === "setup" && (
          <Card>
            <CardHeader>
              <CardTitle>Generate a quiz</CardTitle>
              <CardDescription>
                Supported formats: PDF and DOCX. Answers are revealed only
                after you submit each question.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {error && (
                <Alert className="border-[var(--danger)] bg-red-50">
                  <AlertDescription className="text-[var(--danger)]">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Label>Upload document</Label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragActive(true);
                  }}
                  onDragLeave={() => setIsDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragActive(false);
                    if (e.dataTransfer.files?.[0])
                      handleFile(e.dataTransfer.files[0]);
                  }}
                  onClick={() => !file && fileInputRef.current?.click()}
                  className={cn(
                    "rounded-2xl border-2 border-dashed p-10 text-center transition-all",
                    isDragActive
                      ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                      : file
                        ? "border-green-300 bg-green-50"
                        : "border-[var(--border)] bg-[var(--background)]",
                    !file && "cursor-pointer",
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFile(e.target.files[0]);
                    }}
                  />

                  {!file ? (
                    <div className="space-y-3">
                      <p className="text-lg font-semibold">
                        Drop your file here
                      </p>
                      <p className="text-[var(--muted-foreground)]">
                        or click to browse · max 10 MB
                      </p>
                      <div className="flex justify-center gap-2">
                        <Badge variant="outline">PDF</Badge>
                        <Badge variant="outline">DOCX</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-lg font-semibold">{file.name}</p>
                      <p className="text-[var(--muted-foreground)]">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        disabled={generateMutation.isPending}
                      >
                        Remove file
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {adaptiveQuery.data && (
                <Alert className="border-[var(--primary)]/30 bg-[var(--primary-soft)]">
                  <AlertDescription className="text-sm">
                    <strong>Adaptive suggestion:</strong>{" "}
                    {adaptiveQuery.data.recommended} — {adaptiveQuery.data.reason}
                  </AlertDescription>
                </Alert>
              )}

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border)] p-4">
                <input
                  type="checkbox"
                  checked={useAdaptive}
                  onChange={(e) => setUseAdaptive(e.target.checked)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <div>
                  <p className="font-medium">Use adaptive difficulty</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Adjust difficulty from your recent quiz scores automatically.
                  </p>
                </div>
              </label>

              <div className="space-y-3">
                <Label>Difficulty{useAdaptive ? " (overridden when adaptive)" : ""}</Label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setDifficulty(d.key)}
                      disabled={useAdaptive}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-colors",
                        difficulty === d.key
                          ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50",
                      )}
                    >
                      <p className="font-semibold">{d.label}</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {d.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="num-questions">Number of questions</Label>
                  <Badge variant="secondary">{numQuestions}</Badge>
                </div>
                <input
                  id="num-questions"
                  type="range"
                  min={5}
                  max={15}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full accent-[var(--primary)]"
                />
                <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                  <span>5 min</span>
                  <span>15 max</span>
                </div>
              </div>

              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Generation usually takes 15–30 seconds.
                </p>
                <Button
                  onClick={handleGenerate}
                  disabled={!file || generateMutation.isPending}
                >
                  {generateMutation.isPending
                    ? "Generating..."
                    : "Generate quiz"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === "quiz" && quizData && currentQuestion && (
          <Card>
            <CardHeader>
              <CardTitle className="line-clamp-2">{quizData.title}</CardTitle>
              <CardDescription>
                {quizData.difficulty.charAt(0).toUpperCase() +
                  quizData.difficulty.slice(1)}{" "}
                · {quizData.total_questions} questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <QuestionCard
                key={currentQuestion.id}
                question={currentQuestion}
                questionNumber={currentIndex + 1}
                totalQuestions={quizData.total_questions}
                onAnswer={handleAnswer}
              />

              {currentAnswered && (
                <Button onClick={handleNext} className="w-full">
                  {isLastQuestion ? "View results" : "Next question"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {stage === "result" && quizData && (
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>{quizData.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreScreen
                quizId={quizData.quiz_id}
                title={quizData.title}
                difficulty={quizData.difficulty}
                questions={quizData.questions}
                correctCount={correctCount}
                onRestart={handleRestart}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
