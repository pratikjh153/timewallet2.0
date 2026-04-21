-- CreateTable
CREATE TABLE "UserSettings" (
    "id" SERIAL NOT NULL,
    "dayStart" TEXT NOT NULL,
    "dayEnd" TEXT NOT NULL,
    "dailyValue" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Work',
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyConfig" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "dailyValue" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "investmentGoal" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "goalHit" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DailyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_date_idx" ON "Task"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyConfig_date_key" ON "DailyConfig"("date");
