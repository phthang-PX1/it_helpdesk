import cron from 'node-cron';
import { prisma } from '../libs/prisma';

export const initCronJobs = () => {
  // Chạy mỗi 5 phút
  cron.schedule('*/5 * * * *', async () => {
    // console.log('[CRON] Đang chạy trình quét SLA & Đóng Ticket tự động...');

    try {
      const now = new Date();

      // -- 1. AUTO CLOSE TICKET SAU 48H --
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const ticketsToClose = await prisma.phieuHoTro.findMany({
        where: {
          trang_thai: 'DA_GIAI_QUYET',
          ngay_cap_nhat: { lt: fortyEightHoursAgo }
        }
      });

      if (ticketsToClose.length > 0) {
        for (const ticket of ticketsToClose) {
          await prisma.phieuHoTro.update({
            where: { phieu_ho_tro_id: ticket.phieu_ho_tro_id },
            data: {
              trang_thai: 'DA_DONG',
              danh_sach_log: {
                create: {
                  nguoi_thuc_hien_id: ticket.nguoi_tao_id, // Lấy tạm người tạo làm Actor hệ thống
                  hanh_dong: 'CLOSED',
                  gia_tri_cu: 'DA_GIAI_QUYET',
                  gia_tri_moi: 'DA_DONG',
                  ghi_chu: 'Hệ thống tự động đóng phiếu sau 48h không có phản hồi'
                }
              }
            }
          });

          await prisma.thongBao.create({
            data: {
              nguoi_nhan_id: ticket.nguoi_tao_id,
              phieu_ho_tro_id: ticket.phieu_ho_tro_id,
              loai: 'TICKET_CLOSED',
              tieu_de: `Phiếu ${ticket.ma_phieu} đã được tự động đóng`,
              noi_dung: 'Phiếu đã được tự động đóng do không có bình luận khiếu nại sau 48h.',
            }
          });
        }
        console.log(`[CRON] Đã tự động đóng ${ticketsToClose.length} phiếu.`);
      }

      // -- 2. QUÉT SLA VI PHẠM --
      const expiredSlas = await prisma.slaTheoDoi.findMany({
        where: {
          trang_thai_muc_tieu: 'TIEP_NHAN',
          da_vi_pham: false,
          han_chot: { lt: now }
        },
        include: { phieu_ho_tro: true }
      });

      if (expiredSlas.length > 0) {
        for (const sla of expiredSlas) {
          await prisma.slaTheoDoi.update({
            where: { sla_id: sla.sla_id },
            data: { da_vi_pham: true }
          });

          if (sla.phieu_ho_tro.nguoi_ho_tro_id) {
            await prisma.thongBao.create({
              data: {
                nguoi_nhan_id: sla.phieu_ho_tro.nguoi_ho_tro_id,
                phieu_ho_tro_id: sla.phieu_ho_tro_id,
                loai: 'SLA_VIOLATION',
                tieu_de: `Cảnh báo phạt SLA: Phiếu ${sla.phieu_ho_tro.ma_phieu}`,
                noi_dung: `Bạn đã vi phạm thời hạn xử lý SLA loại ${sla.loai_sla}.`,
              }
            });
          }
        }
        console.log(`[CRON] Đã đánh dấu vi phạm ${expiredSlas.length} SLA.`);
      }

      // -- 3. CẢNH BÁO SLA 20% --
      const slas = await prisma.slaTheoDoi.findMany({
        where: {
          trang_thai_muc_tieu: 'TIEP_NHAN',
          da_vi_pham: false,
          da_gui_nhac_nho: false,
          han_chot: { gt: now }
        },
        include: { phieu_ho_tro: true }
      });

      let warningCount = 0;
      for (const sla of slas) {
        const totalTime = sla.han_chot.getTime() - sla.thoi_diem_bat_dau.getTime();
        const elapsedTime = now.getTime() - sla.thoi_diem_bat_dau.getTime();

        // Trừ thời gian đã tạm dừng (tong_thoi_gian_tam_dung tính bằng phút -> ms)
        const totalPauseMs = sla.tong_thoi_gian_tam_dung * 60 * 1000;
        const actualElapsedTime = elapsedTime - totalPauseMs;

        if (actualElapsedTime >= 0.8 * totalTime && actualElapsedTime > 0) {
          await prisma.slaTheoDoi.update({
            where: { sla_id: sla.sla_id },
            data: { da_gui_nhac_nho: true }
          });
          if (sla.phieu_ho_tro.nguoi_ho_tro_id) {
            await prisma.thongBao.create({
              data: {
                nguoi_nhan_id: sla.phieu_ho_tro.nguoi_ho_tro_id,
                phieu_ho_tro_id: sla.phieu_ho_tro_id,
                loai: 'SLA_WARNING',
                tieu_de: `Sắp vi phạm SLA phiếu ${sla.phieu_ho_tro.ma_phieu}`,
                noi_dung: `Chỉ còn chưa tới 20% thời gian để hoàn thành SLA ${sla.loai_sla}.`,
              }
            });
          }
          warningCount++;
        }
      }
      if (warningCount > 0) console.log(`[CRON] Đã gửi ${warningCount} cảnh báo 20% SLA.`);

    } catch (error) {
      console.error('[CRON] Lỗi khi chạy job:', error);
    }
  });
};
