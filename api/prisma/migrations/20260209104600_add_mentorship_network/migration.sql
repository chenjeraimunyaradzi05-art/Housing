-- CreateTable
CREATE TABLE "mentor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "expertise" TEXT[],
    "yearsExperience" INTEGER NOT NULL,
    "languages" TEXT[] DEFAULT ARRAY['en']::TEXT[],
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "availability" TEXT NOT NULL DEFAULT 'available',
    "maxMentees" INTEGER NOT NULL DEFAULT 3,
    "currentMentees" INTEGER NOT NULL DEFAULT 0,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "bio" TEXT,
    "linkedinUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorships" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeUserId" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "goals" TEXT[],
    "focusAreas" TEXT[],
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "progressNotes" TEXT,
    "milestones" TEXT[],
    "rating" INTEGER,
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentorships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_sessions" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "mentorshipId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "type" TEXT NOT NULL DEFAULT 'video',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "topic" TEXT,
    "notes" TEXT,
    "recordingUrl" TEXT,
    "meetingUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_check_ins" (
    "id" TEXT NOT NULL,
    "mentorshipId" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "goalsProgress" TEXT,
    "challenges" TEXT,
    "nextSteps" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mentor_profiles_userId_key" ON "mentor_profiles"("userId");

-- CreateIndex
CREATE INDEX "mentorships_mentorId_idx" ON "mentorships"("mentorId");

-- CreateIndex
CREATE INDEX "mentorships_menteeUserId_idx" ON "mentorships"("menteeUserId");

-- CreateIndex
CREATE INDEX "mentor_sessions_mentorId_idx" ON "mentor_sessions"("mentorId");

-- CreateIndex
CREATE INDEX "mentor_sessions_mentorshipId_idx" ON "mentor_sessions"("mentorshipId");

-- CreateIndex
CREATE INDEX "mentor_sessions_scheduledAt_idx" ON "mentor_sessions"("scheduledAt");

-- CreateIndex
CREATE INDEX "mentor_check_ins_mentorshipId_idx" ON "mentor_check_ins"("mentorshipId");

-- AddForeignKey
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_sessions" ADD CONSTRAINT "mentor_sessions_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_sessions" ADD CONSTRAINT "mentor_sessions_mentorshipId_fkey" FOREIGN KEY ("mentorshipId") REFERENCES "mentorships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_check_ins" ADD CONSTRAINT "mentor_check_ins_mentorshipId_fkey" FOREIGN KEY ("mentorshipId") REFERENCES "mentorships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
