/*
  Warnings:

  - The values [DA_CHONG] on the enum `TrangThaiPhieu` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `tg_phan_hoi_phut` on the `chinh_sach_sla` table. All the data in the column will be lost.
  - You are about to drop the column `tg_xu_ly_phut` on the `chinh_sach_sla` table. All the data in the column will be lost.
  - You are about to drop the column `nguoi_xu_ly_id` on the `phieu_ho_tro` table. All the data in the column will be lost.
  - You are about to drop the column `so_lan_xu_ly_l1` on the `phieu_ho_tro` table. All the data in the column will be lost.
  - You are about to drop the column `so_lan_xu_ly_l2` on the `phieu_ho_tro` table. All the data in the column will be lost.
  - You are about to drop the `binh_luan_phieu` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `danh_gia_phieu` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `nguoi_dung` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `tg_phan_hoi` to the `chinh_sach_sla` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tg_xu_ly` to the `chinh_sach_sla` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `loai_thoi_gian` on the `chinh_sach_sla` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "LoaiThoiGian" AS ENUM ('GIO_HANH_CHINH', 'H24_7');

-- AlterEnum
BEGIN;
CREATE TYPE "TrangThaiPhieu_new" AS ENUM ('MOI_TAO', 'DANG_GIAI_QUYET', 'DA_GIAI_QUYET', 'DA_DONG');
ALTER TABLE "public"."phieu_ho_tro" ALTER COLUMN "trang_thai" DROP DEFAULT;
ALTER TABLE "phieu_ho_tro" ALTER COLUMN "trang_thai" TYPE "TrangThaiPhieu_new" USING ("trang_thai"::text::"TrangThaiPhieu_new");
ALTER TYPE "TrangThaiPhieu" RENAME TO "TrangThaiPhieu_old";
ALTER TYPE "TrangThaiPhieu_new" RENAME TO "TrangThaiPhieu";
DROP TYPE "public"."TrangThaiPhieu_old";
ALTER TABLE "phieu_ho_tro" ALTER COLUMN "trang_thai" SET DEFAULT 'MOI_TAO';
COMMIT;

-- DropForeignKey
ALTER TABLE "binh_luan_phieu" DROP CONSTRAINT "binh_luan_phieu_nguoi_gui_id_fkey";

-- DropForeignKey
ALTER TABLE "binh_luan_phieu" DROP CONSTRAINT "binh_luan_phieu_phieu_ho_tro_id_fkey";

-- DropForeignKey
ALTER TABLE "co_so_tri_thuc" DROP CONSTRAINT "co_so_tri_thuc_tac_gia_id_fkey";

-- DropForeignKey
ALTER TABLE "danh_gia_phieu" DROP CONSTRAINT "danh_gia_phieu_nguoi_danh_gia_id_fkey";

-- DropForeignKey
ALTER TABLE "danh_gia_phieu" DROP CONSTRAINT "danh_gia_phieu_phieu_ho_tro_id_fkey";

-- DropForeignKey
ALTER TABLE "lich_su_phieu" DROP CONSTRAINT "lich_su_phieu_nguoi_thuc_hien_id_fkey";

-- DropForeignKey
ALTER TABLE "nguoi_dung" DROP CONSTRAINT "nguoi_dung_nhom_ho_tro_id_fkey";

-- DropForeignKey
ALTER TABLE "nguoi_dung" DROP CONSTRAINT "nguoi_dung_phong_ban_id_fkey";

-- DropForeignKey
ALTER TABLE "nguoi_dung" DROP CONSTRAINT "nguoi_dung_vai_tro_id_fkey";

-- DropForeignKey
ALTER TABLE "phieu_ho_tro" DROP CONSTRAINT "phieu_ho_tro_nguoi_tao_id_fkey";

-- DropForeignKey
ALTER TABLE "phieu_ho_tro" DROP CONSTRAINT "phieu_ho_tro_nguoi_xu_ly_id_fkey";

-- DropForeignKey
ALTER TABLE "phong_ban" DROP CONSTRAINT "phong_ban_truong_phong_id_fkey";

-- DropForeignKey
ALTER TABLE "tep_dinh_kem" DROP CONSTRAINT "tep_dinh_kem_binh_luan_id_fkey";

-- DropIndex
DROP INDEX "phieu_ho_tro_nguoi_xu_ly_id_idx";

-- AlterTable
ALTER TABLE "chinh_sach_sla" DROP COLUMN "tg_phan_hoi_phut",
DROP COLUMN "tg_xu_ly_phut",
ADD COLUMN     "tg_phan_hoi" INTEGER NOT NULL,
ADD COLUMN     "tg_xu_ly" INTEGER NOT NULL,
DROP COLUMN "loai_thoi_gian",
ADD COLUMN     "loai_thoi_gian" "LoaiThoiGian" NOT NULL;

-- AlterTable
ALTER TABLE "lich_su_phieu" ADD COLUMN     "ghi_chu" TEXT;

-- AlterTable
ALTER TABLE "phieu_ho_tro" DROP COLUMN "nguoi_xu_ly_id",
DROP COLUMN "so_lan_xu_ly_l1",
DROP COLUMN "so_lan_xu_ly_l2",
ADD COLUMN     "nguoi_ho_tro_id" INTEGER,
ADD COLUMN     "so_lan_thu_lai_L1" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "so_lan_thu_lai_L2" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sla_theo_doi" ADD COLUMN     "da_gui_nhac_nho" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "duoc_mien_tru" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ly_do_mien_tru" TEXT;

-- DropTable
DROP TABLE "binh_luan_phieu";

-- DropTable
DROP TABLE "danh_gia_phieu";

-- DropTable
DROP TABLE "nguoi_dung";

-- CreateTable
CREATE TABLE "nhan_vien" (
    "nhan_vien_id" SERIAL NOT NULL,
    "phong_ban_id" INTEGER NOT NULL,
    "vai_tro_id" INTEGER NOT NULL,
    "nhom_ho_tro_id" INTEGER,
    "tai_khoan" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "mat_khau" VARCHAR(255) NOT NULL,
    "ho_ten" VARCHAR(100) NOT NULL,
    "trang_thai" BOOLEAN NOT NULL DEFAULT true,
    "ngay_tao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nhan_vien_pkey" PRIMARY KEY ("nhan_vien_id")
);

-- CreateTable
CREATE TABLE "binh_luan" (
    "binh_luan_id" SERIAL NOT NULL,
    "phieu_ho_tro_id" INTEGER NOT NULL,
    "nguoi_gui_id" INTEGER NOT NULL,
    "noi_dung" TEXT NOT NULL,
    "loai_binh_luan" "LoaiBinhLuan" NOT NULL DEFAULT 'THUONG',
    "quyen_xem" "QuyenXem" NOT NULL DEFAULT 'CONG_KHAI',
    "ngay_tao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "binh_luan_pkey" PRIMARY KEY ("binh_luan_id")
);

-- CreateTable
CREATE TABLE "phieu_danh_gia" (
    "danh_gia_id" SERIAL NOT NULL,
    "phieu_ho_tro_id" INTEGER NOT NULL,
    "nguoi_danh_gia_id" INTEGER NOT NULL,
    "token_xac_thuc" VARCHAR(100) NOT NULL,
    "hai_long" BOOLEAN NOT NULL,
    "so_sao" INTEGER NOT NULL,
    "nhan_xet" TEXT,
    "ngay_danh_gia" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phieu_danh_gia_pkey" PRIMARY KEY ("danh_gia_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nhan_vien_tai_khoan_key" ON "nhan_vien"("tai_khoan");

-- CreateIndex
CREATE UNIQUE INDEX "nhan_vien_email_key" ON "nhan_vien"("email");

-- CreateIndex
CREATE INDEX "nhan_vien_phong_ban_id_idx" ON "nhan_vien"("phong_ban_id");

-- CreateIndex
CREATE INDEX "nhan_vien_vai_tro_id_idx" ON "nhan_vien"("vai_tro_id");

-- CreateIndex
CREATE INDEX "nhan_vien_nhom_ho_tro_id_idx" ON "nhan_vien"("nhom_ho_tro_id");

-- CreateIndex
CREATE INDEX "binh_luan_phieu_ho_tro_id_idx" ON "binh_luan"("phieu_ho_tro_id");

-- CreateIndex
CREATE INDEX "binh_luan_nguoi_gui_id_idx" ON "binh_luan"("nguoi_gui_id");

-- CreateIndex
CREATE UNIQUE INDEX "phieu_danh_gia_phieu_ho_tro_id_key" ON "phieu_danh_gia"("phieu_ho_tro_id");

-- CreateIndex
CREATE INDEX "phieu_danh_gia_nguoi_danh_gia_id_idx" ON "phieu_danh_gia"("nguoi_danh_gia_id");

-- CreateIndex
CREATE INDEX "phieu_ho_tro_nguoi_ho_tro_id_idx" ON "phieu_ho_tro"("nguoi_ho_tro_id");

-- AddForeignKey
ALTER TABLE "phong_ban" ADD CONSTRAINT "phong_ban_truong_phong_id_fkey" FOREIGN KEY ("truong_phong_id") REFERENCES "nhan_vien"("nhan_vien_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhan_vien" ADD CONSTRAINT "nhan_vien_phong_ban_id_fkey" FOREIGN KEY ("phong_ban_id") REFERENCES "phong_ban"("phong_ban_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhan_vien" ADD CONSTRAINT "nhan_vien_vai_tro_id_fkey" FOREIGN KEY ("vai_tro_id") REFERENCES "vai_tro"("vai_tro_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhan_vien" ADD CONSTRAINT "nhan_vien_nhom_ho_tro_id_fkey" FOREIGN KEY ("nhom_ho_tro_id") REFERENCES "nhom_ho_tro"("nhom_ho_tro_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phieu_ho_tro" ADD CONSTRAINT "phieu_ho_tro_nguoi_tao_id_fkey" FOREIGN KEY ("nguoi_tao_id") REFERENCES "nhan_vien"("nhan_vien_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phieu_ho_tro" ADD CONSTRAINT "phieu_ho_tro_nguoi_ho_tro_id_fkey" FOREIGN KEY ("nguoi_ho_tro_id") REFERENCES "nhan_vien"("nhan_vien_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "binh_luan" ADD CONSTRAINT "binh_luan_phieu_ho_tro_id_fkey" FOREIGN KEY ("phieu_ho_tro_id") REFERENCES "phieu_ho_tro"("phieu_ho_tro_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "binh_luan" ADD CONSTRAINT "binh_luan_nguoi_gui_id_fkey" FOREIGN KEY ("nguoi_gui_id") REFERENCES "nhan_vien"("nhan_vien_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tep_dinh_kem" ADD CONSTRAINT "tep_dinh_kem_binh_luan_id_fkey" FOREIGN KEY ("binh_luan_id") REFERENCES "binh_luan"("binh_luan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lich_su_phieu" ADD CONSTRAINT "lich_su_phieu_nguoi_thuc_hien_id_fkey" FOREIGN KEY ("nguoi_thuc_hien_id") REFERENCES "nhan_vien"("nhan_vien_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phieu_danh_gia" ADD CONSTRAINT "phieu_danh_gia_phieu_ho_tro_id_fkey" FOREIGN KEY ("phieu_ho_tro_id") REFERENCES "phieu_ho_tro"("phieu_ho_tro_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phieu_danh_gia" ADD CONSTRAINT "phieu_danh_gia_nguoi_danh_gia_id_fkey" FOREIGN KEY ("nguoi_danh_gia_id") REFERENCES "nhan_vien"("nhan_vien_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_so_tri_thuc" ADD CONSTRAINT "co_so_tri_thuc_tac_gia_id_fkey" FOREIGN KEY ("tac_gia_id") REFERENCES "nhan_vien"("nhan_vien_id") ON DELETE RESTRICT ON UPDATE CASCADE;
