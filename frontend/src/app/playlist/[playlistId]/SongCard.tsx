"use client"
import { useState } from 'react'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export interface ApiSong {
    id: string;
    title: string;
    thumbNailUrl: string | null;
    duration: number;
    url: string;
    likes: { userId: string }[];
}

interface SongCardProps {
    song: ApiSong;
    playlistId: string;
    isOwner: boolean;
    onAfterChange?: () => void;
    currentUserId?: string | null;
}

export default function SongCard({ song, playlistId, isOwner, onAfterChange, currentUserId }: SongCardProps) {
    const initiallyLiked = Array.isArray(song.likes) && currentUserId
        ? song.likes.some((like) => like?.userId === currentUserId)
        : false
    const [liked, setLiked] = useState<boolean>(initiallyLiked)
    const votes = song.likes?.length ?? 0
    const durationMinutes = Math.floor((song.duration ?? 0) / 60)
    const durationSeconds = Math.floor((song.duration ?? 0) % 60)
        .toString()
        .padStart(2, '0')
    const displayDuration = `${durationMinutes}:${durationSeconds}`
    const imageSrc = song.thumbNailUrl || '/next.svg'

    const handleVote = async () => {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/song/like-song`, {
            songId: song.id,
            playlistId,
        }, {
            headers: {
                Authorization: `${localStorage.getItem("token")}`,
            },
        })
        setLiked(response.data.liked)
        if (response.data.success) {
            onAfterChange?.()
        }
    }

    const handleDeleteSong = async () => {
        await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/song/delete/${song.id}`, {
            headers: {
                Authorization: `${localStorage.getItem("token")}`,
            },
        })
        onAfterChange?.()
    }

    return (
        <Card className="overflow-hidden">
            <div className="flex items-center gap-3 p-3">
                <img
                    src={imageSrc}
                    alt={song.title}
                    className="h-20 w-36 flex-shrink-0 rounded object-cover bg-muted"
                />
                <div className="min-w-0 flex-1">
                    <CardHeader className="py-0 px-0">
                        <CardTitle className="line-clamp-1 text-base">{song.title}</CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-3 text-xs">
                            <span>{displayDuration}</span>
                            <span className="h-1 w-1 rounded-full bg-border" />
                            <span>{votes} votes</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 pb-0 pt-2">
                        <div className="flex items-center justify-between">
                            <Button onClick={handleVote} size="sm">
                                {liked ? "Liked" : "Like"}
                            </Button>
                            {isOwner ? (
                                <Button variant="destructive" size="sm" onClick={handleDeleteSong}>
                                    Delete
                                </Button>
                            ) : null}
                        </div>
                    </CardContent>
                </div>
            </div>
        </Card>
    )
}


