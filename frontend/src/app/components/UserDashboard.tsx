"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

type PlaylistSummary = {
  id: string;
  name: string;
  createdAt: string;
  creator: {
    email: string;
  };
  songCount: number;
  totalVotes: number;
};

type TrendingResponse = {
  playlists: PlaylistSummary[];
};

export default function UserDashboard() {
  const { token, user } = useAuth();
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchTrendingPlaylists = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiRequest<TrendingResponse>("/api/playlist/trending", {
          method: "GET",
          token,
        });

        setPlaylists(response.playlists ?? []);
        setErrorMessage("");
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load playlists");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchTrendingPlaylists();
  }, [token]);

  return (
    <div className="space-y-8">
      <section className="grid gap-5 rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Listener view
          </span>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-slate-900">Welcome back, {user?.email?.split("@")[0]}</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Browse trending queues, open a playlist, and vote for the songs you want to hear next.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <Card className="border-none bg-cyan-50 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-cyan-900">Top playlists</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-cyan-950">{playlists.length}</CardContent>
          </Card>
          <Card className="border-none bg-amber-100 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-900">Votes happening</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-amber-950">
              {playlists.reduce((total, playlist) => total + playlist.totalVotes, 0)}
            </CardContent>
          </Card>
          <Card className="border-none bg-cyan-100 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-cyan-900">Songs queued</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-cyan-950">
              {playlists.reduce((total, playlist) => total + playlist.songCount, 0)}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Trending playlists</h2>
            <p className="text-sm text-slate-600">Open any queue to add songs and vote live.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-44 animate-pulse rounded-[1.5rem] border border-white/60 bg-white/60" />
            ))}
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : playlists.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-sm text-slate-600">
            No playlists are trending yet. Ask a creator to start a queue and come back here.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlist/${playlist.id}`}
                className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 text-left shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-[0.28em] text-primary">Live queue</div>
                    <h3 className="mt-3 text-xl font-semibold text-slate-900">{playlist.name}</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    {playlist.totalVotes} votes
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Creator</div>
                    <div className="mt-1 font-medium text-slate-800">{playlist.creator.email}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Tracks</div>
                    <div className="mt-1 font-medium text-slate-800">{playlist.songCount}</div>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                    Open playlist
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
