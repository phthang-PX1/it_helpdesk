// src/services/admin.service.ts
import bcrypt from 'bcrypt';
import { adminRepository } from '../repositories/admin.repository';
import { AppError } from '../middlewares/errorHandler';

export const adminService = {
  // API-34
  getUsers: async (query: any) => {
    const { page, limit, vai_tro_id, nhom_ho_tro_id, trang_thai, keyword } = query;
    const skip = (page - 1) * limit;

    let where: any = {};
    if (vai_tro_id) where.vai_tro_id = vai_tro_id;
    if (nhom_ho_tro_id) where.nhom_ho_tro_id = nhom_ho_tro_id;
    if (trang_thai !== undefined) where.trang_thai = trang_thai;
    if (keyword) {
      where.OR = [
        { ho_ten: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { tai_khoan: { contains: keyword, mode: 'insensitive' } }
      ];
    }

    return await adminRepository.findUsers(where, skip, limit);
  },

  // API-35
  createUser: async (data: any) => {
    const isExist = await adminRepository.checkUniqueUser(data.email, data.tai_khoan);
    if (isExist) throw new AppError('Email hoặc tài khoản đăng nhập đã tồn tại trong hệ thống', 409);

    // Hash mật khẩu chuẩn bảo mật công nghiệp với Salt Rounds = 12
    const hashedPassword = await bcrypt.hash(data.mat_khau, 12);
    const payload = { ...data, mat_khau: hashedPassword, trang_thai: true };
    
    return await adminRepository.createUser(payload);
  },

  // API-36
  updateUser: async (targetUserId: number, currentManagerId: number, data: any) => {
    const user = await adminRepository.findUserById(targetUserId);
    if (!user) throw new AppError('Nhân viên không tồn tại', 404);

    // Nghiệp vụ: Tránh việc Quản lý (Manager) tự vô hiệu hóa tài khoản của chính mình
    if (data.trang_thai === false && targetUserId === currentManagerId) {
      throw new AppError('Bạn không thể tự vô hiệu hóa tài khoản của chính mình', 403);
    }

    return await adminRepository.updateUser(targetUserId, data);
  },

  // API-37
  getRoles: async () => {
    return await adminRepository.getRoles();
  },

  // API-38
  updateRolePermissions: async (roleId: number, quyenHan: string[]) => {
    // Whitelist bảo vệ hệ thống khỏi việc truyền quyền ảo
    // Fix #7: Whitelist theo đúng format namespace:action đang dùng trong seed data và DB
    const validPermissions = [
      'ticket:create', 'ticket:view_own', 'ticket:view_all',
      'ticket:update_status', 'ticket:escalate', 'ticket:reopen',
      'ticket:assign', 'ticket:comment_public', 'ticket:comment_internal',
      'ticket:view_sla', 'ticket:delete',
      'kb:view', 'kb:create', 'kb:update', 'kb:delete', 'kb:feedback',
      'review:submit', 'review:view_result',
      'sla:manage', 'admin:manage'
    ];
    const hasInvalid = quyenHan.some(p => !validPermissions.includes(p));
    
    if (hasInvalid) throw new AppError('Danh sách quyền chứa mã không hợp lệ với hệ thống', 400);

    const roles = await adminRepository.getRoles();
    const roleExist = roles.find(r => r.vai_tro_id === roleId);
    if (!roleExist) throw new AppError('Vai trò không tồn tại', 404);

    return await adminRepository.updateRolePermissions(roleId, quyenHan);
  },

  // API-39
  getTeams: async () => {
    const teams = await adminRepository.getTeams();
    return teams.map(t => ({
      nhom_ho_tro_id: t.nhom_ho_tro_id,
      ten_nhom: t.ten_nhom,
      mo_ta: t.mo_ta,
      so_thanh_vien: t._count.danh_sach_it,
      thanh_vien: t.danh_sach_it
    }));
  },

  // API-40
  updateTeamMembers: async (teamId: number, userIds: number[]) => {
    const teams = await adminRepository.getTeams();
    const teamExist = teams.find(t => t.nhom_ho_tro_id === teamId);
    if (!teamExist) throw new AppError('Nhóm hỗ trợ không tồn tại', 404);

    return await adminRepository.updateTeamMembers(teamId, userIds);
  },

  // API-41
  getDepartments: async () => {
    const depts = await adminRepository.getDepartments();
    return depts.map(d => ({
      phong_ban_id: d.phong_ban_id,
      ten_phong_ban: d.ten_phong_ban,
      so_nhan_vien: d._count.danh_sach_nv,
      truong_phong: d.truong_phong?.ho_ten || null
    }));
  }
};