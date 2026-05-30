// Hàm này sẽ bao bọc Controller của bạn. Nếu có lỗi nghiệp vụ hay lỗi DB, nó tự động đá văng lỗi sang errorHandler
import { Request, Response, NextFunction } from 'express';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const catchAsync = (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};