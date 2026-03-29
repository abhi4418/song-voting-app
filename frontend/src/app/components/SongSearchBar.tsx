"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type SongType = {
  title: string;
  thumbNailUrl: string;
  duration: number;
  url: string;
};

type SearchSongsResponse = {
  songs: SongType[];
};

interface SongSearchBarProps {
  token: string | null;
  onAdded?: () => void;
}

export default function SongSearchBar({ token, onAdded }: SongSearchBarProps) {
  const { playlistId } = useParams<{ playlistId: string }>();
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<SongType[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingUrl, setAddingUrl] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2 || !token) {
      setSongs([]);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(() => {
      const fetchSongs = async () => {
        try {
          setLoading(true);
          const response = await apiRequest<SearchSongsResponse>("/api/song/search", {
            method: "POST",
            token,
            json: {
              songName: trimmed,
            },
          });

          setSongs(response.songs ?? []);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to search songs");
        } finally {
          setLoading(false);
        }
      };

      void fetchSongs();
    }, 400);

    return () => window.clearTimeout(timer);
  }, [query, token]);

  const handleAddSong = async (song: SongType) => {
    if (!playlistId || !token) {
      return;
    }

    try {
      setAddingUrl(song.url);
      await apiRequest("/api/song/add-song", {
        method: "POST",
        token,
        json: {
          playlistId,
          title: song.title,
          thumbNailUrl: song.thumbNailUrl,
          duration: song.duration,
          url: song.url,
        },
      });

      toast.success("Song added successfully");
      setSongs([]);
      setQuery("");
      onAdded?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add song");
    } finally {
      setAddingUrl(null);
    }
  };

  const formatDuration = (totalSeconds: number): string => {
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
      return "0:00";
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">Add a song</h3>
        <p className="text-sm text-slate-600">Search YouTube and add a track to this playlist.</p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Input
          type="text"
          placeholder="Search by song title or artist"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-11 rounded-full px-4"
        />
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : null}

      {songs.length > 0 ? (
        <div className="mt-4 space-y-3">
          {songs.map((song) => (
            <div
              key={song.url}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
            >
              <img src={song.thumbNailUrl} alt={song.title} className="h-14 w-20 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-medium text-slate-900">{song.title}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDuration(song.duration)}</p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => handleAddSong(song)}
                disabled={addingUrl === song.url}
              >
                {addingUrl === song.url ? "Adding..." : "Add"}
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
