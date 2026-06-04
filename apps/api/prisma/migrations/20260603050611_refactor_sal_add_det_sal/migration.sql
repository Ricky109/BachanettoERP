/*
  Warnings:

  - You are about to drop the column `CAN_SAL` on the `VEN_SAL` table. All the data in the column will be lost.
  - You are about to drop the column `ID_PRD` on the `VEN_SAL` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[FEC_SAL,TUR_SAL]` on the table `VEN_SAL` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "VEN_SAL" DROP CONSTRAINT "VEN_SAL_ID_PRD_fkey";

-- DropIndex
DROP INDEX "VEN_SAL_FEC_SAL_TUR_SAL_idx";

-- AlterTable
ALTER TABLE "VEN_SAL" DROP COLUMN "CAN_SAL",
DROP COLUMN "ID_PRD";

-- CreateTable
CREATE TABLE "VEN_DET_SAL" (
    "ID_DET_SAL" SERIAL NOT NULL,
    "ID_SAL" INTEGER NOT NULL,
    "ID_PRD" INTEGER NOT NULL,
    "CAN_SAL" INTEGER NOT NULL,

    CONSTRAINT "VEN_DET_SAL_pkey" PRIMARY KEY ("ID_DET_SAL")
);

-- CreateIndex
CREATE INDEX "VEN_DET_SAL_ID_SAL_idx" ON "VEN_DET_SAL"("ID_SAL");

-- CreateIndex
CREATE UNIQUE INDEX "VEN_SAL_FEC_SAL_TUR_SAL_key" ON "VEN_SAL"("FEC_SAL", "TUR_SAL");

-- AddForeignKey
ALTER TABLE "VEN_DET_SAL" ADD CONSTRAINT "VEN_DET_SAL_ID_SAL_fkey" FOREIGN KEY ("ID_SAL") REFERENCES "VEN_SAL"("ID_SAL") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VEN_DET_SAL" ADD CONSTRAINT "VEN_DET_SAL_ID_PRD_fkey" FOREIGN KEY ("ID_PRD") REFERENCES "VEN_PRD"("ID_PRD") ON DELETE RESTRICT ON UPDATE CASCADE;
