// src/repositories/attachment.repository.ts
import { prisma } from '../libs/prisma';

export const attachmentRepository = {
  // Kiểm tra Ticket có tồn tại và lấy thông tin trạng thái, người tạo
  findTicketForAttachment: async (ticketId: number) => {
    return prisma.phieuHoTro.findUnique({
      where: { phieu_ho_tro_id: ticketId },
      select: { phieu_ho_tro_id: true, trang_thai: true, nguoi_tao_id: true, nhom_xu_ly_id: true, nguoi_ho_tro_id: true }
    });
  },

  // Lấy thông tin file đính kèm kèm theo Ticket của nó (để check quyền)
  findAttachmentById: async (attachmentId: number) => {
    return prisma.tepDinhKem.findUnique({
      where: { tep_dinh_kem_id: attachmentId },
      include: {
        phieu_ho_tro: {
          select: { trang_thai: true, nguoi_tao_id: true, nguoi_ho_tro_id: true }
        }
      }
    });
  },

  // Bulk Insert nhiều files cùng lúc và cập nhật Ticket
  saveAttachments: async (ticketId: number, userId: number, filesData: any[]) => {
    return prisma.$transaction(async (tx) => {
      // 1. Insert file
      await tx.tepDinhKem.createMany({ data: filesData });
      
      // 2. Cập nhật ngày cập nhật của ticket để đẩy ticket lên
      await tx.phieuHoTro.update({
        where: { phieu_ho_tro_id: ticketId },
        data: { ngay_cap_nhat: new Date() }
      });

      // 3. Ghi lịch sử phiếu
      await tx.lichSuPhieu.create({
        data: {
          phieu_ho_tro_id: ticketId,
          nguoi_thuc_hien_id: userId,
          hanh_dong: 'FILE_UPLOADED',
          ghi_chu: `Đính kèm thêm ${filesData.length} tệp vào phiếu.`
        }
      });

      // 4. Trả về danh sách file vừa tạo
      return tx.tepDinhKem.findMany({
        where: { duong_dan_file: { in: filesData.map(f => f.duong_dan_file) } }
      });
    });
  },

  // Xóa bản ghi trong DB
  deleteAttachmentRecord: async (attachmentId: number) => {
    return prisma.tepDinhKem.delete({
      where: { tep_dinh_kem_id: attachmentId }
    });
  }
};