"use client"
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import {use , useEffect, useMemo, useRef, useState} from 'react'
import SongSearchBar from '@/app/components/SongSearchBar';
import SongCard, { ApiSong } from './SongCard'
import YouTubePlayer from 'youtube-player'

interface ApiSongLocal extends ApiSong {}

export default function PlaylistPage({ params }: { params: Promise<{ playlistId: string }> }) {
    const { isLoading , user, token } = useAuth();
    const { playlistId } = use(params);
    const [songs, setSongs] = useState<ApiSongLocal[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [creatorId, setCreatorId] = useState<string | null>(null);
    const playerContainerRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<ReturnType<typeof YouTubePlayer> | null>(null);
    const songsRef = useRef<ApiSongLocal[]>([]);
    const isOwnerRef = useRef<boolean>(false);
    const currentTopSongIdRef = useRef<string | null>(null);
    const [currentVideoTitle, setCurrentVideoTitle] = useState<string>("");

    const isOwner = useMemo(() => {
        if(!user || !creatorId) return false;
        return user.id === creatorId;
    }, [user, creatorId]);

    
    const fetchPlayListData = async () => {
        try {
            setError(null);
            setLoading(true);
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/playlist/songs-sorted/${playlistId}` , {
                headers : {
                    Authorization : `${localStorage.getItem("token")}`
                }
            })
            const fetched = response.data.songs as ApiSong[];
            setSongs(fetched);
        } catch (e) {
            setError('Failed to load playlist');
        } finally {
            setLoading(false);
        }
    }

    const fetchPlaylistDetails = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/playlist/details/${playlistId}` , {
                headers : {
                    Authorization : token || `${localStorage.getItem("token")}`
                }
            })
            if(response.data?.playlist?.creatorId){
                setCreatorId(response.data.playlist.creatorId);
            }
        } catch (_e) {
            // ignore details error; not critical for non-owners
        }
    }

    useEffect(() => {
        fetchPlayListData();
        fetchPlaylistDetails();
    }, [playlistId]);

    // Helper: extract YouTube video ID from a URL
    const extractYouTubeId = (url: string | undefined | null): string | null => {
        if (!url) return null;
        try {
            const u = new URL(url);
            if (u.hostname.includes('youtu.be')) {
                return u.pathname.replace('/', '') || null;
            }
            if (u.hostname.includes('youtube.com') || u.hostname.includes('youtube-nocookie.com')) {
                const v = u.searchParams.get('v');
                if (v) return v;
                const pathParts = u.pathname.split('/');
                const idx = pathParts.findIndex((p) => p === 'embed');
                if (idx >= 0 && pathParts[idx + 1]) return pathParts[idx + 1];
            }
        } catch (_e) {
            return null;
        }
        return null;
    };

    // Helper: pick the song with the highest likes
    const getTopLikedSong = (list: ApiSongLocal[]): ApiSongLocal | null => {
        if (!Array.isArray(list) || list.length === 0) return null;
        return list.reduce((top, cur) => {
            const topLikes = Array.isArray(top.likes) ? top.likes.length : 0;
            const curLikes = Array.isArray(cur.likes) ? cur.likes.length : 0;
            return curLikes > topLikes ? cur : top;
        });
    };

    // Keep refs in sync for stable event handlers
    useEffect(() => {
        songsRef.current = songs;
        isOwnerRef.current = isOwner;
        const top = getTopLikedSong(songs);
        currentTopSongIdRef.current = top?.id || null;
    }, [songs, isOwner]);

    const deleteSongById = async (songId: string) => {
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/song/delete/${songId}`, {
                headers: { Authorization: `${localStorage.getItem('token')}` }
            });
            await fetchPlayListData();
        } catch (_e) {
            // swallow; UI will reflect on next refresh/like
        }
    };

    const skipCurrentTopSong = async () => {
        const top = getTopLikedSong(songsRef.current || []);
        if (!top) return;
        if (!isOwnerRef.current) return; // safety: only owner can mutate backend
        await deleteSongById(top.id);
        const nextTop = getTopLikedSong(songsRef.current || []);
        const nextVideoId = extractYouTubeId(nextTop?.url);
        if (playerRef.current && nextVideoId) {
            playerRef.current.loadVideoById(nextVideoId);
            setCurrentVideoTitle(nextTop?.title || "");
        }
    };


    useEffect(() => {
        // Only creators should initialize and control the player
        if (!isOwner) {
            setCurrentVideoTitle("");
            return;
        }

        const topSong = getTopLikedSong(songs);
        const videoId = extractYouTubeId(topSong?.url);
        setCurrentVideoTitle(topSong?.title || "");

        if (!playerContainerRef.current) return;

        // Create player once and bind end event
        if (!playerRef.current) {
            if (!videoId) return; // nothing to play yet
            const player = YouTubePlayer(playerContainerRef.current, {
                videoId,
                playerVars: {
                    rel: 0,
                    modestbranding: 1,
                },
            });
            playerRef.current = player;

            // 0 === ended per YT IFrame API
            player.on('stateChange', (event: any) => {
                if (event?.data === 0) {
                    // Only playlist owner should perform backend removal and advance
                    if (isOwnerRef.current && currentTopSongIdRef.current) {
                        // Fire and forget; UI will refetch and advance
                        deleteSongById(currentTopSongIdRef.current).then(() => {
                            const nextTop = getTopLikedSong(songsRef.current || []);
                            const nextVideoId = extractYouTubeId(nextTop?.url);
                            if (nextVideoId && playerRef.current) {
                                playerRef.current.loadVideoById(nextVideoId);
                                setCurrentVideoTitle(nextTop?.title || "");
                            }
                        });
                    }
                }
            });
            return;
        }

        if (videoId) {
            // Autoplay current top song when list changes
            playerRef.current.loadVideoById(videoId);
        }
    }, [songs, isOwner]);

    useEffect(() => {
        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, []);

    if(isLoading){
        return <div>Loading...</div>
    }

    return  (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">Playlist</h1>
                <h2 className="text-sm text-muted-foreground">Created by {user?.email}</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                    <div className="mb-6">
                        <SongSearchBar onAdded={fetchPlayListData} />
                    </div>

                    {error ? (
                        <div className="text-destructive">{error}</div>
                    ) : null}

                    {loading ? (
                        <div className="grid grid-cols-1 gap-4">
                            {Array.from({ length: 8 }).map((_, idx) => (
                                <div key={idx} className="h-24 animate-pulse rounded-xl border" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {songs.map((song) => (
                                <SongCard
                                    key={song.id}
                                    song={song}
                                    playlistId={playlistId}
                                    isOwner={isOwner}
                                    onAfterChange={fetchPlayListData}
                                    currentUserId={user?.id || null}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {isOwner ? (
                    <div className="hidden md:block">
                        <div className="sticky top-8 rounded-xl border p-4">
                            <div className="mb-2 text-sm font-medium text-muted-foreground">Now Playing</div>
                            <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
                                <div ref={playerContainerRef} className="h-full w-full" />
                            </div>
                            <button
                                onClick={skipCurrentTopSong}
                                className="mt-3 inline-flex items-center rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90"
                            >
                                Skip current song
                            </button>
                            {currentVideoTitle ? (
                                <div className="mt-3 line-clamp-2 text-sm">{currentVideoTitle}</div>
                            ) : (
                                <div className="mt-3 text-xs text-muted-foreground">Most liked song will appear here.</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="hidden md:block">
                        <div className="sticky top-8 rounded-xl border p-4">
                            <div className="mb-2 text-sm font-medium text-muted-foreground">Playback</div>
                            <div className="rounded-md border bg-muted p-3 text-xs text-muted-foreground">
                                Only the playlist creator can control playback. You can add songs and like/dislike to vote the next track.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}