# Prisma Schema - Hệ thống hỗ trợ IT

Dưới đây là nội dung file `schema.prisma` đầy đủ, bao gồm các enum, model và quan hệ giữa các bảng.

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ==========================================
// 1. CÁC KIỂU DỮ LIỆU ENUM HỆ THỐNG
// ==========================================

enum VaiTroEnum {
  NGUOI_YEU_CAU
  IT_L1
  IT_L2
  QUAN_LY
}

enum MucDoUuTien {
  THAP
  TRUNG_BINH
  CAO
}

enum TrangThaiPhieu {
  MOI_TAO
  DANG_GIAI_QUYET
  DA_GIAI_QUYET
  DA_DONG
}

enum LoaiBinhLuan {
  THUONG
  KET_QUA
  CHUYEN_CAP
}

enum QuyenXem {
  CONG_KHAI
  NOI_BO
}

enum LoaiSla {
  PHAN_HOI
  XU_LY
}

enum TrangThaiMucTieu {
  TIEP_NHAN
  DA_GIAI_QUYET
}

enum TrangThaiBaiViet {
  NHAP
  DA_XUAT_BAN
}

// Bổ sung enum cho loại thời gian SLA
enum LoaiThoiGian {
  GIO_HANH_CHINH
  H24_7
}

// ==========================================
// 2. CẤU TRÚC 12 BẢNG (MODELS) CHI TIẾT (đồng bộ 100% ERD)
// ==========================================

model PhongBan {
  phong_ban_id    Int        @id @default(autoincrement())
  ten_phong_ban   String     @db.VarChar(100)
  truong_phong_id Int?       @unique

  // Mối quan hệ
  truong_phong    NhanVien?  @relation("TruongPhongRelation", fields: [truong_phong_id], references: [nhan_vien_id], onDelete: SetNull)
  danh_sach_nv    NhanVien[] @relation("NhanVienPhongBan")

  @@map("phong_ban")
}

model VaiTro {
  vai_tro_id   Int        @id @default(autoincrement())
  ma_vai_tro   VaiTroEnum @unique
  ten_vai_tro  String     @db.VarChar(100)
  quyen_han    Json?

  // Mối quan hệ
  danh_sach_nv NhanVien[]

  @@map("vai_tro")
}

model NhomHoTro {
  nhom_ho_tro_id   Int        @id @default(autoincrement())
  ten_nhom         String     @db.VarChar(100)
  mo_ta            String?    @db.Text

  // Mối quan hệ
  danh_sach_it     NhanVien[]
  danh_sach_ticket PhieuHoTro[]

  @@map("nhom_ho_tro")
}

model NhanVien {
  nhan_vien_id   Int        @id @default(autoincrement())
  phong_ban_id   Int
  vai_tro_id     Int
  nhom_ho_tro_id Int?
  tai_khoan      String     @unique @db.VarChar(50)
  email          String     @unique @db.VarChar(100)
  mat_khau       String     @db.VarChar(255)
  ho_ten         String     @db.VarChar(100)
  trang_thai     Boolean    @default(true)
  ngay_tao       DateTime   @default(now()) @db.Timestamptz

  // Mối quan hệ
  phong_ban      PhongBan   @relation("NhanVienPhongBan", fields: [phong_ban_id], references: [phong_ban_id], onDelete: Restrict)
  vai_tro        VaiTro     @relation(fields: [vai_tro_id], references: [vai_tro_id], onDelete: Restrict)
  nhom_ho_tro    NhomHoTro? @relation(fields: [nhom_ho_tro_id], references: [nhom_ho_tro_id], onDelete: SetNull)

  phong_quan_ly  PhongBan?  @relation("TruongPhongRelation")
  tickets_tao    PhieuHoTro[] @relation("NguoiTaoRelation")
  tickets_ho_tro PhieuHoTro[] @relation("NguoiHoTroRelation")
  binh_luan_gui  BinhLuan[]
  lich_su_lam    LichSuPhieu[]
  danh_gia_gui   PhieuDanhGia[]
  bai_viet_tri_thuc CoSoTriThuc[]

  @@index([phong_ban_id])
  @@index([vai_tro_id])
  @@index([nhom_ho_tro_id])
  @@map("nhan_vien")
}

model PhieuHoTro {
  phieu_ho_tro_id     Int            @id @default(autoincrement())
  ma_phieu            String         @unique @db.VarChar(50)
  tieu_de             String         @db.VarChar(255)
  mo_ta_chi_tiet      String         @db.Text
  muc_do_uu_tien      MucDoUuTien
  trang_thai          TrangThaiPhieu @default(MOI_TAO)
  nguoi_tao_id        Int
  nguoi_ho_tro_id     Int?
  nhom_xu_ly_id       Int
  phieu_lien_quan_id  Int?
  so_lan_mo_lai       Int            @default(0)
  so_lan_thu_lai_L1   Int            @default(0)
  so_lan_thu_lai_L2   Int            @default(0)
  ngay_tao            DateTime       @default(now()) @db.Timestamptz
  ngay_cap_nhat       DateTime       @updatedAt @db.Timestamptz

  // Mối quan hệ
  nguoi_tao           NhanVien       @relation("NguoiTaoRelation", fields: [nguoi_tao_id], references: [nhan_vien_id], onDelete: Restrict)
  nguoi_ho_tro        NhanVien?      @relation("NguoiHoTroRelation", fields: [nguoi_ho_tro_id], references: [nhan_vien_id], onDelete: SetNull)
  nhom_xu_ly          NhomHoTro      @relation(fields: [nhom_xu_ly_id], references: [nhom_ho_tro_id], onDelete: Restrict)

  phieu_goc           PhieuHoTro?    @relation("PhieuLienQuanRelation", fields: [phieu_lien_quan_id], references: [phieu_ho_tro_id], onDelete: SetNull)
  phieu_con_lien_quan PhieuHoTro[]   @relation("PhieuLienQuanRelation")

  danh_sach_file      TepDinhKem[]
  danh_sach_bl        BinhLuan[]
  danh_sach_log       LichSuPhieu[]
  danh_gia            PhieuDanhGia?
  danh_sach_sla       SlaTheoDoi[]
  nguon_tri_thuc      CoSoTriThuc[]

  @@index([nguoi_tao_id])
  @@index([nguoi_ho_tro_id])
  @@index([nhom_xu_ly_id])
  @@index([phieu_lien_quan_id])
  @@map("phieu_ho_tro")
}

model BinhLuan {
  binh_luan_id     Int          @id @default(autoincrement())
  phieu_ho_tro_id  Int
  nguoi_gui_id     Int
  noi_dung         String       @db.Text
  loai_binh_luan   LoaiBinhLuan @default(THUONG)
  quyen_xem        QuyenXem     @default(CONG_KHAI)
  ngay_tao         DateTime     @default(now()) @db.Timestamptz

  // Mối quan hệ
  phieu_ho_tro     PhieuHoTro   @relation(fields: [phieu_ho_tro_id], references: [phieu_ho_tro_id], onDelete: Cascade)
  nguoi_gui        NhanVien     @relation(fields: [nguoi_gui_id], references: [nhan_vien_id], onDelete: Restrict)
  danh_sach_file   TepDinhKem[]

  @@index([phieu_ho_tro_id])
  @@index([nguoi_gui_id])
  @@map("binh_luan")
}

model TepDinhKem {
  tep_dinh_kem_id Int        @id @default(autoincrement())
  ten_tep         String     @db.VarChar(255)
  duong_dan_file  String     @db.VarChar(500)
  dinh_dang       String     @db.VarChar(20)
  dung_luong_kb   Int
  phieu_ho_tro_id Int?
  binh_luan_id    Int?
  tri_thuc_id     Int?
  ngay_tao        DateTime   @default(now()) @db.Timestamptz

  // Mối quan hệ
  phieu_ho_tro    PhieuHoTro?   @relation(fields: [phieu_ho_tro_id], references: [phieu_ho_tro_id], onDelete: Cascade)
  binh_luan       BinhLuan?     @relation(fields: [binh_luan_id], references: [binh_luan_id], onDelete: Cascade)
  co_so_tri_thuc  CoSoTriThuc?  @relation(fields: [tri_thuc_id], references: [tri_thuc_id], onDelete: Cascade)

  @@index([phieu_ho_tro_id])
  @@index([binh_luan_id])
  @@index([tri_thuc_id])
  @@map("tep_dinh_kem")
}

model LichSuPhieu {
  lich_su_id         Int        @id @default(autoincrement())
  phieu_ho_tro_id    Int
  nguoi_thuc_hien_id Int
  hanh_dong          String     @db.VarChar(100)
  gia_tri_cu         String?    @db.Text
  gia_tri_moi        String?    @db.Text
  ngay_thuc_hien     DateTime   @default(now()) @db.Timestamptz
  ghi_chu            String?    @db.Text

  // Mối quan hệ
  phieu_ho_tro       PhieuHoTro @relation(fields: [phieu_ho_tro_id], references: [phieu_ho_tro_id], onDelete: Cascade)
  nguoi_thuc_hien    NhanVien   @relation(fields: [nguoi_thuc_hien_id], references: [nhan_vien_id], onDelete: Restrict)

  @@index([phieu_ho_tro_id])
  @@index([nguoi_thuc_hien_id])
  @@map("lich_su_phieu")
}

model PhieuDanhGia {
  danh_gia_id       Int        @id @default(autoincrement())
  phieu_ho_tro_id   Int        @unique
  nguoi_danh_gia_id Int
  token_xac_thuc    String     @db.VarChar(100)
  hai_long          Boolean
  so_sao            Int
  nhan_xet          String?    @db.Text
  ngay_danh_gia     DateTime   @default(now()) @db.Timestamptz

  // Mối quan hệ
  phieu_ho_tro      PhieuHoTro @relation(fields: [phieu_ho_tro_id], references: [phieu_ho_tro_id], onDelete: Cascade)
  nguoi_danh_gia    NhanVien   @relation(fields: [nguoi_danh_gia_id], references: [nhan_vien_id], onDelete: Restrict)

  @@index([nguoi_danh_gia_id])
  @@map("phieu_danh_gia")
}

model ChinhSachSla {
  chinh_sach_sla_id Int          @id @default(autoincrement())
  ten_chinh_sach    String       @db.VarChar(100)
  loai_thoi_gian    LoaiThoiGian
  muc_do_uu_tien    MucDoUuTien
  tg_phan_hoi       Int          // phút
  tg_xu_ly          Int          // phút
  trang_thai        Boolean      @default(true)
  ngay_tao          DateTime     @default(now()) @db.Timestamptz

  // Mối quan hệ
  danh_sach_theo_doi SlaTheoDoi[]

  @@map("chinh_sach_sla")
}

model SlaTheoDoi {
  sla_id              Int              @id @default(autoincrement())
  phieu_ho_tro_id     Int
  chinh_sach_sla_id   Int
  loai_sla            LoaiSla
  trang_thai_muc_tieu TrangThaiMucTieu
  thoi_diem_bat_dau   DateTime         @db.Timestamptz
  han_chot            DateTime         @db.Timestamptz
  thoi_diem_dat       DateTime?        @db.Timestamptz
  da_vi_pham          Boolean          @default(false)
  duoc_mien_tru       Boolean          @default(false)
  ly_do_mien_tru      String?          @db.Text
  da_gui_nhac_nho     Boolean          @default(false)

  // Mối quan hệ
  phieu_ho_tro        PhieuHoTro       @relation(fields: [phieu_ho_tro_id], references: [phieu_ho_tro_id], onDelete: Cascade)
  chinh_sach_sla      ChinhSachSla     @relation(fields: [chinh_sach_sla_id], references: [chinh_sach_sla_id], onDelete: Restrict)

  @@index([phieu_ho_tro_id])
  @@index([chinh_sach_sla_id])
  @@map("sla_theo_doi")
}

model CoSoTriThuc {
  tri_thuc_id        Int              @id @default(autoincrement())
  tieu_de            String           @db.VarChar(255)
  noi_dung           String           @db.Text
  loai_su_co         String           @db.VarChar(100)
  the_tags           String?          @db.VarChar(255)
  tac_gia_id         Int
  phieu_ho_tro_id    Int?
  trang_thai         TrangThaiBaiViet @default(NHAP)
  quyen_xem          QuyenXem         @default(NOI_BO)
  luot_xem           Int              @default(0)
  luot_huu_ich       Int              @default(0)
  luot_khong_huu_ich Int              @default(0)
  ngay_tao           DateTime         @default(now()) @db.Timestamptz
  ngay_cap_nhat      DateTime         @updatedAt @db.Timestamptz

  // Mối quan hệ
  tac_gia            NhanVien         @relation(fields: [tac_gia_id], references: [nhan_vien_id], onDelete: Restrict)
  phieu_nguon        PhieuHoTro?      @relation(fields: [phieu_ho_tro_id], references: [phieu_ho_tro_id], onDelete: SetNull)
  danh_sach_file     TepDinhKem[]

  @@index([tac_gia_id])
  @@index([phieu_ho_tro_id])
  @@index([tieu_de, loai_su_co, the_tags])
  @@map("co_so_tri_thuc")
}