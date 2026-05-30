import { z } from 'zod';

export const loginSchema = z.object({
  tai_khoan: z.string().min(1, 'Tài khoản không được để trống'),
  mat_khau: z.string().min(1, 'Mật khẩu không được để trống'),
});

export const googleLoginSchema = z.object({
  google_id_token: z.string().min(1, 'Google ID Token là bắt buộc'),
});

export const logoutSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh Token là bắt buộc'),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh Token là bắt buộc'),
});