// src/controllers/review.controller.ts
import { Response } from 'express';
import { reviewService } from '../services/review.service';
import { validateTokenSchema, submitReviewSchema } from '../validators/review.schema';
import { AppError } from '../middlewares/errorHandler';
import { getIo } from '../libs/socket';

export const reviewController = {
  validateToken: async (req: any, res: Response, next: any) => {
    try {
      const { token } = validateTokenSchema.parse(req.query);
      const ticket = await reviewService.validateTokenAPI(token);

      res.status(200).json({
        success: true,
        valid: true,
        ticket: { phieu_ho_tro_id: ticket.phieu_ho_tro_id, ma_phieu: ticket.ma_phieu, tieu_de: ticket.tieu_de }
      });
    } catch (error) { next(error); }
  },

  submitReview: async (req: any, res: Response, next: any) => {
    try {
      const validData = submitReviewSchema.parse(req.body);
      const { result, ket_qua, ticketId } = await reviewService.submitReview(validData);

      // 🔗 REALTIME SOCKET.IO: Phát sóng Dashboard KPI & Cảnh báo
      const io = getIo();
      
      // Update Dashboard chung
      io.emit('dashboard_kpi_update', { event: 'NEW_REVIEW', so_sao: validData.so_sao });

      // Cảnh báo Manager nếu sao < 3
      if (validData.so_sao < 3) {
        io.to('QUAN_LY').emit('manager_warning_alert', {
          message: `CẢNH BÁO: Ticket #${ticketId} vừa nhận đánh giá tồi (${validData.so_sao} sao)! Hệ thống đã tự động Reopen.`,
          ticket_id: ticketId,
          so_sao: validData.so_sao
        });
      }

      res.status(200).json({
        success: true,
        message: 'Gửi đánh giá thành công',
        data: {
          phieu_danh_gia_id: result.danh_gia_id,
          ket_qua,
          trang_thai_ticket: ket_qua === 'CLOSED' ? 'DA_DONG' : 'DANG_GIAI_QUYET'
        }
      });
    } catch (error) { next(error); }
  },

  getReview: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user?.nhan_vien_id) throw new AppError('Yêu cầu xác thực tài khoản', 401);
      
      const ticketId = parseInt(req.params.ticket_id);
      if (isNaN(ticketId)) throw new AppError('Định dạng mã ID không hợp lệ', 400);

      const review = await reviewService.getReviewDetail(ticketId);

      res.status(200).json({
        success: true,
        message: 'Lấy dữ liệu đánh giá thành công',
        data: {
          phieu_danh_gia_id: review.danh_gia_id,
          so_sao: review.so_sao,
          hai_long: review.hai_long,
          nhan_xet: review.nhan_xet,
          nguoi_danh_gia: review.nguoi_danh_gia?.ho_ten,
          ngay_danh_gia: review.ngay_danh_gia
        }
      });
    } catch (error) { next(error); }
  }
};