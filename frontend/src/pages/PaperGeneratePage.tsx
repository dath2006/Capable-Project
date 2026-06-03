import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DashboardLayout from "../components/DashboardLayout";
import type {
  PaperGenerateRequest,
  SectionConfig,
} from "../services/paperService";
import { paperService, ApiError } from "../services/paperService";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";

type Step = 1 | 2 | 3 | 4;

const DEFAULT_SECTION: SectionConfig = {
  type: "mcq",
  count: 10,
  marks_per_question: 1,
};

export default function PaperGeneratePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [totalMarks, setTotalMarks] = useState(100);
  const [duration, setDuration] = useState(180);
  const [difficulty, setDifficulty] = useState("mixed");
  const [audience, setAudience] = useState("undergraduate");
  const [topics, setTopics] = useState("");
  const [sections, setSections] = useState<SectionConfig[]>([DEFAULT_SECTION]);
  const [error, setError] = useState("");

  const currentTally = useMemo(
    () =>
      sections.reduce(
        (acc, section) => acc + section.count * section.marks_per_question,
        0,
      ),
    [sections],
  );

  const generateMutation = useMutation({
    mutationFn: ({
      sourceFile,
      payload,
    }: {
      sourceFile: File;
      payload: PaperGenerateRequest;
    }) => paperService.generatePaper(sourceFile, payload),
    onSuccess: (paper) => {
      toast.success("Question paper generated");
      navigate(`/papers/${paper.id}`);
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.status === 401) {
        navigate("/login");
        return;
      }
      setError(err.message || "Failed to generate paper");
      toast.error(err.message || "Failed to generate paper");
    },
  });

  const updateSection = (
    idx: number,
    field: keyof SectionConfig,
    value: string | number,
  ) => {
    setSections((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleGenerate = () => {
    if (!file) {
      setError("Please select a source file first.");
      return;
    }
    if (currentTally !== totalMarks) {
      setError(
        `Total marks mismatch. Target ${totalMarks}, configured ${currentTally}.`,
      );
      return;
    }

    setError("");
    const payload: PaperGenerateRequest = {
      title: title || "Mid-Term Examination",
      total_marks: totalMarks,
      duration_minutes: duration,
      difficulty,
      target_audience: audience,
      topic_focus: topics
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean),
      sections,
    };

    generateMutation.mutate({ sourceFile: file, payload });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Generate Question Paper</h1>
          <p className="text-[var(--muted-foreground)]">
            Upload source material, configure sections, and generate an exam
            paper.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((s) => (
            <Badge key={s} variant={step === s ? "default" : "outline"}>
              Step {s}
            </Badge>
          ))}
        </div>

        {error && (
          <Alert className="border-[var(--danger)] bg-red-50">
            <AlertDescription className="text-[var(--danger)]">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Upload File"}
              {step === 2 && "Paper Settings"}
              {step === 3 && "Section Rules"}
              {step === 4 && "Review and Generate"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Choose a PDF, DOCX, or TXT source file."}
              {step === 2 && "Set paper metadata and target audience."}
              {step === 3 && "Define section types, counts, and mark weights."}
              {step === 4 && "Confirm configuration before generation."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {step === 1 && (
              <div className="space-y-3">
                <Label htmlFor="paper-file">Source file</Label>
                <Input
                  id="paper-file"
                  type="file"
                  accept=".pdf,.txt,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {file && (
                  <Badge variant="secondary">Selected: {file.name}</Badge>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="paper-title">Title</Label>
                  <Input
                    id="paper-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Mid-Term Examination"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paper-marks">Total marks</Label>
                  <Input
                    id="paper-marks"
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paper-duration">Duration (minutes)</Label>
                  <Input
                    id="paper-duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paper-audience">Target audience</Label>
                  <Input
                    id="paper-audience"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="paper-topics">
                    Topic focus (comma-separated)
                  </Label>
                  <Input
                    id="paper-topics"
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    placeholder="Backpropagation, Chapter 3"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Sections</p>
                  <Badge
                    variant={
                      currentTally === totalMarks ? "success" : "warning"
                    }
                  >
                    Tally {currentTally} / {totalMarks}
                  </Badge>
                </div>

                {sections.map((section, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-3 rounded-lg border border-[var(--border)] p-4 sm:grid-cols-4"
                  >
                    <Select
                      value={section.type}
                      onValueChange={(value) =>
                        updateSection(idx, "type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                        <SelectItem value="true_false">True / False</SelectItem>
                        <SelectItem value="fill_in_the_blank">
                          Fill in the Blank
                        </SelectItem>
                        <SelectItem value="short_answer">
                          Short Answer
                        </SelectItem>
                        <SelectItem value="long_answer">Long Answer</SelectItem>
                        <SelectItem value="case_study">Case Study</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      min={1}
                      value={section.count}
                      onChange={(e) =>
                        updateSection(idx, "count", Number(e.target.value))
                      }
                    />
                    <Input
                      type="number"
                      min={1}
                      value={section.marks_per_question}
                      onChange={(e) =>
                        updateSection(
                          idx,
                          "marks_per_question",
                          Number(e.target.value),
                        )
                      }
                    />
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline">
                        {section.count * section.marks_per_question} marks
                      </Badge>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setSections((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        disabled={sections.length === 1}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={() =>
                    setSections((prev) => [
                      ...prev,
                      { type: "short_answer", count: 1, marks_per_question: 2 },
                    ])
                  }
                >
                  Add Section
                </Button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--secondary-soft)] p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <p>
                    <strong>File:</strong> {file?.name ?? "Not selected"}
                  </p>
                  <p>
                    <strong>Title:</strong> {title || "Mid-Term Examination"}
                  </p>
                  <p>
                    <strong>Difficulty:</strong> {difficulty}
                  </p>
                  <p>
                    <strong>Target:</strong> {audience}
                  </p>
                  <p>
                    <strong>Duration:</strong> {duration} minutes
                  </p>
                  <p>
                    <strong>Tally:</strong> {currentTally} / {totalMarks}
                  </p>
                </div>

                <div>
                  <p className="mb-2 font-medium">Section plan</p>
                  <ul className="space-y-1 text-sm text-[var(--muted-foreground)]">
                    {sections.map((section, idx) => (
                      <li key={idx}>
                        {section.count} x {section.type.replaceAll("_", " ")} (
                        {section.count * section.marks_per_question} marks)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setStep((prev) => Math.max(1, prev - 1) as Step)}
              disabled={step === 1 || generateMutation.isPending}
            >
              Back
            </Button>

            {step < 4 && (
              <Button
                onClick={() => setStep((prev) => Math.min(4, prev + 1) as Step)}
                disabled={step === 1 && !file}
              >
                Next
              </Button>
            )}

            {step === 4 && (
              <Button
                onClick={handleGenerate}
                disabled={
                  generateMutation.isPending || currentTally !== totalMarks
                }
              >
                {generateMutation.isPending
                  ? "Generating..."
                  : "Generate Paper"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
