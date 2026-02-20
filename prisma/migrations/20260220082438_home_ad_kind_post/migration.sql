-- AlterTable
ALTER TABLE "home_ads" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'ETC',
ADD COLUMN     "postId" INTEGER;

-- CreateIndex
CREATE INDEX "home_ads_postId_idx" ON "home_ads"("postId");

-- AddForeignKey
ALTER TABLE "home_ads" ADD CONSTRAINT "home_ads_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
