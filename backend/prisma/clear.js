const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clear() {
  await prisma.phieuDanhGia.deleteMany();
  await prisma.slaTheoDoi.deleteMany();
  await prisma.binhLuan.deleteMany();
  await prisma.lichSuPhieu.deleteMany();
  await prisma.phieuHoTro.deleteMany();
  await prisma.coSoTriThuc.deleteMany();
  await prisma.chinhSachSla.deleteMany();
  await prisma.phongBan.updateMany({ data: { truong_phong_id: null } });
  await prisma.nhanVien.deleteMany();
  await prisma.phongBan.deleteMany();
  await prisma.nhomHoTro.deleteMany();
  await prisma.vaiTro.deleteMany();
  console.log('✅ All data cleared');
}

clear().finally(() => prisma.$disconnect());