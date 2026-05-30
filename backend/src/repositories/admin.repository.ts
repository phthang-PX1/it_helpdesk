// src/repositories/admin.repository.ts
import { prisma } from '../libs/prisma';
import { Prisma } from '@prisma/client';

// 🌟 CHỐT CHẶN BẢO MẬT: Chỉ select những trường cần thiết, bỏ mat_khau
const userSelectFields = {
  nhan_vien_id: true, ho_ten: true, email: true, tai_khoan: true, trang_thai: true, ngay_tao: true,
  vai_tro: { select: { vai_tro_id: true, ten_vai_tro: true, ma_vai_tro: true } },
  phong_ban: { select: { phong_ban_id: true, ten_phong_ban: true } },
  nhom_ho_tro: { select: { nhom_ho_tro_id: true, ten_nhom: true } }
};

export const adminRepository = {
  // API-34
  findUsers: async (where: Prisma.NhanVienWhereInput, skip: number, take: number) => {
    const [total, data] = await Promise.all([
      prisma.nhanVien.count({ where }),
      prisma.nhanVien.findMany({ where, skip, take, select: userSelectFields, orderBy: { nhan_vien_id: 'desc' } })
    ]);
    return { total, data };
  },

  // API-35
  checkUniqueUser: async (email: string, taiKhoan: string) => {
    return prisma.nhanVien.findFirst({
      where: { OR: [{ email }, { tai_khoan: taiKhoan }] }
    });
  },

  createUser: async (data: any) => {
    return prisma.nhanVien.create({
      data,
      select: userSelectFields
    });
  },

  // API-36
  findUserById: async (id: number) => {
    return prisma.nhanVien.findUnique({ where: { nhan_vien_id: id } }); // Truy vấn ngầm để logic Service kiểm tra
  },

  updateUser: async (id: number, data: any) => {
    return prisma.nhanVien.update({
      where: { nhan_vien_id: id },
      data,
      select: userSelectFields
    });
  },

  // API-37
  getRoles: async () => {
    return prisma.vaiTro.findMany({ orderBy: { vai_tro_id: 'asc' } });
  },

  // API-38
  updateRolePermissions: async (roleId: number, quyenHan: string[]) => {
    return prisma.vaiTro.update({
      where: { vai_tro_id: roleId },
      data: { quyen_han: quyenHan }
    });
  },

  // API-39
  getTeams: async () => {
    return prisma.nhomHoTro.findMany({
      include: {
        _count: { select: { danh_sach_it: true } },
        danh_sach_it: { select: { nhan_vien_id: true, ho_ten: true, vai_tro: { select: { ten_vai_tro: true } } } }
      }
    });
  },

  // API-40 (Transaction cập nhật hàng loạt thành viên Team)
  updateTeamMembers: async (teamId: number, userIds: number[]) => {
    return prisma.$transaction(async (tx) => {
      // 1. Clear toàn bộ nhân viên cũ đang ở trong nhóm này
      await tx.nhanVien.updateMany({
        where: { nhom_ho_tro_id: teamId },
        data: { nhom_ho_tro_id: null }
      });

      // 2. Gán nhóm cho các nhân viên mới được chọn
      if (userIds.length > 0) {
        await tx.nhanVien.updateMany({
          where: { nhan_vien_id: { in: userIds } },
          data: { nhom_ho_tro_id: teamId }
        });
      }

      // 3. Lấy lại kết quả nhóm vừa update
      return tx.nhomHoTro.findUnique({
        where: { nhom_ho_tro_id: teamId },
        include: { danh_sach_it: { select: { nhan_vien_id: true, ho_ten: true } } }
      });
    });
  },

  // API-41
  getDepartments: async () => {
    return prisma.phongBan.findMany({
      include: {
        _count: { select: { danh_sach_nv: true } },
        truong_phong: { select: { ho_ten: true } }
      }
    });
  }
};