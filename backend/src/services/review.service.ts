// src/services/review.service.ts
import jwt from 'jsonwebtoken';
import { prisma } from '../libs/prisma';
import { reviewRepository } from '../repositories/review.repository';
import { AppError } from '../middlewares/errorHandler';
import { TrangThaiPhieu } from '@prisma/client';

export const reviewService = {
  verifyReviewToken: (token: string) => {
    try {
      // Xác thực JWT (Bắt buộc phải set REVIEW_JWT_SECRET trong .env)
      const secret = process.env.REVIEW_JWT_SECRET || 'fallback_review_secret';
      return jwt.verify(token, secret) as any;
    } catch (error) {
      throw new AppError('Token đánh giá không hợp lệ hoặc đã hết hạn (>48h)', 401);
    }
  },

  validateTokenAPI: async (token: string) => {
    const decoded = reviewService.verifyReviewToken(token);
    const ticketId = decoded.phieu_ho_tro_id;

    const ticket = await reviewRepository.getTicketForReview(ticketId);
    if (!ticket) throw new AppError('Ticket không tồn tại', 404);

    const existingReview = await reviewRepository.checkExistingReview(ticketId);
    if (existingReview) throw new AppError('Phiếu hỗ trợ này đã được đánh giá rồi', 409);

    return ticket;
  },

  submitReview: async (data: any) => {
    const decoded = reviewService.verifyReviewToken(data.token);
    const ticketId = decoded.phieu_ho_tro_id;

    const ticket = await reviewRepository.getTicketForReview(ticketId);
    if (!ticket) throw new AppError('Ticket không tồn tại', 404);

    const existingReview = await reviewRepository.checkExistingReview(ticketId);
    if (existingReview) throw new AppError('Phiếu hỗ trợ này đã được đánh giá rồi', 409);

    let result;
    let ket_qua = '';

    if (data.hai_long) {
      // Hài lòng -> Đóng Ticket
      result = await reviewRepository.createReviewAndCloseTicket(ticketId, ticket.nguoi_tao_id, data);
      ket_qua = 'CLOSED';
    } else {
      // Không hài lòng -> Tự động mở lại Ticket (Nghiệp vụ API-11 nội bộ)
      const newSoLanMoLai = ticket.so_lan_mo_lai + 1;
      
      // Auto-assign: Nếu mở lại > 2 lần, ép chuyển lên L2
      const nhomL2 = await prisma.nhomHoTro.findFirst({ where: { ten_nhom: { contains: 'L2' } } });
      const nhomL2Id = nhomL2 ? nhomL2.nhom_ho_tro_id : 2;
      const newGroupId = newSoLanMoLai > 2 ? nhomL2Id : ticket.nhom_xu_ly_id;

      result = await reviewRepository.createReviewAndReopenTicket(ticketId, ticket.nguoi_tao_id, data, newSoLanMoLai, newGroupId);
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