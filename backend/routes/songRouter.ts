import { Role } from "@prisma/client";
import express from "express";
import yts from "yt-search";
import { addSongSchema, likeSongSchema, searchSongSchema } from "../../common/authTypes";
import prisma from "../db";

const songRouter = express.Router();

type SongType = {
  title: string;
  thumbNailUrl: string;
  duration: number;
  url: string;
};

songRouter.post("/search", async (req, res) => {
  try {
    const songName = typeof req.body?.songName === "string" ? req.body.songName.trim() : "";
    const parsed = searchSongSchema.safeParse({ songName });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid song search",
      });
    }

    const { songName: validSongName } = parsed.data;

    const songs: SongType[] = [];
    const searchResponse = await yts(validSongName);

    for (const video of searchResponse.videos.slice(0, 10)) {
      songs.push({
        title: video.title,
        thumbNailUrl: video.image,
        duration: video.seconds,
        url: video.url,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Songs fetched successfully",
      songs,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

songRouter.post("/add-song", async (req, res) => {
  try {
    const { playlistId, title, thumbNailUrl, duration, url } = req.body;
    const parsed = addSongSchema.safeParse({ playlistId, title, thumbNailUrl, duration, url });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid song data",
      });
    }

    const validSong = parsed.data;

    const playlist = await prisma.playlist.findUnique({
      where: {
        id: validSong.playlistId,
      },
      select: {
        id: true,
      },
    });

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    const existingSong = await prisma.song.findFirst({
      where: {
        playlistId: validSong.playlistId,
        url: validSong.url,
      },
      select: {
        id: true,
      },
    });

    if (existingSong) {
      return res.status(409).json({
        success: false,
        message: "This song is already in the playlist",
      });
    }

    const song = await prisma.song.create({
      data: {
        playlistId: validSong.playlistId,
        title: validSong.title,
        thumbNailUrl: validSong.thumbNailUrl,
        duration: validSong.duration,
        url: validSong.url,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Song added successfully",
      song,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

songRouter.post("/like-song", async (req, res) => {
  try {
    const { songId, playlistId } = req.body;
    const parsed = likeSongSchema.safeParse({ songId, playlistId });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid like request",
      });
    }

    const validLike = parsed.data;

    const song = await prisma.song.findFirst({
      where: {
        id: validLike.songId,
        playlistId: validLike.playlistId,
      },
      select: {
        id: true,
      },
    });

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found in this playlist",
      });
    }

    const existingLike = await prisma.likes.findFirst({
      where: {
        userId: req.userId,
        songId: validLike.songId,
        playlistId: validLike.playlistId,
      },
    });

    if (existingLike) {
      await prisma.likes.delete({
        where: { id: existingLike.id },
      });

      return res.status(200).json({
        success: true,
        message: "Song disliked successfully",
        liked: false,
      });
    }

    const like = await prisma.likes.create({
      data: {
        songId: validLike.songId,
        playlistId: validLike.playlistId,
        userId: req.userId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Song liked successfully",
      liked: true,
      like,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

songRouter.get("/trending", async (_req, res) => {
  try {
    const songs = await prisma.song.findMany({
      include: {
        likes: true,
        playlist: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        likes: {
          _count: "desc",
        },
      },
      take: 20,
    });

    return res.status(200).json({
      success: true,
      message: "Trending songs fetched successfully",
      songs,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

songRouter.delete("/delete/:songId", async (req, res) => {
  try {
    if (req.role !== Role.CREATOR) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete songs",
      });
    }

    const song = await prisma.song.findFirst({
      where: {
        id: req.params.songId,
      },
      include: {
        playlist: true,
      },
    });

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    if (song.playlist.creatorId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this song",
      });
    }

    const recordAsPlayed = req.query.recordAsPlayed === "true";

    if (recordAsPlayed) {
      await prisma.playedSong.create({
        data: {
          playlistId: song.playlistId,
          title: song.title,
          thumbNailUrl: song.thumbNailUrl,
          duration: song.duration,
          url: song.url,
        },
      });
    }

    await prisma.likes.deleteMany({
      where: {
        songId: req.params.songId,
      },
    });

    await prisma.song.delete({
      where: {
        id: req.params.songId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Song deleted successfully",
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default songRouter;
