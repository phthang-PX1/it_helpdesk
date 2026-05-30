const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.nhanVien.findMany({ 
  where:{trang_thai:true}, 
  select:{tai_khoan:true, nhan_vien_id:true, vai_tro:{select:{ma_vai_tro:true}}},
  take: 5
}).then(users => {
  console.log(JSON.stringify(users, null, 2));
  return p.$disconnect();
});
