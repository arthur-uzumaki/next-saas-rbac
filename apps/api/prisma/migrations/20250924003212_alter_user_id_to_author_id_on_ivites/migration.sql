/*
  Warnings:

  - You are about to drop the column `user_id` on the `invites` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."invites" DROP CONSTRAINT "invites_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."invites" DROP COLUMN "user_id",
ADD COLUMN     "author_id" TEXT;

-- AddForeignKey
ALTER TABLE "public"."invites" ADD CONSTRAINT "invites_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
