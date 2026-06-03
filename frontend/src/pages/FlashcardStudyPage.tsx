import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  flashcardService,
  type Flashcard,
  type FlashcardDeck,
  ApiError,
} from "../services/flashcardService";
import { ttsService } from "../services/ttsService";
import DashboardLayout from "../components/DashboardLayout";
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

interface SpeechRecognitionResultLike {
  transcript: string;
}

interface SpeechRecognitionEventLike {
  results: Array<Array<SpeechRecognitionResultLike>>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export default function FlashcardStudyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [localCards, setLocalCards] = useState<Flashcard[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const isFlippedRef = useRef(false);
  const handleScoreRef = useRef<(score: number) => void>(() => undefined);

  const isDueMode = id === "due";
  const deckId = !isDueMode && id ? Number.parseInt(id, 10) : undefined;

  const deckQuery = useQuery({
    queryKey: ["flashcards", "deck", id],
    queryFn: async (): Promise<FlashcardDeck> => {
      if (isDueMode) {
        const dueCards = await flashcardService.getDueFlashcards();
        return {
          id: 0,
          title: "Due Review Session",
          source_filename: "Spaced Repetition",
          created_at: new Date().toISOString(),
          flashcards: dueCards,
        };
      }

      if (!deckId || Number.isNaN(deckId)) {
        throw new Error("Invalid deck id");
      }
      return flashcardService.getDeck(deckId);
    },
  });

  const cards = localCards ?? deckQuery.data?.flashcards ?? [];

  useEffect(() => {
    const err = deckQuery.error;
    if (err instanceof ApiError && err.status === 401) {
      navigate("/login");
    }
  }, [deckQuery.error, navigate]);

  useEffect(() => {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const SpeechRecognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setIsListening(false);
      if (!isFlippedRef.current) {
        setIsFlipped(true);
        return;
      }
      if (transcript.includes("easy") || transcript.includes("got it")) {
        handleScoreRef.current(5);
      } else if (transcript.includes("hard") || transcript.includes("review")) {
        handleScoreRef.current(1);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    isFlippedRef.current = isFlipped;
  }, [isFlipped]);

  const reviewMutation = useMutation({
    mutationFn: ({ cardId, score }: { cardId: number; score: number }) =>
      flashcardService.reviewFlashcard(cardId, score),
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit score");
    },
  });

  const currentCard = cards[currentIndex];
  const progress = useMemo(() => {
    if (cards.length === 0) return 0;
    return ((currentIndex + 1) / cards.length) * 100;
  }, [cards.length, currentIndex]);

  const resetCardView = () => {
    setIsFlipped(false);
    setShowSource(false);
    ttsService.stop();
  };

  const handleNext = () => {
    if (cards.length === 0) return;
    resetCardView();
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    if (cards.length === 0) return;
    resetCardView();
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleScore = (score: number) => {
    if (!currentCard) return;
    reviewMutation.mutate({ cardId: currentCard.id, score });

    if (isDueMode) {
      const updatedCards = cards.filter((_, idx) => idx !== currentIndex);
      setLocalCards(updatedCards);
      resetCardView();
      setCurrentIndex((prev) =>
        updatedCards.length === 0 ? 0 : Math.min(prev, updatedCards.length - 1),
      );
      return;
    }

    handleNext();
  };
  handleScoreRef.current = handleScore;

  const handleShuffle = () => {
    resetCardView();
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setLocalCards(shuffled);
    setCurrentIndex(0);
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error("Voice input is not supported in this browser");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      return;
    }
    recognitionRef.current.start();
    setIsListening(true);
  };

  if (deckQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-[320px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (deckQuery.error || !deckQuery.data) {
    return (
      <DashboardLayout>
        <Alert className="mx-auto mt-8 max-w-3xl border-[var(--danger)] bg-red-50">
          <AlertDescription className="text-[var(--danger)]">
            {deckQuery.error?.message || "Deck not found"}
          </AlertDescription>
        </Alert>
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => navigate("/flashcards")}>
            Back to Decks
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (cards.length === 0) {
    return (
      <DashboardLayout>
        <Card className="mx-auto mt-8 max-w-2xl">
          <CardHeader>
            <CardTitle>
              {isDueMode ? "All due cards reviewed" : "Deck is empty"}
            </CardTitle>
            <CardDescription>
              {isDueMode
                ? "Great work. There are no more due cards right now."
                : "We couldn't find flashcards in this deck."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/flashcards")}>
              Back to Decks
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl animate-fade-in space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{deckQuery.data.title}</h1>
            <p className="text-[var(--muted-foreground)]">
              {deckQuery.data.source_filename}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={toggleVoiceInput}>
              {isListening ? "Listening..." : "Voice Mode"}
            </Button>
            <Button variant="outline" onClick={handleShuffle}>
              Shuffle
            </Button>
            <Button variant="outline" onClick={() => navigate("/flashcards")}>
              Back
            </Button>
          </div>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--secondary-soft)]">
          <div
            className="h-2 rounded-full bg-[var(--primary)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
          <span>Card {currentIndex + 1}</span>
          <span>{cards.length} total</span>
        </div>

        <Card className="min-h-[320px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant={isFlipped ? "secondary" : "default"}>
                {isFlipped ? "Answer" : "Question"}
              </Badge>
              <Button
                variant="ghost"
                onClick={() =>
                  ttsService.speak(
                    isFlipped ? currentCard.answer : currentCard.question,
                  )
                }
              >
                Speak
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xl leading-relaxed">
              {isFlipped ? currentCard.answer : currentCard.question}
            </p>

            {isFlipped && currentCard.chunk_source && (
              <div className="space-y-2">
                {!showSource && (
                  <Button variant="outline" onClick={() => setShowSource(true)}>
                    Reveal Source Context
                  </Button>
                )}
                {showSource && (
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary-soft)] p-4 text-sm text-[var(--muted-foreground)]">
                    {currentCard.chunk_source}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Button variant="outline" onClick={handlePrev}>
            Previous
          </Button>

          {!isFlipped && (
            <Button
              className="sm:col-span-2"
              onClick={() => setIsFlipped(true)}
            >
              Reveal Answer
            </Button>
          )}

          {isFlipped && (
            <>
              <Button
                variant="destructive"
                className="sm:col-span-1"
                onClick={() => handleScore(1)}
                disabled={reviewMutation.isPending}
              >
                Hard
              </Button>
              <Button
                className="sm:col-span-1"
                onClick={() => handleScore(5)}
                disabled={reviewMutation.isPending}
              >
                Easy
              </Button>
            </>
          )}

          <Button variant="outline" onClick={handleNext}>
            Next
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
