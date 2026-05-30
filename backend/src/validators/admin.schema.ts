// src/validators/admin.schema.ts
import { z } from 'zod';

// Regex chuẩn bảo mật: >= 8 ký tự, có chữ hoa, thường, số, ký tự đặc biệt
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const userQuerySchema = z.object({
  page: z.string().optional().transform(val => (val ? Number(val) : 1)).pipe(z.number().min(1)),
  limit: z.string().optional().transform(val => (val ? Number(val) : 10)).pipe(z.number().max(100)),
  vai_tro_id: z.string().optional().transform(val => val ? Number(val) : undefined),
  nhom_ho_tro_id: z.string().optional().transform(val => val ? Number(val) : undefined),
  trang_thai: z.string().optional().transform(val => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }),
  keyword: z.string().optional()
});

export const createUserSchema = z.object({
  ho_ten: z.string({ message: "Họ tên không được để trống" }).min(2, "Họ tên quá ngắn"),
  email: z.string({ message: "Email không được để trống" }).email("Email sai định dạng"),
  tai_khoan: z.string({ message: "Tài khoản không được để trống" }).min(3, "Tài khoản từ 3 ký tự"),
  mat_khau: z.string({ message: "Mật khẩu không được để trống" }).regex(passwordRegex, "Mật khẩu phải từ 8 ký tự, gồm chữ hoa, thường, số và ký tự đặc biệt"),
  vai_tro_id: z.number({ message: "ID vai trò phải là số" }).int().min(1),
  phong_ban_id: z.number({ message: "ID phòng ban phải là số" }).int().min(1),
  nhom_ho_tro_id: z.number({ message: "ID nhóm hỗ trợ phải là số" }).int().optional()
});

export const updateUserSchema = z.object({
  ho_ten: z.string().min(2).optional(),
  vai_tro_id: z.number().int().min(1).optional(),
  phong_ban_id: z.number().int().min(1).optional(),
  nhom_ho_tro_id: z.number().int().optional(),
  trang_thai: z.boolean().optional()
});

export const updatePermissionsSchema = z.object({
  quyen_han: z.array(z.string(), { message: "Quyền hạn phải là một mảng chuỗi" }).min(1, "Danh sách quyền không được để trống")
});

export const updateTeamSchema = z.object({
  nhan_vien_ids: z.array(z.number().int(), { message: "Danh sách nhân viên phải là mảng các ID định dạng số" })
});