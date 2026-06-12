import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import DashboardLayout from "../components/DashboardLayout";
import FormattedMarkdown from "../components/FormattedMarkdown";
import VoiceInputButton from "../components/VoiceInputButton";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import {
  ragService,
  type RAGSource,
} from "../services/ragService";

export default function RAGWorkspacePage() {
  const [urlToIndex, setUrlToIndex] = useState("");
  const [textToIndex, setTextToIndex] = useState("");
  const [indexFile, setIndexFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [queryResult, setQueryResult] = useState<{
    answer: string;
    sources: RAGSource[];
  } | null>(null);

  const statusQuery = useQuery({
    queryKey: ["rag", "status"],
    queryFn: ragService.status,
    refetchInterval: 15_000,
  });

  const statsQuery = useQuery({
    queryKey: ["rag", "stats"],
    queryFn: ragService.stats,
    refetchInterval: 15_000,
  });

  const indexUrlMutation = useMutation({
    mutationFn: ragService.indexUrl,
    onSuccess: (result) => {
      toast.success(result.message || "Material added");
      setUrlToIndex("");
      void statusQuery.refetch();
      void statsQuery.refetch();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const indexTextMutation = useMutation({
    mutationFn: ragService.indexText,
    onSuccess: (result) => {
      toast.success(result.message || "Notes added");
      setTextToIndex("");
      void statusQuery.refetch();
      void statsQuery.refetch();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const indexFileMutation = useMutation({
    mutationFn: ragService.indexFile,
    onSuccess: (result) => {
      toast.success(result.message || "File added");
      setIndexFile(null);
      void statusQuery.refetch();
      void statsQuery.refetch();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const queryMutation = useMutation({
    mutationFn: ragService.query,
    onSuccess: (result) => {
      setQueryResult({ answer: result.answer, sources: result.sources ?? [] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const clearMutation = useMutation({
    mutationFn: ragService.clear,
    onSuccess: (result) => {
      setQueryResult(null);
      toast.success(result.message || "Materials cleared");
      void statusQuery.refetch();
      void statsQuery.refetch();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusBadges = useMemo(() => {
    const status = statusQuery.data;
    const stats = statsQuery.data;
    if (!status) return null;

    return (
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">Assistant ready</Badge>
        <Badge variant={status.is_indexed ? "default" : "outline"}>
          {status.is_indexed
            ? `${stats?.total_chunks ?? status.total_chunks} knowledge chunks`
            : "No materials yet"}
        </Badge>
      </div>
    );
  }, [statusQuery.data, statsQuery.data]);

  const canAsk = statusQuery.data?.is_indexed;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Study assistant</h1>
          <p className="mt-1 text-[var(--muted-foreground)]">
            Add your notes, PDFs, or web pages — then ask questions in text or
            by voice. The assistant uses your uploaded materials automatically.
          </p>
          {statusQuery.data && (
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {statusQuery.data.message}
            </p>
          )}
          <div className="mt-3">{statusBadges}</div>
        </div>

        <Tabs defaultValue="ask" className="w-full">
          <TabsList>
            <TabsTrigger value="ask">Ask questions</TabsTrigger>
            <TabsTrigger value="materials">Add materials</TabsTrigger>
          </TabsList>

          <TabsContent value="ask" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Ask about your materials</CardTitle>
                <CardDescription>
                  Answers are grounded in what you have indexed. Use voice input
                  for hands-free study.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!canAsk && (
                  <p className="rounded-lg border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]">
                    Add study material first (Materials tab), then return here
                    to ask questions.
                  </p>
                )}
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. What are the main causes described in chapter 2?"
                  rows={4}
                  disabled={!canAsk}
                />
                <div className="flex flex-wrap gap-2">
                  <VoiceInputButton
                    label="Ask by voice"
                    disabled={!canAsk}
                    onTranscript={(text) => setQuestion(text)}
                  />
                  <Button
                    onClick={() =>
                      queryMutation.mutate({
                        question,
                        k: 4,
                        return_sources: true,
                      })
                    }
                    disabled={
                      !canAsk || !question.trim() || queryMutation.isPending
                    }
                  >
                    {queryMutation.isPending ? "Thinking..." : "Get answer"}
                  </Button>
                </div>

                {queryResult && (
                  <div className="space-y-4 rounded-xl border border-[var(--border)] p-4">
                    <div>
                      <p className="mb-2 font-semibold">Answer</p>
                      <FormattedMarkdown content={queryResult.answer} />
                    </div>
                    {queryResult.sources.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-medium text-[var(--muted-foreground)]">
                          Sources
                        </p>
                        <ul className="space-y-2">
                          {queryResult.sources.map((source, index) => (
                            <li
                              key={`${source.source}-${index}`}
                              className="rounded-md border border-[var(--border)] p-2 text-xs"
                            >
                              <div className="font-medium">{source.source}</div>
                              {source.content && (
                                <p className="mt-1 text-[var(--muted-foreground)] line-clamp-3">
                                  {source.content}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload a file</CardTitle>
                <CardDescription>PDF, DOCX, or TXT</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={(e) => setIndexFile(e.target.files?.[0] ?? null)}
                />
                <Button
                  onClick={() =>
                    indexFile && indexFileMutation.mutate(indexFile)
                  }
                  disabled={!indexFile || indexFileMutation.isPending}
                >
                  {indexFileMutation.isPending ? "Adding..." : "Add file"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Web page or article URL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={urlToIndex}
                  onChange={(e) => setUrlToIndex(e.target.value)}
                  placeholder="https://..."
                />
                <Button
                  onClick={() => indexUrlMutation.mutate(urlToIndex)}
                  disabled={!urlToIndex || indexUrlMutation.isPending}
                >
                  {indexUrlMutation.isPending ? "Adding..." : "Add from URL"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paste notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={textToIndex}
                  onChange={(e) => setTextToIndex(e.target.value)}
                  placeholder="Paste lecture notes or textbook excerpts"
                  rows={6}
                />
                <Button
                  onClick={() =>
                    indexTextMutation.mutate({ content: textToIndex })
                  }
                  disabled={!textToIndex.trim() || indexTextMutation.isPending}
                >
                  {indexTextMutation.isPending ? "Adding..." : "Add text"}
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending || !canAsk}
              >
                Clear all materials
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
