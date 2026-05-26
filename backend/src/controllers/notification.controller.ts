// src/controllers/notification.controller.ts
import { Response } from 'express';
import { notificationService } from '../services/notification.service';
import { notificationQuerySchema, notificationParamSchema } from '../validators/notification.schema';
import { AppError } from '../middlewares/errorHandler';

export const notificationController = {
  getAll: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user?.nhan_vien_id) throw new AppError('Yêu cầu xác thực tài khoản', 401);
      
      const query = notificationQuerySchema.parse(req.query);
      const result = await notificationService.getNotifications(req.user.nhan_vien_id, query);

      res.status(200).json({
        success: true,
        data: result.data,
        so_chua_doc: result.so_chua_doc,
        pagination: result.pagination
      });
    } catch (error) { next(error); }
  },

  readOne: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user?.nhan_vien_id) throw new AppError('Yêu cầu xác thực tài khoản', 401);
      
      const { id } = notificationParamSchema.parse(req.params);
      const data = await notificationService.readNotification(id, req.user.nhan_vien_id);

      res.status(200).json({ success: true, message: 'Đã đánh dấu đọc', data });
    } catch (error) { next(error); }
  },

  readAll: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user?.nhan_vien_id) throw new AppError('Yêu cầu xác thực tài khoản', 401);
      
      const data = await notificationService.readAllNotifications(req.user.nhan_vien_id);

      res.status(200).json({ success: true, message: 'Đã đọc toàn bộ', data });
    } catch (error) { next(error); }
  }
};