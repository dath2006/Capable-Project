import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { forgotPassword } from "../services/authApi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  const forgotMutation = useMutation({
    mutationFn: () => forgotPassword(email),
    onSuccess: (data) => {
      setResetToken(data.token);
      toast.success("Reset token sent to your email");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Request failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    forgotMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-[420px] animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot password?</CardTitle>
          <CardDescription>No worries, we'll help you reset it</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {forgotMutation.error && (
              <Alert className="border-[var(--danger)] bg-red-50">
                <AlertDescription className="text-[var(--danger)]">
                  {forgotMutation.error.message || "Request failed"}
                </AlertDescription>
              </Alert>
            )}

            {resetToken && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">
                  <p className="font-semibold mb-2">Reset token generated:</p>
                  <code className="block bg-white p-2 rounded border border-green-100 text-xs break-all font-mono">
                    {resetToken}
                  </code>
                </AlertDescription>
              </Alert>
            )}

            {!resetToken && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                    disabled={forgotMutation.isPending}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={forgotMutation.isPending}
                  className="w-full"
                >
                  {forgotMutation.isPending ? "Sending..." : "Send Reset Token"}
                </Button>
              </>
            )}

            <div className="flex justify-between text-sm">
              <Link
                to="/login"
                className="text-[var(--primary)] hover:text-[var(--primary-strong)] font-semibold"
              >
                ← Back to Login
              </Link>
              <Link
                to="/reset-password"
                className="text-[var(--primary)] hover:text-[var(--primary-strong)] font-semibold"
              >
                Have a token? →
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
