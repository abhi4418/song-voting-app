"use client";

import SongSearchBar from "@/app/components/SongSearchBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { Music2, SkipForward } from "lucide-react";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import SongCard, { type ApiSong } from "./SongCard";
import YouTubePlayer from "youtube-player";

type PlaylistDetails = {
  id: string;
  name: string;
  creatorId: string;
  createdAt: string;
  creator: {
    email: string;
  };
};

type PlaylistDetailsResponse = {
  playlist: PlaylistDetails;
};

type SongsResponse = {
  songs: ApiSong[];
};

type PendingSwitchSong = {
  id: string;
  title: string;
  url: string;
};

export default function PlaylistPage({ params }: { params: Promise<{ playlistId: string }> }) {
  const { isLoading, user, token } = useAuth();
  const { playlistId } = use(params);
  const [songs, setSongs] = useState<ApiSong[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistDetails | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState("");
  const [pendingSwitchSong, setPendingSwitchSong] = useState<PendingSwitchSong | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<ReturnType<typeof YouTubePlayer> | null>(null);
  const songsRef = useRef<ApiSong[]>([]);
  const isOwnerRef = useRef(false);
  const activePlayerSongIdRef = useRef<string | null>(null);

  const isOwner = useMemo(() => {
    if (!user || !playlist?.creatorId) {
      return false;
    }

    return user.id === playlist.creatorId;
  }, [playlist?.creatorId, user]);

  const extractYouTubeId = (url: string | undefined | null): string | null => {
    if (!url) {
      return null;
    }

    try {
      const parsedUrl = new URL(url);

      if (parsedUrl.hostname.includes("youtu.be")) {
        return parsedUrl.pathname.replace("/", "") || null;
      }

      if (
        parsedUrl.hostname.includes("youtube.com") ||
        parsedUrl.hostname.includes("youtube-nocookie.com")
      ) {
        const videoId = parsedUrl.searchParams.get("v");

        if (videoId) {
          return videoId;
        }

        const pathParts = parsedUrl.pathname.split("/");
        const embedIndex = pathParts.findIndex((part) => part === "embed");
        if (embedIndex >= 0 && pathParts[embedIndex + 1]) {
          return pathParts[embedIndex + 1];
        }
      }
    } catch (_error) {
      return null;
    }

    return null;
  };

  const getTopLikedSong = (list: ApiSong[]): ApiSong | null => {
    if (!Array.isArray(list) || list.length === 0) {
      return null;
    }

    return list.reduce((top, current) => {
      const topLikes = Array.isArray(top.likes) ? top.likes.length : 0;
      const currentLikes = Array.isArray(current.likes) ? current.likes.length : 0;
      return currentLikes > topLikes ? current : top;
    });
  };

  const fetchPlayListData = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setError(null);
      setLoadingSongs(true);
      const response = await apiRequest<SongsResponse>(`/api/playlist/songs-sorted/${playlistId}`, {
        method: "GET",
        token,
      });

      setSongs(response.songs ?? []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load playlist");
    } finally {
      setLoadingSongs(false);
    }
  }, [playlistId, token]);

  const fetchPlaylistDetails = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const response = await apiRequest<PlaylistDetailsResponse>(`/api/playlist/details/${playlistId}`, {
        method: "GET",
        token,
      });

      setPlaylist(response.playlist);
    } catch (_error) {
      setPlaylist(null);
    }
  }, [playlistId, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    void fetchPlayListData();
    void fetchPlaylistDetails();
  }, [fetchPlayListData, fetchPlaylistDetails, token]);

  useEffect(() => {
    songsRef.current = songs;
    isOwnerRef.current = isOwner;
    const topSong = getTopLikedSong(songs);

    if (!topSong || topSong.id === activePlayerSongIdRef.current) {
      setPendingSwitchSong(null);
      return;
    }

    if (activePlayerSongIdRef.current && isOwner) {
      setPendingSwitchSong({
        id: topSong.id,
        title: topSong.title,
        url: topSong.url,
      });
    }
  }, [isOwner, songs]);

  const playSong = useCallback((song: PendingSwitchSong | ApiSong | null) => {
    if (!song || !playerRef.current) {
      return;
    }

    const nextVideoId = extractYouTubeId(song.url);

    if (!nextVideoId) {
      return;
    }

    playerRef.current.loadVideoById(nextVideoId);
    activePlayerSongIdRef.current = song.id;
    setCurrentVideoTitle(song.title);
    setPendingSwitchSong(null);
  }, []);

  const deleteSongById = useCallback(
    async (songId: string) => {
      if (!token) {
        return;
      }

      await apiRequest(`/api/song/delete/${songId}`, {
        method: "DELETE",
        token,
      });
      await fetchPlayListData();
    },
    [fetchPlayListData, token]
  );

  const skipCurrentTopSong = async () => {
    const activeSongId = activePlayerSongIdRef.current;

    if (!activeSongId || !isOwnerRef.current) {
      return;
    }

    await deleteSongById(activeSongId);
    const nextTop = getTopLikedSong(songsRef.current);
    if (nextTop) {
      playSong(nextTop);
    }
  };

  const handleKeepCurrentSong = () => {
    setPendingSwitchSong(null);
  };

  const handleSwitchToTopSong = () => {
    playSong(pendingSwitchSong);
  };

  useEffect(() => {
    if (!isOwner) {
      setCurrentVideoTitle("");
      setPendingSwitchSong(null);
      activePlayerSongIdRef.current = null;
      return;
    }

    const topSong = getTopLikedSong(songs);
    const videoId = extractYouTubeId(topSong?.url);

    if (!playerContainerRef.current || !topSong || !videoId) {
      activePlayerSongIdRef.current = null;
      setPendingSwitchSong(null);
      if (!topSong) {
        setCurrentVideoTitle("");
      }
      return;
    }

    if (!playerRef.current) {
      const player = YouTubePlayer(playerContainerRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
        },
      });

      playerRef.current = player;
      activePlayerSongIdRef.current = topSong.id;
      setCurrentVideoTitle(topSong.title);

      player.on("stateChange", (event: { data?: number }) => {
        if (event?.data === 0 && isOwnerRef.current && activePlayerSongIdRef.current) {
          void deleteSongById(activePlayerSongIdRef.current).then(() => {
            const nextTop = getTopLikedSong(songsRef.current);
            if (nextTop) {
              playSong(nextTop);
            }
          });
        }
      });
      return;
    }

    if (!activePlayerSongIdRef.current) {
      activePlayerSongIdRef.current = topSong.id;
      setCurrentVideoTitle(topSong.title);
    }
  }, [deleteSongById, isOwner, playSong, songs]);

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <ProtectedRoute>
      {isLoading ? (
        <div className="px-6 py-10">Loading playlist...</div>
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="grid gap-6 rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Playlist room
              </span>
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">{playlist?.name ?? "Playlist"}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  Hosted by {playlist?.creator.email ?? "the playlist creator"}. Add songs, vote on the queue,
                  and let the top track rise to the front.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <div className="rounded-full bg-slate-100 px-4 py-2">{songs.length} songs in queue</div>
                <div className="rounded-full bg-slate-100 px-4 py-2">
                  {songs.reduce((total, song) => total + song.likes.length, 0)} total votes
                </div>
                <div className="rounded-full bg-slate-100 px-4 py-2">
                  {isOwner ? "Creator controls enabled" : "Listener mode"}
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-amber-50 p-5 text-slate-900">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Music2 className="size-4" />
                Now playing
              </div>
              {isOwner ? (
                <>
                  <div className="mt-4 aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <div ref={playerContainerRef} className="h-full w-full" />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="text-sm text-slate-600">
                      {currentVideoTitle || "The highest-voted song will appear here once the queue has tracks."}
                    </div>
                    <Button type="button" variant="outline" onClick={skipCurrentTopSong} disabled={!songs.length}>
                      <SkipForward className="size-4" />
                      Skip
                    </Button>
                  </div>
                  {pendingSwitchSong ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700">
                      <div className="font-medium text-slate-900">
                        "{pendingSwitchSong.title}" is now the top-voted song.
                      </div>
                      <div className="mt-1">
                        Switch playback now, or keep the current song going and change later.
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <Button type="button" size="sm" onClick={handleSwitchToTopSong}>
                          Switch song
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={handleKeepCurrentSong}>
                          Keep current song
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600">
                  Only the playlist creator can control playback. You can still add songs and vote for the next track.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <SongSearchBar token={token} onAdded={fetchPlayListData} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Queued songs</h2>
                  <p className="text-sm text-slate-600">Sorted by votes so the next favorite rises to the top.</p>
                </div>
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              {loadingSongs ? (
                <div className="grid grid-cols-1 gap-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-28 animate-pulse rounded-[1.5rem] border border-white/60 bg-white/60" />
                  ))}
                </div>
              ) : songs.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 p-8 text-sm text-slate-600">
                  This playlist is empty right now. Search for a track on the left to start the queue.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {songs.map((song) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      playlistId={playlistId}
                      isOwner={isOwner}
                      token={token}
                      onAfterChange={fetchPlayListData}
                      currentUserId={user?.id ?? null}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
