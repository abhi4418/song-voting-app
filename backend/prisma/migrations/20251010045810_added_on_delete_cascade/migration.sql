-- DropForeignKey
ALTER TABLE "public"."Song" DROP CONSTRAINT "Song_playlistId_fkey";

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
