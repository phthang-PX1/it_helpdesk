import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import * as authValidator from '../validators/auth.validator';
import { catchAsync } from '../utils/catchAsync'; 
import { AppError } from '../middlewares/errorHandler';

export const login = catchAsync(async (req: Request, res: Response) => {
  const validatedData = authValidator.loginSchema.parse(req.body);

  const result = await authService.loginUser(validatedData.tai_khoan, validatedData.mat_khau);

  res.status(200).json({
    success: true,
    message: 'Đăng nhập thành công',
    data: result
  });
});

export const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const validatedData = authValidator.googleLoginSchema.parse(req.body);

  const result = await authService.googleLoginUser(validatedData.google_id_token);

  res.status(200).json({
    success: true,
    message: 'Đăng nhập bằng Google thành công',
    data: result
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const validatedData = authValidator.logoutSchema.parse(req.body);

  const result = await authService.logoutUser(validatedData.refresh_token);

  res.status(200).json({
    success: true,
    message: result.message, 
    data: null 
  });
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const validatedData = authValidator.refreshTokenSchema.parse(req.body);

  const result = await authService.refreshAccessToken(validatedData.refresh_token);

  res.status(200).json({
    success: true,
    message: 'Cấp lại Access Token thành công',
    data: result
  });
});

/**
 * API-05: Lấy thông tin cá nhân của người dùng hiện tại
 */
export const getMe = catchAsync(async (req: any, res: Response) => {
  // 1. Lấy nhan_vien_id từ req.user (dùng dấu ? để tránh crash nếu user rỗng)
  const nhanVienId = req.user?.nhan_vien_id; 

  // 2. Kiểm tra phòng hờ nếu không tìm thấy id thì báo lỗi 401 ngay
  if (!nhanVienId) {
    throw new AppError('Phiên đăng nhập không hợp lệ hoặc đã hết hạn!', 401);
  }

  // 3. Lúc này nhanVienId chắc chắn là number, truyền vào service sẽ sạch lỗi 100%
  const result = await authService.getMe(nhanVienId);

  res.status(200).json({
    success: true,
    message: 'Lấy thông tin tài khoản thành công',
    data: result
  });
});