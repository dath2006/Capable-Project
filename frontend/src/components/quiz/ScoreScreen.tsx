import { useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import type { QuizQuestion } from "../../services/quizService";
import { quizService } from "../../services/quizService";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface Props {
  quizId: string;
  title: string;
  difficulty: string;
  questions: QuizQuestion[];
  correctCount: number;
  onRestart: () => void;
}

export default function ScoreScreen({
  quizId,
  title,
  difficulty,
  questions,
  correctCount,
  onRestart,
}: Props) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const total = questions.length;
  const pct = Math.round((correctCount / total) * 100);

  const scoreColor =
    pct >= 80
      ? "text-green-600"
      : pct >= 50
        ? "text-amber-600"
        : "text-red-600";

  const scoreMessage =
    pct === 100
      ? "Perfect score — outstanding work."
      : pct >= 80
        ? "Excellent work — keep it up."
        : pct >= 60
          ? "Good effort — review the explanations."
          : pct >= 40
            ? "Keep studying — you are making progress."
            : "Review the material and try again.";

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      await quizService.downloadPDF({
        quiz_id: quizId,
        questions,
        title,
        difficulty,
      });
    } catch {
      setDownloadError("PDF download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div>
        <p className={cn("text-5xl font-bold", scoreColor)}>{pct}%</p>
        <h2 className="mt-2 text-2xl font-semibold">Quiz complete</h2>
        <p className="mt-1 text-[var(--muted-foreground)]">
          {correctCount} of {total} correct · {title}
        </p>
      </div>

      <p className="text-sm text-[var(--muted-foreground)]">{scoreMessage}</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-2xl font-bold text-green-700">{correctCount}</p>
          <p className="text-sm text-green-800">Correct</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-2xl font-bold text-red-700">
            {total - correctCount}
          </p>
          <p className="text-sm text-red-800">Incorrect</p>
        </div>
      </div>

      {downloadError && (
        <Alert className="border-[var(--danger)] bg-red-50 text-left">
          <AlertDescription className="text-[var(--danger)]">
            {downloadError}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button onClick={handleDownload} disabled={downloading} className="gap-2">
          <Download className="h-4 w-4" />
          {downloading ? "Generating PDF..." : "Download revision PDF"}
        </Button>
        <Button variant="outline" onClick={onRestart} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Take another quiz
        </Button>
      </div>
    </div>
  );
}
