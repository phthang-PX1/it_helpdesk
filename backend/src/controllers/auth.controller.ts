import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import * as authValidator from '../validators/auth.validator';

// Import catchAsync từ thư mục middlewares/utils của bạn (điều chỉnh lại đường dẫn nếu cần)
import { catchAsync } from '../utils/catchAsync'; 

/**
 * API-01: Đăng nhập hệ thống (Tài khoản & Mật khẩu)
 */
export const login = catchAsync(async (req: Request, res: Response) => {
  const validatedData = authValidator.loginSchema.parse(req.body);

  const result = await authService.loginUser(validatedData.tai_khoan, validatedData.mat_khau);

  res.status(200).json({
    success: true,
    message: 'Đăng nhập thành công',
    data: result
  });
});

/**
 * API-02: Đăng nhập bằng Google OAuth
 */
export const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const validatedData = authValidator.googleLoginSchema.parse(req.body);

  const result = await authService.googleLoginUser(validatedData.google_id_token);

  res.status(200).json({
    success: true,
    message: 'Đăng nhập bằng Google thành công',
    data: result
  });
});

/**
 * API-03: Đăng xuất và thu hồi Refresh Token
 */
export const logout = catchAsync(async (req: Request, res: Response) => {
  const validatedData = authValidator.logoutSchema.parse(req.body);

  const result = await authService.logoutUser(validatedData.refresh_token);

  res.status(200).json({
    success: true,
    // Lấy thẳng message "Đăng xuất thành công" được trả ra từ tầng Service
    message: result.message, 
    data: null // Đăng xuất xong không cần trả data về
  });
});

/**
 * API-04: Cấp lại Access Token mới (Refresh Token)
 */
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
// Lưu ý: Request ở đây dùng kiểu any hoặc tạo interface mở rộng để TypeScript hiểu req.user
export const getMe = catchAsync(async (req: any, res: Response) => {
  // req.user được gán từ middleware verifyToken (đã đi qua quá trình giải mã)
  const nhanVienId = req.user.nhan_vien_id; 

  const result = await authService.getMe(nhanVienId);

  res.status(200).json({
    success: true,
    message: 'Lấy thông tin tài khoản thành công',
    data: result
  });
});