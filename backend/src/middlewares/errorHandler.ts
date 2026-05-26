import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * 1. LỚP TẠO LỖI NGHIỆP VỤ (AppError)
 * Giúp bạn chủ động ném lỗi ra (Ví dụ: Sai mật khẩu, Tài khoản bị khóa)
 */
export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    
    // Lưu lại vết lỗi (Stack Trace) để dễ debug xem lỗi sinh ra từ dòng nào
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 2. TỔNG ĐÀI XỬ LÝ LỖI TRUNG TÂM (errorHandler)
 * Nơi hứng tất cả các lỗi trong hệ thống và trả về JSON thống nhất cho Frontend
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Ghi log lỗi ra màn hình Terminal của Server để lập trình viên xem
  console.error(`[ERROR] [${new Date().toISOString()}] - ${err.message}`);
  if (err.stack) console.error(err.stack);

  // Trường hợp 1: Lỗi do dữ liệu đầu vào không vượt qua bộ lọc Zod (Validate)
  if (err.name === 'ZodError' || err instanceof ZodError) {
    const zodErrors = (err as any).errors || [];
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu gửi lên không đúng định dạng. Vui lòng kiểm tra lại!',
      errors: zodErrors.map((e: any) => ({
        truong_du_lieu: e.path.join('.'),
        thong_bao: e.message
      }))
    });
  }

  // Trường hợp 2: Lỗi nghiệp vụ do chúng ta chủ động ném ra bằng AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Trường hợp 3: Lỗi đặc thù từ Prisma (Ví dụ: P2002 là trùng lặp dữ liệu Unique)
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Dữ liệu đã tồn tại trong hệ thống (Vi phạm ràng buộc duy nhất).',
    });
  }

  // Trường hợp 4: Lỗi Prisma vi phạm khóa ngoại (P2003)
  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Một số ID tham chiếu (ví dụ: ID phòng ban, ID nhóm hỗ trợ, ID vai trò) không tồn tại trong hệ thống.',
    });
  }

  // Trường hợp 5: Lỗi không xác định (Lỗi sập nguồn, mất kết nối DB, code logic bị crash...)
  // Không bao giờ trả chi tiết lỗi hệ thống này ra cho Client ở Production để đảm bảo bảo mật
  return res.status(500).json({
    success: false,
    message: 'Hệ thống gặp sự cố bất ngờ. Vui lòng thử lại sau hoặc liên hệ Quản lý IT!',
  });
};