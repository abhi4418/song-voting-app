import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";

type SongType = {
    title : string;
    thumbNailUrl : string;
    duration : number;
    url : string;
}

interface SongSearchBarProps {
    onAdded?: () => void;
}

export default function SongSearchBar({ onAdded }: SongSearchBarProps) {
    const {playlistId} = useParams<{playlistId: string}>();
    const [debouncedInput , setDebouncedInput] = useState("");
    const [songs , setSongs] = useState<SongType[]>([]);
    const [loading , setLoading] = useState(false);
    useEffect(()=>{
        const trimmed = debouncedInput.trim();
        if (trimmed.length < 2) {
            // Do not search on mount or for very short/empty input
            setSongs([]);
            setLoading(false);
            return;
        }

        const timer = setTimeout(()=>{
            const fetchSongs = async ()=>{
                try {
                    setLoading(true);
                    const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/song/search` , {
                        songName : trimmed
                    } , {
                        headers : {
                            Authorization : `${localStorage.getItem("token")}`
                        }
                    })
                    setSongs(response.data.songs);
                } catch (error) {
                    toast.error("Failed to search songs");
                } finally {
                    setLoading(false);
                }
            }
            fetchSongs();
        },400)

        return ()=>clearTimeout(timer);
    },[debouncedInput])

    const handleAddSong = async (song: SongType) => {
        // this should also be added in playlist so refresh is not needed
        const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/song/add-song` , {
            playlistId : playlistId,
            title : song.title,
            thumbNailUrl : song.thumbNailUrl,
            duration : song.duration,
            url : song.url
        } , {
            headers : {
                Authorization : `${localStorage.getItem("token")}`
            }
        })
        if(response.data.success){
            toast.success("Song added successfully");
            setSongs([]);
            onAdded?.();
        }
    }

    const formatDuration = (totalSeconds: number): string => {
        if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    return (
        <div className="w-full max-w-md">
            <div className="flex items-center gap-2">
                <Input
                    type="text"
                    placeholder="Search"
                    value={debouncedInput}
                    onChange={(e)=>setDebouncedInput(e.target.value)}
                    className="h-9 text-sm px-3 rounded-full"
                />
                <Button type="button" className="h-9 w-9 p-0 rounded-full" aria-label="Search">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 4.243 11.93l3.788 3.789a.75.75 0 1 0 1.06-1.06l-3.789-3.789A6.75 6.75 0 0 0 10.5 3.75Zm-5.25 6.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z" clipRule="evenodd" />
                    </svg>
                </Button>
            </div>
            {loading && (
                <div className="mt-3 space-y-2">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            )}
            {songs.length > 0 && (
                <div className="mt-3 space-y-2">
                    {songs.map((song)=>(
                        <div onClick={()=>handleAddSong(song)} key={song.title} className="flex items-center gap-3 cursor-pointer">
                            <img src={song.thumbNailUrl} alt={song.title} className="w-10 h-10 object-cover rounded" />
                            <div className="text-sm">
                                <p className="font-medium leading-tight line-clamp-1">{song.title}</p>
                                <p className="text-xs text-muted-foreground">{formatDuration(song.duration)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}