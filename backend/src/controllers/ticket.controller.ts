import { Response } from 'express';
import { ticketService } from '../services/ticket.service';
import { assignSchema, commentSchema, createTicketSchema, escalateSchema, getCommentsQuerySchema, getTicketsQuerySchema, reopenSchema, updateTicketStatusSchema } from '../validators/ticket.schema';
import { AppError } from '../middlewares/errorHandler';
import { getIo } from '../libs/socket';

export const ticketController = {
  create: async (req: any, res: Response, next: any) => {
    try {
      const nhanVienId = req.user?.nhan_vien_id;
      if (!nhanVienId) throw new AppError('Yêu cầu xác thực tài khoản', 401);

      const validatedBody = createTicketSchema.parse(req.body);

      // MẢNH GHÉP MULTER: Ép kiểu mảng tệp đính kèm chui từ Network qua RAM
      const files = (req.files as Express.Multer.File[]) || [];

      // Nạp cả body và files xuống cho Service giải bài toán
      const { ticket, sla } = await ticketService.createTicket(validatedBody, nhanVienId, files);

      let thoiGianBaoTin = 'trong thời gian quy định';
      if (sla.han_chot_phan_hoi) {
        const timeObj = new Date(sla.han_chot_phan_hoi);
        thoiGianBaoTin = timeObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }

      res.status(201).json({
        success: true,
        message: `Khởi tạo ticket thành công. Thời hạn IT Helpdesk phản hồi muộn nhất là trước ${thoiGianBaoTin}.`,
        data: {
          ...ticket,
          trang_thai: "Mới tạo",
          sla: {
            han_chot_phan_hoi: sla.han_chot_phan_hoi,
            han_chot_xu_ly: sla.han_chot_xu_ly
          }
        }
      });
    } catch (error) { next(error); }
  },

  getAll: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user?.nhan_vien_id) throw new AppError('Yêu cầu xác thực tài khoản', 401);

      const query = getTicketsQuerySchema.parse(req.query);
      const result = await ticketService.getTickets(query, req.user);

      res.status(200).json({
        success: true,
        message: 'Tải danh sách dữ liệu hoàn tất',
        data: result.data,
        pagination: { total: result.total, page: query.page, limit: query.limit }
      });
    } catch (error) { next(error); }
  },

  getDetail: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user?.nhan_vien_id) throw new AppError('Yêu cầu xác thực tài khoản', 401);

      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) throw new AppError('Định dạng mã ID truyền vào không hợp lệ', 400);

      const data = await ticketService.getTicketDetail(ticketId, req.user);
      res.status(200).json({ success: true, message: 'Tải dữ liệu chi tiết thành công', data });
    } catch (error) { next(error); }
  },

  updateStatus: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user?.nhan_vien_id) throw new AppError('Yêu cầu xác thực tài khoản', 401);

      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) throw new AppError('Định dạng mã ID truyền vào không hợp lệ', 400);

      const { trang_thai, ghi_chu } = updateTicketStatusSchema.parse(req.body);
      // cast trang_thai to any to satisfy service typing (validated by schema)
      let data: any = await ticketService.updateStatus(ticketId, trang_thai as any, ghi_chu || '', req.user);
      if (trang_thai === 'DA_GIAI_QUYET') {
        const danhGia = await require('../libs/prisma').prisma.phieuDanhGia.findUnique({ where: { phieu_ho_tro_id: ticketId } });
        if (danhGia) data = { ...data, danh_gia: danhGia };
      }

      res.status(200).json({ success: true, message: 'Cập nhật trạng thái và lưu lịch sử thành công', data });
    } catch (error) { next(error); }
  },
  // --- API-10 ---
  escalate: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user?.nhan_vien_id) throw new AppError('Yêu cầu xác thực tài khoản', 401);
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) throw new AppError('Định dạng mã ID không hợp lệ', 400);

      const { ly_do, cac_buoc_da_thu } = escalateSchema.parse(req.body);
      const result = await ticketService.escalateTicket(ticketId, req.user.nhan_vien_id, ly_do, cac_buoc_da_thu);

      // 🔗 REALTIME SOCKET.IO TRIGGER: Phát tín hiệu nhấp nháy cho toàn bộ kỹ sư phòng IT_L2 (group_2)
      const io = getIo();
      io.to('group_2').emit('ticket_escalated_alert', {
        message: `Phiếu sự cố ${result.ma_phieu} đã được chuyển cấp lên tuyến L2 phụ trách!`,
        ticket_id: result.phieu_ho_tro_id,
        ma_phieu: result.ma_phieu,
        thoi_gian: new Date()
      });

      res.status(200).json({
        success: true,
        message: 'Chuyển cấp ticket lên L2 và đẩy thông báo realtime thành công.',
        data: { phieu_ho_tro_id: result.phieu_ho_tro_id, nhom_ho_tro_moi: 'L2', trang_thai: result.trang_thai }
      });
    } catch (error) { next(error); }
  },

  // --- API-11 ---
  reopen: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user?.nhan_vien_id) throw new AppError('Yêu cầu xác thực tài khoản', 401);
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) throw new AppError('Định dạng mã ID không hợp lệ', 400);

      const { ly_do } = reopenSchema.parse(req.body);
      const userRole = req.user.vai_tro?.ma_vai_tro || req.user.vai_tro;
      const result: any = await ticketService.reopenTicket(ticketId, req.user.nhan_vien_id, userRole, ly_do);

      if (result.action === 'CREATED_NEW') {
        res.status(201).json({
          success: true,
          message: result.message,
          data: result.ticket
        });
        return;
      }

      const reopened: any = result;

      // 🔗 REALTIME SOCKET.IO TRIGGER: Đẩy thông tin mở lại phiếu về phòng IT đang phụ trách xử lý phiếu
      const io = getIo();
      io.to(`group_${reopened.nhom_xu_ly_id}`).emit('ticket_reopened_event', {
        message: `Cảnh báo: Phiếu ${reopened.ma_phieu} bị mở lại! Số lần mở lại: ${reopened.so_lan_mo_lai}`,
        ticket_id: reopened.phieu_ho_tro_id,
        so_lan_mo_lai: reopened.so_lan_mo_lai
      });

      res.status(200).json({
        success: true,
        message: 'Hệ thống kích hoạt mở lại phiếu và cập nhật danh sách IT thành công.',
        data: { phieu_ho_tro_id: reopened.phieu_ho_tro_id, trang_thai: reopened.trang_thai, so_lan_mo_lai: reopened.so_lan_mo_lai }
      });
    } catch (error) { next(error); }
  },
  // --- API-12 ---
  createComment: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user?.nhan_vien_id) throw new AppError('Yêu cầu xác thực tài khoản', 401);
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) throw new AppError('Định dạng mã ID không hợp lệ', 400);

      const { noi_dung, loai_binh_luan } = commentSchema.parse(req.body);

      // Lấy mảng tệp tin từ Multer Buffer (Hỗ trợ tối đa 5 files, 20MB cấp từ Router)
      const expressFiles = (req.files as any[]) || [];

      const result = await ticketService.addCommentWithUpload(ticketId, req.user, noi_dung, loai_binh_luan, expressFiles);

      // 🔗 REALTIME SOCKET.IO TRIGGER: 
      const io = getIo();
      if (loai_binh_luan === 'public') {
        // Comment Public: Phát cho cả phòng chat của ticket (Cả nhân viên và IT đang xem đều thấy)
        io.to(`ticket_${ticketId}`).emit('new_comment_message', { success: true, data: result });
      } else {
        // Note Internal: Chỉ gửi ngầm cho nhóm IT đang xử lý, chặn không phát về phòng ticket của requester
        const groupId = (result?.nguoi_gui as any)?.nhom_ho_tro_id ?? req.user?.nhom_ho_tro_id ?? 1;
        io.to(`group_${groupId}`).emit('new_internal_note_alert', { ticket_id: ticketId });
      }

      res.status(201).json({
        success: true,
        message: 'Đã thêm bình luận cùng tệp đính kèm hoàn tất.',
        data: result
      });
    } catch (error) { next(error); }
  },

  // --- API-13 ---
  getComments: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user?.nhan_vien_id) throw new AppError('Yêu cầu xác thực tài khoản', 401);
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) throw new AppError('Định dạng mã ID không hợp lệ', 400);

      const query = getCommentsQuerySchema.parse(req.query);
      const result = await ticketService.getComments(ticketId, query, req.user);

      res.status(200).json({
        success: true,
        message: 'Tải danh sách bình luận thành công',
        data: result.data,
        pagination: { total: result.total, page: query.page, limit: query.limit }
      });
    } catch (error) { next(error); }
  },
  // --- API-14 ---
  getHistory: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user?.nhan_vien_id) throw new AppError('Yêu cầu xác thực tài khoản', 401);
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) throw new AppError('Định dạng mã ID không hợp lệ', 400);

      const data = await ticketService.getHistory(ticketId, req.user);

      res.status(200).json({
        success: true,
        message: 'Tải toàn bộ lịch sử ticket thành công',
        data
      });
    } catch (error) { next(error); }
  },

  // --- API-15 ---
  assignManager: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user?.nhan_vien_id) throw new AppError('Yêu cầu xác thực tài khoản', 401);
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) throw new AppError('Định dạng mã ID không hợp lệ', 400);

      const { nguoi_ho_tro_id } = assignSchema.parse(req.body);
      const result = await ticketService.assignTicket(ticketId, req.user.nhan_vien_id, nguoi_ho_tro_id);

      // 🔗 REALTIME SOCKET.IO: Bắn thông báo trực tiếp cho Kỹ thuật viên mới
      const io = require('../libs/socket').getIo();
      io.to(`group_${result.ticket.nhom_xu_ly_id}`).emit('ticket_reassigned', {
        message: `Quản lý đã chỉ định bạn xử lý phiếu ${result.ticket.ma_phieu}`,
        ticket_id: result.ticket.phieu_ho_tro_id,
        nguoi_nhan_moi: result.newAssignee
      });

      res.status(200).json({
        success: true,
        message: `Đã chỉ định lại phiếu cho kỹ thuật viên ${result.technicianName}`,
        data: {
          phieu_ho_tro_id: result.ticket.phieu_ho_tro_id,
          nguoi_ho_tro_cu: result.oldAssignee,
          nguoi_ho_tro_moi: result.newAssignee,
          ngay_cap_nhat: result.ticket.ngay_cap_nhat
        }
      });
    } catch (error) { next(error); }
  },

  // --- API-16 ---
  getSLA: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user?.nhan_vien_id) throw new AppError('Yêu cầu xác thực tài khoản', 401);
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) throw new AppError('Định dạng mã ID không hợp lệ', 400);

      const data = await ticketService.getSlaStatus(ticketId);

      res.status(200).json({
        success: true,
        message: 'Tải trạng thái SLA thời gian thực thành công',
        data
      });
    } catch (error) { next(error); }
  }
};