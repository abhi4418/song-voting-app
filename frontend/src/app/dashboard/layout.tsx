"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen px-6 py-6 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">
              QueuePulse
            </Link>
            <p className="mt-2 text-sm text-slate-600">
              Signed in as <span className="font-medium text-slate-900">{user?.email ?? "guest"}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button onClick={logout} variant="ghost">
              Logout
            </Button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
