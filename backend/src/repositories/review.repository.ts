// src/repositories/review.repository.ts
import { prisma } from '../libs/prisma';
import { TrangThaiPhieu } from '@prisma/client';

export const reviewRepository = {
  // Tra cứu bản ghi đánh giá đang chờ submit (so_sao = 0 = chưa đánh giá thực sự)
  findPendingReviewByToken: async (token: string) => {
    return prisma.phieuDanhGia.findFirst({
      where: {
        token_xac_thuc: token,
        so_sao: 0 // Đây là bản ghi "pending" được tạo sẵn khi IT chuyển sang DA_GIAI_QUYET
      }
    });
  },

  checkExistingReview: async (ticketId: number) => {
    return prisma.phieuDanhGia.findUnique({
      where: { phieu_ho_tro_id: ticketId }
    });
  },

  getTicketForReview: async (ticketId: number) => {
    return prisma.phieuHoTro.findUnique({
      where: { phieu_ho_tro_id: ticketId },
      select: { phieu_ho_tro_id: true, ma_phieu: true, tieu_de: true, trang_thai: true, nguoi_tao_id: true, so_lan_mo_lai: true, nhom_xu_ly_id: true }
    });
  },

  // UC: Hài lòng -> Cập nhật bản ghi pending + Đóng Ticket
  updateReviewAndCloseTicket: async (danhGiaId: number, ticketId: number, userId: number, data: any) => {
    return prisma.$transaction(async (tx) => {
      const review = await tx.phieuDanhGia.update({
        where: { danh_gia_id: danhGiaId },
        data: {
          nguoi_danh_gia_id: userId,
          hai_long: data.hai_long,
          so_sao: data.so_sao,
          nhan_xet: data.nhan_xet || data.ly_do_khong_hai_long || null
        }
      });

      await tx.phieuHoTro.update({
        where: { phieu_ho_tro_id: ticketId },
        data: { trang_thai: TrangThaiPhieu.DA_DONG }
      });

      await tx.lichSuPhieu.create({
        data: {
          phieu_ho_tro_id: ticketId,
          nguoi_thuc_hien_id: userId,
          hanh_dong: 'CLOSED',
          ghi_chu: `Khách hàng đã đánh giá ${data.so_sao} sao. Đóng phiếu tự động.`
        }
      });

      return review;
    });
  },

  // UC: Không hài lòng -> Cập nhật bản ghi pending + Reopen Ticket
  updateReviewAndReopenTicket: async (danhGiaId: number, ticketId: number, userId: number, data: any, newSoLanMoLai: number, newGroupId: number) => {
    return prisma.$transaction(async (tx) => {
      const review = await tx.phieuDanhGia.update({
        where: { danh_gia_id: danhGiaId },
        data: {
          nguoi_danh_gia_id: userId,
          hai_long: false,
          so_sao: data.so_sao,
          nhan_xet: data.ly_do_khong_hai_long || data.nhan_xet || null
        }
      });

      await tx.phieuHoTro.update({
        where: { phieu_ho_tro_id: ticketId },
        data: {
          trang_thai: TrangThaiPhieu.DANG_GIAI_QUYET,
          so_lan_mo_lai: newSoLanMoLai,
          nhom_xu_ly_id: newGroupId,
          nguoi_ho_tro_id: null // Reset kỹ thuật viên để nhóm tự nhận lại
        }
      });

      await tx.lichSuPhieu.create({
        data: {
          phieu_ho_tro_id: ticketId,
          nguoi_thuc_hien_id: userId,
          hanh_dong: 'REOPENED',
          ghi_chu: `Phiếu bị mở lại do khách hàng đánh giá không hài lòng (${data.so_sao} sao). Lý do: ${data.ly_do_khong_hai_long}`
        }
      });

      return review;
    });
  },

  // UC (legacy - giữ lại, không dùng nữa): Hài lòng -> Tạo mới + Đóng Ticket
  createReviewAndCloseTicket: async (ticketId: number, userId: number, data: any) => {
    return prisma.$transaction(async (tx) => {
      const review = await tx.phieuDanhGia.create({
        data: {
          phieu_ho_tro_id: ticketId,
          nguoi_danh_gia_id: userId,
          token_xac_thuc: data.token.substring(0, 100),
          hai_long: data.hai_long,
          so_sao: data.so_sao,
          nhan_xet: data.nhan_xet || data.ly_do_khong_hai_long || null
        }
      });

      await tx.phieuHoTro.update({
        where: { phieu_ho_tro_id: ticketId },
        data: { trang_thai: TrangThaiPhieu.DA_DONG }
      });

      await tx.lichSuPhieu.create({
        data: {
          phieu_ho_tro_id: ticketId,
          nguoi_thuc_hien_id: userId,
          hanh_dong: 'CLOSED',
          ghi_chu: `Khách hàng đã đánh giá ${data.so_sao} sao. Đóng phiếu tự động.`
        }
      });

      return review;
    });
  },

  // UC (legacy - giữ lại, không dùng nữa): Không hài lòng -> Tạo mới + Reopen Ticket
  createReviewAndReopenTicket: async (ticketId: number, userId: number, data: any, newSoLanMoLai: number, newGroupId: number) => {
    return prisma.$transaction(async (tx) => {
      const review = await tx.phieuDanhGia.create({
        data: {
          phieu_ho_tro_id: ticketId,
          nguoi_danh_gia_id: userId,
          token_xac_thuc: data.token.substring(0, 100),
          hai_long: false,
          so_sao: data.so_sao,
          nhan_xet: data.ly_do_khong_hai_long || data.nhan_xet || null
        }
      });

      await tx.phieuHoTro.update({
        where: { phieu_ho_tro_id: ticketId },
        data: {
          trang_thai: TrangThaiPhieu.DANG_GIAI_QUYET,
          so_lan_mo_lai: newSoLanMoLai,
          nhom_xu_ly_id: newGroupId,
          nguoi_ho_tro_id: null
        }
      });

      await tx.lichSuPhieu.create({
        data: {
          phieu_ho_tro_id: ticketId,
          nguoi_thuc_hien_id: userId,
          hanh_dong: 'REOPENED',
          ghi_chu: `Phiếu bị mở lại do khách hàng đánh giá không hài lòng (${data.so_sao} sao). Lý do: ${data.ly_do_khong_hai_long}`
        }
      });

      return review;
    });
  },

  getReviewDetail: async (ticketId: number) => {
    return prisma.phieuDanhGia.findUnique({
      where: { phieu_ho_tro_id: ticketId },
      include: { nguoi_danh_gia: { select: { ho_ten: true } } }
    });
  }
};