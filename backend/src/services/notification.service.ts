// src/services/notification.service.ts
import { notificationRepository } from '../repositories/notification.repository';
import { AppError } from '../middlewares/errorHandler';

export const notificationService = {
  getNotifications: async (userId: number, query: any) => {
    const { page, limit, da_doc } = query;
    const skip = (page - 1) * limit;

    const where: any = { nguoi_nhan_id: userId };
    if (da_doc !== undefined) {
      where.da_doc = da_doc;
    }

    const { total, soChuaDoc, data } = await notificationRepository.findNotifications(userId, where, skip, limit);

    // Chuẩn hóa key trả về theo đúng tài liệu (thong_bao_id -> notification_id)
    const formattedData = data.map(item => ({
      notification_id: item.thong_bao_id,
      loai: item.loai,
      tieu_de: item.tieu_de,
      noi_dung: item.noi_dung,
      phieu_ho_tro_id: item.phieu_ho_tro_id,
      da_doc: item.da_doc,
      ngay_tao: item.ngay_tao
    }));

    return {
      data: formattedData,
      so_chua_doc: soChuaDoc,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  },

  readNotification: async (id: number, userId: number) => {
    const notification = await notificationRepository.findNotificationById(id);
    if (!notification) throw new AppError('Thông báo không tồn tại', 404);

    // Chốt chặn bảo mật: Cấm đọc trộm thông báo của người khác
    if (notification.nguoi_nhan_id !== userId) {
      throw new AppError('Bạn không có quyền truy cập thông báo này', 403);
    }

    const updated = await notificationRepository.markAsRead(id);
    return { notification_id: updated.thong_bao_id, da_doc: updated.da_doc };
  },

  readAllNotifications: async (userId: number) => {
    const result = await notificationRepository.markAllAsRead(userId);
    // Prisma updateMany trả về { count: number }
    return { so_da_cap_nhat: result.count };
  }
};