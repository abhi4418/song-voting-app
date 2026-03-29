import z from "zod";

const youtubeUrlSchema = z.string().url("Please provide a valid URL").refine((value) => {
  try {
    const parsedUrl = new URL(value);
    const host = parsedUrl.hostname.toLowerCase();

    return [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtu.be",
      "youtube-nocookie.com",
      "www.youtube-nocookie.com",
    ].includes(host);
  } catch (_error) {
    return false;
  }
}, "Only YouTube links are allowed");

export const signUpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(320, "Email is too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(72, "Password is too long"),
  role: z.enum(["USER", "CREATOR"]),
});

export const signInSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(320, "Email is too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(72, "Password is too long"),
  role: z.enum(["USER", "CREATOR"]),
});

export const createPlaylistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(80, "Name must be 80 characters or fewer"),
});

export const searchSongSchema = z.object({
  songName: z
    .string()
    .trim()
    .min(2, "Song name must be at least 2 characters long")
    .max(100, "Song name must be 100 characters or fewer"),
});

export const addSongSchema = z.object({
  playlistId: z.string().trim().min(1, "Playlist id is required"),
  title: z
    .string()
    .trim()
    .min(1, "Title must be at least 1 character long")
    .max(200, "Title must be 200 characters or fewer"),
  thumbNailUrl: z.string().url("Please provide a valid thumbnail URL"),
  duration: z
    .number()
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1")
    .max(7200, "Duration is too long"),
  url: youtubeUrlSchema,
});

export const likeSongSchema = z.object({
  songId: z.string().trim().min(1, "Song id is required"),
  playlistId: z.string().trim().min(1, "Playlist id is required"),
});

export type SignUpType = z.infer<typeof signUpSchema>;
export type SignInType = z.infer<typeof signInSchema>;
export type CreatePlaylistType = z.infer<typeof createPlaylistSchema>;
export type SearchSongType = z.infer<typeof searchSongSchema>;
export type AddSongType = z.infer<typeof addSongSchema>;
export type LikeSongType = z.infer<typeof likeSongSchema>;
