import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

interface UserPayload {
  nhan_vien_id: number;
  tai_khoan: string | null;
  vai_tro: string | null; 
}

// Đồng bộ hóa cấu trúc mở rộng đối tượng Request của Express sang kiểu 'user'
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) {
    return next(new AppError('Bạn chưa đăng nhập! Vui lòng đăng nhập để tiếp tục.', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as UserPayload;

    // Lưu trữ thông tin giải mã vào req.user đồng bộ hoàn toàn với Controller
    req.user = decoded;

    next(); 
  } catch (error) {
    return next(new AppError('Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại!', 401));
  }
};

export const checkRole = (vaiTroChoPhep: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.vai_tro) {
      return next(new AppError('Hệ thống không thể xác thực danh tính hoặc quyền hạn. Vui lòng đăng nhập lại!', 401));
    }

    const vaiTroNguoiDung = req.user.vai_tro;

    if (!vaiTroChoPhep.includes(vaiTroNguoiDung)) {
      return next(new AppError('Bạn không có quyền thực hiện thao tác này! (Lỗi phân quyền hệ thống)', 403));
    }

    next(); 
  };
};