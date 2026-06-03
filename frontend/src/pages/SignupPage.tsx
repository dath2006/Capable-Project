import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { signup } from "../services/authApi";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";

const STUDY_OPTIONS = [
  { value: "engineering", label: "Engineering" },
  { value: "medical", label: "Medical" },
];

export default function SignupPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    study_field: "",
    semester: "",
    college_name: "",
    phone: "",
  });
  const [passwordError, setPasswordError] = useState("");

  const updateField = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setPasswordError("");
  };

  const signupMutation = useMutation({
    mutationFn: async () => {
      if (form.password !== form.confirm_password) {
        setPasswordError("Passwords do not match");
        throw new Error("Passwords do not match");
      }
      return signup(form);
    },
    onSuccess: () => {
      toast.success("Account created successfully. Please log in.");
      nav("/login");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Signup failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !form.username.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.study_field
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    signupMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-[520px] animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Start your learning journey today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {signupMutation.error && (
              <Alert className="border-[var(--danger)] bg-red-50">
                <AlertDescription className="text-[var(--danger)]">
                  {signupMutation.error.message || "Signup failed"}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  placeholder="johndoe"
                  required
                  disabled={signupMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="john@example.com"
                  required
                  disabled={signupMutation.isPending}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={signupMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password *</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={form.confirm_password}
                  onChange={(e) =>
                    updateField("confirm_password", e.target.value)
                  }
                  placeholder="••••••••"
                  required
                  className={passwordError ? "border-[var(--danger)]" : ""}
                  disabled={signupMutation.isPending}
                />
                {passwordError && (
                  <p className="text-xs text-[var(--danger)]">
                    {passwordError}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="study">Field of Study *</Label>
              <Select
                value={form.study_field}
                onValueChange={(value) => updateField("study_field", value)}
              >
                <SelectTrigger id="study" disabled={signupMutation.isPending}>
                  <SelectValue placeholder="Select your field" />
                </SelectTrigger>
                <SelectContent>
                  {STUDY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Input
                  id="semester"
                  value={form.semester}
                  onChange={(e) => updateField("semester", e.target.value)}
                  placeholder="e.g. 4th"
                  disabled={signupMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="college">College</Label>
                <Input
                  id="college"
                  value={form.college_name}
                  onChange={(e) => updateField("college_name", e.target.value)}
                  placeholder="e.g. RVCE"
                  disabled={signupMutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+91 9876543210"
                disabled={signupMutation.isPending}
              />
            </div>

            <Button
              type="submit"
              disabled={signupMutation.isPending}
              className="w-full"
            >
              {signupMutation.isPending
                ? "Creating account..."
                : "Create Account"}
            </Button>

            <p className="text-center text-[var(--muted-foreground)] text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[var(--primary)] hover:text-[var(--primary-strong)] font-semibold"
              >
                Log in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
