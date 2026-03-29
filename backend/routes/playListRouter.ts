import { Role } from "@prisma/client";
import express from "express";
import { createPlaylistSchema } from "../../common/authTypes";
import prisma from "../db";

const playListRouter = express.Router();

playListRouter.post("/create", async (req, res) => {
  try {
    if (req.role !== Role.CREATOR) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create a playlist",
      });
    }

    const creatorId = req.userId;
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const parsed = createPlaylistSchema.safeParse({ name });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid playlist name",
      });
    }

    const playlist = await prisma.playlist.create({
      data: {
        name,
        creatorId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Playlist created successfully",
      playlist,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

playListRouter.get("/details/:playlistId", async (req, res) => {
  try {
    const playlistId = req.params.playlistId;
    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId },
      select: {
        id: true,
        name: true,
        creatorId: true,
        createdAt: true,
        creator: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Playlist details fetched successfully",
      playlist,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

playListRouter.get("/songs-sorted/:playlistId", async (req, res) => {
  try {
    const playlistId = req.params.playlistId;
    const playlist = await prisma.playlist.findUnique({
      where: {
        id: playlistId,
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

    const songs = await prisma.song.findMany({
      where: {
        playlistId,
      },
      include: {
        likes: true,
      },
      orderBy: {
        likes: {
          _count: "desc",
        },
      },
      take: 100,
    });

    const sanitizedSongs = songs.map((song) => ({
      ...song,
      likes: song.likes.map((like) => ({
        userId: like.userId,
      })),
    }));

    return res.status(200).json({
      success: true,
      message: "Songs fetched successfully",
      songs: sanitizedSongs,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

playListRouter.get("/trending", async (_req, res) => {
  try {
    const playlists = await prisma.playlist.findMany({
      include: {
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
        songs: {
          include: {
            likes: true,
          },
        },
      },
    });

    const playlistsWithStats = playlists
      .map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        createdAt: playlist.createdAt,
        creatorId: playlist.creatorId,
        creator: playlist.creator,
        songCount: playlist.songs.length,
        totalVotes: playlist.songs.reduce((total, song) => total + song.likes.length, 0),
      }))
      .sort((a, b) => b.totalVotes - a.totalVotes)
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      message: "Playlists fetched successfully",
      playlists: playlistsWithStats,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

playListRouter.get("/my-playlists", async (req, res) => {
  try {
    const playlists = await prisma.playlist.findMany({
      where: {
        creatorId: req.userId,
      },
      include: {
        songs: {
          include: {
            likes: true,
          },
        },
      },
    });

    const playlistsWithStats = playlists.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      createdAt: playlist.createdAt,
      creatorId: playlist.creatorId,
      songCount: playlist.songs.length,
      totalVotes: playlist.songs.reduce((total, song) => total + song.likes.length, 0),
    }));

    return res.status(200).json({
      success: true,
      message: "Playlists fetched successfully",
      playlists: playlistsWithStats,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

playListRouter.delete("/delete/:playlistId", async (req, res) => {
  try {
    if (req.role !== Role.CREATOR) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete playlists",
      });
    }

    const playlistId = req.params.playlistId;
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: playlistId,
        creatorId: req.userId,
      },
      select: {
        id: true,
      },
    });

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found or you don't have permission to delete it",
      });
    }

    await prisma.playlist.delete({
      where: {
        id: playlistId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Playlist deleted successfully",
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default playListRouter;
