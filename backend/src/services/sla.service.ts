// src/services/sla.service.ts
import { slaRepository } from '../repositories/sla.repository';
import { AppError } from '../middlewares/errorHandler';

export const slaService = {
  getPolicies: async (query: any) => {
    const { trang_thai } = query;
    const where: any = {};
    
    if (trang_thai === 'active') where.trang_thai = true;
    if (trang_thai === 'inactive') where.trang_thai = false;

    return await slaRepository.getPolicies(where);
  },

  createPolicy: async (data: any) => {
    // Ràng buộc hệ thống: Chỉ 1 policy được active trên 1 mức độ ưu tiên
    const conflict = await slaRepository.checkActivePolicyConflict(data.muc_do_uu_tien);
    if (conflict) {
      throw new AppError(`Không thể tạo: Đã tồn tại một chính sách đang 'active' cho mức độ ưu tiên ${data.muc_do_uu_tien}. Vui lòng vô hiệu hóa chính sách cũ trước!`, 409);
    }

    // Mặc định tạo mới thì luôn active
    const payload = { ...data, trang_thai: true };
    return await slaRepository.createPolicy(payload);
  },

  updatePolicy: async (id: number, data: any) => {
    const existing = await slaRepository.getPolicyById(id);
    if (!existing) throw new AppError('Chính sách SLA không tồn tại trên hệ thống', 404);

    // Kịch bản rủi ro: Quản lý cố tình bật (trang_thai = true) một chính sách đã tắt từ lâu.
    // Cần kiểm tra xem mức ưu tiên đó hiện có ai đang chiếm dụng active không.
    if (data.trang_thai === true) {
      const conflict = await slaRepository.checkActivePolicyConflict(existing.muc_do_uu_tien, id);
      if (conflict) {
        throw new AppError(`Không thể kích hoạt: Đang có một chính sách khác chiếm quyền 'active' cho mức độ ưu tiên ${existing.muc_do_uu_tien}`, 409);
      }
    }

    return await slaRepository.updatePolicy(id, data);
  }
};