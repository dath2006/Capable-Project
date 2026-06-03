import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import DashboardLayout from "../components/DashboardLayout";
import {
  paperService,
  type QuestionPaper,
  ApiError,
} from "../services/paperService";
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
import { Skeleton } from "../components/ui/skeleton";

export default function PaperPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showAnswers, setShowAnswers] = useState(false);
  const [localPaper, setLocalPaper] = useState<QuestionPaper | null>(null);

  const paperId = Number(id);
  const paperQuery = useQuery({
    queryKey: ["papers", "single", paperId],
    queryFn: () => paperService.getPaper(paperId),
    enabled: Number.isFinite(paperId),
  });

  const paper = localPaper ?? paperQuery.data ?? null;

  const regenerateMutation = useMutation({
    mutationFn: ({ questionId }: { questionId: number }) =>
      paperService.regenerateQuestion(paperId, questionId),
    onSuccess: (updatedQuestion, vars) => {
      if (!paper) return;
      const nextPaper = structuredClone(paper);
      for (const section of nextPaper.sections) {
        const qIdx = section.questions.findIndex(
          (q) => q.id === vars.questionId,
        );
        if (qIdx >= 0) {
          section.questions[qIdx] = updatedQuestion;
          break;
        }
      }
      setLocalPaper(nextPaper);
      toast.success("Question regenerated");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to regenerate question");
    },
  });

  if (paperQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-[520px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (paperQuery.error || !paper) {
    const err = paperQuery.error;
    if (err instanceof ApiError && err.status === 401) {
      navigate("/login");
    }
    return (
      <DashboardLayout>
        <Alert className="mx-auto mt-8 max-w-2xl border-[var(--danger)] bg-red-50">
          <AlertDescription className="text-[var(--danger)]">
            {paperQuery.error?.message || "Paper not found"}
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const handleExport = (format: string, type: string) => {
    window.open(paperService.exportPaperUrl(paper.id, format, type), "_blank");
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{paper.title}</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Source: {paper.source_filename} | Total: {paper.total_marks} marks
              | Duration: {paper.duration_minutes} min
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/papers")}>
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAnswers((prev) => !prev)}
            >
              {showAnswers ? "Hide Key" : "Show Key"}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("pdf", "both")}
            >
              Export PDF (Both)
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("pdf", "paper")}
            >
              Export PDF (Paper)
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("docx", "both")}
            >
              Export DOCX
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{paper.title}</CardTitle>
            <CardDescription>
              Target audience: {paper.target_audience}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {paper.sections.map((section, sectionIndex) => (
              <section key={section.id} className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <h2 className="text-lg font-semibold uppercase">
                    Section {sectionIndex + 1}:{" "}
                    {section.section_type.replaceAll("_", " ")}
                  </h2>
                  <Badge variant="outline">
                    {section.questions.reduce((acc, q) => acc + q.marks, 0)}{" "}
                    marks
                  </Badge>
                </div>

                <div className="space-y-5">
                  {section.questions.map((question, qIndex) => (
                    <div
                      key={question.id}
                      className="space-y-3 rounded-lg border border-[var(--border)] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <p className="font-medium leading-relaxed">
                          {qIndex + 1}. {question.question_text}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{question.marks}</Badge>
                          <Button
                            variant="ghost"
                            disabled={regenerateMutation.isPending}
                            onClick={() =>
                              regenerateMutation.mutate({
                                questionId: question.id,
                              })
                            }
                          >
                            Regenerate
                          </Button>
                        </div>
                      </div>

                      {section.section_type === "mcq" && question.options && (
                        <div className="grid grid-cols-1 gap-2 text-sm text-[var(--muted-foreground)] sm:grid-cols-2">
                          {JSON.parse(question.options).map(
                            (option: string, idx: number) => (
                              <p key={idx}>
                                {String.fromCharCode(65 + idx)}. {option}
                              </p>
                            ),
                          )}
                        </div>
                      )}

                      {showAnswers && question.answer_key && (
                        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm">
                          <p className="font-semibold text-green-800">
                            Answer: {question.answer_key.correct_answer}
                          </p>
                          {question.answer_key.explanation && (
                            <p className="mt-2 text-green-700">
                              {question.answer_key.explanation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
