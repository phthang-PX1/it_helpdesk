// src/repositories/notification.repository.ts
import { prisma } from '../libs/prisma';
import { Prisma } from '@prisma/client';

export const notificationRepository = {
  // Lấy danh sách, tổng số và số lượng chưa đọc (API-42)
  findNotifications: async (userId: number, where: Prisma.ThongBaoWhereInput, skip: number, take: number) => {
    const [total, soChuaDoc, data] = await Promise.all([
      prisma.thongBao.count({ where }),
      prisma.thongBao.count({ where: { nguoi_nhan_id: userId, da_doc: false } }),
      prisma.thongBao.findMany({
        where,
        skip,
        take,
        orderBy: { ngay_tao: 'desc' }
      })
    ]);
    return { total, soChuaDoc, data };
  },

  findNotificationById: async (id: number) => {
    return prisma.thongBao.findUnique({
      where: { thong_bao_id: id }
    });
  },

  // Đánh dấu 1 thông báo là đã đọc (API-43)
  markAsRead: async (id: number) => {
    return prisma.thongBao.update({
      where: { thong_bao_id: id },
      data: { da_doc: true }
    });
  },

  // Đánh dấu TẤT CẢ thông báo của user là đã đọc (API-44)
  markAllAsRead: async (userId: number) => {
    return prisma.thongBao.updateMany({
      where: { 
        nguoi_nhan_id: userId,
        da_doc: false 
      },
      data: { da_doc: true }
    });
  }
};