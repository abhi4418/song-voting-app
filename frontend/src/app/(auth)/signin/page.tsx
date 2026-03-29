"use client";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "CREATOR">("USER");
  const { login, isLoading } = useAuth();

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login(email, password, role);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <Card className="w-full max-w-md border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <CardHeader>
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">QueuePulse</div>
          <CardTitle className="text-3xl">Sign in</CardTitle>
          <CardDescription>Get back into your live queue and keep the music moving.</CardDescription>
          <CardAction>
            <Button asChild className="cursor-pointer" variant="link">
              <Link href="/signup">Create account</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSignIn}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label>Role</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["USER", "CREATOR"] as const).map((option) => (
                  <label
                    key={option}
                    className={`cursor-pointer rounded-2xl border p-4 text-sm transition ${
                      role === option
                        ? "border-primary bg-primary/10 text-slate-950"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option}
                      checked={role === option}
                      onChange={() => setRole(option)}
                      className="sr-only"
                    />
                    <span className="block font-semibold">{option === "USER" ? "Listener" : "Creator"}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {option === "USER" ? "Vote on songs and join playlists." : "Create playlists and control playback."}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-sm text-slate-500">
          Need an account? <Link href="/signup" className="ml-1 font-medium text-primary">Sign up</Link>
        </CardFooter>
      </Card>
    </main>
  );
}
