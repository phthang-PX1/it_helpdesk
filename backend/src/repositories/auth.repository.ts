import { prisma } from '../libs/prisma';

export const findUserByTaiKhoan = async (tai_khoan: string) => {
  return await prisma.nhanVien.findUnique({
    where: { tai_khoan },
    include: { vai_tro: true }
  });
};

export const findUserByEmail = async (email: string) => {
  return await prisma.nhanVien.findUnique({
    where: { email },
  });
};

export const findUserById = async (nhan_vien_id: number) => {
  return await prisma.nhanVien.findUnique({
    where: { nhan_vien_id },
    include: {
      phong_ban: true,
      vai_tro: true,
      nhom_ho_tro: true,
    },
  });
};