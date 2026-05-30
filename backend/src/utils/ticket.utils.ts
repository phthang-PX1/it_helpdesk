import { MucDoAnhHuong, MucDoKhanCap, MucDoUuTien } from '@prisma/client';

export function addBusinessMinutes(startDate: Date, minutesToAdd: number): Date {
  let currentDate = new Date(startDate);
  while (minutesToAdd > 0) {
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      currentDate.setDate(currentDate.getDate() + (currentDate.getDay() === 0 ? 1 : 2));
      currentDate.setHours(8, 0, 0, 0);
      continue;
    }
    const hour = currentDate.getHours();
    if (hour < 8) {
      currentDate.setHours(8, 0, 0, 0);
    } else if (hour >= 17) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(8, 0, 0, 0);
      if (currentDate.getDay() === 6) currentDate.setDate(currentDate.getDate() + 2);
    } else {
      const minutesTo17 = (17 - hour) * 60 - currentDate.getMinutes();
      if (minutesToAdd <= minutesTo17) {
        currentDate.setMinutes(currentDate.getMinutes() + minutesToAdd);
        minutesToAdd = 0;
      } else {
        minutesToAdd -= minutesTo17;
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(8, 0, 0, 0);
        if (currentDate.getDay() === 6) currentDate.setDate(currentDate.getDate() + 2);
      }
    }
  }
  return currentDate;
}

export function calculatePriority(impact: MucDoAnhHuong, urgency: MucDoKhanCap): MucDoUuTien {
  // Cao x Cao => Cao
  if (impact === 'CAO' && urgency === 'CAO') return MucDoUuTien.CAO;
  // Trung bình x Cao => Cao
  if (impact === 'TRUNG_BINH' && urgency === 'CAO') return MucDoUuTien.CAO;
  // Cao x Trung bình => Trung bình
  if (impact === 'CAO' && urgency === 'TRUNG_BINH') return MucDoUuTien.TRUNG_BINH;
  // Trung bình x Trung bình => Trung bình
  if (impact === 'TRUNG_BINH' && urgency === 'TRUNG_BINH') return MucDoUuTien.TRUNG_BINH;
  // Thấp x Cao => Trung bình
  if (impact === 'THAP' && urgency === 'CAO') return MucDoUuTien.TRUNG_BINH;
  // Cao x Thấp => Trung bình (Theo logic cũ, dù QA không liệt kê rõ, thường là TB)
  if (impact === 'CAO' && urgency === 'THAP') return MucDoUuTien.TRUNG_BINH;
  // Trung bình x Thấp => Thấp
  if (impact === 'TRUNG_BINH' && urgency === 'THAP') return MucDoUuTien.THAP;
  // Thấp x Trung bình => Thấp
  if (impact === 'THAP' && urgency === 'TRUNG_BINH') return MucDoUuTien.THAP;
  // Thấp x Thấp => Thấp
  if (impact === 'THAP' && urgency === 'THAP') return MucDoUuTien.THAP;
  
  return MucDoUuTien.TRUNG_BINH; // Default fallback
}
