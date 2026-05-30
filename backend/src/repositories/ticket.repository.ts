// src/repositories/ticket.repository.ts
import { prisma } from '../libs/prisma';
import { Prisma, TrangThaiPhieu, QuyenXem, LoaiBinhLuan } from '@prisma/client';

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

  // THUẬT TOÁN TÌM NGƯỜI HỖ TRỢ L1 ĐANG RẢNH NHẤT (LOAD BALANCING)
  findOptimalL1Supporter: async () => {
    return prisma.nhanVien.findFirst({
      where: {
        vai_tro: { ma_vai_tro: 'IT_L1' }, // Chỉ tìm nhân sự thuộc tuyến L1
        trang_thai: true,                 // Tài khoản đang hoạt động
        nhom_ho_tro_id: { not: null }     // Bắt buộc phải thuộc một nhóm hỗ trợ
      },
      orderBy: {
        // Ưu tiên người đang có ít phiếu "Mới tạo" hoặc "Đang giải quyết" nhất
        tickets_ho_tro: { _count: 'asc' } 
      },
      select: {
        nhan_vien_id: true,
        nhom_ho_tro_id: true,
        ho_ten: true
      }
    });
  },

  createTicketWithSla: async (ticketData: any, slaData: any[], filesData: any[], traceId?: string) => {
    return prisma.$transaction(async (tx) => {
      // Sửa lỗi Race Condition (G-05) bằng Sequence Table lock qua upsert
      const year = new Date().getFullYear();
      const sequence = await tx.maPhieuSequence.upsert({
        where: { year },
        update: { last_id: { increment: 1 } },
        create: { year, last_id: 1 }
      });
      ticketData.ma_phieu = `SW-${year}-${String(sequence.last_id).padStart(4, '0')}`;

      // 1. Tạo mới bản ghi phiếu hỗ trợ
      const newTicket = await tx.phieuHoTro.create({ 
        data: ticketData 
      });
      
      // 2. Map dữ liệu SLA
      const slas = slaData.map(sla => ({
        phieu_ho_tro_id: newTicket.phieu_ho_tro_id,
        chinh_sach_sla_id: sla.chinh_sach_sla_id,
        loai_sla: sla.loai_sla,
        trang_thai_muc_tieu: sla.trang_thai_muc_tieu,
        thoi_diem_bat_dau: sla.thoi_diem_bat_dau,
        han_chot: sla.han_chot
      }));
      await tx.slaTheoDoi.createMany({ data: slas });

      // 3. LƯU BẢN GHI FILE: Đẩy file đính kèm nếu Client gửi lên
      if (filesData && filesData.length > 0) {
        const filesToInsert = filesData.map(file => ({
          phieu_ho_tro_id: newTicket.phieu_ho_tro_id,
          ten_tep: file.ten_tep,
          duong_dan_file: file.duong_dan_file,
          dinh_dang: file.dinh_dang,
          dung_luong_kb: file.dung_luong_kb
        }));
        await tx.tepDinhKem.createMany({ data: filesToInsert });
      }

      // 4. Ghi lịch sử phiếu
      await tx.lichSuPhieu.create({
        data: {
          phieu_ho_tro_id: newTicket.phieu_ho_tro_id,
          nguoi_thuc_hien_id: newTicket.nguoi_tao_id, 
          hanh_dong: 'CREATED',
          trace_id: traceId,
          ghi_chu: filesData.length > 0 
            ? `Hệ thống ghi nhận phiếu yêu cầu kèm theo ${filesData.length} tệp đính kèm.`
            : 'Hệ thống ghi nhận phiếu yêu cầu mới từ nhân viên.'
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
        danh_sach_sla: true,
        danh_sach_file: true,
        danh_sach_bl: { include: { nguoi_gui: { select: { ho_ten: true } } } },
        danh_sach_log: { orderBy: { ngay_thuc_hien: 'asc' }, include: { nguoi_thuc_hien: { select: { ho_ten: true } } } }
      }
    });
  },

  updateStatus: async (id: number, trang_thai: TrangThaiPhieu, userId: number, ghi_chu?: string, traceId?: string) => {
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
          trace_id: traceId,
          ghi_chu: ghi_chu || 'Cập nhật trạng thái thông qua IT Helpdesk Dashboard'
        }
      });
      
      return updatedTicket;
    });
  },
  // --- API 10: CHUYỂN CẤP TICKET ---
  escalateTicket: async (ticketId: number, userId: number, nhomL2Id: number, lyDo: string, cacBuocDaThu: string, traceId?: string) => {
    return prisma.$transaction(async (tx) => {
      const ticket = await tx.phieuHoTro.update({
        where: { phieu_ho_tro_id: ticketId },
        data: {
          nhom_xu_ly_id: nhomL2Id,
          nguoi_ho_tro_id: null // Reset người hỗ trợ
        }
      });

      await tx.lichSuPhieu.create({
        data: {
          phieu_ho_tro_id: ticketId,
          nguoi_thuc_hien_id: userId,
          hanh_dong: 'ESCALATED',
          trace_id: traceId,
          ghi_chu: `Lý do: ${lyDo} | Đã thử: ${cacBuocDaThu}`
        }
      });
      return ticket;
    });
  },

  // --- API 11: MỞ LẠI TICKET ---
  reopenTicket: async (ticketId: number, userId: number, newSoLanMoLai: number, newGroupId: number, supporterId: number | null, lyDo: string, traceId?: string) => {
    return prisma.$transaction(async (tx) => {
      const ticket = await tx.phieuHoTro.update({
        where: { phieu_ho_tro_id: ticketId },
        data: {
          trang_thai: TrangThaiPhieu.DANG_GIAI_QUYET,
          so_lan_mo_lai: newSoLanMoLai,
          nhom_xu_ly_id: newGroupId,
          nguoi_ho_tro_id: supporterId
        }
      });

      await tx.lichSuPhieu.create({
        data: {
          phieu_ho_tro_id: ticketId,
          nguoi_thuc_hien_id: userId,
          hanh_dong: 'REOPENED',
          gia_tri_cu: TrangThaiPhieu.DA_GIAI_QUYET,
          gia_tri_moi: TrangThaiPhieu.DANG_GIAI_QUYET,
          trace_id: traceId,
          ghi_chu: `Lý do mở lại: ${lyDo}`
        }
      });
      return ticket;
    });
  },

  // --- API 12: TẠO BÌNH LUẬN ---
  createCommentWithFiles: async (
    ticketId: number, 
    userId: number, 
    noiDung: string, 
    quyenXem: QuyenXem, 
    filesData: { ten_tep: string; duong_dan_file: string; dinh_dang: string; dung_luong_kb: number }[],
    loaiBinhLuanEnum: LoaiBinhLuan = LoaiBinhLuan.THUONG,
    traceId?: string
  ) => {
    return prisma.$transaction(async (tx) => {
      // 1. Khởi tạo bản ghi bình luận
      const comment = await tx.binhLuan.create({
        data: {
          phieu_ho_tro_id: ticketId,
          nguoi_gui_id: userId,
          noi_dung: noiDung,
          loai_binh_luan: loaiBinhLuanEnum,
          quyen_xem: quyenXem
        },
        include: {
          nguoi_gui: {
            select: {
              ho_ten: true,
              vai_tro: { select: { ma_vai_tro: true } }
            }
          }
        }
      });
      

      // 2. Nếu có tệp tải lên từ Multer, bulk insert lồng vào transaction
      if (filesData.length > 0) {
        const payloadFiles = filesData.map(f => ({
          ...f,
          binh_luan_id: comment.binh_luan_id
        }));
        await tx.tepDinhKem.createMany({ data: payloadFiles });
      }

      await tx.lichSuPhieu.create({
        data: {
          phieu_ho_tro_id: ticketId,
          nguoi_thuc_hien_id: userId,
          hanh_dong: 'COMMENTED',
          gia_tri_moi: quyenXem,
          trace_id: traceId,
          ghi_chu: `Thêm bình luận mới (${quyenXem}) với ${filesData.length} tệp đính kèm.`
        }
      });

      // Tải lại bản ghi đầy đủ tệp tin để xuất về cho Frontend hiển thị mẫu
      return await tx.binhLuan.findUnique({
        where: { binh_luan_id: comment.binh_luan_id },
        include: {
          nguoi_gui: { select: { ho_ten: true, vai_tro: { select: { ma_vai_tro: true } } } },
          danh_sach_file: true
        }
      });
    });
  },

  // --- API 13: LẤY BÌNH LUẬN ---
  findComments: async (ticketId: number, restrictInternal: boolean, skip: number, take: number) => {
    const whereClause: any = { phieu_ho_tro_id: ticketId };
    
    if (restrictInternal) {
      whereClause.quyen_xem = QuyenXem.CONG_KHAI;
    }

    const [total, data] = await Promise.all([
      prisma.binhLuan.count({ where: whereClause }),
      prisma.binhLuan.findMany({
        where: whereClause,
        orderBy: { ngay_tao: 'desc' },
        skip,
        take,
        include: {
          nguoi_gui: { select: { ho_ten: true, vai_tro: { select: { ma_vai_tro: true } } } },
          danh_sach_file: true
        }
      })
    ]);
    return { total, data };
  },
  // --- API 14: LẤY LỊCH SỬ TICKET ---
  getHistoryByTicketId: async (ticketId: number) => {
    return prisma.lichSuPhieu.findMany({
      where: { phieu_ho_tro_id: ticketId },
      orderBy: { ngay_thuc_hien: 'asc' },
      include: {
        nguoi_thuc_hien: { select: { ho_ten: true, vai_tro: { select: { ma_vai_tro: true } } } }
      }
    });
  },

  // --- API 15: GÁN LẠI TICKET & TÌM KỸ THUẬT VIÊN ---
  findTechnicianById: async (techId: number) => {
    return prisma.nhanVien.findUnique({
      where: { nhan_vien_id: techId },
      select: { nhan_vien_id: true, ho_ten: true, nhom_ho_tro_id: true, trang_thai: true }
    });
  },

  assignTicketTransaction: async (ticketId: number, managerId: number, oldAssignee: number | null, newAssignee: number, traceId?: string) => {
    return prisma.$transaction(async (tx) => {
      const ticket = await tx.phieuHoTro.update({
        where: { phieu_ho_tro_id: ticketId },
        data: { nguoi_ho_tro_id: newAssignee }
      });

      await tx.lichSuPhieu.create({
        data: {
          phieu_ho_tro_id: ticketId,
          nguoi_thuc_hien_id: managerId,
          hanh_dong: 'REASSIGNED',
          gia_tri_cu: oldAssignee ? oldAssignee.toString() : 'Chưa có',
          gia_tri_moi: newAssignee.toString(),
          trace_id: traceId,
          ghi_chu: 'Quản lý chỉ định lại kỹ thuật viên phụ trách'
        }
      });

      return ticket;
    });
  },

  // --- API 16: LẤY THÔNG TIN SLA ---
  getSlaByTicketId: async (ticketId: number) => {
    return prisma.slaTheoDoi.findMany({
      where: { phieu_ho_tro_id: ticketId }
    });
  }
};