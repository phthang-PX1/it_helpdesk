// src/services/ticket.service.ts
import { ticketRepository } from '../repositories/ticket.repository';
import { AppError } from '../middlewares/errorHandler';
import { TrangThaiPhieu, MucDoUuTien, LoaiSla, TrangThaiMucTieu, QuyenXem } from '@prisma/client';

export const ticketService = {
  createTicket: async (data: any, userId: number) => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0,0,0,0));
    const endOfDay = new Date(today.setHours(23,59,59,999));
    const count = await ticketRepository.countTicketsToday(startOfDay, endOfDay);
    const ma_phieu = `SW-${today.getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    let muc_do_uu_tien: MucDoUuTien = MucDoUuTien.TRUNG_BINH;
    const contentLower = data.tieu_de.toLowerCase();
    if (contentLower.includes('khẩn') || contentLower.includes('sập hệ thống') || contentLower.includes('gấp')) {
      muc_do_uu_tien = MucDoUuTien.CAO;
    } else if (contentLower.includes('thong thả') || contentLower.includes('khi nào rảnh')) {
      muc_do_uu_tien = MucDoUuTien.THAP;
    }

    const policy = await ticketRepository.findActiveSlaPolicy(muc_do_uu_tien);
    const offsetPhanHoi = policy ? policy.tg_phan_hoi : 30; 
    const offsetXuLy = policy ? policy.tg_xu_ly : 180;     
    const chinhSachId = policy ? policy.chinh_sach_sla_id : 1; 

    const now = new Date();
    const slaData = [
      {
        chinh_sach_sla_id: chinhSachId,
        loai_sla: LoaiSla.PHAN_HOI,
        trang_thai_muc_tieu: TrangThaiMucTieu.TIEP_NHAN,
        thoi_diem_bat_dau: now,
        han_chot: new Date(now.getTime() + offsetPhanHoi * 60 * 1000)
      },
      {
        chinh_sach_sla_id: chinhSachId,
        loai_sla: LoaiSla.XU_LY,
        trang_thai_muc_tieu: TrangThaiMucTieu.DA_GIAI_QUYET,
        thoi_diem_bat_dau: now,
        han_chot: new Date(now.getTime() + offsetXuLy * 60 * 1000)
      }
    ];

    const ticketData = {
      ma_phieu,
      tieu_de: data.tieu_de,
      mo_ta_chi_tiet: data.mo_ta_chi_tiet,
      nguoi_tao_id: userId,
      nhom_xu_ly_id: 1, // Khớp với trường nhom_xu_ly_id trong schema.prisma của bạn
      muc_do_uu_tien,
      trang_thai: TrangThaiPhieu.MOI_TAO
    };

    return await ticketRepository.createTicketWithSla(ticketData, slaData);
  },

  getTickets: async (query: any, user: any) => {
    const { page, limit, trang_thai, muc_do_uu_tien } = query;
    const skip = (page - 1) * limit;

    let whereClause: any = {};
    if (trang_thai) whereClause.trang_thai = trang_thai;
    if (muc_do_uu_tien) whereClause.muc_do_uu_tien = muc_do_uu_tien;

    // Phân quyền dựa trên MaVaiTro hoặc EnumVaiTro của Phase 1
    if (user.vai_tro === 'NGUOI_YEU_CAU' || user.vai_tro?.ma_vai_tro === 'NGUOI_YEU_CAU') {
      whereClause.nguoi_tao_id = user.nhan_vien_id;
    } else if (['IT_L1', 'IT_L2'].includes(user.vai_tro) || ['IT_L1', 'IT_L2'].includes(user.vai_tro?.ma_vai_tro)) {
      whereClause.nhom_xu_ly_id = user.nhom_ho_tro_id;
    } 

    return await ticketRepository.findTickets(whereClause, skip, limit);
  },

  getTicketDetail: async (id: number, user: any) => {
    const ticket = await ticketRepository.findById(id);
    if (!ticket) throw new AppError('Ticket không tồn tại trên hệ thống Map Pacific', 404);

    const userRole = user.vai_tro?.ma_vai_tro || user.vai_tro;
    if (userRole === 'NGUOI_YEU_CAU' && ticket.nguoi_tao_id !== user.nhan_vien_id) {
      throw new AppError('Bạn không có quyền truy cập thông tin phiếu hỗ trợ này', 403);
    }

    // Đã sửa: Thay thế binh_luan_phieu và quyen_xem bằng danh_sach_bl và quyyen_xem khớp chuẩn schema
    if (userRole === 'NGUOI_YEU_CAU' && ticket.danh_sach_bl) {
      ticket.danh_sach_bl = ticket.danh_sach_bl.filter(
        (cmt) => cmt.quyen_xem !== QuyenXem.NOI_BO
      );
    }

    return ticket;
  },

  updateStatus: async (id: number, newStatus: TrangThaiPhieu, ghi_chu: string, user: any) => {
    const ticket = await ticketRepository.findById(id);
    if (!ticket) throw new AppError('Ticket không tồn tại', 404);

    if (ticket.trang_thai === TrangThaiPhieu.DA_DONG) {
      throw new AppError('Hành động bị từ chối: Phiếu hỗ trợ này đã được Đóng hoàn toàn', 409);
    }

    const validTransitions: Record<TrangThaiPhieu, TrangThaiPhieu[]> = {
      [TrangThaiPhieu.MOI_TAO]: [TrangThaiPhieu.DANG_GIAI_QUYET],
      [TrangThaiPhieu.DANG_GIAI_QUYET]: [TrangThaiPhieu.DA_GIAI_QUYET],
      [TrangThaiPhieu.DA_GIAI_QUYET]: [TrangThaiPhieu.DA_DONG],
      [TrangThaiPhieu.DA_DONG]: []
    };

    if (!validTransitions[ticket.trang_thai]?.includes(newStatus)) {
      throw new AppError(`Chuyển đổi trạng thái thất bại: Không được chuyển từ ${ticket.trang_thai} sang ${newStatus}`, 400);
    }

    const userRole = user.vai_tro?.ma_vai_tro || user.vai_tro;
    // Đã sửa: Thay thế nhom_ho_tro_id bằng nhom_xu_ly_id khớp chuẩn file schema của bạn
    if (['IT_L1', 'IT_L2'].includes(userRole) && ticket.nhom_xu_ly_id !== user.nhom_ho_tro_id) {
      throw new AppError('Bạn không có quyền thay đổi trạng thái phiếu thuộc nhóm xử lý khác', 403);
    }

    return await ticketRepository.updateStatus(id, newStatus, user.nhan_vien_id, ghi_chu);
  }
};