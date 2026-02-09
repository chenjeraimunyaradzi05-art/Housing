-- CreateTable
CREATE TABLE "social_hashtags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_hashtags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_post_hashtags" (
    "postId" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_post_hashtags_pkey" PRIMARY KEY ("postId","hashtagId")
);

-- CreateTable
CREATE TABLE "social_mentions" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "mentionedUserId" TEXT NOT NULL,
    "mentionerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_content_reports" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "reporterId" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "social_hashtags_name_key" ON "social_hashtags"("name");

-- CreateIndex
CREATE INDEX "social_hashtags_postCount_idx" ON "social_hashtags"("postCount" DESC);

-- CreateIndex
CREATE INDEX "social_mentions_mentionedUserId_idx" ON "social_mentions"("mentionedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "social_mentions_postId_mentionedUserId_key" ON "social_mentions"("postId", "mentionedUserId");

-- CreateIndex
CREATE INDEX "social_content_reports_status_idx" ON "social_content_reports"("status");

-- CreateIndex
CREATE INDEX "social_content_reports_postId_idx" ON "social_content_reports"("postId");

-- CreateIndex
CREATE INDEX "social_content_reports_commentId_idx" ON "social_content_reports"("commentId");

-- AddForeignKey
ALTER TABLE "social_post_hashtags" ADD CONSTRAINT "social_post_hashtags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_hashtags" ADD CONSTRAINT "social_post_hashtags_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "social_hashtags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_mentions" ADD CONSTRAINT "social_mentions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_mentions" ADD CONSTRAINT "social_mentions_mentionedUserId_fkey" FOREIGN KEY ("mentionedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_mentions" ADD CONSTRAINT "social_mentions_mentionerId_fkey" FOREIGN KEY ("mentionerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_content_reports" ADD CONSTRAINT "social_content_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_content_reports" ADD CONSTRAINT "social_content_reports_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_content_reports" ADD CONSTRAINT "social_content_reports_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "social_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_content_reports" ADD CONSTRAINT "social_content_reports_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
