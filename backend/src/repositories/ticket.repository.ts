// src/repositories/ticket.repository.ts
import { prisma } from '../libs/prisma';
import { Prisma, TrangThaiPhieu } from '@prisma/client';

export const ticketRepository = {
  countTicketsToday: async (startOfDay: Date, endOfDay: Date) => {
    return prisma.phieuHoTro.count({
      where: { ngay_tao: { gte: startOfDay, lte: endOfDay } }
    });
  },

  findActiveSlaPolicy: async (mucDo: any) => {
    return prisma.chinhSachSla.findFirst({
      where: { muc_do_uu_tien: mucDo, trang_thai: true }
    });
  },

  createTicketWithSla: async (ticketData: any, slaData: any[]) => {
    return prisma.$transaction(async (tx) => {
      const newTicket = await tx.phieuHoTro.create({ 
        data: ticketData 
      });
      
      const slas = slaData.map(sla => ({
        phieu_ho_tro_id: newTicket.phieu_ho_tro_id,
        chinh_sach_sla_id: sla.chinh_sach_sla_id,
        loai_sla: sla.loai_sla,
        trang_thai_muc_tieu: sla.trang_thai_muc_tieu,
        thoi_diem_bat_dau: sla.thoi_diem_bat_dau,
        han_chot: sla.han_chot
      }));
      
      await tx.slaTheoDoi.createMany({ 
        data: slas 
      });

      await tx.lichSuPhieu.create({
        data: {
          phieu_ho_tro_id: newTicket.phieu_ho_tro_id,
          nguoi_thuc_hien_id: newTicket.nguoi_tao_id, 
          hanh_dong: 'CREATED',
          chi_tiet: 'Hệ thống ghi nhận phiếu yêu cầu mới từ nhân viên.'
        }
      });

      return newTicket;
    });
  },

  findTickets: async (where: Prisma.PhieuHoTroWhereInput, skip: number, take: number) => {
    const [total, data] = await Promise.all([
      prisma.phieuHoTro.count({ where }),
      prisma.phieuHoTro.findMany({
        where,
        skip,
        take,
        orderBy: { ngay_tao: 'desc' },
        include: {
          nguoi_tao: { select: { ho_ten: true, tai_khoan: true } },
          nguoi_ho_tro: { select: { ho_ten: true } }
        }
      })
    ]);
    return { total, data };
  },

  findById: async (id: number) => {
    return prisma.phieuHoTro.findUnique({
      where: { phieu_ho_tro_id: id },
      include: {
        nguoi_tao: { select: { ho_ten: true, email: true, tai_khoan: true } },
        nguoi_ho_tro: { select: { ho_ten: true, email: true } },
        nhom_xu_ly: true,
        danh_sach_sla: true, // ĐÃ SỬA: Đồng bộ 100% theo tên trường trong schema.prisma của bạn
        danh_sach_file: true,
        danh_sach_bl: {
          include: { nguoi_gui: { select: { ho_ten: true } } }
        },
        danh_sach_log: {
          orderBy: { ngay_thuc_hien: 'asc' },
          include: { nguoi_thuc_hien: { select: { ho_ten: true } } }
        }
      }
    });
  },

  updateStatus: async (id: number, trang_thai: TrangThaiPhieu, userId: number, ghi_chu?: string) => {
    return prisma.$transaction(async (tx) => {
      const currentTicket = await tx.phieuHoTro.findUnique({
        where: { phieu_ho_tro_id: id },
        select: { trang_thai: true }
      });

      const updatedTicket = await tx.phieuHoTro.update({
        where: { phieu_ho_tro_id: id },
        data: { trang_thai }
      });

      await tx.lichSuPhieu.create({
        data: {
          phieu_ho_tro_id: id,
          nguoi_thuc_hien_id: userId,
          hanh_dong: 'STATUS_CHANGED',
          gia_tri_cu: currentTicket?.trang_thai,
          gia_tri_moi: trang_thai,
          ghi_chu: ghi_chu || 'Cập nhật trạng thái thông qua IT Helpdesk Dashboard'
        }
      });
      
      return updatedTicket;
    });
  }
};