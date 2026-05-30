// src/services/ticket.service.ts
import { prisma } from '../libs/prisma';
import { ticketRepository } from '../repositories/ticket.repository';
import { AppError } from '../middlewares/errorHandler';
import { sendEmail } from '../libs/email'; // Nạp tiện ích email
import crypto from 'crypto';
import path from 'path';
import { TrangThaiPhieu, MucDoUuTien, MucDoAnhHuong, MucDoKhanCap, LoaiSla, TrangThaiMucTieu, QuyenXem, VaiTroEnum, LoaiThoiGian } from '@prisma/client';
import { saveMemoryFileToDisk } from '../libs/multer';
import { addBusinessMinutes, calculatePriority } from '../utils/ticket.utils';
import { analyzeTicketPriority } from '../utils/gemini.util';

// addBusinessMinutes đã được chuyển sang src/utils/ticket.utils.ts

export const ticketService = {
  // NÂNG CẤP: Nhận thêm files từ Controller mồi xuống
  createTicket: async (data: any, userId: number, expressFiles: Express.Multer.File[] = []) => {
    const today = new Date();
    const traceId = crypto.randomUUID();

    // Tính Priority dựa trên Ma trận Impact x Urgency (Nếu không truyền, dùng Gemini LLM để đánh giá)
    let i = data.muc_do_anh_huong as MucDoAnhHuong;
    let u = data.muc_do_khan_cap as MucDoKhanCap;

    if (!i || !u) {
      const llmResult = await analyzeTicketPriority(data.tieu_de, data.mo_ta_chi_tiet);
      i = i || llmResult.muc_do_anh_huong;
      u = u || llmResult.muc_do_khan_cap;
    }

    let muc_do_uu_tien: MucDoUuTien = calculatePriority(i, u);

    // Định tuyến nhân viên
    let supporterId: number | null = null;
    let groupXulyId: number | null = null;

    const candidates = await prisma.nhanVien.findMany({
      where: {
        vai_tro: { ma_vai_tro: VaiTroEnum.IT_L1 },
        trang_thai: true,
        nhom_ho_tro_id: { not: null }
      },
      include: {
        _count: { select: { tickets_ho_tro: { where: { trang_thai: { in: [TrangThaiPhieu.MOI_TAO, TrangThaiPhieu.DANG_GIAI_QUYET] } } } } },
        tickets_ho_tro: {
          orderBy: { ngay_cap_nhat: 'desc' },
          take: 1,
          select: { ngay_cap_nhat: true }
        }
      }
    });

    let optimalSupporter = null;
    let supporterEmail = null;
    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        const countA = a._count.tickets_ho_tro;
        const countB = b._count.tickets_ho_tro;
        if (countA !== countB) return countA - countB;
        // Tie-breaker: người "rảnh" lâu hơn (ticket cuối cập nhật cách đây lâu nhất) lên đầu
        const timeA = a.tickets_ho_tro[0]?.ngay_cap_nhat.getTime() || 0;
        const timeB = b.tickets_ho_tro[0]?.ngay_cap_nhat.getTime() || 0;
        return timeA - timeB;
      });
      optimalSupporter = candidates[0];
    }

    if (optimalSupporter && optimalSupporter.nhom_ho_tro_id) {
      supporterId = optimalSupporter.nhan_vien_id;
      groupXulyId = optimalSupporter.nhom_ho_tro_id;
      supporterEmail = optimalSupporter.email;
    } else {
      const defaultL1Group = await prisma.nhomHoTro.findFirst({ where: { ten_nhom: { contains: 'L1' } } });
      if (!defaultL1Group) {
        throw new AppError('Hệ thống lỗi: Không tìm thấy nhóm L1.', 400);
      }
      groupXulyId = defaultL1Group.nhom_ho_tro_id;
      supporterId = null;
    }

    if (!groupXulyId) {
      throw new AppError('Không thể xác định nhóm xử lý. Vui lòng liên hệ quản trị viên.', 500);
    }

    // Áp dụng SLA
    let policy = await ticketRepository.findActiveSlaPolicy(muc_do_uu_tien);
    if (!policy) {
      policy = await prisma.chinhSachSla.create({
        data: {
          ten_chinh_sach: `Chính sách SLA tự động cấp cho độ ưu tiên ${muc_do_uu_tien}`,
          loai_thoi_gian: LoaiThoiGian.GIO_HANH_CHINH,
          muc_do_uu_tien: muc_do_uu_tien,
          tg_phan_hoi: muc_do_uu_tien === MucDoUuTien.CAO ? 15 : (muc_do_uu_tien === MucDoUuTien.TRUNG_BINH ? 60 : 240),
          tg_xu_ly: muc_do_uu_tien === MucDoUuTien.CAO ? 240 : (muc_do_uu_tien === MucDoUuTien.TRUNG_BINH ? 480 : 1440),
          trang_thai: true
        }
      });
    }

    const now = new Date();
    const hanChotPhanHoi = policy.loai_thoi_gian === LoaiThoiGian.GIO_HANH_CHINH
      ? addBusinessMinutes(now, policy.tg_phan_hoi)
      : new Date(now.getTime() + policy.tg_phan_hoi * 60 * 1000);

    const hanChotXuLy = policy.loai_thoi_gian === LoaiThoiGian.GIO_HANH_CHINH
      ? addBusinessMinutes(now, policy.tg_xu_ly)
      : new Date(now.getTime() + policy.tg_xu_ly * 60 * 1000);

    const slaData = [
      {
        chinh_sach_sla_id: policy.chinh_sach_sla_id,
        loai_sla: LoaiSla.PHAN_HOI,
        trang_thai_muc_tieu: TrangThaiMucTieu.TIEP_NHAN,
        thoi_diem_bat_dau: now,
        han_chot: hanChotPhanHoi
      },
      {
        chinh_sach_sla_id: policy.chinh_sach_sla_id,
        loai_sla: LoaiSla.XU_LY,
        trang_thai_muc_tieu: TrangThaiMucTieu.DA_GIAI_QUYET,
        thoi_diem_bat_dau: now,
        han_chot: hanChotXuLy
      }
    ];

    // MẢNH GHÉP UUID: Xử lý đóng gói mảng file vật lý đổi tên bằng UUID hằng số
    const processedFiles = expressFiles.map(file => saveMemoryFileToDisk(file, 'attachments'));

    const ticketData = {
      tieu_de: data.tieu_de,
      mo_ta_chi_tiet: data.mo_ta_chi_tiet,
      nguoi_tao_id: userId,
      nhom_xu_ly_id: groupXulyId,
      nguoi_ho_tro_id: supporterId,
      muc_do_anh_huong: i,
      muc_do_khan_cap: u,
      muc_do_uu_tien,
      trang_thai: TrangThaiPhieu.MOI_TAO
    };

    const creator = await prisma.nhanVien.findUnique({
      where: { nhan_vien_id: userId },
      select: { ho_ten: true, email: true }
    });

    const result = await ticketRepository.createTicketWithSla(ticketData, slaData, processedFiles, traceId);

    if (creator) {
      const subject = `[IT Helpdesk] Xác nhận tạo phiếu hỗ trợ mới - ${result.ma_phieu}`;
      const htmlContent = `
        <h3>Chào ${creator.ho_ten},</h3>
        <p>Hệ thống IT Helpdesk đã ghi nhận phiếu yêu cầu hỗ trợ của bạn.</p>
        <p><b>Mã phiếu:</b> ${result.ma_phieu}</p>
        <p><b>Tiêu đề:</b> ${data.tieu_de}</p>
        <p><b>Mức độ ưu tiên:</b> ${muc_do_uu_tien}</p>
        <p>Đội ngũ IT sẽ tiến hành kiểm tra và phản hồi trong thời gian sớm nhất theo SLA đã cam kết.</p>
        <br/>
        <p>Trân trọng,</p>
        <p><b>Map Pacific Singapore IT Operations Team</b></p>
      `;
      sendEmail(creator.email, subject, htmlContent);
    }

    // Gửi thông báo và email cho người được gán L1
    if (supporterId) {
      await prisma.thongBao.create({
        data: {
          nguoi_nhan_id: supporterId,
          phieu_ho_tro_id: result.phieu_ho_tro_id,
          loai: 'TICKET_ASSIGNED',
          tieu_de: `Có ticket mới được gán cho bạn: ${result.ma_phieu}`,
          noi_dung: `Bạn vừa được hệ thống phân công tự động xử lý phiếu hỗ trợ ${result.ma_phieu}.`
        }
      });

      if (supporterEmail) {
        const emailContent = `
          <h3>Chào bạn,</h3>
          <p>Hệ thống vừa phân công cho bạn một phiếu yêu cầu hỗ trợ mới.</p>
          <p><b>Mã phiếu:</b> ${result.ma_phieu}</p>
          <p><b>Tiêu đề:</b> ${data.tieu_de}</p>
          <p><b>Mức độ ưu tiên:</b> ${muc_do_uu_tien}</p>
          <p>Vui lòng kiểm tra hệ thống và xử lý theo SLA.</p>
        `;
        sendEmail(supporterEmail, `[IT Helpdesk] Ticket mới được phân công - ${result.ma_phieu}`, emailContent);
      }
    }

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
    const { page, limit, trang_thai, muc_do_uu_tien, keyword } = query;
    const skip = (page - 1) * limit;
    let whereClause: any = {};
    if (trang_thai) whereClause.trang_thai = trang_thai;
    if (muc_do_uu_tien) whereClause.muc_do_uu_tien = muc_do_uu_tien;

    const userRole = user.vai_tro?.ma_vai_tro || user.vai_tro;
    if (userRole === 'NGUOI_YEU_CAU') {
      whereClause.nguoi_tao_id = user.nhan_vien_id;
    } else if (userRole === 'IT_L1' || userRole === 'IT_L2') {
      const itUserId = user.nhan_vien_id;
      const itGroupId = user.nhom_ho_tro_id;
      whereClause.OR = [
        { nguoi_ho_tro_id: itUserId },
        { nguoi_tao_id: itUserId },
        { nguoi_ho_tro_id: null, nhom_xu_ly_id: itGroupId }
      ];
    }
    if (keyword) {
      const keywordFilter = {
        OR: [
          { tieu_de: { contains: keyword, mode: 'insensitive' as any } },
          { ma_phieu: { contains: keyword, mode: 'insensitive' as any } }
        ]
      };
      if (whereClause.OR) {
        whereClause.AND = [{ OR: whereClause.OR }, keywordFilter];
        delete whereClause.OR;
      } else {
        whereClause.OR = keywordFilter.OR;
      }
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

  updateStatus: async (id: number, newStatus: TrangThaiPhieu, ghiChu: string, user: any) => {
    const ticket = await prisma.phieuHoTro.findUnique({
      where: { phieu_ho_tro_id: id },
      include: { nguoi_tao: { select: { email: true, ho_ten: true } } }
    });

    if (!ticket) throw new AppError('Ticket không tồn tại', 404);
    if (ticket.trang_thai === TrangThaiPhieu.DA_DONG) {
      throw new AppError('Hành động bị từ chối: Phiếu hỗ trợ này đã được Đóng hoàn toàn', 409);
    }

    const validTransitions: Record<TrangThaiPhieu, TrangThaiPhieu[]> = {
      [TrangThaiPhieu.MOI_TAO]: [TrangThaiPhieu.DANG_GIAI_QUYET, TrangThaiPhieu.CHO_PHAN_HOI],
      [TrangThaiPhieu.DANG_GIAI_QUYET]: [TrangThaiPhieu.DA_GIAI_QUYET, TrangThaiPhieu.CHO_PHAN_HOI],
      [TrangThaiPhieu.CHO_PHAN_HOI]: [TrangThaiPhieu.DANG_GIAI_QUYET],
      [TrangThaiPhieu.DA_GIAI_QUYET]: [TrangThaiPhieu.DA_DONG],
      [TrangThaiPhieu.DA_DONG]: []
    };

    if (!validTransitions[ticket.trang_thai]?.includes(newStatus)) {
      throw new AppError(`Chuyển đổi trạng thái thất bại: Không được chuyển từ ${ticket.trang_thai} sang ${newStatus}`, 400);
    }

    const userRole = user.vai_tro?.ma_vai_tro || user.vai_tro;
    if (['IT_L1', 'IT_L2'].includes(userRole) && ticket.nguoi_ho_tro_id !== user.nhan_vien_id) {
      throw new AppError('Bạn chỉ có thể cập nhật trạng thái phiếu mà bạn đang trực tiếp phụ trách', 403);
    }

    const traceId = crypto.randomUUID();
    const updatedTicket = await ticketRepository.updateStatus(id, newStatus, user.nhan_vien_id, ghiChu, traceId);

    await prisma.thongBao.create({
      data: {
        nguoi_nhan_id: ticket.nguoi_tao_id,
        phieu_ho_tro_id: id,
        loai: 'STATUS_CHANGED',
        tieu_de: `Cập nhật trạng thái phiếu ${ticket.ma_phieu}`,
        noi_dung: `Phiếu hỗ trợ của bạn đã chuyển sang trạng thái: ${newStatus}.`
      }
    });

    if (ticket.trang_thai === TrangThaiPhieu.MOI_TAO && newStatus === TrangThaiPhieu.DANG_GIAI_QUYET) {
      await prisma.slaTheoDoi.updateMany({
        where: { phieu_ho_tro_id: id, loai_sla: LoaiSla.PHAN_HOI },
        data: { thoi_diem_dat: new Date() }
      });
    }

    if (newStatus === TrangThaiPhieu.CHO_PHAN_HOI) {
      await prisma.slaTheoDoi.updateMany({
        where: { phieu_ho_tro_id: id, thoi_diem_dat: null },
        data: { thoi_diem_tam_dung: new Date() }
      });
    }

    if (ticket.trang_thai === TrangThaiPhieu.CHO_PHAN_HOI && newStatus === TrangThaiPhieu.DANG_GIAI_QUYET) {
      const slas = await prisma.slaTheoDoi.findMany({
        where: { phieu_ho_tro_id: id, thoi_diem_dat: null, thoi_diem_tam_dung: { not: null } }
      });
      const now = new Date();
      for (const sla of slas) {
        const pauseDurationMs = now.getTime() - sla.thoi_diem_tam_dung!.getTime();
        const pauseMinutes = Math.floor(pauseDurationMs / 60000);
        await prisma.slaTheoDoi.update({
          where: { sla_id: sla.sla_id },
          data: {
            thoi_diem_tam_dung: null,
            tong_thoi_gian_tam_dung: sla.tong_thoi_gian_tam_dung + pauseMinutes,
            han_chot: new Date(sla.han_chot.getTime() + pauseDurationMs)
          }
        });
      }
    }

    if (newStatus === TrangThaiPhieu.DA_GIAI_QUYET) {
      const now = new Date();

      await prisma.slaTheoDoi.updateMany({
        where: { phieu_ho_tro_id: id, loai_sla: LoaiSla.XU_LY },
        data: { thoi_diem_dat: now }
      });

      const reviewToken = crypto.randomBytes(32).toString('hex');
      await prisma.phieuDanhGia.upsert({
        where: { phieu_ho_tro_id: id },
        update: { token_xac_thuc: reviewToken, hai_long: false, so_sao: 0, nhan_xet: null },
        create: {
          phieu_ho_tro_id: id,
          nguoi_danh_gia_id: ticket.nguoi_tao_id,
          token_xac_thuc: reviewToken,
          hai_long: false,
          so_sao: 0
        }
      });

      const evaluationLink = `http://localhost:3000/api/v1/reviews/validate-token?token=${reviewToken}`;
      const subject = `[IT Helpdesk] Sự cố ${ticket.ma_phieu} đã xử lý xong - Vui lòng đánh giá dịch vụ`;
      const htmlContent = `
        <h3>Chào ${ticket.nguoi_tao.ho_ten},</h3>
        <p>Bộ phận IT Helpdesk của Map Pacific Singapore thông báo: Phiếu yêu cầu hỗ trợ mã số <b>${ticket.ma_phieu}</b> của bạn đã giải quyết xong.</p>
        <p><b>Phương án xử lý:</b> ${ghiChu || 'Kỹ thuật viên đã khắc phục hoàn tất.'}</p>
        <p>Vui lòng nhấn vào đường link màu xanh dưới đây để thực hiện chấm sao đánh giá mức độ hài lòng:</p>
        <p><a href="${evaluationLink}" style="background-color: #008CBA; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">Bấm vào đây để Khảo sát dịch vụ</a></p>
        <br/>
        <p>Trân trọng,</p>
        <p><b>Map Pacific Singapore IT Operations Team</b></p>
      `;

      sendEmail(ticket.nguoi_tao.email, subject, htmlContent);
    }

    return updatedTicket;
  },

  escalateTicket: async (ticketId: number, userId: number, lyDo: string, cacBuocDaThu: string) => {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new AppError('Ticket không tồn tại', 404);
    if (ticket.trang_thai !== TrangThaiPhieu.DANG_GIAI_QUYET) {
      throw new AppError('Chỉ có thể chuyển cấp Ticket đang ở trạng thái Đang giải quyết', 409);
    }

    if (ticket.nguoi_ho_tro_id !== userId) {
      throw new AppError('Bạn chỉ có thể chuyển cấp phiếu mà bạn đang trực tiếp phụ trách', 403);
    }

    const nhomL2 = await prisma.nhomHoTro.findFirst({
      where: { ten_nhom: { contains: 'L2' } }
    });
    const nhomL2Id = nhomL2 ? nhomL2.nhom_ho_tro_id : 2;

    const traceId = crypto.randomUUID();
    const result = await ticketRepository.escalateTicket(ticketId, userId, nhomL2Id, lyDo, cacBuocDaThu, traceId);

    const l2Members = await prisma.nhanVien.findMany({
      where: { nhom_ho_tro_id: nhomL2Id, trang_thai: true },
      select: { nhan_vien_id: true }
    });

    if (l2Members.length > 0) {
      const thongBaoData = l2Members.map(m => ({
        nguoi_nhan_id: m.nhan_vien_id,
        phieu_ho_tro_id: ticketId,
        loai: 'TICKET_ESCALATED',
        tieu_de: `Phiếu ${ticket.ma_phieu} được chuyển cấp lên nhóm của bạn`,
        noi_dung: `Phiếu hỗ trợ ${ticket.ma_phieu} đã chuyển cấp với lý do: ${lyDo}`
      }));
      await prisma.thongBao.createMany({ data: thongBaoData });
    }

    return result;
  },

  reopenTicket: async (ticketId: number, userId: number, userRole: string, lyDo: string) => {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new AppError('Ticket không tồn tại', 404);
    if (ticket.trang_thai !== TrangThaiPhieu.DA_GIAI_QUYET) {
      throw new AppError('Chỉ có thể mở lại Ticket ở trạng thái Đã giải quyết', 400);
    }

    if (ticket.nguoi_tao_id !== userId && userRole !== 'QUAN_LY') {
      throw new AppError('Bạn không có quyền mở lại phiếu này', 403);
    }

    const resolvedLog = await prisma.lichSuPhieu.findFirst({
      where: { phieu_ho_tro_id: ticketId, gia_tri_moi: TrangThaiPhieu.DA_GIAI_QUYET },
      orderBy: { ngay_thuc_hien: 'desc' }
    });

    const resolveTime = resolvedLog ? resolvedLog.ngay_thuc_hien.getTime() : ticket.ngay_cap_nhat.getTime();
    const hoursSinceResolved = Math.abs(new Date().getTime() - resolveTime) / 36e5;

    if (hoursSinceResolved > 48) {
      throw new AppError('Quá 48h kể từ lúc giải quyết, không thể mở lại. Vui lòng tạo ticket mới.', 409);
    }

    const newSoLanMoLai = ticket.so_lan_mo_lai + 1;
    const traceId = crypto.randomUUID();

    if (newSoLanMoLai >= 2) {
      // Bắt buộc tạo ticket mới
      const newTicketData = {
        tieu_de: `[Mở lại] ${ticket.tieu_de}`,
        mo_ta_chi_tiet: `Phiếu này được hệ thống tạo tự động do phiếu gốc ${ticket.ma_phieu} đã được mở lại quá số lần quy định.\n\nLý do mở lại: ${lyDo}\n\nMô tả gốc:\n${ticket.mo_ta_chi_tiet}`,
        muc_do_anh_huong: ticket.muc_do_anh_huong,
        muc_do_khan_cap: ticket.muc_do_khan_cap,
      };

      await ticketRepository.updateStatus(ticketId, TrangThaiPhieu.DA_DONG, userId, `Hệ thống tự động đóng phiếu do yêu cầu mở lại vượt quá số lần. Đã chuyển sang tạo phiếu mới.`, traceId);

      const newTicketResult = await ticketService.createTicket(newTicketData, ticket.nguoi_tao_id, []);

      return {
        action: 'CREATED_NEW',
        message: 'Do số lần mở lại quá giới hạn, hệ thống đã tạo một phiếu mới và đưa vào hàng chờ L1.',
        ticket: newTicketResult.ticket,
        sla: newTicketResult.sla
      };
    }

    let supporterId: number | null = ticket.nguoi_ho_tro_id;
    let groupXulyId: number | null = ticket.nhom_xu_ly_id;
    let supporterEmail: string | null = null;

    if (supporterId) {
      const oldSupporter = await prisma.nhanVien.findUnique({ where: { nhan_vien_id: supporterId } });
      if (oldSupporter && oldSupporter.trang_thai) {
        supporterEmail = oldSupporter.email;
      } else {
        supporterId = null;
      }
    }

    if (!supporterId) {
      // Mở lại bình thường -> Phân bổ lại cho L1 rảnh nhất nếu người cũ không còn
      const candidates = await prisma.nhanVien.findMany({
        where: {
          vai_tro: { ma_vai_tro: VaiTroEnum.IT_L1 },
          trang_thai: true,
          nhom_ho_tro_id: { not: null }
        },
        include: {
          _count: { select: { tickets_ho_tro: { where: { trang_thai: { in: [TrangThaiPhieu.MOI_TAO, TrangThaiPhieu.DANG_GIAI_QUYET] } } } } },
          tickets_ho_tro: {
            orderBy: { ngay_cap_nhat: 'desc' },
            take: 1,
            select: { ngay_cap_nhat: true }
          }
        }
      });

      if (candidates.length > 0) {
        candidates.sort((a, b) => {
          const countA = a._count.tickets_ho_tro;
          const countB = b._count.tickets_ho_tro;
          if (countA !== countB) return countA - countB;
          const timeA = a.tickets_ho_tro[0]?.ngay_cap_nhat.getTime() || 0;
          const timeB = b.tickets_ho_tro[0]?.ngay_cap_nhat.getTime() || 0;
          return timeA - timeB;
        });
        supporterId = candidates[0].nhan_vien_id;
        groupXulyId = candidates[0].nhom_ho_tro_id;
        supporterEmail = candidates[0].email;
      } else {
        const defaultGroup = await prisma.nhomHoTro.findFirst({ where: { ten_nhom: { contains: 'L1' } } });
        if (!defaultGroup) throw new AppError('Hệ thống lỗi: Không tìm thấy nhóm L1.', 400);
        groupXulyId = defaultGroup.nhom_ho_tro_id;
      }
    }

    const reopenedTicket = await ticketRepository.reopenTicket(ticketId, userId, newSoLanMoLai, groupXulyId as number, supporterId, lyDo, traceId);

    const policy = await ticketRepository.findActiveSlaPolicy(ticket.muc_do_uu_tien);
    if (policy) {
      const now = new Date();
      const hanChotPhanHoi = policy.loai_thoi_gian === LoaiThoiGian.GIO_HANH_CHINH
        ? addBusinessMinutes(now, policy.tg_phan_hoi)
        : new Date(now.getTime() + policy.tg_phan_hoi * 60 * 1000);

      const hanChotXuLy = policy.loai_thoi_gian === LoaiThoiGian.GIO_HANH_CHINH
        ? addBusinessMinutes(now, policy.tg_xu_ly)
        : new Date(now.getTime() + policy.tg_xu_ly * 60 * 1000);

      await prisma.slaTheoDoi.createMany({
        data: [
          {
            phieu_ho_tro_id: ticketId,
            chinh_sach_sla_id: policy.chinh_sach_sla_id,
            loai_sla: LoaiSla.PHAN_HOI,
            trang_thai_muc_tieu: TrangThaiMucTieu.TIEP_NHAN,
            thoi_diem_bat_dau: now,
            han_chot: hanChotPhanHoi
          },
          {
            phieu_ho_tro_id: ticketId,
            chinh_sach_sla_id: policy.chinh_sach_sla_id,
            loai_sla: LoaiSla.XU_LY,
            trang_thai_muc_tieu: TrangThaiMucTieu.DA_GIAI_QUYET,
            thoi_diem_bat_dau: now,
            han_chot: hanChotXuLy
          }
        ]
      });
    }

    const notifyUserIds = supporterId ? [supporterId] : (await prisma.nhanVien.findMany({ where: { nhom_ho_tro_id: groupXulyId as number, trang_thai: true }, select: { nhan_vien_id: true } })).map(m => m.nhan_vien_id);

    if (notifyUserIds.length > 0) {
      const thongBaoData = notifyUserIds.map(uid => ({
        nguoi_nhan_id: uid,
        phieu_ho_tro_id: ticketId,
        loai: 'TICKET_REOPENED',
        tieu_de: `Phiếu ${ticket.ma_phieu} đã được mở lại`,
        noi_dung: `Người dùng đã yêu cầu mở lại phiếu ${ticket.ma_phieu} với lý do: ${lyDo}. Bạn đã được phân công xử lý.`
      }));
      await prisma.thongBao.createMany({ data: thongBaoData });
    }

    if (supporterEmail) {
      await sendEmail(
        supporterEmail,
        `[IT Helpdesk] Phiếu ${ticket.ma_phieu} đã được mở lại và giao cho bạn`,
        `<h3>Chào bạn,</h3><p>Phiếu hỗ trợ <b>${ticket.ma_phieu}</b> đã được người dùng yêu cầu mở lại và hệ thống đã giao cho bạn tiếp tục xử lý.</p><p><b>Lý do:</b> ${lyDo}</p><br/><p>Vui lòng kiểm tra hệ thống và phản hồi trong thời gian sớm nhất.</p>`
      );
    } else if (groupXulyId) {
      const l1Emails = (await prisma.nhanVien.findMany({ where: { nhom_ho_tro_id: groupXulyId, trang_thai: true }, select: { email: true } })).map(m => m.email);
      await Promise.all(l1Emails.map(email =>
        sendEmail(
          email,
          `[IT Helpdesk] Phiếu ${ticket.ma_phieu} đã được mở lại`,
          `<h3>Chào bạn,</h3><p>Phiếu hỗ trợ <b>${ticket.ma_phieu}</b> thuộc nhóm của bạn đã được mở lại.</p><p><b>Lý do:</b> ${lyDo}</p><br/><p>Vui lòng kiểm tra hệ thống.</p>`
        )
      ));
    }

    return { action: 'REOPENED', ...reopenedTicket };
  },

  addCommentWithUpload: async (ticketId: number, user: any, noiDung: string, loaiBinhLuan: string, expressFiles: any[]) => {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new AppError('Ticket không tồn tại trên hệ thống Map Pacific', 404);
    if (ticket.trang_thai === TrangThaiPhieu.DA_DONG) {
      throw new AppError('Không thể bình luận trên Phiếu hỗ trợ đã đóng dứt điểm', 409);
    }

    const userRole = user.vai_tro?.ma_vai_tro || user.vai_tro;
    if (userRole === 'NGUOI_YEU_CAU' && ticket.nguoi_tao_id !== user.nhan_vien_id) {
      throw new AppError('Bạn không có quyền bình luận vào phiếu hỗ trợ này', 403);
    }
    if (userRole === 'NGUOI_YEU_CAU' && loaiBinhLuan === 'internal') {
      throw new AppError('Tài khoản Người yêu cầu không được phép tạo ghi chú nội bộ', 403);
    }

    const quyenXem = loaiBinhLuan === 'internal' ? QuyenXem.NOI_BO : QuyenXem.CONG_KHAI;

    const filesPayload = expressFiles.map((f: any) => saveMemoryFileToDisk(f, 'attachments'));
    const traceId = crypto.randomUUID();

    return await ticketRepository.createCommentWithFiles(ticketId, user.nhan_vien_id,
      noiDung, quyenXem, filesPayload, undefined, traceId);
  },

  getComments: async (ticketId: number, query: any, user: any) => {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new AppError('Ticket không tồn tại', 404);

    const userRole = user.vai_tro?.ma_vai_tro || user.vai_tro;

    if (userRole === 'NGUOI_YEU_CAU' && ticket.nguoi_tao_id !== user.nhan_vien_id) {
      throw new AppError('Bạn không có quyền xem bình luận của phiếu này', 403);
    }

    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const restrictInternal = userRole === 'NGUOI_YEU_CAU';

    return await ticketRepository.findComments(ticketId, restrictInternal, skip, limit);
  },

  getHistory: async (ticketId: number, user: any) => {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new AppError('Ticket không tồn tại', 404);

    const userRole = user.vai_tro?.ma_vai_tro || user.vai_tro;
    if (userRole === 'NGUOI_YEU_CAU' && ticket.nguoi_tao_id !== user.nhan_vien_id) {
      throw new AppError('Bạn không có quyền xem lịch sử của phiếu này', 403);
    }

    return await ticketRepository.getHistoryByTicketId(ticketId);
  },

  assignTicket: async (ticketId: number, managerId: number, newAssigneeId: number) => {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new AppError('Ticket không tồn tại', 404);

    const technician = await ticketRepository.findTechnicianById(newAssigneeId);
    if (!technician || !technician.trang_thai) {
      throw new AppError('Kỹ thuật viên không tồn tại hoặc đã bị khóa tài khoản', 400);
    }

    if (technician.nhom_ho_tro_id !== ticket.nhom_xu_ly_id) {
      throw new AppError('Kỹ thuật viên này không thuộc nhóm đang phụ trách ticket hiện tại', 400);
    }

    const traceId = crypto.randomUUID();
    const updatedTicket = await ticketRepository.assignTicketTransaction(
      ticketId,
      managerId,
      ticket.nguoi_ho_tro_id,
      newAssigneeId,
      traceId
    );

    await prisma.thongBao.create({
      data: {
        nguoi_nhan_id: newAssigneeId,
        phieu_ho_tro_id: ticketId,
        loai: 'TICKET_ASSIGNED',
        tieu_de: `Bạn được phân công xử lý phiếu ${ticket.ma_phieu}`,
        noi_dung: `Bạn vừa được quản lý phân công xử lý phiếu hỗ trợ ${ticket.ma_phieu}.`
      }
    });

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