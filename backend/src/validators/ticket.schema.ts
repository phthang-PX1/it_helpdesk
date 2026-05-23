// src/validations/ticket.schema.ts
import { z } from 'zod';
import { TrangThaiPhieu, MucDoUuTien } from '@prisma/client';

export const createTicketSchema = z.object({
  tieu_de: z.string().min(5, 'Tiêu đề phải có ít nhất 5 ký tự'),
  mo_ta_chi_tiet: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự'),
});

export const updateTicketStatusSchema = z.object({
  // Đổi thành thuộc tính message để Zod khớp overload hoàn chỉnh
  trang_thai: z.enum(Object.values(TrangThaiPhieu) as [string, ...string[]], {
    message: 'Trạng thái chuyển đổi Workflow không hợp lệ'
  }),
  ghi_chu: z.string().optional()
});

export const getTicketsQuerySchema = z.object({
  page: z.string().optional().transform(val => (val ? Number(val) : 1)),
  limit: z.string().optional().transform(val => (val ? Number(val) : 10)),
  
  // Đồng bộ cấu hình dùng tham số message cho tầng query filter
  trang_thai: z.enum(Object.values(TrangThaiPhieu) as [string, ...string[]], {
    message: 'Trạng thái lọc dữ liệu không đúng định dạng'
  }).optional(),
  
  muc_do_uu_tien: z.enum(Object.values(MucDoUuTien) as [string, ...string[]], {
    message: 'Mức độ ưu tiên lọc dữ liệu không hợp lệ'
  }).optional(),
  
  keyword: z.string().optional(),
});