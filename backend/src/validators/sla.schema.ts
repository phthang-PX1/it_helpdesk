// src/validators/sla.schema.ts
import { z } from 'zod';
import { LoaiThoiGian, MucDoUuTien } from '@prisma/client';

export const getSlaPoliciesQuerySchema = z.object({
  trang_thai: z.enum(['active', 'inactive'], { 
    message: "Trạng thái lọc phải là 'active' hoặc 'inactive'" 
  }).optional()
});

export const createSlaSchema = z.object({
  ten_chinh_sach: z.string({ message: "Tên chính sách không được để trống" }).min(3, "Tên chính sách quá ngắn"),
  loai_thoi_gian: z.enum([LoaiThoiGian.GIO_HANH_CHINH, LoaiThoiGian.H24_7] as const, { 
    message: "Loại thời gian phải là GIO_HANH_CHINH hoặc H24_7" 
  }),
  muc_do_uu_tien: z.enum([MucDoUuTien.THAP, MucDoUuTien.TRUNG_BINH, MucDoUuTien.CAO] as const, { 
    message: "Mức độ ưu tiên phải là THAP, TRUNG_BINH hoặc CAO" 
  }),
  tg_phan_hoi: z.number({ message: "Thời gian phản hồi phải là số (phút)" })
    .int()
    .positive("Thời gian phản hồi phải lớn hơn 0"),
  tg_xu_ly: z.number({ message: "Thời gian xử lý phải là số (phút)" })
    .int()
    .positive("Thời gian xử lý phải lớn hơn 0")
});

export const updateSlaSchema = z.object({
  ten_chinh_sach: z.string().min(3, "Tên chính sách quá ngắn").optional(),
  loai_thoi_gian: z.enum([LoaiThoiGian.GIO_HANH_CHINH, LoaiThoiGian.H24_7] as const).optional(),
  tg_phan_hoi: z.number().int().positive("Thời gian phản hồi phải lớn hơn 0").optional(),
  tg_xu_ly: z.number().int().positive("Thời gian xử lý phải lớn hơn 0").optional(),
  trang_thai: z.boolean().optional()
});