import { z } from 'zod';

// API-01: Định nghĩa schema đăng nhập truyền thống (Giữ lại của bạn)
export const loginSchema = z.object({
  tai_khoan: z.string().min(1, 'Tài khoản không được để trống'),
  mat_khau: z.string().min(1, 'Mật khẩu không được để trống'),
});

// API-02: Định nghĩa schema đăng nhập Google
export const googleLoginSchema = z.object({
  google_id_token: z.string().min(1, 'Google ID Token là bắt buộc'),
});

// API-03: Định nghĩa schema đăng xuất
export const logoutSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh Token là bắt buộc'),
});

// API-04: Định nghĩa schema cấp lại Access Token
export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh Token là bắt buộc'),
});