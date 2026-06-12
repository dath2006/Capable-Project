import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Headphones, Upload } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../components/DashboardLayout";
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
import { Label } from "../components/ui/label";
import { Skeleton } from "../components/ui/skeleton";

export default function LessonsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const lessonsQuery = useQuery({
    queryKey: ["lessons"],
    queryFn: advancedService.listLessons,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      advancedService.createLessonFromFile(file as File, title || undefined),
    onSuccess: () => {
      toast.success("Lesson summary and audio generated");
      setFile(null);
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      void lessonsQuery.refetch();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Spoken lesson summaries</h1>
          <p className="mt-1 text-[var(--muted-foreground)]">
            AI chapter summaries with downloadable audio (edge-TTS).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate audio lesson</CardTitle>
            <CardDescription>
              Upload PDF, DOCX, or TXT. The server creates a summary and MP3
              file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Chapter 3 — Cell division"
              />
            </div>
            <div className="space-y-2">
              <Label>Document</Label>
              <Input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={!file || generateMutation.isPending}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {generateMutation.isPending
                ? "Generating (30–60s)..."
                : "Create spoken summary"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              Your lessons
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lessonsQuery.isLoading && <Skeleton className="h-24 w-full" />}
            {lessonsQuery.data?.length === 0 && (
              <p className="text-sm text-[var(--muted-foreground)]">
                No lessons yet.
              </p>
            )}
            {lessonsQuery.data?.map((lesson) => (
              <div
                key={lesson.id}
                className="rounded-xl border border-[var(--border)] p-4 space-y-3"
              >
                <p className="font-semibold">{lesson.title}</p>
                <p className="text-sm text-[var(--muted-foreground)] line-clamp-3">
                  {lesson.summary_text}
                </p>
                <audio
                  controls
                  className="w-full"
                  src={advancedService.lessonAudioFullUrl(lesson.audio_url)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
