-- AlterTable
ALTER TABLE "lich_su_phieu" ADD COLUMN     "trace_id" VARCHAR(100);

-- CreateTable
CREATE TABLE "ma_phieu_sequence" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "year" INTEGER NOT NULL,
    "last_id" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ma_phieu_sequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ma_phieu_sequence_year_key" ON "ma_phieu_sequence"("year");
