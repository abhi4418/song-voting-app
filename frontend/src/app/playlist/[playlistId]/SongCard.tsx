"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";
import { ExternalLink, Heart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface ApiSong {
  id: string;
  title: string;
  thumbNailUrl: string | null;
  duration: number;
  url: string;
  likes: { userId: string }[];
}

type LikeSongResponse = {
  liked: boolean;
};

interface SongCardProps {
  song: ApiSong;
  playlistId: string;
  isOwner: boolean;
  token: string | null;
  onAfterChange?: () => void;
  currentUserId?: string | null;
}

export default function SongCard({
  song,
  playlistId,
  isOwner,
  token,
  onAfterChange,
  currentUserId,
}: SongCardProps) {
  const [liked, setLiked] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const votes = song.likes?.length ?? 0;
  const durationMinutes = Math.floor((song.duration ?? 0) / 60);
  const durationSeconds = Math.floor((song.duration ?? 0) % 60)
    .toString()
    .padStart(2, "0");
  const displayDuration = `${durationMinutes}:${durationSeconds}`;
  const imageSrc = song.thumbNailUrl || "/next.svg";

  useEffect(() => {
    setLiked(Boolean(currentUserId && song.likes.some((like) => like.userId === currentUserId)));
  }, [currentUserId, song.likes]);

  const handleVote = async () => {
    if (!token) {
      return;
    }

    try {
      setIsVoting(true);
      const response = await apiRequest<LikeSongResponse>("/api/song/like-song", {
        method: "POST",
        token,
        json: {
          songId: song.id,
          playlistId,
        },
      });

      setLiked(response.liked);
      onAfterChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update vote");
    } finally {
      setIsVoting(false);
    }
  };

  const handleDeleteSong = async () => {
    if (!token) {
      return;
    }

    try {
      setIsDeleting(true);
      await apiRequest(`/api/song/delete/${song.id}`, {
        method: "DELETE",
        token,
      });

      toast.success("Song removed from playlist");
      onAfterChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete song");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="overflow-hidden border-white/70 bg-white/85 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 p-4 sm:flex-row">
        <img
          src={imageSrc}
          alt={song.title}
          className="h-28 w-full rounded-2xl object-cover bg-slate-100 sm:h-24 sm:w-40"
        />
        <div className="min-w-0 flex-1">
          <CardHeader className="px-0 py-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="line-clamp-2 text-lg text-slate-900">{song.title}</CardTitle>
                <CardDescription className="mt-2 flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-slate-500">
                  <span>{displayDuration}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span>{votes} votes</span>
                </CardDescription>
              </div>
              <a
                href={song.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary"
              >
                Open
                <ExternalLink className="size-4" />
              </a>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={handleVote} size="sm" disabled={isVoting}>
                <Heart className="size-4" />
                {isVoting ? "Saving..." : liked ? "Voted" : "Vote"}
              </Button>
              {isOwner ? (
                <Button variant="destructive" size="sm" type="button" onClick={handleDeleteSong} disabled={isDeleting}>
                  <Trash2 className="size-4" />
                  {isDeleting ? "Removing..." : "Remove"}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
