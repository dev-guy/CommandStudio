import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signInWithPassword } from "@/lib/auth";

const emailPattern = /^[^\s]+@[^\s]+\.[^\s]+$/;

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await signInWithPassword(email, password);
      navigate("/", { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sign-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 via-white to-zinc-100 p-4">
      <Card className="w-full max-w-md border-zinc-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
