const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const ticket = await prisma.phieuHoTro.findFirst();
    if (!ticket) {
      console.log('No ticket found');
      return;
    }
    console.log('Using ticket ID:', ticket.phieu_ho_tro_id);

    const filesData = [
      {
        ten_tep: 'test_upload.png',
        duong_dan_file: 'uploads/attachments/test_123.png',
        dinh_dang: 'png',
        dung_luong_kb: 15,
        phieu_ho_tro_id: ticket.phieu_ho_tro_id
      }
    ];

    console.log('Inserting...', filesData);
    const createRes = await prisma.tepDinhKem.createMany({ data: filesData });
    console.log('Create result:', createRes);

    const findRes = await prisma.tepDinhKem.findMany({
      where: { duong_dan_file: { in: filesData.map(f => f.duong_dan_file) } }
    });
    console.log('Find result:', findRes);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
