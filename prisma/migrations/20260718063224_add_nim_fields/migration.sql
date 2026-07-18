-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "nimEvaluatedAt" TIMESTAMP(3),
ADD COLUMN     "nimFeedback" TEXT,
ADD COLUMN     "nimScore" DOUBLE PRECISION;
