import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { resetPassword } from "../services/authApi";
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

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        setPasswordError("Passwords do not match");
        throw new Error("Passwords do not match");
      }
      return resetPassword({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
    },
    onSuccess: () => {
      toast.success("Password reset successfully. Please log in.");
      nav("/login");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Reset failed");
    },
  });

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    setPasswordError("");
  };

  const handleConfirmChange = (value: string) => {
    setConfirmPassword(value);
    setPasswordError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    resetMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-[420px] animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>
            Enter your reset token and choose a new password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {resetMutation.error && (
              <Alert className="border-[var(--danger)] bg-red-50">
                <AlertDescription className="text-[var(--danger)]">
                  {resetMutation.error.message || "Reset failed"}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="token">Reset Token *</Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your token here"
                required
                disabled={resetMutation.isPending}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newpw">New Password *</Label>
              <Input
                id="newpw"
                type="password"
                value={newPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="••••••••"
                required
                disabled={resetMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmpw">Confirm Password *</Label>
              <Input
                id="confirmpw"
                type="password"
                value={confirmPassword}
                onChange={(e) => handleConfirmChange(e.target.value)}
                placeholder="••••••••"
                required
                className={passwordError ? "border-[var(--danger)]" : ""}
                disabled={resetMutation.isPending}
              />
              {passwordError && (
                <p className="text-xs text-[var(--danger)]">{passwordError}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={resetMutation.isPending}
              className="w-full"
            >
              {resetMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>

            <p className="text-center text-sm">
              <Link
                to="/login"
                className="text-[var(--primary)] hover:text-[var(--primary-strong)] font-semibold"
              >
                ← Back to Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
