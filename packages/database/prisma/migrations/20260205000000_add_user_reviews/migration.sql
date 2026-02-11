-- AlterTable: Make clinic_id and patient_id nullable on Review
ALTER TABLE "Review" ALTER COLUMN "clinic_id" DROP NOT NULL;
ALTER TABLE "Review" ALTER COLUMN "patient_id" DROP NOT NULL;

-- AddColumn: Add user_id to Review for direct professional reviews
ALTER TABLE "Review" ADD COLUMN "user_id" TEXT;

-- CreateIndex
CREATE INDEX "Review_user_id_idx" ON "Review"("user_id");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
