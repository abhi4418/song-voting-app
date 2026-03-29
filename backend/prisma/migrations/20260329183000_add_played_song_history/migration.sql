-- CreateTable
CREATE TABLE "PlayedSong" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thumbNailUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayedSong_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayedSong_playlistId_playedAt_idx" ON "PlayedSong"("playlistId", "playedAt");

-- AddForeignKey
ALTER TABLE "PlayedSong" ADD CONSTRAINT "PlayedSong_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
