import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  FileText,
  Sparkles,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { analyticsService, ApiError } from "../services/analyticsService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
          {title}
        </CardTitle>
        <div className="text-[var(--primary)]">{icon}</div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="line-clamp-1 font-medium">{label}</span>
        <span className="text-[var(--muted-foreground)]">{score}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-all"
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const navigate = useNavigate();

  const summaryQuery = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: analyticsService.getSummary,
  });

  useEffect(() => {
    const err = summaryQuery.error;
    if (err instanceof ApiError && err.status === 401) {
      navigate("/login");
    }
  }, [summaryQuery.error, navigate]);

  const data = summaryQuery.data;

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Study analytics</h1>
          <p className="mt-1 text-[var(--muted-foreground)]">
            Your progress across quizzes, flashcards, and question papers.
          </p>
        </div>

        {summaryQuery.isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        )}

        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Quiz attempts"
                value={data.quiz.attempt_count}
                subtitle={`Avg ${data.quiz.average_score}% · Best ${data.quiz.best_score}%`}
                icon={<BrainCircuit className="h-5 w-5" />}
              />
              <StatCard
                title="Flashcard decks"
                value={data.flashcards.deck_count}
                subtitle={`${data.flashcards.card_count} cards · ${data.flashcards.due_count} due`}
                icon={<Sparkles className="h-5 w-5" />}
              />
              <StatCard
                title="Question papers"
                value={data.papers.paper_count}
                subtitle={`${data.papers.total_questions} questions generated`}
                icon={<FileText className="h-5 w-5" />}
              />
              <StatCard
                title="Reviews (7 days)"
                value={data.flashcards.reviews_last_7_days}
                subtitle={`${data.papers.views_last_7_days} paper views this week`}
                icon={<BookOpen className="h-5 w-5" />}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Quiz score trend
                  </CardTitle>
                  <CardDescription>
                    Recent quiz results (up to 10 attempts)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.score_trend.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Complete a quiz to see your score trend.
                    </p>
                  ) : (
                    data.score_trend.map((point, idx) => (
                      <ScoreBar
                        key={`${point.completed_at}-${idx}`}
                        label={point.label}
                        score={point.score_percent}
                      />
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent quiz attempts</CardTitle>
                  <CardDescription>Last 5 completed quizzes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.quiz.recent_attempts.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)]">
                      No quiz history yet.
                    </p>
                  ) : (
                    data.quiz.recent_attempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3"
                      >
                        <div>
                          <p className="font-medium line-clamp-1">
                            {attempt.title}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {attempt.correct_count}/{attempt.total_questions}{" "}
                            correct · {attempt.difficulty}
                          </p>
                        </div>
                        <Badge variant="secondary">{attempt.score_percent}%</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
