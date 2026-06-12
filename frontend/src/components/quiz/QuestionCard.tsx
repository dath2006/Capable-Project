import { useState } from "react";
import { Check, Volume2, X } from "lucide-react";
import { ttsService } from "../../services/ttsService";
import type { QuizQuestion } from "../../services/quizService";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface Props {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (selectedLabel: string, wasCorrect: boolean) => void;
}

const difficultyVariant: Record<string, string> = {
  easy: "border-green-300 bg-green-50 text-green-700",
  medium: "border-amber-300 bg-amber-50 text-amber-700",
  hard: "border-red-300 bg-red-50 text-red-700",
};

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
    onAnswer(selected, selected === question.correct_label);
  };

  const progressPct = ((questionNumber - 1) / totalQuestions) * 100;
  const isCorrect = selected === question.correct_label;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="text-[var(--muted-foreground)]">
            {questionNumber}/{totalQuestions}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Q{questionNumber}</Badge>
        <Badge variant="secondary">{question.concept}</Badge>
        <Badge
          variant="outline"
          className={cn(
            difficultyVariant[question.difficulty] ??
              "border-[var(--border)]",
          )}
        >
          {question.difficulty.charAt(0).toUpperCase() +
            question.difficulty.slice(1)}
        </Badge>
      </div>

      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-semibold leading-relaxed flex-1">
          {question.question}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1"
          onClick={() => ttsService.speak(question.question)}
        >
          <Volume2 className="h-4 w-4" />
          Listen
        </Button>
      </div>

      <div className="space-y-3">
        {question.options.map((opt) => {
          const isSelected = selected === opt.label;
          const showCorrect = submitted && opt.label === question.correct_label;
          const showWrong =
            submitted &&
            opt.label === selected &&
            selected !== question.correct_label;

          return (
            <button
              key={opt.label}
              type="button"
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                !submitted &&
                  isSelected &&
                  "border-[var(--primary)] bg-[var(--primary-soft)]",
                !submitted &&
                  !isSelected &&
                  "border-[var(--border)] hover:border-[var(--primary)]/50",
                submitted && showCorrect && "border-green-400 bg-green-50",
                submitted && showWrong && "border-red-400 bg-red-50",
                submitted &&
                  !showCorrect &&
                  !showWrong &&
                  "border-[var(--border)] opacity-60",
              )}
              onClick={() => {
                if (!submitted) setSelected(opt.label);
              }}
              disabled={submitted}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-sm font-bold">
                {opt.label}
              </span>
              <span className="flex-1 pt-0.5">{opt.text}</span>
              {showCorrect && (
                <Check className="h-5 w-5 shrink-0 text-green-600" />
              )}
              {showWrong && <X className="h-5 w-5 shrink-0 text-red-600" />}
            </button>
          );
        })}
      </div>

      {submitted && (
        <div
          className={cn(
            "rounded-lg border px-4 py-3 text-sm font-medium",
            isCorrect
              ? "border-green-300 bg-green-50 text-green-800"
              : "border-red-300 bg-red-50 text-red-800",
          )}
        >
          {isCorrect
            ? "Correct — well done."
            : `Incorrect — the correct answer is ${question.correct_label}.`}
        </div>
      )}

      {submitted && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          <p className="mb-2 text-sm font-semibold text-[var(--muted-foreground)]">
            Explanation
          </p>
          <p className="text-sm leading-relaxed">{question.explanation}</p>
        </div>
      )}

      {!submitted && (
        <Button onClick={handleSubmit} disabled={!selected} className="w-full">
          Submit Answer
        </Button>
      )}
    </div>
  );
}
