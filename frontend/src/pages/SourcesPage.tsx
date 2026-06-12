import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BookOpen, ImageIcon, Youtube } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../components/DashboardLayout";
import FormattedMarkdown from "../components/FormattedMarkdown";
import { advancedService } from "../services/advancedService";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

export default function SourcesPage() {
  const navigate = useNavigate();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [khanQuery, setKhanQuery] = useState("");
  const [khanResults, setKhanResults] = useState<
    Array<{ title: string; url: string }>
  >([]);
  const [quizletJson, setQuizletJson] = useState("");
  const [diagramResult, setDiagramResult] = useState<{
    analysis: string;
    ocr_text?: string;
    method: string;
  } | null>(null);
  const diagramRef = useRef<HTMLInputElement>(null);

  const youtubeIndexMutation = useMutation({
    mutationFn: () => advancedService.youtubeIndexToRag(youtubeUrl),
    onSuccess: (r) => {
      toast.success(r.message);
      setYoutubeUrl("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const khanMutation = useMutation({
    mutationFn: () => advancedService.khanSearch(khanQuery),
    onSuccess: (r) => setKhanResults(r.results),
    onError: (err: Error) => toast.error(err.message),
  });

  const quizletMutation = useMutation({
    mutationFn: () => {
      const parsed = JSON.parse(quizletJson) as unknown;
      const cards = Array.isArray(parsed)
        ? parsed
        : (parsed as { cards?: unknown }).cards;
      if (!Array.isArray(cards)) throw new Error("Expected array of cards");
      return advancedService.quizletImport("Quizlet import", cards);
    },
    onSuccess: (deck) => {
      toast.success("Deck imported");
      navigate(`/flashcards/${deck.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const diagramMutation = useMutation({
    mutationFn: (file: File) => advancedService.analyzeDiagram(file),
    onSuccess: (r) => {
      setDiagramResult(r);
      toast.success(`Analyzed via ${r.method}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Educational sources</h1>
          <p className="mt-1 text-[var(--muted-foreground)]">
            YouTube transcripts, Khan Academy search, Quizlet import, and
            diagram recognition (Vision + Gemini).
          </p>
        </div>

        <Tabs defaultValue="youtube">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
            <TabsTrigger value="khan">Khan</TabsTrigger>
            <TabsTrigger value="quizlet">Quizlet</TabsTrigger>
            <TabsTrigger value="diagram">Diagram</TabsTrigger>
          </TabsList>

          <TabsContent value="youtube">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-red-600" />
                  YouTube Education
                </CardTitle>
                <CardDescription>
                  Fetch captions and index into your RAG workspace (init RAG
                  first on the RAG page).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
                <Button
                  onClick={() => youtubeIndexMutation.mutate()}
                  disabled={!youtubeUrl || youtubeIndexMutation.isPending}
                >
                  {youtubeIndexMutation.isPending
                    ? "Indexing..."
                    : "Index transcript to RAG"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="khan">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Khan Academy
                </CardTitle>
                <CardDescription>
                  Search public Khan Academy topics and open lessons in a new
                  tab.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. linear algebra, photosynthesis"
                    value={khanQuery}
                    onChange={(e) => setKhanQuery(e.target.value)}
                  />
                  <Button
                    onClick={() => khanMutation.mutate()}
                    disabled={!khanQuery || khanMutation.isPending}
                  >
                    Search
                  </Button>
                </div>
                <ul className="space-y-2">
                  {khanResults.map((item) => (
                    <li key={item.url}>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-[var(--primary)] hover:underline"
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quizlet">
            <Card>
              <CardHeader>
                <CardTitle>Quizlet import</CardTitle>
                <CardDescription>
                  Paste JSON export:{" "}
                  <code className="text-xs">
                    {`[{"term":"...","definition":"..."}]`}
                  </code>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  rows={8}
                  value={quizletJson}
                  onChange={(e) => setQuizletJson(e.target.value)}
                  placeholder='[{"term": "Mitosis", "definition": "Cell division..."}]'
                />
                <Button
                  onClick={() => quizletMutation.mutate()}
                  disabled={!quizletJson || quizletMutation.isPending}
                >
                  Import as flashcard deck
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagram">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Diagram recognition
                </CardTitle>
                <CardDescription>
                  Google Cloud Vision OCR + Gemini vision analysis for charts,
                  whiteboards, and diagrams.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  ref={diagramRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) diagramMutation.mutate(f);
                  }}
                />
                {diagramMutation.isPending && (
                  <Badge variant="secondary">Analyzing...</Badge>
                )}
                {diagramResult && (
                  <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">Analysis</p>
                      <Badge variant="secondary">{diagramResult.method}</Badge>
                    </div>
                    <FormattedMarkdown content={diagramResult.analysis} />
                    {diagramResult.ocr_text && (
                      <div className="border-t border-[var(--border)] pt-4">
                        <p className="mb-2 text-sm font-medium text-[var(--muted-foreground)]">
                          Extracted text (OCR)
                        </p>
                        <FormattedMarkdown content={diagramResult.ocr_text} />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
