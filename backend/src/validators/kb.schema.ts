// src/validators/kb.schema.ts
import { z } from 'zod';
import { TrangThaiBaiViet, QuyenXem } from '@prisma/client';

export const searchKbSchema = z.object({
  q: z.string({ error: "Vui lòng nhập từ khóa tìm kiếm" }).min(2, "Từ khóa phải từ 2 ký tự trở lên"),
  limit: z.string().optional().transform(val => (val ? Number(val) : 5))
});

export const getKbQuerySchema = z.object({
  page: z.string().optional().transform(val => (val ? Number(val) : 1)).pipe(z.number().min(1)),
  limit: z.string().optional().transform(val => (val ? Number(val) : 10)).pipe(z.number().max(50)),
  loai_su_co: z.string().optional(),
  the: z.string().optional(),
  trang_thai: z.enum([TrangThaiBaiViet.NHAP, TrangThaiBaiViet.DA_XUAT_BAN]).optional(),
  sort: z.enum(["luot_xem", "luot_huu_ich", "ngay_tao"]).optional().default("ngay_tao")
});

export const createKbSchema = z.object({
  tieu_de: z.string({ message: "Tiêu đề không được để trống" }).min(5, "Tiêu đề phải từ 5 ký tự"),
  noi_dung: z.string({ message: "Nội dung bài viết không được để trống" }).min(20, "Nội dung quá ngắn"),
  loai_su_co: z.string({ message: "Vui lòng phân loại sự cố" }),
  the_tags: z.string().optional(), // VD: "máy in, kẹt giấy, hp"
  trang_thai: z.enum([TrangThaiBaiViet.NHAP, TrangThaiBaiViet.DA_XUAT_BAN] as const, { message: "Trạng thái không hợp lệ" }),
  quyen_xem: z.enum([QuyenXem.CONG_KHAI, QuyenXem.NOI_BO] as const).default(QuyenXem.NOI_BO),
  phieu_ho_tro_id: z.string().optional().transform(val => val ? Number(val) : undefined)
});

export const updateKbSchema = createKbSchema.partial(); // Tái sử dụng nhưng các trường đều optional

export const feedbackKbSchema = z.object({
  huu_ich: z.boolean({ message: "Vui lòng truyền trạng thái đánh giá huu_ich (true/false)" })
});