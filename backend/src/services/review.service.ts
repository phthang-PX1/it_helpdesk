// src/services/review.service.ts
import { prisma } from '../libs/prisma';
import { reviewRepository } from '../repositories/review.repository';
import { AppError } from '../middlewares/errorHandler';

export const reviewService = {
  // Fix #1: Đổi sang DB lookup thay vì JWT verify
  // Lý do: ticket.service.ts tạo token bằng crypto.randomBytes(hex), không phải JWT.
  // Bản ghi PhieuDanhGia được tạo sẵn (pending) với so_sao=0 khi ticket → DA_GIAI_QUYET.
  validateTokenAPI: async (token: string) => {
    // Bước 1: Tìm bản ghi pending trong DB bằng token hex
    const pendingReview = await reviewRepository.findPendingReviewByToken(token);
    if (!pendingReview) {
      throw new AppError('Token đánh giá không hợp lệ, đã hết hạn hoặc phiếu đã được đánh giá rồi', 404);
    }

    // Bước 2: Lấy thông tin ticket gốc
    const ticket = await reviewRepository.getTicketForReview(pendingReview.phieu_ho_tro_id);
    if (!ticket) throw new AppError('Ticket không tồn tại', 404);

    return ticket;
  },

  submitReview: async (data: any) => {
    // Bước 1: Tìm bản ghi pending bằng token hex
    const pendingReview = await reviewRepository.findPendingReviewByToken(data.token);
    if (!pendingReview) {
      throw new AppError('Token đánh giá không hợp lệ, đã hết hạn hoặc phiếu đã được đánh giá rồi', 404);
    }

    const ticketId = pendingReview.phieu_ho_tro_id;
    const ticket = await reviewRepository.getTicketForReview(ticketId);
    if (!ticket) throw new AppError('Ticket không tồn tại', 404);

    let result;
    let ket_qua = '';

    if (data.hai_long) {
      // Hài lòng → Cập nhật bản ghi pending + Đóng Ticket
      result = await reviewRepository.updateReviewAndCloseTicket(pendingReview.danh_gia_id, ticketId, ticket.nguoi_tao_id, data);
      ket_qua = 'CLOSED';
    } else {
      // Không hài lòng → Cập nhật bản ghi pending + Tự động mở lại Ticket
      const newSoLanMoLai = ticket.so_lan_mo_lai + 1;

      // Auto-assign: Nếu mở lại > 2 lần, ép chuyển lên L2
      const nhomL2 = await prisma.nhomHoTro.findFirst({ where: { ten_nhom: { contains: 'L2' } } });
      const nhomL2Id = nhomL2 ? nhomL2.nhom_ho_tro_id : 2;
      const newGroupId = newSoLanMoLai > 2 ? nhomL2Id : ticket.nhom_xu_ly_id;

      result = await reviewRepository.updateReviewAndReopenTicket(pendingReview.danh_gia_id, ticketId, ticket.nguoi_tao_id, data, newSoLanMoLai, newGroupId);
      ket_qua = 'REOPENED';
    }

    return { result, ket_qua, ticketId };
  },

  getReviewDetail: async (ticketId: number) => {
    const review = await reviewRepository.getReviewDetail(ticketId);
    if (!review) throw new AppError('Chưa có đánh giá cho ticket này', 404);
    return review;
  }
};