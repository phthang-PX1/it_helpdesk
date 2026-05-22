import { PrismaClient } from '@prisma/client';

// Đoạn code này đảm bảo khi bạn code ở môi trường Development, 
// mỗi lần lưu file (Nodemon/Ts-node-dev reset) hệ thống không bị tạo lập vô số kết nối thừa.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Hiện câu lệnh SQL dưới Terminal để bạn dễ debug
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;