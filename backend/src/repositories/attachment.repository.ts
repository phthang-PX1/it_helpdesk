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

  // Bulk Insert nhiều files cùng lúc
  saveAttachments: async (filesData: any[]) => {
    await prisma.tepDinhKem.createMany({ data: filesData });
    // Trả về danh sách file vừa tạo dựa trên đường dẫn
    return prisma.tepDinhKem.findMany({
      where: { duong_dan_file: { in: filesData.map(f => f.duong_dan_file) } }
    });
  },

  // Xóa bản ghi trong DB
  deleteAttachmentRecord: async (attachmentId: number) => {
    return prisma.tepDinhKem.delete({
      where: { tep_dinh_kem_id: attachmentId }
    });
  }
};