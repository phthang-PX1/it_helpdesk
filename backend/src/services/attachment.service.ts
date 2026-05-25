// src/services/attachment.service.ts
import { attachmentRepository } from '../repositories/attachment.repository';
import { AppError } from '../middlewares/errorHandler';
import { TrangThaiPhieu } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { saveMemoryFileToDisk } from '../libs/multer';

export const attachmentService = {
// --- NÂNG CẤP ĐỒNG BỘ MEMORY STORAGE CHO API-26 ---
  uploadToTicket: async (ticketId: number, userId: number, userRole: string, expressFiles: any[]) => {
    const ticket = await attachmentRepository.findTicketForAttachment(ticketId);
    if (!ticket) throw new AppError('Ticket không tồn tại', 404);

    if (ticket.trang_thai === TrangThaiPhieu.DA_DONG) {
      throw new AppError('Không thể tải file lên Phiếu hỗ trợ đã đóng', 409);
    }

    // 🔥 MAP VÀ GHI FILE ĐÍNH KÈM TỪ BUFFER RAM XUỐNG DISK BẰNG HELPER UUID MỚI
    const filesPayload = expressFiles.map((f: any) => {
      const diskData = saveMemoryFileToDisk(f, 'attachments');
      return {
        ...diskData,
        phieu_ho_tro_id: ticketId
      };
    });

    return await attachmentRepository.saveAttachments(filesPayload);
  },

  // API-27
  deleteAttachment: async (attachmentId: number, userId: number, userRole: string) => {
    const attachment = await attachmentRepository.findAttachmentById(attachmentId);
    if (!attachment) throw new AppError('File không tồn tại trên hệ thống', 404);

    // Ràng buộc 1: Ticket đã đóng thì file là bất khả xâm phạm
    if (attachment.phieu_ho_tro && attachment.phieu_ho_tro.trang_thai === TrangThaiPhieu.DA_DONG) {
      throw new AppError('Không thể xóa file vì Phiếu hỗ trợ liên quan đã đóng', 409);
    }

    // Ràng buộc 2: Kiểm tra chủ sở hữu (Soft Check)
    // Chỉ Quản lý, Người tạo ticket, hoặc IT đang phụ trách mới được xóa file trực tiếp của Ticket
    const isManager = userRole === 'QUAN_LY';
    const isCreator = attachment.phieu_ho_tro?.nguoi_tao_id === userId;
    const isAssignedIT = attachment.phieu_ho_tro?.nguoi_ho_tro_id === userId;

    if (!isManager && !isCreator && !isAssignedIT) {
      throw new AppError('Bạn không có quyền xóa file đính kèm này', 403);
    }

    // 1. Xóa bản ghi trong DB
    await attachmentRepository.deleteAttachmentRecord(attachmentId);

    // 2. Dọn rác: Xóa file vật lý trên Server (Hoặc gọi AWS S3 Delete Object)
    try {
      if (fs.existsSync(attachment.duong_dan_file)) {
        fs.unlinkSync(attachment.duong_dan_file);
      }
    } catch (err) {
      console.error(`[Cảnh báo] Lỗi dọn rác file vật lý: ${attachment.duong_dan_file}`);
    }

    return true;
  }
};