const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // Lấy TẤT CẢ ticket với số file của từng ticket
  const tickets = await prisma.phieuHoTro.findMany({ 
    include: { 
      danh_sach_file: true,
      _count: { select: { danh_sach_file: true } }
    }
  });
  
  console.log('=== TẤT CẢ TICKET + SỐ FILE ===');
  for (const t of tickets) {
    console.log(`Ticket #${t.phieu_ho_tro_id} (${t.trang_thai}): ${t._count.danh_sach_file} file`);
  }
  
  // Lấy tất cả file trong bảng TepDinhKem
  const allFiles = await prisma.tepDinhKem.findMany({
    orderBy: { tep_dinh_kem_id: 'desc' }
  });
  console.log('\n=== TẤT CẢ FILE TRONG DB ===');
  console.log('Total count:', allFiles.length);
  for (const f of allFiles) {
    console.log(`File #${f.tep_dinh_kem_id}: ${f.ten_tep} | ticket=${f.phieu_ho_tro_id} | bl=${f.binh_luan_id}`);
  }
  
  await prisma.$disconnect();
}
check();
