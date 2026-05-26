// src/repositories/sla.repository.ts
import { prisma } from '../libs/prisma';
import { Prisma, MucDoUuTien } from '@prisma/client';

export const slaRepository = {
  // Lấy danh sách SLA
  getPolicies: async (where: Prisma.ChinhSachSlaWhereInput) => {
    return prisma.chinhSachSla.findMany({
      where,
      orderBy: { ngay_tao: 'desc' }
    });
  },

  // Kiểm tra xem đã có Policy nào đang ACTIVE cho mức độ ưu tiên này chưa
  checkActivePolicyConflict: async (mucDo: MucDoUuTien, excludeId?: number) => {
    const whereClause: Prisma.ChinhSachSlaWhereInput = {
      muc_do_uu_tien: mucDo,
      trang_thai: true
    };
    
    // Nếu truyền excludeId (khi update), ta sẽ loại trừ chính sách đang được cập nhật
    if (excludeId) {
      whereClause.chinh_sach_sla_id = { not: excludeId };
    }
    
    return prisma.chinhSachSla.findFirst({ where: whereClause });
  },

  // Tìm theo ID
  getPolicyById: async (id: number) => {
    return prisma.chinhSachSla.findUnique({
      where: { chinh_sach_sla_id: id }
    });
  },

  // Tạo mới
  createPolicy: async (data: any) => {
    return prisma.chinhSachSla.create({ data });
  },

  // Cập nhật
  updatePolicy: async (id: number, data: any) => {
    return prisma.chinhSachSla.update({
      where: { chinh_sach_sla_id: id },
      data
    });
  }
};