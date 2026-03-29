"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { Clock3, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface Playlist {
  id: string;
  name: string;
  createdAt: string;
  creatorId: string;
  songCount: number;
  totalVotes: number;
}

interface PlayedSong {
  id: string;
  playlistId: string;
  playlistName: string;
  title: string;
  thumbNailUrl: string;
  duration: number;
  url: string;
  playedAt: string;
}

type PlaylistsResponse = {
  playlists: Playlist[];
};

type PlayedSongsResponse = {
  playedSongs: PlayedSong[];
};

type CreatePlaylistResponse = {
  playlist: Playlist;
  message: string;
};

export default function CreatorDashboard() {
  const { token } = useAuth();
  const [playlistName, setPlaylistName] = useState("");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playedSongs, setPlayedSongs] = useState<PlayedSong[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const fetchPlaylists = useCallback(async () => {
    if (!token) {
      setPlaylists([]);
      setPlayedSongs([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [playlistsResponse, playedSongsResponse] = await Promise.all([
        apiRequest<PlaylistsResponse>("/api/playlist/my-playlists", {
          method: "GET",
          token,
        }),
        apiRequest<PlayedSongsResponse>("/api/playlist/played-history", {
          method: "GET",
          token,
        }),
      ]);

      setPlaylists(playlistsResponse.playlists ?? []);
      setPlayedSongs(playedSongsResponse.playedSongs ?? []);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load playlists.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchPlaylists();
  }, [fetchPlaylists]);

  const handleCreatePlaylist = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    try {
      setIsCreating(true);
      const response = await apiRequest<CreatePlaylistResponse>("/api/playlist/create", {
        method: "POST",
        token,
        json: {
          name: playlistName,
        },
      });

      setPlaylistName("");
      toast.success(response.message);
      await fetchPlaylists();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create playlist");
    } finally {
      setIsCreating(false);
    }
  };

  const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${seconds}`;
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-5 rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Creator studio
          </span>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-slate-900">Manage your live queues</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Create a playlist, share it with your audience, and let the votes decide the next track.
            </p>
          </div>
        </div>

        <Card className="border-amber-100 bg-gradient-to-br from-amber-50 via-white to-cyan-50 shadow-none">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">Create a new playlist</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreatePlaylist}>
              <Input
                value={playlistName}
                onChange={(event) => setPlaylistName(event.target.value)}
                placeholder="Weekend rooftop set"
                className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                maxLength={80}
              />
              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? "Creating playlist..." : "Create playlist"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Your playlists</h2>
          <p className="text-sm text-slate-600">Open a queue to add songs, manage playback, and moderate the list.</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-44 animate-pulse rounded-[1.5rem] border border-white/60 bg-white/60" />
            ))}
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div>
        ) : playlists.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-sm text-slate-600">
            You have not created any playlists yet. Start with a short title above and your dashboard will fill in here.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {playlists.map((playlist) => {
              const createdAtLabel = new Date(playlist.createdAt).toLocaleDateString();

              return (
                <button
                  type="button"
                  onClick={() => router.push(`/playlist/${playlist.id}`)}
                  key={playlist.id}
                  className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 text-left shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-[0.28em] text-primary">Playlist</div>
                      <h3 className="mt-3 text-xl font-semibold text-slate-900">{playlist.name}</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                      {playlist.totalVotes} votes
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-2xl bg-slate-100 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Songs</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">{playlist.songCount}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-100 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Votes</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">{playlist.totalVotes}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-100 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Created</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{createdAtLabel}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="size-5 text-primary" />
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Played songs</h2>
            <p className="text-sm text-slate-600">A recent log of tracks that were actually played from your queues.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-[1.5rem] border border-white/60 bg-white/60" />
            ))}
          </div>
        ) : playedSongs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-sm text-slate-600">
            No played songs yet. Once tracks finish or are skipped from a live queue, they'll show up here.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {playedSongs.map((song) => (
              <Card key={song.id} className="border-white/70 bg-white/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                <CardContent className="flex gap-4 p-4">
                  <img
                    src={song.thumbNailUrl}
                    alt={song.title}
                    className="h-20 w-28 rounded-2xl object-cover bg-slate-100"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
                      {song.playlistName}
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-base font-semibold text-slate-900">{song.title}</h3>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <Clock3 className="size-4" />
                      <span>{new Date(song.playedAt).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">{formatDuration(song.duration)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
