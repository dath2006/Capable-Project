import { Mic, MicOff } from "lucide-react";
import { Button } from "./ui/button";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  label?: string;
}

export default function VoiceInputButton({
  onTranscript,
  disabled,
  label = "Ask by voice",
}: Props) {
  const { isListening, supported, startListening, stopListening } =
    useSpeechRecognition(onTranscript);

  if (!supported) return null;

  return (
    <Button
      type="button"
      variant={isListening ? "default" : "outline"}
      size="sm"
      className="gap-2"
      disabled={disabled}
      onClick={() => (isListening ? stopListening() : startListening())}
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
      {isListening ? "Listening..." : label}
    </Button>
  );
}
