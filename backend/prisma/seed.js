/**
 * seed.js — IT Helpdesk System (Map Pacific Singapore)
 * Version: 3.0 - Enterprise ready with sequence reset & correct order
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

// ==================== HELPER FUNCTIONS ====================
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAfter(base, h) {
  return new Date(base.getTime() + h * 60 * 60 * 1000);
}

function minutesAfter(base, m) {
  return new Date(base.getTime() + m * 60 * 1000);
}

function maPhieu(year, seq) {
  return `SW-${year}-${String(seq).padStart(4, '0')}`;
}

// ==================== MAIN ====================
async function main() {
  console.log('🌱  Bắt đầu seed dữ liệu Map Pacific Singapore (70 nhân viên)...\n');

  // ---------- DỌN DẸP DỮ LIỆU CŨ & RESET SEQUENCE ----------
  console.log('🧹  Đang dọn dẹp dữ liệu cũ...');
  // 1. Xóa các bảng con trước
  await prisma.phieuDanhGia.deleteMany();
  await prisma.slaTheoDoi.deleteMany();
  await prisma.binhLuan.deleteMany();
  await prisma.lichSuPhieu.deleteMany();
  await prisma.phieuHoTro.deleteMany();
  await prisma.coSoTriThuc.deleteMany();
  await prisma.chinhSachSla.deleteMany();
  // Gỡ trưởng phòng trước khi xóa nhân viên
  await prisma.phongBan.updateMany({ data: { truong_phong_id: null } });
  await prisma.nhanVien.deleteMany();
  await prisma.phongBan.deleteMany();
  await prisma.nhomHoTro.deleteMany();
  await prisma.vaiTro.deleteMany();

  // 2. Reset sequence cho tất cả bảng (PostgreSQL)
  console.log('🔄  Resetting sequences...');
  const tables = [
    'phieu_danh_gia', 'sla_theo_doi', 'binh_luan', 'lich_su_phieu',
    'phieu_ho_tro', 'co_so_tri_thuc', 'chinh_sach_sla', 'nhan_vien',
    'phong_ban', 'nhom_ho_tro', 'vai_tro'
  ];
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER SEQUENCE ${table}_${table}_id_seq RESTART WITH 1;`);
    } catch (e) {
      // Một số bảng có tên sequence khác, nhưng phần lớn theo quy tắc này
      // Nếu lỗi, bỏ qua vì sequence có thể không tồn tại
    }
  }
  // Reset cụ thể cho các bảng có tên sequence đặc biệt (dựa trên model name)
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE phieu_danh_gia_danh_gia_id_seq RESTART WITH 1;`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE sla_theo_doi_sla_id_seq RESTART WITH 1;`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE binh_luan_binh_luan_id_seq RESTART WITH 1;`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE lich_su_phieu_lich_su_id_seq RESTART WITH 1;`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE phieu_ho_tro_phieu_ho_tro_id_seq RESTART WITH 1;`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE co_so_tri_thuc_tri_thuc_id_seq RESTART WITH 1;`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE chinh_sach_sla_chinh_sach_sla_id_seq RESTART WITH 1;`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE nhan_vien_nhan_vien_id_seq RESTART WITH 1;`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE phong_ban_phong_ban_id_seq RESTART WITH 1;`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE nhom_ho_tro_nhom_ho_tro_id_seq RESTART WITH 1;`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE vai_tro_vai_tro_id_seq RESTART WITH 1;`);

  console.log('   ✓ Dọn dẹp hoàn tất, sequences reset.\n');

  // ---------- 1. VAI TRÒ ----------
  console.log('📌  Tạo vai trò...');
  const roleRequester = await prisma.vaiTro.create({
    data: {
      ma_vai_tro: 'NGUOI_YEU_CAU',
      ten_vai_tro: 'Người yêu cầu',
      quyen_han: JSON.stringify(['ticket:create', 'ticket:view_own', 'ticket:comment_public', 'kb:view', 'kb:feedback', 'review:submit']),
    },
  });
  const roleL1 = await prisma.vaiTro.create({
    data: {
      ma_vai_tro: 'IT_L1',
      ten_vai_tro: 'IT Support L1',
      quyen_han: JSON.stringify(['ticket:view_assigned', 'ticket:update_status', 'ticket:comment_all', 'ticket:escalate', 'kb:view', 'kb:feedback', 'dashboard:view']),
    },
  });
  const roleL2 = await prisma.vaiTro.create({
    data: {
      ma_vai_tro: 'IT_L2',
      ten_vai_tro: 'IT Support L2',
      quyen_han: JSON.stringify(['ticket:view_assigned', 'ticket:update_status', 'ticket:comment_all', 'kb:view', 'kb:create', 'kb:edit_own', 'dashboard:view']),
    },
  });
  const roleManager = await prisma.vaiTro.create({
    data: {
      ma_vai_tro: 'QUAN_LY',
      ten_vai_tro: 'Quản lý IT',
      quyen_han: JSON.stringify(['ticket:view_all', 'ticket:assign', 'ticket:comment_all', 'kb:create', 'kb:edit_all', 'dashboard:view', 'report:view', 'sla:manage', 'admin:users']),
    },
  });
  console.log('   ✓ 4 vai trò\n');

  // ---------- 2. NHÓM HỖ TRỢ ----------
  console.log('📌  Tạo nhóm hỗ trợ...');
  const nhomL1 = await prisma.nhomHoTro.create({
    data: { ten_nhom: 'IT Support L1 — Helpdesk', mo_ta: 'Tuyến hỗ trợ đầu tiên' },
  });
  const nhomL2 = await prisma.nhomHoTro.create({
    data: { ten_nhom: 'IT Support L2 — Infrastructure', mo_ta: 'Tuyến hỗ trợ chuyên sâu' },
  });
  console.log('   ✓ 2 nhóm hỗ trợ\n');

  // ---------- 3. PHÒNG BAN ----------
  console.log('📌  Tạo phòng ban...');
  const pbIT = await prisma.phongBan.create({ data: { ten_phong_ban: 'Information Technology' } });
  const pbSales = await prisma.phongBan.create({ data: { ten_phong_ban: 'Sales & Business Development' } });
  const pbMarketing = await prisma.phongBan.create({ data: { ten_phong_ban: 'Marketing & Communications' } });
  const pbFinance = await prisma.phongBan.create({ data: { ten_phong_ban: 'Finance & Accounting' } });
  const pbHR = await prisma.phongBan.create({ data: { ten_phong_ban: 'Human Resources' } });
  const pbOps = await prisma.phongBan.create({ data: { ten_phong_ban: 'Operations & Logistics' } });
  const pbPM = await prisma.phongBan.create({ data: { ten_phong_ban: 'Project Management' } });
  console.log('   ✓ 7 phòng ban\n');

  // ---------- 4. NHÂN VIÊN ----------
  console.log('📌  Hash mật khẩu...');
  const defaultHash = await bcrypt.hash('Mappacific@2025', SALT_ROUNDS);
  console.log('   ✓ Hash xong\n');

  console.log('📌  Tạo nhân viên IT...');
  const nvITManager = await prisma.nhanVien.create({
    data: {
      phong_ban_id: pbIT.phong_ban_id,
      vai_tro_id: roleManager.vai_tro_id,
      nhom_ho_tro_id: null,
      email: 'james.tan@mappacific.com',
      tai_khoan: 'james.tan',
      mat_khau: defaultHash,
      ho_ten: 'James Tan Wei Ming',
      trang_thai: true,
      ngay_tao: daysAgo(730),
    },
  });
  const nvL1_1 = await prisma.nhanVien.create({
    data: {
      phong_ban_id: pbIT.phong_ban_id,
      vai_tro_id: roleL1.vai_tro_id,
      nhom_ho_tro_id: nhomL1.nhom_ho_tro_id,
      email: 'alicia.lim@mappacific.com',
      tai_khoan: 'alicia.lim',
      mat_khau: defaultHash,
      ho_ten: 'Alicia Lim Siu Yin',
      trang_thai: true,
      ngay_tao: daysAgo(600),
    },
  });
  const nvL1_2 = await prisma.nhanVien.create({
    data: {
      phong_ban_id: pbIT.phong_ban_id,
      vai_tro_id: roleL1.vai_tro_id,
      nhom_ho_tro_id: nhomL1.nhom_ho_tro_id,
      email: 'ravi.kumar@mappacific.com',
      tai_khoan: 'ravi.kumar',
      mat_khau: defaultHash,
      ho_ten: 'Ravi Kumar s/o Suresh',
      trang_thai: true,
      ngay_tao: daysAgo(480),
    },
  });
  const nvL1_3 = await prisma.nhanVien.create({
    data: {
      phong_ban_id: pbIT.phong_ban_id,
      vai_tro_id: roleL1.vai_tro_id,
      nhom_ho_tro_id: nhomL1.nhom_ho_tro_id,
      email: 'priya.nair@mappacific.com',
      tai_khoan: 'priya.nair',
      mat_khau: defaultHash,
      ho_ten: 'Priya Nair d/o Krishnan',
      trang_thai: true,
      ngay_tao: daysAgo(365),
    },
  });
  const nvL2_1 = await prisma.nhanVien.create({
    data: {
      phong_ban_id: pbIT.phong_ban_id,
      vai_tro_id: roleL2.vai_tro_id,
      nhom_ho_tro_id: nhomL2.nhom_ho_tro_id,
      email: 'michael.chen@mappacific.com',
      tai_khoan: 'michael.chen',
      mat_khau: defaultHash,
      ho_ten: 'Michael Chen Jian Hao',
      trang_thai: true,
      ngay_tao: daysAgo(700),
    },
  });
  const nvL2_2 = await prisma.nhanVien.create({
    data: {
      phong_ban_id: pbIT.phong_ban_id,
      vai_tro_id: roleL2.vai_tro_id,
      nhom_ho_tro_id: nhomL2.nhom_ho_tro_id,
      email: 'siti.rahimah@mappacific.com',
      tai_khoan: 'siti.rahimah',
      mat_khau: defaultHash,
      ho_ten: 'Siti Rahimah bte Abdullah',
      trang_thai: true,
      ngay_tao: daysAgo(550),
    },
  });
  console.log('   ✓ 6 nhân viên IT\n');

  await prisma.phongBan.update({
    where: { phong_ban_id: pbIT.phong_ban_id },
    data: { truong_phong_id: nvITManager.nhan_vien_id },
  });

  console.log('📌  Tạo nhân viên nghiệp vụ (64 người)...');
  const departments = [
    { pb: pbSales, count: 20, prefix: 'sales' },
    { pb: pbOps, count: 12, prefix: 'ops' },
    { pb: pbPM, count: 10, prefix: 'pm' },
    { pb: pbMarketing, count: 8, prefix: 'mkt' },
    { pb: pbFinance, count: 8, prefix: 'fin' },
    { pb: pbHR, count: 6, prefix: 'hr' },
  ];
  const allRequesters = [];
  for (const dept of departments) {
    const list = [];
    for (let i = 1; i <= dept.count; i++) {
      const email = `${dept.prefix}${i}@mappacific.com`;
      const nv = await prisma.nhanVien.create({
        data: {
          phong_ban_id: dept.pb.phong_ban_id,
          vai_tro_id: roleRequester.vai_tro_id,
          nhom_ho_tro_id: null,
          email: email,
          tai_khoan: email.split('@')[0],
          mat_khau: defaultHash,
          ho_ten: `Nhân viên ${dept.prefix} ${i}`,
          trang_thai: true,
          ngay_tao: daysAgo(Math.floor(Math.random() * 500) + 100),
        },
      });
      list.push(nv);
    }
    allRequesters.push(...list);
    await prisma.phongBan.update({
      where: { phong_ban_id: dept.pb.phong_ban_id },
      data: { truong_phong_id: list[0].nhan_vien_id },
    });
  }
  console.log(`   ✓ ${allRequesters.length} nhân viên nghiệp vụ\n`);
  console.log(`   📊 Tổng nhân viên: ${6 + allRequesters.length} người\n`);

  // ---------- 5. SLA ----------
  console.log('📌  Tạo chính sách SLA...');
  const slaCao = await prisma.chinhSachSla.create({
    data: {
      ten_chinh_sach: 'SLA Ưu tiên Cao',
      loai_thoi_gian: 'GIO_HANH_CHINH',
      muc_do_uu_tien: 'CAO',
      tg_phan_hoi: 60,
      tg_xu_ly: 240,
      trang_thai: true,
    },
  });
  const slaTrungBinh = await prisma.chinhSachSla.create({
    data: {
      ten_chinh_sach: 'SLA Ưu tiên Trung bình',
      loai_thoi_gian: 'GIO_HANH_CHINH',
      muc_do_uu_tien: 'TRUNG_BINH',
      tg_phan_hoi: 240,
      tg_xu_ly: 1440,
      trang_thai: true,
    },
  });
  const slaThap = await prisma.chinhSachSla.create({
    data: {
      ten_chinh_sach: 'SLA Ưu tiên Thấp',
      loai_thoi_gian: 'GIO_HANH_CHINH',
      muc_do_uu_tien: 'THAP',
      tg_phan_hoi: 480,
      tg_xu_ly: 2400,
      trang_thai: true,
    },
  });
  console.log('   ✓ 3 chính sách SLA\n');

  // ---------- 6. KB ----------
  console.log('📌  Tạo bài viết KB...');
  await prisma.coSoTriThuc.createMany({
    data: [
      { tieu_de: 'Hướng dẫn tự reset mật khẩu', noi_dung: '...', loai_su_co: 'account_access', the_tags: '["password"]', tac_gia_id: nvL2_1.nhan_vien_id, trang_thai: 'DA_XUAT_BAN', quyen_xem: 'CONG_KHAI', luot_xem: 182, luot_huu_ich: 47, luot_khong_huu_ich: 3, ngay_tao: daysAgo(300) },
      { tieu_de: 'Khắc phục VPN', noi_dung: '...', loai_su_co: 'network', the_tags: '["vpn"]', tac_gia_id: nvL2_2.nhan_vien_id, trang_thai: 'DA_XUAT_BAN', quyen_xem: 'CONG_KHAI', luot_xem: 143, luot_huu_ich: 38, luot_khong_huu_ich: 5, ngay_tao: daysAgo(250) },
      { tieu_de: 'Teams âm thanh', noi_dung: '...', loai_su_co: 'software', the_tags: '["teams"]', tac_gia_id: nvL2_1.nhan_vien_id, trang_thai: 'DA_XUAT_BAN', quyen_xem: 'CONG_KHAI', luot_xem: 98, luot_huu_ich: 29, luot_khong_huu_ich: 2, ngay_tao: daysAgo(200) },
      { tieu_de: 'Cài máy in', noi_dung: '...', loai_su_co: 'hardware', the_tags: '["printer"]', tac_gia_id: nvL2_2.nhan_vien_id, trang_thai: 'DA_XUAT_BAN', quyen_xem: 'CONG_KHAI', luot_xem: 76, luot_huu_ich: 22, luot_khong_huu_ich: 1, ngay_tao: daysAgo(180) },
      { tieu_de: 'Quy trình cài phần mềm', noi_dung: '...', loai_su_co: 'software', the_tags: '["policy"]', tac_gia_id: nvL2_1.nhan_vien_id, trang_thai: 'DA_XUAT_BAN', quyen_xem: 'CONG_KHAI', luot_xem: 55, luot_huu_ich: 18, luot_khong_huu_ich: 0, ngay_tao: daysAgo(150) },
      { tieu_de: '[DRAFT] Hướng dẫn MFA', noi_dung: '...', loai_su_co: 'security', the_tags: '["mfa"]', tac_gia_id: nvL2_2.nhan_vien_id, trang_thai: 'NHAP', quyen_xem: 'NOI_BO', luot_xem: 0, luot_huu_ich: 0, luot_khong_huu_ich: 0, ngay_tao: daysAgo(10) },
    ],
  });
  console.log('   ✓ 6 bài viết KB\n');

  // ---------- 7. TICKETS (theo thứ tự mã phiếu tăng dần, mỗi ticket trong transaction) ----------
  console.log('📌  Tạo tickets và luồng xử lý (thứ tự mã 135,138,139,140,141,142,143,144)...\n');

  async function createSlaTracking(tx, ticketId, policyId, loaiSla, batDau, hanChot, daViPham = false, thoiDiemDat = null) {
    return tx.slaTheoDoi.create({
      data: {
        phieu_ho_tro_id: ticketId,
        chinh_sach_sla_id: policyId,
        loai_sla: loaiSla,
        trang_thai_muc_tieu: thoiDiemDat ? 'DA_GIAI_QUYET' : 'TIEP_NHAN',
        thoi_diem_bat_dau: batDau,
        han_chot: hanChot,
        thoi_diem_dat: thoiDiemDat,
        da_vi_pham: daViPham,
        duoc_mien_tru: false,
        da_gui_nhac_nho: daViPham,
      },
    });
  }

  const sales1 = allRequesters.find(r => r.email === 'sales1@mappacific.com');
  const fin1 = allRequesters.find(r => r.email === 'fin1@mappacific.com');
  const pm1 = allRequesters.find(r => r.email === 'pm1@mappacific.com');
  const ops1 = allRequesters.find(r => r.email === 'ops1@mappacific.com');
  const pm2 = allRequesters.find(r => r.email === 'pm2@mappacific.com');
  const fin2 = allRequesters.find(r => r.email === 'fin2@mappacific.com');
  const sales2 = allRequesters.find(r => r.email === 'sales2@mappacific.com');
  const mkt1 = allRequesters.find(r => r.email === 'mkt1@mappacific.com');

  // ------------------- TICKET 6 (mã 135) -------------------
  const t6Created = daysAgo(30);
  const t6L1Start = hoursAfter(t6Created, 1);
  const t6Escalate = hoursAfter(t6Created, 6);
  const t6L2Resolved = hoursAfter(t6Created, 14);
  await prisma.$transaction(async (tx) => {
    const ticket = await tx.phieuHoTro.create({
      data: {
        ma_phieu: maPhieu(2025, 135),
        tieu_de: 'Xero báo lỗi "Connection timeout" khi xuất báo cáo',
        mo_ta_chi_tiet: 'Xuất báo cáo lớn bị timeout.',
        muc_do_uu_tien: 'CAO',
        trang_thai: 'DA_DONG',
        nguoi_tao_id: fin2.nhan_vien_id,
        nguoi_ho_tro_id: nvL2_1.nhan_vien_id,
        nhom_xu_ly_id: nhomL2.nhom_ho_tro_id,
        so_lan_mo_lai: 0,
        so_lan_thu_lai_L1: 1,
        so_lan_thu_lai_L2: 1,
        ngay_tao: t6Created,
      },
    });
    await tx.lichSuPhieu.createMany({
      data: [
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: fin2.nhan_vien_id, hanh_dong: 'CREATED', ngay_thuc_hien: t6Created },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: nvL1_3.nhan_vien_id, hanh_dong: 'STATUS_CHANGED', gia_tri_moi: 'DANG_GIAI_QUYET', ngay_thuc_hien: t6L1Start },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: nvL1_3.nhan_vien_id, hanh_dong: 'ESCALATED', gia_tri_moi: 'CHUYEN_CAP', ngay_thuc_hien: t6Escalate },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: nvL2_1.nhan_vien_id, hanh_dong: 'STATUS_CHANGED', gia_tri_moi: 'DA_GIAI_QUYET', ngay_thuc_hien: t6L2Resolved },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: fin2.nhan_vien_id, hanh_dong: 'STATUS_CHANGED', gia_tri_moi: 'DA_DONG', ngay_thuc_hien: hoursAfter(t6L2Resolved, 4) },
      ],
    });
    await tx.binhLuan.createMany({
      data: [
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_gui_id: nvL2_1.nhan_vien_id, noi_dung: 'Đã tăng timeout và tối ưu query.', loai_binh_luan: 'KET_QUA', quyen_xem: 'CONG_KHAI', ngay_tao: t6L2Resolved },
      ],
    });
    await createSlaTracking(tx, ticket.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'PHAN_HOI', t6Created, hoursAfter(t6Created, 1), false, t6L1Start);
    await createSlaTracking(tx, ticket.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'XU_LY', t6Created, hoursAfter(t6Created, 4), true, t6L2Resolved);
    await tx.phieuDanhGia.create({
      data: {
        phieu_ho_tro_id: ticket.phieu_ho_tro_id,
        nguoi_danh_gia_id: fin2.nhan_vien_id,
        token_xac_thuc: 'token_t6',
        hai_long: true,
        so_sao: 4,
        nhan_xet: 'Hơi lâu nhưng giải quyết tốt.',
        ngay_danh_gia: hoursAfter(t6L2Resolved, 4),
      },
    });
  });

  // ------------------- TICKET 1 (mã 138) -------------------
  const t1Created = daysAgo(20);
  const t1Responded = hoursAfter(t1Created, 0.5);
  const t1Resolved = hoursAfter(t1Created, 2);
  await prisma.$transaction(async (tx) => {
    const ticket = await tx.phieuHoTro.create({
      data: {
        ma_phieu: maPhieu(2025, 138),
        tieu_de: 'Không đăng nhập được tài khoản Windows sau kỳ nghỉ lễ',
        mo_ta_chi_tiet: '...',
        muc_do_uu_tien: 'CAO',
        trang_thai: 'DA_DONG',
        nguoi_tao_id: sales1.nhan_vien_id,
        nguoi_ho_tro_id: nvL1_1.nhan_vien_id,
        nhom_xu_ly_id: nhomL1.nhom_ho_tro_id,
        so_lan_mo_lai: 0,
        so_lan_thu_lai_L1: 1,
        so_lan_thu_lai_L2: 0,
        ngay_tao: t1Created,
      },
    });
    await tx.lichSuPhieu.createMany({
      data: [
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: sales1.nhan_vien_id, hanh_dong: 'CREATED', ngay_thuc_hien: t1Created },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: nvL1_1.nhan_vien_id, hanh_dong: 'STATUS_CHANGED', gia_tri_moi: 'DANG_GIAI_QUYET', ngay_thuc_hien: t1Responded },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: nvL1_1.nhan_vien_id, hanh_dong: 'STATUS_CHANGED', gia_tri_moi: 'DA_GIAI_QUYET', ngay_thuc_hien: t1Resolved },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: sales1.nhan_vien_id, hanh_dong: 'STATUS_CHANGED', gia_tri_moi: 'DA_DONG', ngay_thuc_hien: hoursAfter(t1Resolved, 3) },
      ],
    });
    await tx.binhLuan.createMany({
      data: [
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_gui_id: nvL1_1.nhan_vien_id, noi_dung: 'Đã unlock tài khoản.', loai_binh_luan: 'THUONG', quyen_xem: 'CONG_KHAI', ngay_tao: t1Responded },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_gui_id: sales1.nhan_vien_id, noi_dung: 'Cảm ơn!', loai_binh_luan: 'THUONG', quyen_xem: 'CONG_KHAI', ngay_tao: hoursAfter(t1Responded, 1) },
      ],
    });
    await createSlaTracking(tx, ticket.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'PHAN_HOI', t1Created, hoursAfter(t1Created, 1), false, t1Responded);
    await createSlaTracking(tx, ticket.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'XU_LY', t1Created, hoursAfter(t1Created, 4), false, t1Resolved);
    await tx.phieuDanhGia.create({
      data: {
        phieu_ho_tro_id: ticket.phieu_ho_tro_id,
        nguoi_danh_gia_id: sales1.nhan_vien_id,
        token_xac_thuc: 'token_t1',
        hai_long: true,
        so_sao: 5,
        nhan_xet: 'Rất nhanh',
        ngay_danh_gia: hoursAfter(t1Resolved, 3),
      },
    });
  });

  // ------------------- TICKET 2 (mã 139) -------------------
  const t2Created = daysAgo(15);
  const t2Responded = hoursAfter(t2Created, 3);
  const t2Resolved1 = hoursAfter(t2Created, 6);
  const t2Reopen = hoursAfter(t2Resolved1, 5);
  const t2Resolved2 = hoursAfter(t2Reopen, 4);
  await prisma.$transaction(async (tx) => {
    const ticket = await tx.phieuHoTro.create({
      data: {
        ma_phieu: maPhieu(2025, 139),
        tieu_de: 'Máy in tầng 3 không in được',
        mo_ta_chi_tiet: '...',
        muc_do_uu_tien: 'TRUNG_BINH',
        trang_thai: 'DA_DONG',
        nguoi_tao_id: fin1.nhan_vien_id,
        nguoi_ho_tro_id: nvL1_2.nhan_vien_id,
        nhom_xu_ly_id: nhomL1.nhom_ho_tro_id,
        so_lan_mo_lai: 1,
        so_lan_thu_lai_L1: 2,
        so_lan_thu_lai_L2: 0,
        ngay_tao: t2Created,
      },
    });
    await tx.lichSuPhieu.createMany({
      data: [
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: fin1.nhan_vien_id, hanh_dong: 'CREATED', ngay_thuc_hien: t2Created },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: nvL1_2.nhan_vien_id, hanh_dong: 'STATUS_CHANGED', gia_tri_moi: 'DANG_GIAI_QUYET', ngay_thuc_hien: t2Responded },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: nvL1_2.nhan_vien_id, hanh_dong: 'STATUS_CHANGED', gia_tri_moi: 'DA_GIAI_QUYET', ngay_thuc_hien: t2Resolved1 },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: fin1.nhan_vien_id, hanh_dong: 'REOPENED', gia_tri_moi: 'DANG_GIAI_QUYET', ngay_thuc_hien: t2Reopen },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: nvL1_2.nhan_vien_id, hanh_dong: 'STATUS_CHANGED', gia_tri_moi: 'DA_GIAI_QUYET', ngay_thuc_hien: t2Resolved2 },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: fin1.nhan_vien_id, hanh_dong: 'STATUS_CHANGED', gia_tri_moi: 'DA_DONG', ngay_thuc_hien: hoursAfter(t2Resolved2, 2) },
      ],
    });
    await tx.binhLuan.createMany({
      data: [
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_gui_id: nvL1_2.nhan_vien_id, noi_dung: 'Đã xóa driver cũ.', loai_binh_luan: 'THUONG', quyen_xem: 'CONG_KHAI', ngay_tao: t2Responded },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_gui_id: fin1.nhan_vien_id, noi_dung: 'Vẫn không được.', loai_binh_luan: 'THUONG', quyen_xem: 'CONG_KHAI', ngay_tao: hoursAfter(t2Resolved1, 1) },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_gui_id: nvL1_2.nhan_vien_id, noi_dung: 'Đã xuống tận nơi sửa IP.', loai_binh_luan: 'KET_QUA', quyen_xem: 'CONG_KHAI', ngay_tao: hoursAfter(t2Reopen, 2) },
      ],
    });
    await createSlaTracking(tx, ticket.phieu_ho_tro_id, slaTrungBinh.chinh_sach_sla_id, 'PHAN_HOI', t2Created, hoursAfter(t2Created, 4), false, t2Responded);
    await createSlaTracking(tx, ticket.phieu_ho_tro_id, slaTrungBinh.chinh_sach_sla_id, 'XU_LY', t2Created, hoursAfter(t2Created, 24), false, t2Resolved2);
    await tx.phieuDanhGia.create({
      data: {
        phieu_ho_tro_id: ticket.phieu_ho_tro_id,
        nguoi_danh_gia_id: fin1.nhan_vien_id,
        token_xac_thuc: 'token_t2',
        hai_long: true,
        so_sao: 4,
        nhan_xet: 'Lần đầu chưa xong',
        ngay_danh_gia: hoursAfter(t2Resolved2, 2),
      },
    });
  });

  // ------------------- TICKET 3 (mã 140) -------------------
  const t3Created = daysAgo(10);
  const t3L1Start = hoursAfter(t3Created, 1);
  const t3Escalate = hoursAfter(t3Created, 5);
  const t3L2Resolved = hoursAfter(t3Created, 9);
  await prisma.$transaction(async (tx) => {
    const ticket = await tx.phieuHoTro.create({
      data: {
        ma_phieu: maPhieu(2025, 140),
        tieu_de: 'VPN không kết nối được',
        mo_ta_chi_tiet: '...',
        muc_do_uu_tien: 'CAO',
        trang_thai: 'DA_DONG',
        nguoi_tao_id: pm1.nhan_vien_id,
        nguoi_ho_tro_id: nvL2_2.nhan_vien_id,
        nhom_xu_ly_id: nhomL2.nhom_ho_tro_id,
        so_lan_mo_lai: 0,
        so_lan_thu_lai_L1: 1,
        so_lan_thu_lai_L2: 1,
        ngay_tao: t3Created,
      },
    });
    await tx.lichSuPhieu.createMany({
      data: [
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: pm1.nhan_vien_id, hanh_dong: 'CREATED', ngay_thuc_hien: t3Created },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: nvL1_3.nhan_vien_id, hanh_dong: 'STATUS_CHANGED', gia_tri_moi: 'DANG_GIAI_QUYET', ngay_thuc_hien: t3L1Start },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: nvL1_3.nhan_vien_id, hanh_dong: 'ESCALATED', gia_tri_moi: 'CHUYEN_CAP', ngay_thuc_hien: t3Escalate },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: nvL2_2.nhan_vien_id, hanh_dong: 'STATUS_CHANGED', gia_tri_moi: 'DA_GIAI_QUYET', ngay_thuc_hien: t3L2Resolved },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: pm1.nhan_vien_id, hanh_dong: 'STATUS_CHANGED', gia_tri_moi: 'DA_DONG', ngay_thuc_hien: hoursAfter(t3L2Resolved, 2) },
      ],
    });
    await tx.binhLuan.createMany({
      data: [
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_gui_id: nvL1_3.nhan_vien_id, noi_dung: 'Chuyển L2.', loai_binh_luan: 'THUONG', quyen_xem: 'CONG_KHAI', ngay_tao: t3Escalate },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_gui_id: nvL2_2.nhan_vien_id, noi_dung: 'Cert hết hạn, đã renew.', loai_binh_luan: 'KET_QUA', quyen_xem: 'CONG_KHAI', ngay_tao: t3L2Resolved },
      ],
    });
    await createSlaTracking(tx, ticket.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'PHAN_HOI', t3Created, hoursAfter(t3Created, 1), false, t3L1Start);
    await createSlaTracking(tx, ticket.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'XU_LY', t3Created, hoursAfter(t3Created, 4), true, t3L2Resolved);
    await tx.phieuDanhGia.create({
      data: {
        phieu_ho_tro_id: ticket.phieu_ho_tro_id,
        nguoi_danh_gia_id: pm1.nhan_vien_id,
        token_xac_thuc: 'token_t3',
        hai_long: true,
        so_sao: 5,
        nhan_xet: 'Tốt',
        ngay_danh_gia: hoursAfter(t3L2Resolved, 2),
      },
    });
  });

  // ------------------- TICKET 4 (mã 141) -------------------
  const t4Created = daysAgo(2);
  const t4Responded = hoursAfter(t4Created, 2);
  await prisma.$transaction(async (tx) => {
    const ticket = await tx.phieuHoTro.create({
      data: {
        ma_phieu: maPhieu(2025, 141),
        tieu_de: 'Outlook không nhận email ngoài',
        mo_ta_chi_tiet: '...',
        muc_do_uu_tien: 'CAO',
        trang_thai: 'DANG_GIAI_QUYET',
        nguoi_tao_id: ops1.nhan_vien_id,
        nguoi_ho_tro_id: nvL1_1.nhan_vien_id,
        nhom_xu_ly_id: nhomL1.nhom_ho_tro_id,
        so_lan_mo_lai: 0,
        so_lan_thu_lai_L1: 1,
        so_lan_thu_lai_L2: 0,
        ngay_tao: t4Created,
      },
    });
    await tx.lichSuPhieu.createMany({
      data: [
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: ops1.nhan_vien_id, hanh_dong: 'CREATED', ngay_thuc_hien: t4Created },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: nvL1_1.nhan_vien_id, hanh_dong: 'STATUS_CHANGED', gia_tri_moi: 'DANG_GIAI_QUYET', ngay_thuc_hien: t4Responded },
      ],
    });
    await tx.binhLuan.create({
      data: {
        phieu_ho_tro_id: ticket.phieu_ho_tro_id,
        nguoi_gui_id: nvL1_1.nhan_vien_id,
        noi_dung: 'Đang kiểm tra mail flow.',
        loai_binh_luan: 'THUONG',
        quyen_xem: 'CONG_KHAI',
        ngay_tao: t4Responded,
      },
    });
    await createSlaTracking(tx, ticket.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'PHAN_HOI', t4Created, hoursAfter(t4Created, 1), true, t4Responded);
    await createSlaTracking(tx, ticket.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'XU_LY', t4Created, hoursAfter(t4Created, 4), false, null);
  });

  // ------------------- TICKET 5 (mã 142) -------------------
  const t5Created = minutesAfter(new Date(), -45);
  await prisma.$transaction(async (tx) => {
    const ticket = await tx.phieuHoTro.create({
      data: {
        ma_phieu: maPhieu(2025, 142),
        tieu_de: 'Yêu cầu cài Adobe Acrobat Pro',
        mo_ta_chi_tiet: '...',
        muc_do_uu_tien: 'TRUNG_BINH',
        trang_thai: 'MOI_TAO',
        nguoi_tao_id: pm2.nhan_vien_id,
        nguoi_ho_tro_id: null,
        nhom_xu_ly_id: nhomL1.nhom_ho_tro_id,
        so_lan_mo_lai: 0,
        so_lan_thu_lai_L1: 0,
        so_lan_thu_lai_L2: 0,
        ngay_tao: t5Created,
      },
    });
    await tx.lichSuPhieu.create({
      data: {
        phieu_ho_tro_id: ticket.phieu_ho_tro_id,
        nguoi_thuc_hien_id: pm2.nhan_vien_id,
        hanh_dong: 'CREATED',
        ngay_thuc_hien: t5Created,
      },
    });
    await createSlaTracking(tx, ticket.phieu_ho_tro_id, slaTrungBinh.chinh_sach_sla_id, 'PHAN_HOI', t5Created, hoursAfter(t5Created, 4), false, null);
    await createSlaTracking(tx, ticket.phieu_ho_tro_id, slaTrungBinh.chinh_sach_sla_id, 'XU_LY', t5Created, hoursAfter(t5Created, 24), false, null);
  });

  // ------------------- TICKET 7 (mã 143) -------------------
  const t7Created = daysAgo(3);
  const t7Responded = hoursAfter(t7Created, 3);
  await prisma.$transaction(async (tx) => {
    const ticket = await tx.phieuHoTro.create({
      data: {
        ma_phieu: maPhieu(2025, 143),
        tieu_de: 'Toàn bộ máy tính phòng Sales tầng 3 mất mạng',
        mo_ta_chi_tiet: 'Switch loop.',
        muc_do_uu_tien: 'CAO',
        trang_thai: 'DANG_GIAI_QUYET',
        nguoi_tao_id: sales2.nhan_vien_id,
        nguoi_ho_tro_id: nvL1_2.nhan_vien_id,
        nhom_xu_ly_id: nhomL1.nhom_ho_tro_id,
        so_lan_mo_lai: 0,
        so_lan_thu_lai_L1: 1,
        so_lan_thu_lai_L2: 0,
        ngay_tao: t7Created,
      },
    });
    await tx.lichSuPhieu.createMany({
      data: [
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: sales2.nhan_vien_id, hanh_dong: 'CREATED', ngay_thuc_hien: t7Created },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: nvL1_2.nhan_vien_id, hanh_dong: 'STATUS_CHANGED', gia_tri_moi: 'DANG_GIAI_QUYET', ngay_thuc_hien: t7Responded },
      ],
    });
    await tx.binhLuan.create({
      data: {
        phieu_ho_tro_id: ticket.phieu_ho_tro_id,
        nguoi_gui_id: nvL1_2.nhan_vien_id,
        noi_dung: 'Xin lỗi phản hồi trễ, đang xử lý switch.',
        loai_binh_luan: 'THUONG',
        quyen_xem: 'CONG_KHAI',
        ngay_tao: t7Responded,
      },
    });
    await createSlaTracking(tx, ticket.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'PHAN_HOI', t7Created, hoursAfter(t7Created, 1), true, t7Responded);
    await createSlaTracking(tx, ticket.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'XU_LY', t7Created, hoursAfter(t7Created, 4), false, null);
  });

  // ------------------- TICKET 8 (mã 144) -------------------
  const t8Created = daysAgo(1);
  const t8L1Start = hoursAfter(t8Created, 0.75);
  const t8Escalate = hoursAfter(t8Created, 4);
  await prisma.$transaction(async (tx) => {
    const ticket = await tx.phieuHoTro.create({
      data: {
        ma_phieu: maPhieu(2025, 144),
        tieu_de: 'SharePoint không upload được file > 500MB',
        mo_ta_chi_tiet: 'Lỗi 413.',
        muc_do_uu_tien: 'TRUNG_BINH',
        trang_thai: 'DANG_GIAI_QUYET',
        nguoi_tao_id: mkt1.nhan_vien_id,
        nguoi_ho_tro_id: nvL2_1.nhan_vien_id,
        nhom_xu_ly_id: nhomL2.nhom_ho_tro_id,
        so_lan_mo_lai: 0,
        so_lan_thu_lai_L1: 1,
        so_lan_thu_lai_L2: 1,
        ngay_tao: t8Created,
      },
    });
    await tx.lichSuPhieu.createMany({
      data: [
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: mkt1.nhan_vien_id, hanh_dong: 'CREATED', ngay_thuc_hien: t8Created },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: nvL1_1.nhan_vien_id, hanh_dong: 'STATUS_CHANGED', gia_tri_moi: 'DANG_GIAI_QUYET', ngay_thuc_hien: t8L1Start },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_thuc_hien_id: nvL1_1.nhan_vien_id, hanh_dong: 'ESCALATED', gia_tri_moi: 'CHUYEN_CAP', ngay_thuc_hien: t8Escalate },
      ],
    });
    await tx.binhLuan.createMany({
      data: [
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_gui_id: nvL1_1.nhan_vien_id, noi_dung: 'Cần L2 tăng limit.', loai_binh_luan: 'THUONG', quyen_xem: 'CONG_KHAI', ngay_tao: t8Escalate },
        { phieu_ho_tro_id: ticket.phieu_ho_tro_id, nguoi_gui_id: nvL2_1.nhan_vien_id, noi_dung: 'Đang cấu hình lại.', loai_binh_luan: 'THUONG', quyen_xem: 'CONG_KHAI', ngay_tao: hoursAfter(t8Escalate, 1) },
      ],
    });
    await createSlaTracking(tx, ticket.phieu_ho_tro_id, slaTrungBinh.chinh_sach_sla_id, 'PHAN_HOI', t8Created, hoursAfter(t8Created, 4), false, t8L1Start);
    await createSlaTracking(tx, ticket.phieu_ho_tro_id, slaTrungBinh.chinh_sach_sla_id, 'XU_LY', t8Created, hoursAfter(t8Created, 24), false, null);
  });

  console.log('   ✓ 8 tickets với transaction hoàn tất\n');

  // ---------- TỔNG KẾT ----------
  console.log('═'.repeat(60));
  console.log('✅  SEED HOÀN TẤT — Map Pacific Singapore (70 nhân viên)');
  console.log('═'.repeat(60));
  console.log('\n📊  Tóm tắt:');
  console.log(`    Nhân viên: ${6 + allRequesters.length} (6 IT + ${allRequesters.length} NV)`);
  console.log('    Tickets: 8 (mã 135,138,139,140,141,142,143,144)');
  console.log('\n🔑  Password mặc định: Mappacific@2025');
  console.log('═'.repeat(60));
}

main()
  .catch(e => { console.error('❌  Seed thất bại:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });