import { Response } from 'express';
import { ticketService } from '../services/ticket.service';
import { createTicketSchema, getTicketsQuerySchema, updateTicketStatusSchema } from '../validators/ticket.schema';
import { AppError } from '../middlewares/errorHandler';

export const ticketController = {
  create: async (req: any, res: Response, next: any) => {
    try {
      const nhanVienId = req.user?.nhan_vien_id;
      if (!nhanVienId) throw new AppError('Yêu cầu xác thực tài khoản', 401);

      const validatedBody = createTicketSchema.parse(req.body);
      const data = await ticketService.createTicket(validatedBody, nhanVienId);

      res.status(201).json({ success: true, message: 'Khởi tạo ticket thành công', data });
    } catch (error) { next(error); }
  },

  getAll: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user?.nhan_vien_id) throw new AppError('Yêu cầu xác thực tài khoản', 401);

      const query = getTicketsQuerySchema.parse(req.query);
      const result = await ticketService.getTickets(query, req.user);

      res.status(200).json({
        success: true,
        message: 'Tải danh sách dữ liệu hoàn tất',
        data: result.data,
        pagination: { total: result.total, page: query.page, limit: query.limit }
      });
    } catch (error) { next(error); }
  },

  getDetail: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user?.nhan_vien_id) throw new AppError('Yêu cầu xác thực tài khoản', 401);

      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) throw new AppError('Định dạng mã ID truyền vào không hợp lệ', 400);

      const data = await ticketService.getTicketDetail(ticketId, req.user);
      res.status(200).json({ success: true, message: 'Tải dữ liệu chi tiết thành công', data });
    } catch (error) { next(error); }
  },

  updateStatus: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user?.nhan_vien_id) throw new AppError('Yêu cầu xác thực tài khoản', 401);

      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) throw new AppError('Định dạng mã ID truyền vào không hợp lệ', 400);

      const { trang_thai, ghi_chu } = updateTicketStatusSchema.parse(req.body);
      // cast trang_thai to any to satisfy service typing (validated by schema)
      const data = await ticketService.updateStatus(ticketId, trang_thai as any, ghi_chu || '', req.user);

      res.status(200).json({ success: true, message: 'Cập nhật trạng thái và lưu lịch sử thành công', data });
    } catch (error) { next(error); }
  }
};