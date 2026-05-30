import { describe, it, expect } from '@jest/globals';
import { addBusinessMinutes, calculatePriority } from '../src/utils/ticket.utils';
import { MucDoAnhHuong, MucDoKhanCap, MucDoUuTien } from '@prisma/client';

describe('Ticket Utility Functions', () => {

  describe('calculatePriority', () => {
    it('CAO x CAO => CAO', () => {
      expect(calculatePriority(MucDoAnhHuong.CAO, MucDoKhanCap.CAO)).toBe(MucDoUuTien.CAO);
    });

    it('TRUNG_BINH x CAO => CAO', () => {
      expect(calculatePriority(MucDoAnhHuong.TRUNG_BINH, MucDoKhanCap.CAO)).toBe(MucDoUuTien.CAO);
    });

    it('THAP x THAP => THAP', () => {
      expect(calculatePriority(MucDoAnhHuong.THAP, MucDoKhanCap.THAP)).toBe(MucDoUuTien.THAP);
    });

    it('THAP x CAO => TRUNG_BINH', () => {
      expect(calculatePriority(MucDoAnhHuong.THAP, MucDoKhanCap.CAO)).toBe(MucDoUuTien.TRUNG_BINH);
    });
  });

  describe('addBusinessMinutes', () => {
    it('should add minutes within the same business day', () => {
      // Thứ 2, 2026-05-25 lúc 10:00 sáng (local time)
      const start = new Date(2026, 4, 25, 10, 0, 0); 
      const result = addBusinessMinutes(start, 60);
      expect(result.getTime()).toBe(new Date(2026, 4, 25, 11, 0, 0).getTime());
    });

    it('should roll over to the next day if adding minutes exceeds 17:00', () => {
      // Thứ 2, 2026-05-25 lúc 16:30 chiều
      const start = new Date(2026, 4, 25, 16, 30, 0);
      // Thêm 60 phút => 30 phút trong hôm nay (tới 17:00), 30 phút sáng hôm sau (8:30)
      const result = addBusinessMinutes(start, 60);
      expect(result.getTime()).toBe(new Date(2026, 4, 26, 8, 30, 0).getTime());
    });

    it('should skip weekends', () => {
      // Thứ 6, 2026-05-29 lúc 16:00
      const start = new Date(2026, 4, 29, 16, 0, 0);
      // Thêm 120 phút (2 tiếng) => 1 tiếng hôm nay (đến 17:00 thứ 6), 1 tiếng sáng thứ 2 tuần sau (đến 9:00 thứ 2)
      const result = addBusinessMinutes(start, 120);
      // Thứ 2 là 2026-06-01
      expect(result.getTime()).toBe(new Date(2026, 5, 1, 9, 0, 0).getTime());
    });

    it('should advance to 08:00 next monday if created on weekend', () => {
      // Chủ nhật, 2026-05-31 lúc 10:00
      const start = new Date(2026, 4, 31, 10, 0, 0);
      const result = addBusinessMinutes(start, 60);
      // Sẽ bắt đầu tính từ 08:00 sáng Thứ 2 (2026-06-01) + 60 phút = 09:00
      expect(result.getTime()).toBe(new Date(2026, 5, 1, 9, 0, 0).getTime());
    });
  });

});
