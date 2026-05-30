// src/repositories/kb.repository.ts
import { prisma } from '../libs/prisma';
import { TrangThaiBaiViet, Prisma } from '@prisma/client';

export const kbRepository = {
  // API-20: Gợi ý tìm kiếm nhanh (Chỉ lấy bài đã xuất bản)
  searchPublishedArticles: async (keyword: string, limit: number) => {
    return prisma.coSoTriThuc.findMany({
      where: {
        trang_thai: TrangThaiBaiViet.DA_XUAT_BAN,
        OR: [
          { tieu_de: { contains: keyword, mode: 'insensitive' } },
          { noi_dung: { contains: keyword, mode: 'insensitive' } },
          { the_tags: { contains: keyword, mode: 'insensitive' } }
        ]
      },
      take: limit,
      select: {
        tri_thuc_id: true, tieu_de: true, loai_su_co: true, the_tags: true, 
        luot_xem: true, luot_huu_ich: true, trang_thai: true, noi_dung: true 
      }
    });
  },

  // API-21: Lấy danh sách phân trang và bộ lọc
  findArticles: async (where: Prisma.CoSoTriThucWhereInput, orderBy: any, skip: number, take: number) => {
    const [total, data] = await Promise.all([
      prisma.coSoTriThuc.count({ where }),
      prisma.coSoTriThuc.findMany({
        where, orderBy, skip, take,
        include: { tac_gia: { select: { ho_ten: true } } }
      })
    ]);
    return { total, data };
  },

  // API-22: Tải chi tiết và đếm view
  findById: async (id: number) => {
    return prisma.coSoTriThuc.findUnique({
      where: { tri_thuc_id: id },
      include: {
        tac_gia: { select: { ho_ten: true, tai_khoan: true } },
        danh_sach_file: true
      }
    });
  },

  incrementView: async (id: number) => {
    return prisma.coSoTriThuc.update({
      where: { tri_thuc_id: id },
      data: { luot_xem: { increment: 1 } },
      select: { tri_thuc_id: true, luot_xem: true }
    });
  },

  // API-23: Tạo bài mới có kèm đính kèm
  createArticle: async (data: any, files: any[]) => {
    return prisma.$transaction(async (tx) => {
      const article = await tx.coSoTriThuc.create({ data });
      if (files.length > 0) {
        const payloadFiles = files.map(f => ({ ...f, tri_thuc_id: article.tri_thuc_id }));
        await tx.tepDinhKem.createMany({ data: payloadFiles });
      }
      return article;
    });
  },

  // API-24: Cập nhật
  updateArticle: async (id: number, data: any) => {
    return prisma.coSoTriThuc.update({
      where: { tri_thuc_id: id },
      data
    });
  },

  // API-25: Ghi nhận Feedback
  updateFeedback: async (id: number, huuIch: boolean) => {
    return prisma.coSoTriThuc.update({
      where: { tri_thuc_id: id },
      data: huuIch ? { luot_huu_ich: { increment: 1 } } : { luot_khong_huu_ich: { increment: 1 } },
      select: { tri_thuc_id: true, luot_huu_ich: true, luot_khong_huu_ich: true }
    });
  }
};