import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  flashcardService,
  type FlashcardDeck,
  ApiError,
} from "../services/flashcardService";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";

function DeckCard({
  deck,
  onDelete,
}: {
  deck: FlashcardDeck;
  onDelete: (id: number) => void;
}) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="line-clamp-2">{deck.title}</CardTitle>
        <CardDescription className="line-clamp-1" title={deck.source_filename}>
          {deck.source_filename}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <Badge variant="secondary">{deck.flashcards?.length ?? 0} cards</Badge>
      </CardContent>
      <CardFooter className="flex gap-3">
        <Button asChild className="flex-1">
          <Link to={`/flashcards/${deck.id}`}>Start Studying</Link>
        </Button>
        <Button variant="outline" onClick={() => onDelete(deck.id)}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function FlashcardDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const decksQuery = useQuery({
    queryKey: ["flashcards", "decks"],
    queryFn: flashcardService.getDecks,
  });

  useEffect(() => {
    const err = decksQuery.error;
    if (err instanceof ApiError && err.status === 401) {
      navigate("/login");
    }
  }, [decksQuery.error, navigate]);

  const deleteDeckMutation = useMutation({
    mutationFn: flashcardService.deleteDeck,
    onSuccess: () => {
      toast.success("Deck deleted");
      queryClient.invalidateQueries({ queryKey: ["flashcards", "decks"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete deck");
    },
  });

  const handleDelete = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this deck?")) return;
    deleteDeckMutation.mutate(id);
  };

  return (
    <DashboardLayout>
      <section className="mb-10 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-10 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Flashcard Study Hub
            </h1>
            <p className="mt-2 text-[var(--muted-foreground)]">
              Review with spaced repetition and keep your decks fresh.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link to="/flashcards/due">Study Due</Link>
            </Button>
            <Button asChild>
              <Link to="/flashcards/new">Generate Deck</Link>
            </Button>
          </div>
        </div>
      </section>

      {decksQuery.error && (
        <Alert className="mb-6 border-[var(--danger)] bg-red-50">
          <AlertDescription className="text-[var(--danger)]">
            {decksQuery.error.message || "Failed to load flashcard decks"}
          </AlertDescription>
        </Alert>
      )}

      {decksQuery.isLoading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-20" />
              </CardContent>
              <CardFooter className="flex gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!decksQuery.isLoading && (decksQuery.data?.length ?? 0) === 0 && (
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>No flashcard decks yet</CardTitle>
            <CardDescription>
              Upload a document and generate your first deck.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link to="/flashcards/new">Create Your First Deck</Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      {!decksQuery.isLoading && (decksQuery.data?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {decksQuery.data?.map((deck) => (
            <DeckCard key={deck.id} deck={deck} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
