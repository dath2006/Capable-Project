import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import DashboardLayout from "../components/DashboardLayout";
import { flashcardService, ApiError } from "../services/flashcardService";
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

const VALID_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export default function FlashcardGeneratePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const generateMutation = useMutation({
    mutationFn: flashcardService.generateFlashcards,
    onSuccess: (deck) => {
      toast.success("Deck generated successfully");
      navigate(`/flashcards/${deck.id}`);
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.status === 401) {
        navigate("/login");
        return;
      }
      setError(err.message || "Failed to generate flashcards");
      toast.error(err.message || "Failed to generate flashcards");
    },
  });

  const handleFile = (selectedFile: File) => {
    if (
      VALID_TYPES.includes(selectedFile.type) ||
      selectedFile.name.endsWith(".md")
    ) {
      setFile(selectedFile);
      setError("");
      return;
    }
    setError("Please upload a PDF, DOCX, TXT, or MD file.");
  };

  const handleGenerate = () => {
    if (!file) {
      toast.error("Select a file first");
      return;
    }
    setError("");
    generateMutation.mutate(file);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl animate-fade-in">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Generate Flashcard Deck</h1>
          <Button variant="outline" onClick={() => navigate("/flashcards")}>
            Back to Decks
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Study Material</CardTitle>
            <CardDescription>
              Drag and drop a file or browse from your device. Supported
              formats: PDF, DOCX, TXT, MD.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-[var(--danger)] bg-red-50">
                <AlertDescription className="text-[var(--danger)]">
                  {error}
                </AlertDescription>
              </Alert>
            )}

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
              className={`rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
                isDragActive
                  ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                  : file
                    ? "border-green-300 bg-green-50"
                    : "border-[var(--border)] bg-[var(--background)]"
              } ${!file ? "cursor-pointer" : ""}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />

              {!file && (
                <div className="space-y-3">
                  <p className="text-lg font-semibold">Drop your file here</p>
                  <p className="text-[var(--muted-foreground)]">
                    or click to browse
                  </p>
                  <div className="flex justify-center gap-2">
                    <Badge variant="outline">PDF</Badge>
                    <Badge variant="outline">DOCX</Badge>
                    <Badge variant="outline">TXT</Badge>
                    <Badge variant="outline">MD</Badge>
                  </div>
                </div>
              )}

              {file && (
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
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    disabled={generateMutation.isPending}
                  >
                    Remove File
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <p className="text-sm text-[var(--muted-foreground)]">
                AI processing can take 1-3 minutes for larger documents.
              </p>
              <Button
                onClick={handleGenerate}
                disabled={!file || generateMutation.isPending}
              >
                {generateMutation.isPending ? "Generating..." : "Generate Deck"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
