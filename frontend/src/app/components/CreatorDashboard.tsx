"use client"
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Playlist {
    id: string;
    name: string;
    createdAt: Date;
    creatorId: string;
    songCount: number
    totalVotes: number;
}

export default function CreatorDashboard() {
    const {token} = useAuth();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const router = useRouter();
    const fetchPlaylists = async () => {
        try {
            setIsLoading(true);
            setErrorMessage("");
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/playlist/my-playlists` ,
                {
                    headers : {
                        Authorization : token
                    }
                }
            );
            setPlaylists(response.data.playlists ?? []);
        } catch (_err) {
            setErrorMessage("Failed to load playlists. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    const handlePlaylistClick = (playlistId: string) => {
        router.push(`/playlist/${playlistId}`);
    }

    useEffect(() => {
        fetchPlaylists();
    }, []);
    return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-semibold tracking-tight">Creator Dashboard</h1>
            <p className="text-sm text-muted-foreground">Your playlists at a glance</p>
        </div>

        {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading playlists…</div>
        ) : errorMessage ? (
            <div className="text-sm text-red-500">{errorMessage}</div>
        ) : playlists.length === 0 ? (
            <div className="text-sm text-muted-foreground">You have not created any playlists yet.</div>
        ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {playlists.map((playlist) => {
                    const createdAtLabel = new Date(playlist.createdAt as unknown as string).toLocaleDateString();
                    return (
                        <Card onClick={() => handlePlaylistClick(playlist.id)} key={playlist.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-base">{playlist.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="space-y-1">
                                        <div className="text-muted-foreground">Songs</div>
                                        <div className="font-medium">{playlist.songCount}</div>
                                    </div>
                                    <div className="h-10 w-px bg-border" />
                                    <div className="space-y-1">
                                        <div className="text-muted-foreground">Total votes</div>
                                        <div className="font-medium">{playlist.totalVotes}</div>
                                    </div>
                                    <div className="h-10 w-px bg-border" />
                                    <div className="space-y-1 text-right">
                                        <div className="text-muted-foreground">Created</div>
                                        <div className="font-medium">{createdAtLabel}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        )}
    </div>
    )
}