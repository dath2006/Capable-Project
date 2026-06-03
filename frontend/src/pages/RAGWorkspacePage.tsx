import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import DashboardLayout from "../components/DashboardLayout";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
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
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import {
  ragService,
  type RAGSearchResult,
  type RAGSource,
} from "../services/ragService";

const DEFAULT_STORE_PATH = "./rag_store";

export default function RAGWorkspacePage() {
  const [provider, setProvider] = useState("gemini");
  const [modelName, setModelName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [urlToIndex, setUrlToIndex] = useState("");
  const [textToIndex, setTextToIndex] = useState("");
  const [indexFile, setIndexFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [storePath, setStorePath] = useState(DEFAULT_STORE_PATH);
  const [queryResult, setQueryResult] = useState<{
    answer: string;
    sources: RAGSource[];
  } | null>(null);
  const [searchResult, setSearchResult] = useState<RAGSearchResult[]>([]);

  const statsQuery = useQuery({
    queryKey: ["rag", "stats"],
    queryFn: ragService.stats,
    refetchInterval: 10_000,
  });

  const initMutation = useMutation({
    mutationFn: ragService.init,
    onSuccess: (result) => toast.success(result.message || "RAG initialized"),
    onError: (err: Error) => toast.error(err.message),
  });

  const indexUrlMutation = useMutation({
    mutationFn: ragService.indexUrl,
    onSuccess: (result) => {
      toast.success(result.message || "URL indexed");
      setUrlToIndex("");
      void statsQuery.refetch();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const indexTextMutation = useMutation({
    mutationFn: ragService.indexText,
    onSuccess: (result) => {
      toast.success(result.message || "Text indexed");
      setTextToIndex("");
      void statsQuery.refetch();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const indexFileMutation = useMutation({
    mutationFn: ragService.indexFile,
    onSuccess: (result) => {
      toast.success(result.message || "File indexed");
      setIndexFile(null);
      void statsQuery.refetch();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const queryMutation = useMutation({
    mutationFn: ragService.query,
    onSuccess: (result) => {
      setQueryResult({ answer: result.answer, sources: result.sources });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const searchMutation = useMutation({
    mutationFn: ragService.search,
    onSuccess: (result) => {
      setSearchResult(result.results);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const clearMutation = useMutation({
    mutationFn: ragService.clear,
    onSuccess: (result) => {
      setQueryResult(null);
      setSearchResult([]);
      toast.success(result.message || "Index cleared");
      void statsQuery.refetch();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveMutation = useMutation({
    mutationFn: ragService.save,
    onSuccess: (result) => toast.success(result.message || "Store saved"),
    onError: (err: Error) => toast.error(err.message),
  });

  const loadMutation = useMutation({
    mutationFn: ragService.load,
    onSuccess: (result) => {
      toast.success(result.message || "Store loaded");
      void statsQuery.refetch();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statsBadges = useMemo(() => {
    const stats = statsQuery.data;
    if (!stats) return null;

    return (
      <div className="flex flex-wrap gap-2">
        <Badge variant={stats.is_indexed ? "success" : "secondary"}>
          {stats.is_indexed ? "Indexed" : "Not indexed"}
        </Badge>
        <Badge variant="outline">Documents: {stats.total_documents}</Badge>
        <Badge variant="outline">Chunks: {stats.total_chunks}</Badge>
        <Badge variant="outline">
          Embedding Dim: {stats.embedding_dimension}
        </Badge>
      </div>
    );
  }, [statsQuery.data]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="space-y-3">
          <Badge>RAG Workspace</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">
            Knowledge Retrieval Studio
          </h1>
          <p className="max-w-3xl text-sm text-[var(--muted-foreground)]">
            Initialize your model, ingest content from URL, file, or plain text,
            then run answer generation and semantic search.
          </p>
          {statsBadges}
        </header>

        <Alert className="border-[var(--primary-soft)] bg-[var(--primary-soft)]/20">
          <AlertTitle>Setup Order</AlertTitle>
          <AlertDescription>
            Call init first, then index content, then use query or search.
            Save/load manage local vector store snapshots.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="setup" className="w-full">
          <TabsList>
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="ingest">Ingestion</TabsTrigger>
            <TabsTrigger value="query">Query</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="manage">Index Management</TabsTrigger>
          </TabsList>

          <TabsContent value="setup">
            <Card>
              <CardHeader>
                <CardTitle>Initialize RAG</CardTitle>
                <CardDescription>Maps to POST /api/rag/init.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger id="provider">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini">Gemini</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelName">Model name (optional)</Label>
                  <Input
                    id="modelName"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="gemini-1.5-pro"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="apiKey">API key (optional)</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Leave empty to use server env"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button
                    onClick={() =>
                      initMutation.mutate({
                        provider,
                        model_name: modelName || undefined,
                        api_key: apiKey || undefined,
                      })
                    }
                    disabled={initMutation.isPending}
                  >
                    {initMutation.isPending ? "Initializing..." : "Initialize"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ingest" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Index from URL</CardTitle>
                <CardDescription>
                  Maps to POST /api/rag/index/url.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={urlToIndex}
                  onChange={(e) => setUrlToIndex(e.target.value)}
                  placeholder="https://example.com/article"
                />
                <Button
                  onClick={() => indexUrlMutation.mutate(urlToIndex)}
                  disabled={!urlToIndex || indexUrlMutation.isPending}
                >
                  {indexUrlMutation.isPending ? "Indexing..." : "Index URL"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Index from file</CardTitle>
                <CardDescription>
                  Maps to POST /api/rag/index/file.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={(e) => setIndexFile(e.target.files?.[0] || null)}
                />
                <Button
                  onClick={() =>
                    indexFile && indexFileMutation.mutate(indexFile)
                  }
                  disabled={!indexFile || indexFileMutation.isPending}
                >
                  {indexFileMutation.isPending ? "Indexing..." : "Index file"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Index from text</CardTitle>
                <CardDescription>
                  Maps to POST /api/rag/index/text.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={textToIndex}
                  onChange={(e) => setTextToIndex(e.target.value)}
                  placeholder="Paste study material here"
                />
                <Button
                  onClick={() =>
                    indexTextMutation.mutate({ content: textToIndex })
                  }
                  disabled={!textToIndex.trim() || indexTextMutation.isPending}
                >
                  {indexTextMutation.isPending ? "Indexing..." : "Index text"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="query">
            <Card>
              <CardHeader>
                <CardTitle>Ask a question</CardTitle>
                <CardDescription>Maps to POST /api/rag/query.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What are the key findings in this material?"
                />
                <Button
                  onClick={() =>
                    queryMutation.mutate({
                      question,
                      k: 4,
                      return_sources: true,
                    })
                  }
                  disabled={!question.trim() || queryMutation.isPending}
                >
                  {queryMutation.isPending
                    ? "Generating answer..."
                    : "Run query"}
                </Button>

                {queryResult && (
                  <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
                    <h3 className="font-medium">Answer</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {queryResult.answer}
                    </p>
                    <h4 className="pt-2 text-sm font-medium">Sources</h4>
                    <ul className="space-y-2">
                      {queryResult.sources.map((source, index) => (
                        <li
                          key={`${source.source}-${index}`}
                          className="rounded-md border border-[var(--border)] p-2 text-xs"
                        >
                          <div className="font-medium">{source.source}</div>
                          {source.content && (
                            <p className="mt-1 text-[var(--muted-foreground)]">
                              {source.content}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle>Semantic search</CardTitle>
                <CardDescription>Maps to POST /api/rag/search.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find mentions of spaced repetition"
                />
                <Button
                  onClick={() =>
                    searchMutation.mutate({ query: searchQuery, k: 6 })
                  }
                  disabled={!searchQuery || searchMutation.isPending}
                >
                  {searchMutation.isPending ? "Searching..." : "Search index"}
                </Button>

                <div className="space-y-2">
                  {searchResult.map((result, index) => (
                    <div
                      key={`${result.score}-${index}`}
                      className="rounded-md border border-[var(--border)] p-3"
                    >
                      <div className="mb-2 text-xs font-medium">
                        Score: {result.score.toFixed(4)}
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {result.content}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle>Persistence and cleanup</CardTitle>
                <CardDescription>
                  Maps to POST /api/rag/save, /api/rag/load, and /api/rag/clear.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storePath">Store path</Label>
                  <Input
                    id="storePath"
                    value={storePath}
                    onChange={(e) => setStorePath(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => saveMutation.mutate(storePath)}
                    disabled={saveMutation.isPending || !storePath}
                  >
                    {saveMutation.isPending ? "Saving..." : "Save store"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => loadMutation.mutate(storePath)}
                    disabled={loadMutation.isPending || !storePath}
                  >
                    {loadMutation.isPending ? "Loading..." : "Load store"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => clearMutation.mutate()}
                    disabled={clearMutation.isPending}
                  >
                    {clearMutation.isPending ? "Clearing..." : "Clear index"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
