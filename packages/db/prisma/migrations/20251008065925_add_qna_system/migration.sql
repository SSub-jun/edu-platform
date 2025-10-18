-- CreateTable
CREATE TABLE "qna_posts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qna_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qna_replies" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qna_replies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "qna_posts_userId_idx" ON "qna_posts"("userId");

-- CreateIndex
CREATE INDEX "qna_posts_createdAt_idx" ON "qna_posts"("createdAt");

-- CreateIndex
CREATE INDEX "qna_replies_postId_idx" ON "qna_replies"("postId");

-- AddForeignKey
ALTER TABLE "qna_posts" ADD CONSTRAINT "qna_posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qna_replies" ADD CONSTRAINT "qna_replies_postId_fkey" FOREIGN KEY ("postId") REFERENCES "qna_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qna_replies" ADD CONSTRAINT "qna_replies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
