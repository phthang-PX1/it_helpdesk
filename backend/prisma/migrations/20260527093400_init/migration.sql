-- CreateEnum
CREATE TYPE "VaiTroEnum" AS ENUM ('NGUOI_YEU_CAU', 'IT_L1', 'IT_L2', 'QUAN_LY');

-- CreateEnum
CREATE TYPE "MucDoAnhHuong" AS ENUM ('THAP', 'TRUNG_BINH', 'CAO');

-- CreateEnum
CREATE TYPE "MucDoKhanCap" AS ENUM ('THAP', 'TRUNG_BINH', 'CAO');

-- CreateEnum
CREATE TYPE "MucDoUuTien" AS ENUM ('THAP', 'TRUNG_BINH', 'CAO');

-- CreateEnum
CREATE TYPE "TrangThaiPhieu" AS ENUM ('MOI_TAO', 'DANG_GIAI_QUYET', 'CHO_PHAN_HOI', 'DA_GIAI_QUYET', 'DA_DONG');

-- CreateEnum
CREATE TYPE "LoaiBinhLuan" AS ENUM ('THUONG', 'KET_QUA', 'CHUYEN_CAP');

-- CreateEnum
CREATE TYPE "QuyenXem" AS ENUM ('CONG_KHAI', 'NOI_BO');

-- CreateEnum
CREATE TYPE "LoaiSla" AS ENUM ('PHAN_HOI', 'XU_LY');

-- CreateEnum
CREATE TYPE "TrangThaiMucTieu" AS ENUM ('TIEP_NHAN', 'DA_GIAI_QUYET');

-- CreateEnum
CREATE TYPE "TrangThaiBaiViet" AS ENUM ('NHAP', 'DA_XUAT_BAN');

-- CreateEnum
CREATE TYPE "LoaiThoiGian" AS ENUM ('GIO_HANH_CHINH', 'H24_7');

-- CreateTable
CREATE TABLE "phong_ban" (
    "phong_ban_id" SERIAL NOT NULL,
    "ten_phong_ban" VARCHAR(100) NOT NULL,
    "truong_phong_id" INTEGER,

    CONSTRAINT "phong_ban_pkey" PRIMARY KEY ("phong_ban_id")
);

-- CreateTable
CREATE TABLE "vai_tro" (
    "vai_tro_id" SERIAL NOT NULL,
    "ma_vai_tro" "VaiTroEnum" NOT NULL,
    "ten_vai_tro" VARCHAR(100) NOT NULL,
    "quyen_han" JSONB,

    CONSTRAINT "vai_tro_pkey" PRIMARY KEY ("vai_tro_id")
);

-- CreateTable
CREATE TABLE "nhom_ho_tro" (
    "nhom_ho_tro_id" SERIAL NOT NULL,
    "ten_nhom" VARCHAR(100) NOT NULL,
    "mo_ta" TEXT,

    CONSTRAINT "nhom_ho_tro_pkey" PRIMARY KEY ("nhom_ho_tro_id")
);

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
CREATE TABLE "phieu_ho_tro" (
    "phieu_ho_tro_id" SERIAL NOT NULL,
    "ma_phieu" VARCHAR(50) NOT NULL,
    "tieu_de" VARCHAR(255) NOT NULL,
    "mo_ta_chi_tiet" TEXT NOT NULL,
    "muc_do_anh_huong" "MucDoAnhHuong" NOT NULL DEFAULT 'TRUNG_BINH',
    "muc_do_khan_cap" "MucDoKhanCap" NOT NULL DEFAULT 'TRUNG_BINH',
    "muc_do_uu_tien" "MucDoUuTien" NOT NULL,
    "trang_thai" "TrangThaiPhieu" NOT NULL DEFAULT 'MOI_TAO',
    "nguoi_tao_id" INTEGER NOT NULL,
    "nguoi_ho_tro_id" INTEGER,
    "nhom_xu_ly_id" INTEGER NOT NULL,
    "phieu_lien_quan_id" INTEGER,
    "so_lan_mo_lai" INTEGER NOT NULL DEFAULT 0,
    "so_lan_thu_lai_L1" INTEGER NOT NULL DEFAULT 0,
    "so_lan_thu_lai_L2" INTEGER NOT NULL DEFAULT 0,
    "ngay_tao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "phieu_ho_tro_pkey" PRIMARY KEY ("phieu_ho_tro_id")
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
CREATE TABLE "tep_dinh_kem" (
    "tep_dinh_kem_id" SERIAL NOT NULL,
    "ten_tep" VARCHAR(255) NOT NULL,
    "duong_dan_file" VARCHAR(500) NOT NULL,
    "dinh_dang" VARCHAR(20) NOT NULL,
    "dung_luong_kb" INTEGER NOT NULL,
    "phieu_ho_tro_id" INTEGER,
    "binh_luan_id" INTEGER,
    "tri_thuc_id" INTEGER,
    "ngay_tao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tep_dinh_kem_pkey" PRIMARY KEY ("tep_dinh_kem_id")
);

-- CreateTable
CREATE TABLE "lich_su_phieu" (
    "lich_su_id" SERIAL NOT NULL,
    "phieu_ho_tro_id" INTEGER NOT NULL,
    "nguoi_thuc_hien_id" INTEGER NOT NULL,
    "hanh_dong" VARCHAR(100) NOT NULL,
    "gia_tri_cu" TEXT,
    "gia_tri_moi" TEXT,
    "ngay_thuc_hien" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ghi_chu" TEXT,

    CONSTRAINT "lich_su_phieu_pkey" PRIMARY KEY ("lich_su_id")
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

-- CreateTable
CREATE TABLE "chinh_sach_sla" (
    "chinh_sach_sla_id" SERIAL NOT NULL,
    "ten_chinh_sach" VARCHAR(100) NOT NULL,
    "loai_thoi_gian" "LoaiThoiGian" NOT NULL,
    "muc_do_uu_tien" "MucDoUuTien" NOT NULL,
    "tg_phan_hoi" INTEGER NOT NULL,
    "tg_xu_ly" INTEGER NOT NULL,
    "trang_thai" BOOLEAN NOT NULL DEFAULT true,
    "ngay_tao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chinh_sach_sla_pkey" PRIMARY KEY ("chinh_sach_sla_id")
);

-- CreateTable
CREATE TABLE "sla_theo_doi" (
    "sla_id" SERIAL NOT NULL,
    "phieu_ho_tro_id" INTEGER NOT NULL,
    "chinh_sach_sla_id" INTEGER NOT NULL,
    "loai_sla" "LoaiSla" NOT NULL,
    "trang_thai_muc_tieu" "TrangThaiMucTieu" NOT NULL,
    "thoi_diem_bat_dau" TIMESTAMPTZ NOT NULL,
    "han_chot" TIMESTAMPTZ NOT NULL,
    "thoi_diem_dat" TIMESTAMPTZ,
    "thoi_diem_tam_dung" TIMESTAMPTZ,
    "tong_thoi_gian_tam_dung" INTEGER NOT NULL DEFAULT 0,
    "da_vi_pham" BOOLEAN NOT NULL DEFAULT false,
    "duoc_mien_tru" BOOLEAN NOT NULL DEFAULT false,
    "ly_do_mien_tru" TEXT,
    "da_gui_nhac_nho" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sla_theo_doi_pkey" PRIMARY KEY ("sla_id")
);

-- CreateTable
CREATE TABLE "co_so_tri_thuc" (
    "tri_thuc_id" SERIAL NOT NULL,
    "tieu_de" VARCHAR(255) NOT NULL,
    "noi_dung" TEXT NOT NULL,
    "loai_su_co" VARCHAR(100) NOT NULL,
    "the_tags" VARCHAR(255),
    "tac_gia_id" INTEGER NOT NULL,
    "phieu_ho_tro_id" INTEGER,
    "trang_thai" "TrangThaiBaiViet" NOT NULL DEFAULT 'NHAP',
    "quyen_xem" "QuyenXem" NOT NULL DEFAULT 'NOI_BO',
    "luot_xem" INTEGER NOT NULL DEFAULT 0,
    "luot_huu_ich" INTEGER NOT NULL DEFAULT 0,
    "luot_khong_huu_ich" INTEGER NOT NULL DEFAULT 0,
    "ngay_tao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "co_so_tri_thuc_pkey" PRIMARY KEY ("tri_thuc_id")
);

-- CreateTable
CREATE TABLE "thong_bao" (
    "thong_bao_id" SERIAL NOT NULL,
    "nguoi_nhan_id" INTEGER NOT NULL,
    "phieu_ho_tro_id" INTEGER,
    "loai" VARCHAR(50) NOT NULL,
    "tieu_de" VARCHAR(255) NOT NULL,
    "noi_dung" TEXT NOT NULL,
    "da_doc" BOOLEAN NOT NULL DEFAULT false,
    "ngay_tao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "thong_bao_pkey" PRIMARY KEY ("thong_bao_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "phong_ban_truong_phong_id_key" ON "phong_ban"("truong_phong_id");

-- CreateIndex
CREATE UNIQUE INDEX "vai_tro_ma_vai_tro_key" ON "vai_tro"("ma_vai_tro");

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
CREATE UNIQUE INDEX "phieu_ho_tro_ma_phieu_key" ON "phieu_ho_tro"("ma_phieu");

-- CreateIndex
CREATE INDEX "phieu_ho_tro_nguoi_tao_id_idx" ON "phieu_ho_tro"("nguoi_tao_id");

-- CreateIndex
CREATE INDEX "phieu_ho_tro_nguoi_ho_tro_id_idx" ON "phieu_ho_tro"("nguoi_ho_tro_id");

-- CreateIndex
CREATE INDEX "phieu_ho_tro_nhom_xu_ly_id_idx" ON "phieu_ho_tro"("nhom_xu_ly_id");

-- CreateIndex
CREATE INDEX "phieu_ho_tro_phieu_lien_quan_id_idx" ON "phieu_ho_tro"("phieu_lien_quan_id");

-- CreateIndex
CREATE INDEX "phieu_ho_tro_trang_thai_muc_do_uu_tien_idx" ON "phieu_ho_tro"("trang_thai", "muc_do_uu_tien");

-- CreateIndex
CREATE INDEX "binh_luan_phieu_ho_tro_id_idx" ON "binh_luan"("phieu_ho_tro_id");

-- CreateIndex
CREATE INDEX "binh_luan_nguoi_gui_id_idx" ON "binh_luan"("nguoi_gui_id");

-- CreateIndex
CREATE INDEX "tep_dinh_kem_phieu_ho_tro_id_idx" ON "tep_dinh_kem"("phieu_ho_tro_id");

-- CreateIndex
CREATE INDEX "tep_dinh_kem_binh_luan_id_idx" ON "tep_dinh_kem"("binh_luan_id");

-- CreateIndex
CREATE INDEX "tep_dinh_kem_tri_thuc_id_idx" ON "tep_dinh_kem"("tri_thuc_id");

-- CreateIndex
CREATE INDEX "lich_su_phieu_phieu_ho_tro_id_idx" ON "lich_su_phieu"("phieu_ho_tro_id");

-- CreateIndex
CREATE INDEX "lich_su_phieu_nguoi_thuc_hien_id_idx" ON "lich_su_phieu"("nguoi_thuc_hien_id");

-- CreateIndex
CREATE UNIQUE INDEX "phieu_danh_gia_phieu_ho_tro_id_key" ON "phieu_danh_gia"("phieu_ho_tro_id");

-- CreateIndex
CREATE INDEX "phieu_danh_gia_nguoi_danh_gia_id_idx" ON "phieu_danh_gia"("nguoi_danh_gia_id");

-- CreateIndex
CREATE INDEX "sla_theo_doi_phieu_ho_tro_id_idx" ON "sla_theo_doi"("phieu_ho_tro_id");

-- CreateIndex
CREATE INDEX "sla_theo_doi_chinh_sach_sla_id_idx" ON "sla_theo_doi"("chinh_sach_sla_id");

-- CreateIndex
CREATE INDEX "co_so_tri_thuc_tac_gia_id_idx" ON "co_so_tri_thuc"("tac_gia_id");

-- CreateIndex
CREATE INDEX "co_so_tri_thuc_phieu_ho_tro_id_idx" ON "co_so_tri_thuc"("phieu_ho_tro_id");

-- CreateIndex
CREATE INDEX "co_so_tri_thuc_tieu_de_loai_su_co_the_tags_idx" ON "co_so_tri_thuc"("tieu_de", "loai_su_co", "the_tags");

-- CreateIndex
CREATE INDEX "thong_bao_nguoi_nhan_id_idx" ON "thong_bao"("nguoi_nhan_id");

-- CreateIndex
CREATE INDEX "thong_bao_da_doc_idx" ON "thong_bao"("da_doc");

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
ALTER TABLE "phieu_ho_tro" ADD CONSTRAINT "phieu_ho_tro_nhom_xu_ly_id_fkey" FOREIGN KEY ("nhom_xu_ly_id") REFERENCES "nhom_ho_tro"("nhom_ho_tro_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phieu_ho_tro" ADD CONSTRAINT "phieu_ho_tro_phieu_lien_quan_id_fkey" FOREIGN KEY ("phieu_lien_quan_id") REFERENCES "phieu_ho_tro"("phieu_ho_tro_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "binh_luan" ADD CONSTRAINT "binh_luan_phieu_ho_tro_id_fkey" FOREIGN KEY ("phieu_ho_tro_id") REFERENCES "phieu_ho_tro"("phieu_ho_tro_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "binh_luan" ADD CONSTRAINT "binh_luan_nguoi_gui_id_fkey" FOREIGN KEY ("nguoi_gui_id") REFERENCES "nhan_vien"("nhan_vien_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tep_dinh_kem" ADD CONSTRAINT "tep_dinh_kem_phieu_ho_tro_id_fkey" FOREIGN KEY ("phieu_ho_tro_id") REFERENCES "phieu_ho_tro"("phieu_ho_tro_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tep_dinh_kem" ADD CONSTRAINT "tep_dinh_kem_binh_luan_id_fkey" FOREIGN KEY ("binh_luan_id") REFERENCES "binh_luan"("binh_luan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tep_dinh_kem" ADD CONSTRAINT "tep_dinh_kem_tri_thuc_id_fkey" FOREIGN KEY ("tri_thuc_id") REFERENCES "co_so_tri_thuc"("tri_thuc_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lich_su_phieu" ADD CONSTRAINT "lich_su_phieu_phieu_ho_tro_id_fkey" FOREIGN KEY ("phieu_ho_tro_id") REFERENCES "phieu_ho_tro"("phieu_ho_tro_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lich_su_phieu" ADD CONSTRAINT "lich_su_phieu_nguoi_thuc_hien_id_fkey" FOREIGN KEY ("nguoi_thuc_hien_id") REFERENCES "nhan_vien"("nhan_vien_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phieu_danh_gia" ADD CONSTRAINT "phieu_danh_gia_phieu_ho_tro_id_fkey" FOREIGN KEY ("phieu_ho_tro_id") REFERENCES "phieu_ho_tro"("phieu_ho_tro_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phieu_danh_gia" ADD CONSTRAINT "phieu_danh_gia_nguoi_danh_gia_id_fkey" FOREIGN KEY ("nguoi_danh_gia_id") REFERENCES "nhan_vien"("nhan_vien_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_theo_doi" ADD CONSTRAINT "sla_theo_doi_phieu_ho_tro_id_fkey" FOREIGN KEY ("phieu_ho_tro_id") REFERENCES "phieu_ho_tro"("phieu_ho_tro_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_theo_doi" ADD CONSTRAINT "sla_theo_doi_chinh_sach_sla_id_fkey" FOREIGN KEY ("chinh_sach_sla_id") REFERENCES "chinh_sach_sla"("chinh_sach_sla_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_so_tri_thuc" ADD CONSTRAINT "co_so_tri_thuc_tac_gia_id_fkey" FOREIGN KEY ("tac_gia_id") REFERENCES "nhan_vien"("nhan_vien_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_so_tri_thuc" ADD CONSTRAINT "co_so_tri_thuc_phieu_ho_tro_id_fkey" FOREIGN KEY ("phieu_ho_tro_id") REFERENCES "phieu_ho_tro"("phieu_ho_tro_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thong_bao" ADD CONSTRAINT "thong_bao_nguoi_nhan_id_fkey" FOREIGN KEY ("nguoi_nhan_id") REFERENCES "nhan_vien"("nhan_vien_id") ON DELETE CASCADE ON UPDATE CASCADE;
