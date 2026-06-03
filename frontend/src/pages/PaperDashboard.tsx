import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import DashboardLayout from "../components/DashboardLayout";
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
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Skeleton } from "../components/ui/skeleton";

export default function PaperDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const papersQuery = useQuery({
    queryKey: ["papers", "all"],
    queryFn: paperService.getPapers,
  });

  useEffect(() => {
    const err = papersQuery.error;
    if (err instanceof ApiError && err.status === 401) {
      navigate("/login");
    }
  }, [papersQuery.error, navigate]);

  const deleteMutation = useMutation({
    mutationFn: paperService.deletePaper,
    onSuccess: () => {
      toast.success("Paper deleted");
      queryClient.invalidateQueries({ queryKey: ["papers", "all"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete paper");
    },
  });

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Question Papers</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Review generated papers or build a new one.
          </p>
        </div>
        <Button asChild>
          <Link to="/papers/new">Generate New</Link>
        </Button>
      </div>

      {papersQuery.error && (
        <Alert className="mb-6 border-[var(--danger)] bg-red-50">
          <AlertDescription className="text-[var(--danger)]">
            {papersQuery.error.message || "Failed to load papers"}
          </AlertDescription>
        </Alert>
      )}

      {papersQuery.isLoading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx}>
              <CardHeader>
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-5 w-24" />
              </CardContent>
              <CardFooter className="flex gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!papersQuery.isLoading && (papersQuery.data?.length ?? 0) === 0 && (
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>No question papers yet</CardTitle>
            <CardDescription>
              Upload source material and generate your first structured exam
              paper.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link to="/papers/new">Create your first paper</Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      {!papersQuery.isLoading && (papersQuery.data?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {papersQuery.data?.map((paper) => (
            <Card key={paper.id} className="flex h-full flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">
                    {paper.difficulty.toUpperCase()}
                  </Badge>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Are you sure you want to delete this paper?",
                        )
                      )
                        return;
                      deleteMutation.mutate(paper.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
                <CardTitle className="line-clamp-2">{paper.title}</CardTitle>
                <CardDescription
                  className="line-clamp-1"
                  title={paper.source_filename}
                >
                  Source: {paper.source_filename}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant="outline">{paper.total_marks} marks</Badge>
                  <Badge variant="outline">{paper.duration_minutes} min</Badge>
                </div>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button asChild className="w-full">
                  <Link to={`/papers/${paper.id}`}>Preview Paper</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
