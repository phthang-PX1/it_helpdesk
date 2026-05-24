// src/services/ticket.service.ts
import { prisma } from '../libs/prisma';
import { ticketRepository } from '../repositories/ticket.repository';
import { AppError } from '../middlewares/errorHandler';
import { sendEmail } from '../libs/email'; // Nạp tiện ích email
import { v4 as uuidv4 } from 'uuid';       // Nạp hằng số sinh chuỗi uuid
import crypto from 'crypto';
import path from 'path';
import { TrangThaiPhieu, MucDoUuTien, LoaiSla, TrangThaiMucTieu, QuyenXem, VaiTroEnum, LoaiThoiGian } from '@prisma/client';

export const ticketService = {
  // NÂNG CẤP: Nhận thêm files từ Controller mồi xuống
  createTicket: async (data: any, userId: number, files: Express.Multer.File[] = []) => {
    const today = new Date();
    const count = await ticketRepository.countTicketsToday(
      new Date(today.setHours(0,0,0,0)), 
      new Date(today.setHours(23,59,59,999))
    );
    const ma_phieu = `SW-${today.getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Thuật toán Phân tích Regex
    let muc_do_uu_tien: MucDoUuTien = MucDoUuTien.TRUNG_BINH;
    const contentToAnalyze = `${data.tieu_de} ${data.mo_ta_chi_tiet}`.toLowerCase();
    const highPriorityKeywords = /sập|khẩn|gấp|chết|ngay lập tức|không thể|liệt|đứng máy|vip|virus|hack/i;
    const lowPriorityKeywords = /từ từ|thong thả|rảnh|hỏi|góp ý|nâng cấp|xin cấp/i;

    if (highPriorityKeywords.test(contentToAnalyze)) {
      muc_do_uu_tien = MucDoUuTien.CAO;
    } else if (lowPriorityKeywords.test(contentToAnalyze)) {
      muc_do_uu_tien = MucDoUuTien.THAP;
    }

    // Định tuyến nhân viên
    let supporterId: number | null = null;
    let groupXulyId: number | null = null;

    const optimalSupporter = await prisma.nhanVien.findFirst({
      where: {
        vai_tro: { ma_vai_tro: VaiTroEnum.IT_L1 },
        trang_thai: true,
        nhom_ho_tro_id: { not: null }
      },
      orderBy: { tickets_ho_tro: { _count: 'asc' } },
      select: { nhan_vien_id: true, nhom_ho_tro_id: true }
    });

    if (optimalSupporter && optimalSupporter.nhom_ho_tro_id) {
      supporterId = optimalSupporter.nhan_vien_id;
      groupXulyId = optimalSupporter.nhom_ho_tro_id;
    } else {
      const defaultGroup = await prisma.nhomHoTro.findFirst();
      if (!defaultGroup) {
        throw new AppError('Hệ thống lỗi: Bảng nhom_ho_tro đang trống.', 400);
      }
      groupXulyId = defaultGroup.nhom_ho_tro_id;
      supporterId = null;
    }

    // Áp dụng SLA
    let policy = await ticketRepository.findActiveSlaPolicy(muc_do_uu_tien);
    if (!policy) {
      policy = await prisma.chinhSachSla.create({
        data: {
          ten_chinh_sach: `Chính sách SLA tự động cấp cho độ ưu tiên ${muc_do_uu_tien}`,
          loai_thoi_gian: LoaiThoiGian.GIO_HANH_CHINH,
          muc_do_uu_tien: muc_do_uu_tien,
          tg_phan_hoi: muc_do_uu_tien === MucDoUuTien.CAO ? 15 : (muc_do_uu_tien === MucDoUuTien.TRUNG_BINH ? 30 : 60),
          tg_xu_ly: muc_do_uu_tien === MucDoUuTien.CAO ? 120 : (muc_do_uu_tien === MucDoUuTien.TRUNG_BINH ? 240 : 480),
          trang_thai: true
        }
      });
    }

    const now = new Date();
    const slaData = [
      {
        chinh_sach_sla_id: policy.chinh_sach_sla_id,
        loai_sla: LoaiSla.PHAN_HOI,
        trang_thai_muc_tieu: TrangThaiMucTieu.TIEP_NHAN,
        thoi_diem_bat_dau: now,
        han_chot: new Date(now.getTime() + policy.tg_phan_hoi * 60 * 1000)
      },
      {
        chinh_sach_sla_id: policy.chinh_sach_sla_id,
        loai_sla: LoaiSla.XU_LY,
        trang_thai_muc_tieu: TrangThaiMucTieu.DA_GIAI_QUYET,
        thoi_diem_bat_dau: now,
        han_chot: new Date(now.getTime() + policy.tg_xu_ly * 60 * 1000)
      }
    ];

    // MẢNH GHÉP UUID: Xử lý đóng gói mảng file vật lý đổi tên bằng UUID hằng số
    const processedFiles = files.map(file => {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      return {
        ten_tep: file.originalname,
        duong_dan_file: `/uploads/tickets/${uniqueName}`,
        dinh_dang: path.extname(file.originalname).replace('.', '').toUpperCase(),
        dung_luong_kb: Math.round(file.size / 1024)
      };
    });

    const ticketData = {
      ma_phieu,
      tieu_de: data.tieu_de,
      mo_ta_chi_tiet: data.mo_ta_chi_tiet,
      nguoi_tao_id: userId,
      nhom_xu_ly_id: groupXulyId, 
      nguoi_ho_tro_id: supporterId, 
      muc_do_uu_tien,
      trang_thai: TrangThaiPhieu.MOI_TAO
    };

    const result = await ticketRepository.createTicketWithSla(ticketData, slaData, processedFiles);

    const phanHoiSla = slaData.find((s) => s.loai_sla === LoaiSla.PHAN_HOI);
    const xuLySla = slaData.find((s) => s.loai_sla === LoaiSla.XU_LY);

    const { danh_sach_sla, ...ticketInfo } = result as any;

    return {
      ticket: ticketInfo,
      sla: {
        han_chot_phan_hoi: phanHoiSla ? phanHoiSla.han_chot : null,
        han_chot_xu_ly: xuLySla ? xuLySla.han_chot : null,
      }
    };
  },

  getTickets: async (query: any, user: any) => {
    const { page, limit, trang_thai, muc_do_uu_tien } = query;
    const skip = (page - 1) * limit;
    let whereClause: any = {};
    if (trang_thai) whereClause.trang_thai = trang_thai;
    if (muc_do_uu_tien) whereClause.muc_do_uu_tien = muc_do_uu_tien;

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
    if (userRole === 'NGUOI_YEU_CAU' && ticket.danh_sach_bl) {
      ticket.danh_sach_bl = ticket.danh_sach_bl.filter((cmt: any) => cmt.quyen_xem !== QuyenXem.NOI_BO);
    }
    return ticket;
  },

  // NÂNG CẤP API-09: Tích hợp Stop SLA + Sinh Token Khảo sát + Gửi email thông báo tự động
  updateStatus: async (id: number, newStatus: TrangThaiPhieu, ghi_chu: string, user: any) => {
    const ticket = await prisma.phieuHoTro.findUnique({
      where: { phieu_ho_tro_id: id },
      include: { nguoi_tao: { select: { email: true, ho_ten: true } } }
    });
    
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
    if (['IT_L1', 'IT_L2'].includes(userRole) && ticket.nhom_xu_ly_id !== user.nhom_ho_tro_id) {
      throw new AppError('Bạn không có quyền thay đổi trạng thái phiếu thuộc nhóm xử lý khác', 403);
    }

    const updated = await ticketRepository.updateStatus(id, newStatus, user.nhan_vien_id, ghi_chu);

    // MẢNH GHÉP NODEMAILER: Luồng tự động khi trạng thái chuyển dịch sang DA_GIAI_QUYET
    if (newStatus === TrangThaiPhieu.DA_GIAI_QUYET) {
      const now = new Date();

      // 1. Chặn đứng đồng hồ tính giờ SLA (Stop SLA)
      await prisma.slaTheoDoi.updateMany({
        where: { phieu_ho_tro_id: id, loai_sla: LoaiSla.XU_LY },
        data: { thoi_diem_dat: now }
      });

      // 2. Dùng thư viện crypto sinh mã xác thực độc bản đính kèm vào link khảo sát
      const reviewToken = crypto.randomBytes(32).toString('hex');
      await prisma.phieuDanhGia.create({
        data: {
          phieu_ho_tro_id: id,
          nguoi_danh_gia_id: ticket.nguoi_tao_id,
          token_xac_thuc: reviewToken,
          hai_long: false,
          so_sao: 0
        }
      });

      // 3. Tiến hành cấu hình HTML Content và gọi Nodemailer chạy ngầm ẩn
      const evaluationLink = `http://localhost:3000/api/reviews/evaluate?token=${reviewToken}`;
      const subject = `[IT Helpdesk] Sự cố ${ticket.ma_phieu} đã xử lý xong - Vui lòng đánh giá dịch vụ`;
      const htmlContent = `
        <h3>Chào ${ticket.nguoi_tao.ho_ten},</h3>
        <p>Bộ phận IT Helpdesk của Map Pacific Singapore thông báo: Phiếu yêu cầu hỗ trợ mã số <b>${ticket.ma_phieu}</b> của bạn đã giải quyết xong.</p>
        <p><b>Phương án xử lý:</b> ${ghi_chu || 'Kỹ thuật viên đã khắc phục hoàn tất.'}</p>
        <p>Vui lòng nhấn vào đường link màu xanh dưới đây để thực hiện chấm sao đánh giá mức độ hài lòng:</p>
        <p><a href="${evaluationLink}" style="background-color: #008CBA; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">Bấm vào đây để Khảo sát dịch vụ</a></p>
        <br/>
        <p>Trân trọng,</p>
        <p><b>Map Pacific Singapore IT Operations Team</b></p>
      `;

      // Không dùng từ khóa await để gửi mail chạy song song dạng nền, tối ưu tốc độ response cho IT
      sendEmail(ticket.nguoi_tao.email, subject, htmlContent);
    }

    return updated;
  },
  // --- API-10 ---
  escalateTicket: async (ticketId: number, userId: number, lyDo: string, cacBuocDaThu: string) => {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new AppError('Ticket không tồn tại', 404);
    if (ticket.trang_thai !== TrangThaiPhieu.DANG_GIAI_QUYET) {
      throw new AppError('Chỉ có thể chuyển cấp Ticket đang ở trạng thái Đang giải quyết', 409);
    }

    // Tìm nhóm hỗ trợ L2 (Giả định nhóm có tên chứa "L2" hoặc ID = 2)
    const nhomL2 = await prisma.nhomHoTro.findFirst({
      where: { ten_nhom: { contains: 'L2' } }
    });
    const nhomL2Id = nhomL2 ? nhomL2.nhom_ho_tro_id : 2; // Fail-safe

    return await ticketRepository.escalateTicket(ticketId, userId, nhomL2Id, lyDo, cacBuocDaThu);
  },

  // --- API-11 ---
  reopenTicket: async (ticketId: number, userId: number, lyDo: string) => {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new AppError('Ticket không tồn tại', 404);
    if (ticket.trang_thai !== TrangThaiPhieu.DA_GIAI_QUYET) {
      throw new AppError('Chỉ có thể mở lại Ticket ở trạng thái Đã giải quyết', 400);
    }

    const hoursSinceResolved = Math.abs(new Date().getTime() - ticket.ngay_cap_nhat.getTime()) / 36e5;
    if (hoursSinceResolved > 48) {
      throw new AppError('Quá 48h kể từ lúc giải quyết, không thể mở lại. Vui lòng tạo ticket mới.', 409);
    }

    const newSoLanMoLai = ticket.so_lan_mo_lai + 1;
    // Tìm nhóm L2 để chuyển nếu mở lại > 2 lần
    const nhomL2 = await prisma.nhomHoTro.findFirst({ where: { ten_nhom: { contains: 'L2' } } });
    const nhomL2Id = nhomL2 ? nhomL2.nhom_ho_tro_id : 2;
    
    const newGroupId = newSoLanMoLai > 2 ? nhomL2Id : ticket.nhom_xu_ly_id;

    return await ticketRepository.reopenTicket(ticketId, userId, newSoLanMoLai, newGroupId, lyDo);
  },

  // --- API-12 ---
  addCommentWithUpload: async (ticketId: number, user: any, noiDung: string, loaiBinhLuan: string, expressFiles: any[]) => {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new AppError('Ticket không tồn tại trên hệ thống Map Pacific', 404);
    if (ticket.trang_thai === TrangThaiPhieu.DA_DONG) {
      throw new AppError('Không thể bình luận trên Phiếu hỗ trợ đã đóng dứt điểm', 403);
    }

    const userRole = user.vai_tro?.ma_vai_tro || user.vai_tro;
    if (userRole === 'NGUOI_YEU_CAU' && loaiBinhLuan === 'internal') {
      throw new AppError('Tài khoản Người yêu cầu không được phép tạo ghi chú nội bộ', 403);
    }

    const quyenXem = loaiBinhLuan === 'internal' ? QuyenXem.NOI_BO : QuyenXem.CONG_KHAI;

    // Map mảng file thô từ Multer RAM sang cấu trúc lưu trữ dữ liệu cứng PostgreSQL
    const filesPayload = expressFiles.map((f: any) => {
      const ext = f.originalname.split('.').pop() || 'unknown';
      return {
        ten_tep: f.originalname,
        duong_dan_file: `/uploads/attachments/${Date.now()}-${f.originalname}`, // Đường dẫn ảo giả định lưu trữ
        dinh_dang: ext.toLowerCase(),
        dung_luong_kb: Math.round(f.size / 1024)
      };
    });

    return await ticketRepository.createCommentWithFiles(ticketId, user.nhan_vien_id, noiDung, quyenXem, filesPayload);
  },

  // --- API-13 ---
  getComments: async (ticketId: number, query: any, user: any) => {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new AppError('Ticket không tồn tại', 404);

    const { page, limit } = query;
    const skip = (page - 1) * limit;
    
    const userRole = user.vai_tro?.ma_vai_tro || user.vai_tro;
    const restrictInternal = userRole === 'NGUOI_YEU_CAU'; 

    return await ticketRepository.findComments(ticketId, restrictInternal, skip, limit);
  },
  // --- API-14 ---
  getHistory: async (ticketId: number, user: any) => {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new AppError('Ticket không tồn tại', 404);

    // Xác thực quyền truy cập của NGUOI_YEU_CAU
    const userRole = user.vai_tro?.ma_vai_tro || user.vai_tro;
    if (userRole === 'NGUOI_YEU_CAU' && ticket.nguoi_tao_id !== user.nhan_vien_id) {
      throw new AppError('Bạn không có quyền xem lịch sử của phiếu này', 403);
    }

    return await ticketRepository.getHistoryByTicketId(ticketId);
  },

  // --- API-15 ---
  assignTicket: async (ticketId: number, managerId: number, newAssigneeId: number) => {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new AppError('Ticket không tồn tại', 404);

    const technician = await ticketRepository.findTechnicianById(newAssigneeId);
    if (!technician || !technician.trang_thai) {
      throw new AppError('Kỹ thuật viên không tồn tại hoặc đã bị khóa tài khoản', 400);
    }

    // Kiểm tra tính toàn vẹn luồng nghiệp vụ: IT phải cùng nhóm xử lý
    if (technician.nhom_ho_tro_id !== ticket.nhom_xu_ly_id) {
      throw new AppError('Kỹ thuật viên này không thuộc nhóm đang phụ trách ticket hiện tại', 400);
    }

    const updatedTicket = await ticketRepository.assignTicketTransaction(
      ticketId, 
      managerId, 
      ticket.nguoi_ho_tro_id, 
      newAssigneeId
    );

    return {
      ticket: updatedTicket,
      oldAssignee: ticket.nguoi_ho_tro_id,
      newAssignee: newAssigneeId,
      technicianName: technician.ho_ten
    };
  },

  // --- API-16 ---
  getSlaStatus: async (ticketId: number) => {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new AppError('Ticket không tồn tại', 404);

    const slas = await ticketRepository.getSlaByTicketId(ticketId);
    if (!slas || slas.length === 0) throw new AppError('Không tìm thấy dữ liệu SLA cho ticket này', 404);

    const now = new Date().getTime();
    const result: any = {};

    slas.forEach(sla => {
      let thoi_gian_con_lai_giay = 0;
      
      // Nếu chưa đạt SLA (thoi_diem_dat = null) thì tính realtime
      if (!sla.thoi_diem_dat) {
        const hanChotTime = new Date(sla.han_chot).getTime();
        thoi_gian_con_lai_giay = Math.max(0, Math.floor((hanChotTime - now) / 1000));
      }

      // Trả cấu trúc động cho frontend dễ map
      const key = sla.loai_sla === 'PHAN_HOI' ? 'sla_phan_hoi' : 'sla_xu_ly';
      result[key] = {
        han_chot: sla.han_chot,
        thoi_gian_con_lai_giay,
        da_vi_pham: sla.da_vi_pham,
        thoi_diem_dat: sla.thoi_diem_dat || null
      };
    });

    return result;
  }
};