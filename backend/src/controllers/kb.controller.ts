// src/controllers/kb.controller.ts
import { Response } from 'express';
import { kbService } from '../services/kb.service';
import { searchKbSchema, getKbQuerySchema, createKbSchema, updateKbSchema, feedbackKbSchema } from '../validators/kb.schema';
import { AppError } from '../middlewares/errorHandler';

export const kbController = {
  search: async (req: any, res: Response, next: any) => {
    try {
      const { q, limit } = searchKbSchema.parse(req.query);
      const data = await kbService.searchQuick(q, limit);
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  },

  getAll: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user) throw new AppError('Yêu cầu xác thực tài khoản', 401);
      const userRole = req.user.vai_tro?.ma_vai_tro || req.user.vai_tro;
      
      const query = getKbQuerySchema.parse(req.query);
      const result = await kbService.getArticles(query, userRole);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: { total: result.total, page: query.page, limit: query.limit }
      });
    } catch (error) { next(error); }
  },

  getDetail: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user) throw new AppError('Yêu cầu xác thực tài khoản', 401);
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new AppError('Mã bài viết không hợp lệ', 400);

      const userRole = req.user.vai_tro?.ma_vai_tro || req.user.vai_tro;
      const data = await kbService.getArticleDetail(id, req.user.nhan_vien_id, userRole);

      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  },

  create: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user) throw new AppError('Yêu cầu xác thực tài khoản', 401);
      const data = createKbSchema.parse(req.body);
      const expressFiles = (req.files as any[]) || [];

      const result = await kbService.createArticle(data, req.user.nhan_vien_id, expressFiles);

      res.status(201).json({
        success: true,
        message: data.trang_thai === 'DA_XUAT_BAN' ? 'Đã đăng tải bài viết lên Cơ sở Tri thức' : 'Lưu nháp thành công',
        data: { tri_thuc_id: result.tri_thuc_id, tieu_de: result.tieu_de, trang_thai: result.trang_thai, ngay_tao: result.ngay_tao }
      });
    } catch (error) { next(error); }
  },

  update: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user) throw new AppError('Yêu cầu xác thực tài khoản', 401);
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new AppError('Mã bài viết không hợp lệ', 400);

      const data = updateKbSchema.parse(req.body);
      const userRole = req.user.vai_tro?.ma_vai_tro || req.user.vai_tro;

      const result = await kbService.updateArticle(id, req.user.nhan_vien_id, userRole, data);

      res.status(200).json({
        success: true,
        message: 'Cập nhật bài viết thành công',
        data: { tri_thuc_id: result.tri_thuc_id, tieu_de: result.tieu_de, trang_thai: result.trang_thai, ngay_cap_nhat: result.ngay_cap_nhat }
      });
    } catch (error) { next(error); }
  },

  feedback: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user) throw new AppError('Yêu cầu xác thực tài khoản', 401);
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new AppError('Mã bài viết không hợp lệ', 400);

      const { huu_ich } = feedbackKbSchema.parse(req.body);
      const result = await kbService.submitFeedback(id, req.user.nhan_vien_id, huu_ich);

      res.status(200).json({
        success: true,
        message: 'Cảm ơn bạn đã đánh giá bài viết!',
        data: result
      });
    } catch (error) { next(error); }
  }
};