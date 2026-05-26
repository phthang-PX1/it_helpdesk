const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Teams:', await prisma.nhomHoTro.findMany());
  console.log('Roles:', await prisma.vaiTro.findMany());
  console.log('Depts:', await prisma.phongBan.findMany());
}

main().catch(console.error).finally(() => prisma.$disconnect());
