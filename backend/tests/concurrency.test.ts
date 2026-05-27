import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../src/libs/prisma';
import { ticketService } from '../src/services/ticket.service';
import { ticketRepository } from '../src/repositories/ticket.repository';
import { TrangThaiPhieu, MucDoAnhHuong, MucDoKhanCap } from '@prisma/client';

// Đảm bảo không ghi đè DB thật quá nhiều, dùng 1 user có sẵn hoặc tạo tạm
let testUserId: number;

beforeAll(async () => {
  // Tìm 1 user để làm NGUOI_YEU_CAU
  let user = await prisma.nhanVien.findFirst({ where: { tai_khoan: 'test_concurrency' } });
  if (!user) {
    user = await prisma.nhanVien.create({
      data: {
        tai_khoan: 'test_concurrency',
        email: 'test_concurrency@example.com',
        mat_khau: '123',
        ho_ten: 'Test Concurrency',
        phong_ban_id: 1,
        vai_tro_id: 1 // NGUOI_YEU_CAU (cần đảm bảo DB có vai_tro_id = 1)
      }
    });
  }
  testUserId = user.nhan_vien_id;
});

afterAll(async () => {
  // Dọn dẹp
  await prisma.phieuHoTro.deleteMany({ where: { nguoi_tao_id: testUserId } });
  await prisma.nhanVien.deleteMany({ where: { tai_khoan: 'test_concurrency' } });
  await prisma.$disconnect();
});

describe('Phase 5 QA: Concurrency & Race Condition', () => {

  it('G-05: 20 requests tạo Ticket đồng thời không được trùng ma_phieu', async () => {
    const concurrentRequests = 20;
    const promises = [];

    for (let i = 0; i < concurrentRequests; i++) {
      const data = {
        tieu_de: `Test Concurrency ${i}`,
        mo_ta_chi_tiet: 'Mô tả chi tiết',
        muc_do_anh_huong: MucDoAnhHuong.TRUNG_BINH,
        muc_do_khan_cap: MucDoKhanCap.TRUNG_BINH
      };
      // Bắn thẳng vào Service (Bỏ qua HTTP overhead để dồn ép DB max tải)
      promises.push(ticketService.createTicket(data, testUserId, []));
    }

    // Đợi 20 req hoàn thành cùng lúc
    const results = await Promise.all(promises);

    expect(results.length).toBe(concurrentRequests);

    // Thu thập ma_phieu
    const maPhieuList = results.map(r => r.ticket.ma_phieu);
    const uniqueMaPhieu = new Set(maPhieuList);

    // Nếu không có Race Condition, số lượng ma_phieu unique phải đúng bằng số lượng request
    expect(uniqueMaPhieu.size).toBe(concurrentRequests);
  }, 10000); // 10s timeout
});
