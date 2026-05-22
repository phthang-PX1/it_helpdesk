import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

// --- MỞ RỘNG KIỂU REQUEST CỦA EXPRESS ---
// Định nghĩa cấu trúc dữ liệu sẽ nằm trong Token (khớp với Payload lúc bạn ký ở Service)
interface NguoiDungPayload {
  nhan_vien_id: number;
  tai_khoan: string;
  vai_tro: string; // Các mã vai trò từ DB như: NGUOI_YEU_CAU, IT_L1, IT_L2, QUAN_LY
}

// Khai báo cho TypeScript biết req sẽ có thêm trường 'nguoi_dung'
declare global {
  namespace Express {
    interface Request {
      nguoi_dung?: NguoiDungPayload;
    }
  }
}

/**
 * 🛡️ 1. MIDDLEWARE KIỂM TRA THẺ ĐĂNG NHẬP (verifyToken)
 * Chặn đứng toàn bộ request không trình được Token hợp lệ hoặc hết hạn.
 */
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  // Lấy token từ header gửi lên (Dạng chuẩn: Authorization: Bearer <chuoi_token>)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Cắt chuỗi bốc lấy phần token phía sau

  if (!token) {
    return next(new AppError('Bạn chưa đăng nhập! Vui lòng đăng nhập để tiếp tục.', 401));
  }

  try {
    // Giải mã và kiểm tra chữ ký của chiếc thẻ Token này
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as NguoiDungPayload;

    // QUAN TRỌNG: Gắn thông tin người dùng đã giải mã vào req để các API phía sau sử dụng
    req.nguoi_dung = decoded;

    next(); // Thẻ hợp lệ -> Cho phép đi tiếp qua trạm kiểm soát
  } catch (error) {
    return next(new AppError('Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại!', 401));
  }
};

/**
 * 🔑 2. MIDDLEWARE PHÂN QUYỀN TRUY CẬP (checkRole)
 * Nhận vào một danh sách các vai trò được phép (Factory Pattern)
 * Ví dụ cách dùng trong route: checkRole(['IT_L1', 'QUAN_LY'])
 */
export const checkRole = (vaiTroChoPhep: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Bảo vệ logic: verifyToken bắt buộc phải chạy trước middleware này để có req.nguoi_dung
    if (!req.nguoi_dung) {
      return next(new AppError('Hệ thống không thể xác thực danh tính. Vui lòng đăng nhập lại!', 401));
    }

    const vaiTroNguoiDung = req.nguoi_dung.vai_tro;

    // Kiểm tra xem vai trò của nhân viên này có nằm trong danh sách được phép không
    if (!vaiTroChoPhep.includes(vaiTroNguoiDung)) {
      return next(new AppError('Bạn không có quyền thực hiện thao tác này! (Lỗi phân quyền hệ thống)', 403));
    }

    next(); // Đủ quyền hạn -> Cho phép tiến vào Controller xử lý nghiệp vụ
  };
};