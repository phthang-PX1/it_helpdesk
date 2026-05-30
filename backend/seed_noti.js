const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Tìm nhân viên IT_L1 đầu tiên
    const itL1 = await prisma.nhanVien.findFirst({
      where: { vai_tro: { ma_vai_tro: 'IT_L1' } }
    });

    if (!itL1) {
      console.log('Không tìm thấy tài khoản IT_L1 nào trong CSDL!');
      return;
    }

    // Tạo 2 thông báo giả
    const noti1 = await prisma.thongBao.create({
      data: {
        nguoi_nhan_id: itL1.nhan_vien_id,
        loai: 'TICKET_ASSIGNED',
        tieu_de: 'Bạn vừa được phân công xử lý 1 sự cố mới',
        noi_dung: 'Hệ thống vừa phân công phiếu hỗ trợ lỗi phần mềm kế toán cho bạn. Vui lòng kiểm tra.',
        da_doc: false
      }
    });

    const noti2 = await prisma.thongBao.create({
      data: {
        nguoi_nhan_id: itL1.nhan_vien_id,
        loai: 'SLA_WARNING',
        tieu_de: 'Cảnh báo SLA',
        noi_dung: 'Phiếu hỗ trợ đang xử lý sắp trễ hạn SLA phản hồi. Vui lòng phản hồi sớm!',
        da_doc: false
      }
    });

    console.log(`Đã tạo thành công 2 thông báo cho user IT_L1 (ID = ${itL1.nhan_vien_id})!`);
  } catch (error) {
    console.error('Lỗi khi tạo thông báo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
