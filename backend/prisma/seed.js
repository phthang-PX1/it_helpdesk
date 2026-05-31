/**
 * seed.js — IT Helpdesk System (Map Pacific Singapore)
 * Version: 4.0 - Full test coverage + buffer data
 * 
 * Tài khoản cố định (giữ nguyên từ v3):
 *   thangpq23406  → QUAN_LY
 *   huyentld23406 → IT_L1
 *   vanbtt23406   → IT_L2
 *
 * Data bổ sung so với v3:
 *   - Thêm 1 tài khoản bị khóa (locked_user) cho TC-AUTH-004
 *   - Thêm IT_L1 thứ 2,3 và IT_L2 thứ 2 đặt tên rõ
 *   - Thêm tài khoản IT thuộc nhóm KHÁC để test wrong group assign
 *   - Thêm 12 tickets đa dạng trạng thái (bao phủ mọi nhánh testcase)
 *   - Thêm tickets DA_GIAI_QUYET với review token rõ ràng
 *   - Thêm ticket > 48h để test reopen expired
 *   - Thêm ticket DA_DONG có file đính kèm
 *   - Thêm ticket chưa có đánh giá (noReviewTicket)
 *   - Thêm KB đa dạng: nhiều DA_XUAT_BAN, nhiều NHAP, có tác giả khác nhau
 *   - Thêm SLA inactive để test conflict khi activate
 *   - Thêm notifications
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

// ==================== HELPERS ====================
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function hoursAfter(base, h) {
  return new Date(base.getTime() + h * 3600 * 1000);
}
function minutesAfter(base, m) {
  return new Date(base.getTime() + m * 60 * 1000);
}
function mp(seq) {
  return `SW-2025-${String(seq).padStart(4, '0')}`;
}
function randomBetween(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

// ==================== MAIN ====================
async function main() {
  console.log('🌱  Seed v4.0 — Map Pacific Singapore\n');

  // ── CLEANUP ──────────────────────────────────────────────────────
  console.log('🧹  Dọn dẹp dữ liệu cũ...');
  await prisma.phieuDanhGia.deleteMany();
  await prisma.slaTheoDoi.deleteMany();
  await prisma.tepDinhKem.deleteMany();
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

  // ── RESET SEQUENCES ──────────────────────────────────────────────
  console.log('🔄  Reset sequences...');
  const seqMap = {
    phieu_danh_gia: 'danh_gia_id',
    sla_theo_doi: 'sla_id',
    tep_dinh_kem: 'tep_dinh_kem_id',
    binh_luan: 'binh_luan_id',
    lich_su_phieu: 'lich_su_id',
    phieu_ho_tro: 'phieu_ho_tro_id',
    co_so_tri_thuc: 'tri_thuc_id',
    chinh_sach_sla: 'chinh_sach_sla_id',
    nhan_vien: 'nhan_vien_id',
    phong_ban: 'phong_ban_id',
    nhom_ho_tro: 'nhom_ho_tro_id',
    vai_tro: 'vai_tro_id',
  };
  for (const [table, col] of Object.entries(seqMap)) {
    try {
      await prisma.$executeRawUnsafe(
        `ALTER SEQUENCE ${table}_${col}_seq RESTART WITH 1;`
      );
    } catch (_) { }
  }
  console.log('   ✓ Done\n');

  // ════════════════════════════════════════════════════════════════
  // 1. VAI TRÒ
  // ════════════════════════════════════════════════════════════════
  console.log('📌  Vai trò...');
  const roleRequester = await prisma.vaiTro.create({
    data: {
      ma_vai_tro: 'NGUOI_YEU_CAU', ten_vai_tro: 'Người yêu cầu',
      quyen_han: JSON.stringify(['ticket:create', 'ticket:view_own', 'ticket:comment_public', 'kb:view', 'kb:feedback', 'review:submit']),
    }
  });
  const roleL1 = await prisma.vaiTro.create({
    data: {
      ma_vai_tro: 'IT_L1', ten_vai_tro: 'IT Support L1',
      quyen_han: JSON.stringify(['ticket:view_assigned', 'ticket:update_status', 'ticket:comment_all', 'ticket:escalate', 'kb:view', 'kb:feedback', 'dashboard:view']),
    }
  });
  const roleL2 = await prisma.vaiTro.create({
    data: {
      ma_vai_tro: 'IT_L2', ten_vai_tro: 'IT Support L2',
      quyen_han: JSON.stringify(['ticket:view_assigned', 'ticket:update_status', 'ticket:comment_all', 'kb:view', 'kb:create', 'kb:edit_own', 'dashboard:view']),
    }
  });
  const roleManager = await prisma.vaiTro.create({
    data: {
      ma_vai_tro: 'QUAN_LY', ten_vai_tro: 'Quản lý IT',
      quyen_han: JSON.stringify(['ticket:view_all', 'ticket:assign', 'ticket:reopen', 'ticket:comment_all', 'kb:create', 'kb:edit_all', 'dashboard:view', 'report:view', 'sla:manage', 'admin:users']),
    }
  });
  // roleId = 1(requester), 2(L1), 3(L2), 4(manager)
  console.log(`   ✓ vai_tro_id: Requester=${roleRequester.vai_tro_id}, L1=${roleL1.vai_tro_id}, L2=${roleL2.vai_tro_id}, Manager=${roleManager.vai_tro_id}\n`);

  // ════════════════════════════════════════════════════════════════
  // 2. NHÓM HỖ TRỢ
  // ════════════════════════════════════════════════════════════════
  console.log('📌  Nhóm hỗ trợ...');
  const nhomL1 = await prisma.nhomHoTro.create({ data: { ten_nhom: 'IT Support L1 — Helpdesk', mo_ta: 'Tuyến hỗ trợ đầu tiên, xử lý sự cố phổ biến' } });
  const nhomL2 = await prisma.nhomHoTro.create({ data: { ten_nhom: 'IT Support L2 — Infrastructure', mo_ta: 'Tuyến hỗ trợ chuyên sâu, hạ tầng và bảo mật' } });
  // nhomL1.id=1, nhomL2.id=2
  console.log(`   ✓ nhom_ho_tro_id: L1=${nhomL1.nhom_ho_tro_id}, L2=${nhomL2.nhom_ho_tro_id}\n`);

  // ════════════════════════════════════════════════════════════════
  // 3. PHÒNG BAN
  // ════════════════════════════════════════════════════════════════
  console.log('📌  Phòng ban...');
  const pbIT = await prisma.phongBan.create({ data: { ten_phong_ban: 'Information Technology' } });
  const pbSales = await prisma.phongBan.create({ data: { ten_phong_ban: 'Sales & Business Development' } });
  const pbMarketing = await prisma.phongBan.create({ data: { ten_phong_ban: 'Marketing & Communications' } });
  const pbFinance = await prisma.phongBan.create({ data: { ten_phong_ban: 'Finance & Accounting' } });
  const pbHR = await prisma.phongBan.create({ data: { ten_phong_ban: 'Human Resources' } });
  const pbOps = await prisma.phongBan.create({ data: { ten_phong_ban: 'Operations & Logistics' } });
  const pbPM = await prisma.phongBan.create({ data: { ten_phong_ban: 'Project Management' } });
  console.log('   ✓ 7 phòng ban\n');

  // ════════════════════════════════════════════════════════════════
  // 4. NHÂN VIÊN
  // ════════════════════════════════════════════════════════════════
  console.log('📌  Hash mật khẩu...');
  const defaultHash = await bcrypt.hash('Mappacific@2025', SALT_ROUNDS);
  console.log('   ✓ Done\n');

  console.log('📌  Nhân viên IT...');

  // ── QUAN_LY (giữ nguyên) ──
  const nvManager = await prisma.nhanVien.create({
    data: {
      phong_ban_id: pbIT.phong_ban_id, vai_tro_id: roleManager.vai_tro_id, nhom_ho_tro_id: null,
      email: 'thangpq23406@st.uel.edu.vn', tai_khoan: 'thangpq23406', mat_khau: defaultHash,
      ho_ten: 'Thang Pham Quoc', trang_thai: true, ngay_tao: daysAgo(730),
    }
  });

  // ── IT_L1 #1 (giữ nguyên) ──
  const nvL1_1 = await prisma.nhanVien.create({
    data: {
      phong_ban_id: pbIT.phong_ban_id, vai_tro_id: roleL1.vai_tro_id, nhom_ho_tro_id: nhomL1.nhom_ho_tro_id,
      email: 'huyentld23406@st.uel.edu.vn', tai_khoan: 'huyentld23406', mat_khau: defaultHash,
      ho_ten: 'Alicia Lim Siu Yin', trang_thai: true, ngay_tao: daysAgo(600),
    }
  });

  // ── IT_L1 #2 (nhóm L1 — validItL1Id cho assign test) ──
  const nvL1_2 = await prisma.nhanVien.create({
    data: {
      phong_ban_id: pbIT.phong_ban_id, vai_tro_id: roleL1.vai_tro_id, nhom_ho_tro_id: nhomL1.nhom_ho_tro_id,
      email: 'ravi.kumar@mappacific.com', tai_khoan: 'ravi.kumar', mat_khau: defaultHash,
      ho_ten: 'Ravi Kumar s/o Suresh', trang_thai: true, ngay_tao: daysAgo(480),
    }
  });

  // ── IT_L1 #3 ──
  const nvL1_3 = await prisma.nhanVien.create({
    data: {
      phong_ban_id: pbIT.phong_ban_id, vai_tro_id: roleL1.vai_tro_id, nhom_ho_tro_id: nhomL1.nhom_ho_tro_id,
      email: 'priya.nair@mappacific.com', tai_khoan: 'priya.nair', mat_khau: defaultHash,
      ho_ten: 'Priya Nair d/o Krishnan', trang_thai: true, ngay_tao: daysAgo(365),
    }
  });

  // ── IT_L2 #1 (giữ nguyên — tác giả KB chính) ──
  const nvL2_1 = await prisma.nhanVien.create({
    data: {
      phong_ban_id: pbIT.phong_ban_id, vai_tro_id: roleL2.vai_tro_id, nhom_ho_tro_id: nhomL2.nhom_ho_tro_id,
      email: 'vanbtt23406@st.uel.edu.vn', tai_khoan: 'vanbtt23406', mat_khau: defaultHash,
      ho_ten: 'Michael Chen Jian Hao', trang_thai: true, ngay_tao: daysAgo(700),
    }
  });

  // ── IT_L2 #2 (otherItL2Token — không phải tác giả bài KB của vanbtt) ──
  const nvL2_2 = await prisma.nhanVien.create({
    data: {
      phong_ban_id: pbIT.phong_ban_id, vai_tro_id: roleL2.vai_tro_id, nhom_ho_tro_id: nhomL2.nhom_ho_tro_id,
      email: 'siti.rahimah@mappacific.com', tai_khoan: 'siti.rahimah', mat_khau: defaultHash,
      ho_ten: 'Siti Rahimah bte Abdullah', trang_thai: true, ngay_tao: daysAgo(550),
    }
  });

  // ── Tài khoản bị khóa (lockedUsername cho TC-AUTH-004) ──
  const nvLocked = await prisma.nhanVien.create({
    data: {
      phong_ban_id: pbIT.phong_ban_id, vai_tro_id: roleL1.vai_tro_id, nhom_ho_tro_id: nhomL1.nhom_ho_tro_id,
      email: 'locked.user@mappacific.com', tai_khoan: 'locked_user', mat_khau: defaultHash,
      ho_ten: 'Locked Test Account', trang_thai: false, ngay_tao: daysAgo(200),
    }
  });

  await prisma.phongBan.update({ where: { phong_ban_id: pbIT.phong_ban_id }, data: { truong_phong_id: nvManager.nhan_vien_id } });

  console.log('   ✓ 7 nhân viên IT (1 manager, 3 L1, 2 L2, 1 locked)\n');
  console.log('   📋  ID map:');
  console.log(`       Manager  (thangpq23406)  : nhan_vien_id = ${nvManager.nhan_vien_id}`);
  console.log(`       IT_L1 #1 (huyentld23406) : nhan_vien_id = ${nvL1_1.nhan_vien_id}`);
  console.log(`       IT_L1 #2 (ravi.kumar)    : nhan_vien_id = ${nvL1_2.nhan_vien_id}  ← validItL1Id`);
  console.log(`       IT_L1 #3 (priya.nair)    : nhan_vien_id = ${nvL1_3.nhan_vien_id}`);
  console.log(`       IT_L2 #1 (vanbtt23406)   : nhan_vien_id = ${nvL2_1.nhan_vien_id}  ← itL2UserId`);
  console.log(`       IT_L2 #2 (siti.rahimah)  : nhan_vien_id = ${nvL2_2.nhan_vien_id}  ← otherItL2 / wrongGroupItId`);
  console.log(`       Locked   (locked_user)   : nhan_vien_id = ${nvLocked.nhan_vien_id}\n`);

  // ── NHÂN VIÊN NGHIỆP VỤ ──
  console.log('📌  Nhân viên nghiệp vụ...');
  const depts = [
    { pb: pbSales, count: 20, prefix: 'sales' },
    { pb: pbOps, count: 12, prefix: 'ops' },
    { pb: pbPM, count: 10, prefix: 'pm' },
    { pb: pbMarketing, count: 8, prefix: 'mkt' },
    { pb: pbFinance, count: 8, prefix: 'fin' },
    { pb: pbHR, count: 6, prefix: 'hr' },
  ];
  const allRequesters = [];
  for (const dept of depts) {
    const list = [];
    for (let i = 1; i <= dept.count; i++) {
      const email = `${dept.prefix}${i}@mappacific.com`;
      const nv = await prisma.nhanVien.create({
        data: {
          phong_ban_id: dept.pb.phong_ban_id, vai_tro_id: roleRequester.vai_tro_id, nhom_ho_tro_id: null,
          email, tai_khoan: email.split('@')[0], mat_khau: defaultHash,
          ho_ten: `${dept.prefix.toUpperCase()} Staff ${i}`,
          trang_thai: true, ngay_tao: daysAgo(randomBetween(100, 500)),
        }
      });
      list.push(nv);
    }
    await prisma.phongBan.update({ where: { phong_ban_id: dept.pb.phong_ban_id }, data: { truong_phong_id: list[0].nhan_vien_id } });
    allRequesters.push(...list);
  }
  console.log(`   ✓ ${allRequesters.length} nhân viên nghiệp vụ\n`);

  // Shorthand cho requesters hay dùng
  const R = (email) => allRequesters.find(r => r.email === email);
  const sales1 = R('sales1@mappacific.com');
  const sales2 = R('sales2@mappacific.com');
  const sales3 = R('sales3@mappacific.com');
  const sales4 = R('sales4@mappacific.com');
  const sales5 = R('sales5@mappacific.com');
  const fin1 = R('fin1@mappacific.com');
  const fin2 = R('fin2@mappacific.com');
  const fin3 = R('fin3@mappacific.com');
  const pm1 = R('pm1@mappacific.com');
  const pm2 = R('pm2@mappacific.com');
  const pm3 = R('pm3@mappacific.com');
  const ops1 = R('ops1@mappacific.com');
  const ops2 = R('ops2@mappacific.com');
  const ops3 = R('ops3@mappacific.com');
  const mkt1 = R('mkt1@mappacific.com');
  const mkt2 = R('mkt2@mappacific.com');
  const hr1 = R('hr1@mappacific.com');
  const hr2 = R('hr2@mappacific.com');

  // ════════════════════════════════════════════════════════════════
  // 5. CHÍNH SÁCH SLA
  // active: CAO, TRUNG_BINH, THAP
  // inactive: dùng cho TC-SLA-008 (conflict test khi activate)
  // ════════════════════════════════════════════════════════════════
  console.log('📌  SLA policies...');
  const slaCao = await prisma.chinhSachSla.create({
    data: {
      ten_chinh_sach: 'SLA Ưu tiên Cao — Giờ hành chính',
      loai_thoi_gian: 'GIO_HANH_CHINH', muc_do_uu_tien: 'CAO',
      tg_phan_hoi: 60, tg_xu_ly: 240, trang_thai: true,
    }
  });
  const slaTrungBinh = await prisma.chinhSachSla.create({
    data: {
      ten_chinh_sach: 'SLA Ưu tiên Trung bình — Giờ hành chính',
      loai_thoi_gian: 'GIO_HANH_CHINH', muc_do_uu_tien: 'TRUNG_BINH',
      tg_phan_hoi: 240, tg_xu_ly: 1440, trang_thai: true,
    }
  });
  const slaThap = await prisma.chinhSachSla.create({
    data: {
      ten_chinh_sach: 'SLA Ưu tiên Thấp — Giờ hành chính',
      loai_thoi_gian: 'GIO_HANH_CHINH', muc_do_uu_tien: 'THAP',
      tg_phan_hoi: 480, tg_xu_ly: 2400, trang_thai: true,
    }
  });
  // inactive CAO — dùng cho TC-SLA-008: activate sẽ conflict với slaCao đang active
  const slaCaoInactive = await prisma.chinhSachSla.create({
    data: {
      ten_chinh_sach: 'SLA Ưu tiên Cao — 24/7 (inactive)',
      loai_thoi_gian: 'H24_7', muc_do_uu_tien: 'CAO',
      tg_phan_hoi: 30, tg_xu_ly: 120, trang_thai: false,
    }
  });
  console.log(`   ✓ 4 SLA policies`);
  console.log(`     Active  : Cao(id=${slaCao.chinh_sach_sla_id}), TrungBinh(id=${slaTrungBinh.chinh_sach_sla_id}), Thap(id=${slaThap.chinh_sach_sla_id})`);
  console.log(`     Inactive: CaoInactive(id=${slaCaoInactive.chinh_sach_sla_id}) ← dùng cho TC-SLA-008\n`);

  // ════════════════════════════════════════════════════════════════
  // 6. KNOWLEDGE BASE
  // Cần: nhiều DA_XUAT_BAN (KB-1..5), nhiều NHAP (KB-6..8)
  // tác giả khác nhau để test TC-KB-010 (403 sửa bài không phải của mình)
  // ════════════════════════════════════════════════════════════════
  console.log('📌  Knowledge Base...');
  const kbData = await prisma.coSoTriThuc.createManyAndReturn({
    data: [
      // id=1: DA_XUAT_BAN, tác giả nvL2_1 (vanbtt) — dùng làm kbArticleId chính
      {
        tieu_de: 'Hướng dẫn tự reset mật khẩu domain Windows',
        noi_dung: 'Bước 1: Truy cập https://password.mappacific.com\nBước 2: Nhập email công ty và xác thực OTP\nBước 3: Đặt mật khẩu mới theo quy định (tối thiểu 8 ký tự, có hoa thường số ký tự đặc biệt)\nBước 4: Đăng nhập lại và kiểm tra.',
        loai_su_co: 'account_access', the_tags: '["password","reset","windows","domain","account"]',
        tac_gia_id: nvL2_1.nhan_vien_id, trang_thai: 'DA_XUAT_BAN', quyen_xem: 'CONG_KHAI',
        luot_xem: 248, luot_huu_ich: 89, luot_khong_huu_ich: 4, ngay_tao: daysAgo(300),
      },
      // id=2: DA_XUAT_BAN, tác giả nvL2_2 (siti)
      {
        tieu_de: 'Khắc phục lỗi VPN không kết nối được',
        noi_dung: 'Nguyên nhân phổ biến: certificate hết hạn, sai profile, tường lửa block port.\nGiải pháp: 1. Kiểm tra date/time máy tính 2. Xóa profile VPN cũ, import lại 3. Liên hệ IT nếu vẫn lỗi.',
        loai_su_co: 'network', the_tags: '["vpn","network","certificate","remote"]',
        tac_gia_id: nvL2_2.nhan_vien_id, trang_thai: 'DA_XUAT_BAN', quyen_xem: 'CONG_KHAI',
        luot_xem: 193, luot_huu_ich: 61, luot_khong_huu_ich: 7, ngay_tao: daysAgo(260),
      },
      // id=3: DA_XUAT_BAN, tác giả nvL2_1
      {
        tieu_de: 'Microsoft Teams — Sửa lỗi không nghe được âm thanh',
        noi_dung: 'Kiểm tra: 1. Settings > Devices — chọn đúng thiết bị audio 2. Privacy > Microphone — bật quyền cho Teams 3. Cập nhật driver audio 4. Restart Teams hoàn toàn (Task Manager > End task).',
        loai_su_co: 'software', the_tags: '["teams","audio","microphone","microsoft365"]',
        tac_gia_id: nvL2_1.nhan_vien_id, trang_thai: 'DA_XUAT_BAN', quyen_xem: 'CONG_KHAI',
        luot_xem: 134, luot_huu_ich: 45, luot_khong_huu_ich: 3, ngay_tao: daysAgo(210),
      },
      // id=4: DA_XUAT_BAN, tác giả nvL2_2
      {
        tieu_de: 'Hướng dẫn cài đặt máy in mạng Canon IR-ADV',
        noi_dung: 'IP máy in theo tầng: Tầng 3: 192.168.1.51, Tầng 4: 192.168.1.52, Tầng 5: 192.168.1.53.\nCài driver: 1. Vào https://intranet/printer-drivers 2. Chọn đúng model 3. Chạy setup, chọn Network Installation 4. Nhập IP tương ứng.',
        loai_su_co: 'hardware', the_tags: '["printer","canon","hardware","network-printer"]',
        tac_gia_id: nvL2_2.nhan_vien_id, trang_thai: 'DA_XUAT_BAN', quyen_xem: 'CONG_KHAI',
        luot_xem: 97, luot_huu_ich: 34, luot_khong_huu_ich: 2, ngay_tao: daysAgo(185),
      },
      // id=5: DA_XUAT_BAN, tác giả nvL2_1
      {
        tieu_de: 'Quy trình yêu cầu cài phần mềm mới',
        noi_dung: 'Tất cả phần mềm cần IT phê duyệt trước khi cài.\nBước 1: Tạo ticket loại "Software Request"\nBước 2: Đính kèm business justification\nBước 3: IT kiểm tra license và security\nBước 4: IT cài và bàn giao.',
        loai_su_co: 'software', the_tags: '["policy","software","installation","approval"]',
        tac_gia_id: nvL2_1.nhan_vien_id, trang_thai: 'DA_XUAT_BAN', quyen_xem: 'CONG_KHAI',
        luot_xem: 78, luot_huu_ich: 27, luot_khong_huu_ich: 1, ngay_tao: daysAgo(160),
      },
      // id=6: DA_XUAT_BAN, tác giả nvL2_2 — thêm buffer
      {
        tieu_de: 'Hướng dẫn sử dụng SharePoint và OneDrive',
        noi_dung: 'SharePoint dùng để lưu file team, OneDrive dùng file cá nhân.\nGiới hạn upload: SharePoint 250GB/file, OneDrive 250GB/file.\nSync: cài OneDrive app, đăng nhập bằng email công ty.',
        loai_su_co: 'software', the_tags: '["sharepoint","onedrive","microsoft365","storage"]',
        tac_gia_id: nvL2_2.nhan_vien_id, trang_thai: 'DA_XUAT_BAN', quyen_xem: 'CONG_KHAI',
        luot_xem: 62, luot_huu_ich: 21, luot_khong_huu_ich: 2, ngay_tao: daysAgo(140),
      },
      // id=7: DA_XUAT_BAN NOI_BO — chỉ IT thấy
      {
        tieu_de: 'Checklist bàn giao laptop cho nhân viên mới',
        noi_dung: 'Checklist nội bộ IT: 1. Format và cài Windows 11 2. Join domain 3. Cài Office 365 4. Cài antivirus 5. Test VPN 6. Bàn giao kèm biên bản.',
        loai_su_co: 'hardware', the_tags: '["onboarding","laptop","internal","checklist"]',
        tac_gia_id: nvL2_1.nhan_vien_id, trang_thai: 'DA_XUAT_BAN', quyen_xem: 'NOI_BO',
        luot_xem: 14, luot_huu_ich: 8, luot_khong_huu_ich: 0, ngay_tao: daysAgo(120),
      },
      // id=8: NHAP, tác giả nvL2_2 — dùng làm draftKbId
      {
        tieu_de: '[DRAFT] Hướng dẫn thiết lập MFA cho tài khoản M365',
        noi_dung: 'Đang soạn thảo — chưa hoàn thiện.',
        loai_su_co: 'security', the_tags: '["mfa","security","microsoft365","draft"]',
        tac_gia_id: nvL2_2.nhan_vien_id, trang_thai: 'NHAP', quyen_xem: 'NOI_BO',
        luot_xem: 0, luot_huu_ich: 0, luot_khong_huu_ich: 0, ngay_tao: daysAgo(15),
      },
      // id=9: NHAP, tác giả nvL2_1 — buffer thêm
      {
        tieu_de: '[DRAFT] Quy trình xử lý sự cố mất điện văn phòng',
        noi_dung: 'Đang soạn thảo.',
        loai_su_co: 'hardware', the_tags: '["power","emergency","draft"]',
        tac_gia_id: nvL2_1.nhan_vien_id, trang_thai: 'NHAP', quyen_xem: 'NOI_BO',
        luot_xem: 0, luot_huu_ich: 0, luot_khong_huu_ich: 0, ngay_tao: daysAgo(5),
      },
      // id=10: NHAP, tác giả nvL2_2 — buffer
      {
        tieu_de: '[DRAFT] Hướng dẫn backup dữ liệu cá nhân',
        noi_dung: 'Đang soạn thảo.',
        loai_su_co: 'software', the_tags: '["backup","data","draft"]',
        tac_gia_id: nvL2_2.nhan_vien_id, trang_thai: 'NHAP', quyen_xem: 'NOI_BO',
        luot_xem: 0, luot_huu_ich: 0, luot_khong_huu_ich: 0, ngay_tao: daysAgo(3),
      },
    ],
  });
  console.log(`   ✓ ${kbData.length} bài viết KB`);
  console.log(`     DA_XUAT_BAN CONG_KHAI: id 1-6`);
  console.log(`     DA_XUAT_BAN NOI_BO   : id 7  ← draftKbId (visible IT only)`);
  console.log(`     NHAP                 : id 8-10 ← draftKbId có thể dùng id 8\n`);

  // ════════════════════════════════════════════════════════════════
  // 7. TICKETS
  // Cần bao phủ:
  //   - DA_DONG × nhiều (closedTicketId, usedReviewToken, otherUserTicketId)
  //   - DA_GIAI_QUYET trong 48h × 3 (resolvedTicketId, noReviewTicketId, reviewToken source)
  //   - DA_GIAI_QUYET > 48h × 1 (oldResolvedTicketId)
  //   - DANG_GIAI_QUYET × nhiều (ticketId chính, L2 ticket, otherUserTicket đang mở)
  //   - MOI_TAO × vài cái
  //   - Có file đính kèm (closedTicketAttachmentId)
  //   - Có so_lan_mo_lai = 1, 2 (reopen history)
  //   - Có escalate history (L1 → L2)
  // ════════════════════════════════════════════════════════════════
  console.log('📌  Tickets...');

  async function sla(tx, tid, policyId, loai, start, deadline, viPham = false, dat = null) {
    return tx.slaTheoDoi.create({
      data: {
        phieu_ho_tro_id: tid, chinh_sach_sla_id: policyId,
        loai_sla: loai,
        trang_thai_muc_tieu: dat ? 'DA_GIAI_QUYET' : 'TIEP_NHAN',
        thoi_diem_bat_dau: start, han_chot: deadline,
        thoi_diem_dat: dat, da_vi_pham: viPham,
        duoc_mien_tru: false, da_gui_nhac_nho: viPham,
      }
    });
  }

  async function log(tx, tid, uid, action, newVal = null, oldVal = null, time = new Date()) {
    return tx.lichSuPhieu.create({
      data: {
        phieu_ho_tro_id: tid, nguoi_thuc_hien_id: uid,
        hanh_dong: action, gia_tri_moi: newVal, gia_tri_cu: oldVal, ngay_thuc_hien: time,
      }
    });
  }

  async function comment(tx, tid, uid, content, type = 'THUONG', visibility = 'CONG_KHAI', time = new Date()) {
    return tx.binhLuan.create({
      data: {
        phieu_ho_tro_id: tid, nguoi_gui_id: uid,
        noi_dung: content, loai_binh_luan: type, quyen_xem: visibility, ngay_tao: time,
      }
    });
  }

  // ────────────────────────────────────────────────────────────────
  // T01 (SW-2025-0101) — DA_DONG, sales1, L1, nhanh, đánh giá 5 sao
  // Dùng: closedTicketId buffer, existingEmail test
  // ────────────────────────────────────────────────────────────────
  const c01 = daysAgo(60);
  await prisma.$transaction(async (tx) => {
    const t = await tx.phieuHoTro.create({
      data: {
        ma_phieu: mp(101), tieu_de: 'Không đăng nhập được tài khoản Windows sau kỳ nghỉ lễ',
        mo_ta_chi_tiet: 'Tài khoản báo lỗi "Account locked" khi đăng nhập buổi sáng.',
        muc_do_anh_huong: 'CAO', muc_do_khan_cap: 'CAO', muc_do_uu_tien: 'CAO',
        trang_thai: 'DA_DONG', nguoi_tao_id: sales1.nhan_vien_id,
        nguoi_ho_tro_id: nvL1_1.nhan_vien_id, nhom_xu_ly_id: nhomL1.nhom_ho_tro_id,
        so_lan_mo_lai: 0, so_lan_thu_lai_L1: 1, so_lan_thu_lai_L2: 0, ngay_tao: c01,
      }
    });
    const c01r = hoursAfter(c01, 0.5), c01d = hoursAfter(c01, 2);
    await log(tx, t.phieu_ho_tro_id, sales1.nhan_vien_id, 'CREATED', null, null, c01);
    await log(tx, t.phieu_ho_tro_id, nvL1_1.nhan_vien_id, 'STATUS_CHANGED', 'DANG_GIAI_QUYET', 'MOI_TAO', c01r);
    await log(tx, t.phieu_ho_tro_id, nvL1_1.nhan_vien_id, 'STATUS_CHANGED', 'DA_GIAI_QUYET', 'DANG_GIAI_QUYET', c01d);
    await log(tx, t.phieu_ho_tro_id, sales1.nhan_vien_id, 'STATUS_CHANGED', 'DA_DONG', 'DA_GIAI_QUYET', hoursAfter(c01d, 3));
    await comment(tx, t.phieu_ho_tro_id, nvL1_1.nhan_vien_id, 'Đã unlock tài khoản và reset password. Vui lòng đổi mật khẩu ngay khi đăng nhập.', 'KET_QUA', 'CONG_KHAI', c01d);
    await comment(tx, t.phieu_ho_tro_id, sales1.nhan_vien_id, 'Cảm ơn bạn, đã vào được rồi!', 'THUONG', 'CONG_KHAI', hoursAfter(c01d, 1));
    await sla(tx, t.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'PHAN_HOI', c01, hoursAfter(c01, 1), false, c01r);
    await sla(tx, t.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'XU_LY', c01, hoursAfter(c01, 4), false, c01d);
    await tx.phieuDanhGia.create({
      data: {
        phieu_ho_tro_id: t.phieu_ho_tro_id, nguoi_danh_gia_id: sales1.nhan_vien_id,
        token_xac_thuc: 'rv_token_t01_used', hai_long: true, so_sao: 5,
        nhan_xet: 'Xử lý rất nhanh, cảm ơn Alicia!', ngay_danh_gia: hoursAfter(c01d, 3),
      }
    });
  });

  // ────────────────────────────────────────────────────────────────
  // T02 (SW-2025-0102) — DA_DONG, fin1, L1, reopen 1 lần
  // ────────────────────────────────────────────────────────────────
  const c02 = daysAgo(45);
  await prisma.$transaction(async (tx) => {
    const t = await tx.phieuHoTro.create({
      data: {
        ma_phieu: mp(102), tieu_de: 'Máy in tầng 3 không in được tài liệu',
        mo_ta_chi_tiet: 'Lệnh in gửi đi nhưng không có gì ra khỏi máy in.',
        muc_do_anh_huong: 'TRUNG_BINH', muc_do_khan_cap: 'TRUNG_BINH', muc_do_uu_tien: 'TRUNG_BINH',
        trang_thai: 'DA_DONG', nguoi_tao_id: fin1.nhan_vien_id,
        nguoi_ho_tro_id: nvL1_2.nhan_vien_id, nhom_xu_ly_id: nhomL1.nhom_ho_tro_id,
        so_lan_mo_lai: 1, so_lan_thu_lai_L1: 2, so_lan_thu_lai_L2: 0, ngay_tao: c02,
      }
    });
    const r1 = hoursAfter(c02, 3), d1 = hoursAfter(c02, 6);
    const re = hoursAfter(d1, 5), d2 = hoursAfter(re, 4);
    await log(tx, t.phieu_ho_tro_id, fin1.nhan_vien_id, 'CREATED', null, null, c02);
    await log(tx, t.phieu_ho_tro_id, nvL1_2.nhan_vien_id, 'STATUS_CHANGED', 'DANG_GIAI_QUYET', 'MOI_TAO', r1);
    await log(tx, t.phieu_ho_tro_id, nvL1_2.nhan_vien_id, 'STATUS_CHANGED', 'DA_GIAI_QUYET', 'DANG_GIAI_QUYET', d1);
    await log(tx, t.phieu_ho_tro_id, nvManager.nhan_vien_id, 'REOPENED', 'DANG_GIAI_QUYET', 'DA_GIAI_QUYET', re);
    await log(tx, t.phieu_ho_tro_id, nvL1_2.nhan_vien_id, 'STATUS_CHANGED', 'DA_GIAI_QUYET', 'DANG_GIAI_QUYET', d2);
    await log(tx, t.phieu_ho_tro_id, fin1.nhan_vien_id, 'STATUS_CHANGED', 'DA_DONG', 'DA_GIAI_QUYET', hoursAfter(d2, 2));
    await comment(tx, t.phieu_ho_tro_id, nvL1_2.nhan_vien_id, 'Đã xóa driver cũ và cài lại.', 'THUONG', 'CONG_KHAI', r1);
    await comment(tx, t.phieu_ho_tro_id, fin1.nhan_vien_id, 'Vẫn chưa in được, sáng nay thử lại vẫn lỗi.', 'THUONG', 'CONG_KHAI', hoursAfter(d1, 1));
    await comment(tx, t.phieu_ho_tro_id, nvL1_2.nhan_vien_id, 'Đã xuống tận nơi kiểm tra, sửa lại IP và test thành công.', 'KET_QUA', 'CONG_KHAI', hoursAfter(re, 2));
    await sla(tx, t.phieu_ho_tro_id, slaTrungBinh.chinh_sach_sla_id, 'PHAN_HOI', c02, hoursAfter(c02, 4), false, r1);
    await sla(tx, t.phieu_ho_tro_id, slaTrungBinh.chinh_sach_sla_id, 'XU_LY', c02, hoursAfter(c02, 24), false, d2);
    await tx.phieuDanhGia.create({
      data: {
        phieu_ho_tro_id: t.phieu_ho_tro_id, nguoi_danh_gia_id: fin1.nhan_vien_id,
        token_xac_thuc: 'rv_token_t02_used', hai_long: true, so_sao: 4,
        nhan_xet: 'Lần đầu chưa xử lý hết, nhưng lần sau giải quyết ổn.', ngay_danh_gia: hoursAfter(d2, 2),
      }
    });
  });

  // ────────────────────────────────────────────────────────────────
  // T03 (SW-2025-0103) — DA_DONG, pm1, escalate L1→L2
  // ────────────────────────────────────────────────────────────────
  const c03 = daysAgo(35);
  await prisma.$transaction(async (tx) => {
    const t = await tx.phieuHoTro.create({
      data: {
        ma_phieu: mp(103), tieu_de: 'VPN không kết nối được từ nhà',
        mo_ta_chi_tiet: 'Thử nhiều lần vẫn báo "Authentication failed".',
        muc_do_anh_huong: 'CAO', muc_do_khan_cap: 'CAO', muc_do_uu_tien: 'CAO',
        trang_thai: 'DA_DONG', nguoi_tao_id: pm1.nhan_vien_id,
        nguoi_ho_tro_id: nvL2_2.nhan_vien_id, nhom_xu_ly_id: nhomL2.nhom_ho_tro_id,
        so_lan_mo_lai: 0, so_lan_thu_lai_L1: 1, so_lan_thu_lai_L2: 1, ngay_tao: c03,
      }
    });
    const r1 = hoursAfter(c03, 1), esc = hoursAfter(c03, 5), d = hoursAfter(c03, 9);
    await log(tx, t.phieu_ho_tro_id, pm1.nhan_vien_id, 'CREATED', null, null, c03);
    await log(tx, t.phieu_ho_tro_id, nvL1_3.nhan_vien_id, 'STATUS_CHANGED', 'DANG_GIAI_QUYET', 'MOI_TAO', r1);
    await log(tx, t.phieu_ho_tro_id, nvL1_3.nhan_vien_id, 'ESCALATED', 'L2', 'L1', esc);
    await log(tx, t.phieu_ho_tro_id, nvL2_2.nhan_vien_id, 'STATUS_CHANGED', 'DA_GIAI_QUYET', 'DANG_GIAI_QUYET', d);
    await log(tx, t.phieu_ho_tro_id, pm1.nhan_vien_id, 'STATUS_CHANGED', 'DA_DONG', 'DA_GIAI_QUYET', hoursAfter(d, 2));
    await comment(tx, t.phieu_ho_tro_id, nvL1_3.nhan_vien_id, 'Chuyển L2 do liên quan certificate hạ tầng.', 'CHUYEN_CAP', 'NOI_BO', esc);
    await comment(tx, t.phieu_ho_tro_id, nvL2_2.nhan_vien_id, 'VPN certificate hết hạn, đã renew và deploy lại.', 'KET_QUA', 'CONG_KHAI', d);
    await sla(tx, t.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'PHAN_HOI', c03, hoursAfter(c03, 1), false, r1);
    await sla(tx, t.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'XU_LY', c03, hoursAfter(c03, 4), true, d);
    await tx.phieuDanhGia.create({
      data: {
        phieu_ho_tro_id: t.phieu_ho_tro_id, nguoi_danh_gia_id: pm1.nhan_vien_id,
        token_xac_thuc: 'rv_token_t03_used', hai_long: true, so_sao: 5,
        nhan_xet: 'Siti xử lý rất chuyên nghiệp!', ngay_danh_gia: hoursAfter(d, 2),
      }
    });
  });

  // ────────────────────────────────────────────────────────────────
  // T04 (SW-2025-0104) — DA_DONG, fin2, L2, Xero timeout
  // ────────────────────────────────────────────────────────────────
  const c04 = daysAgo(30);
  await prisma.$transaction(async (tx) => {
    const t = await tx.phieuHoTro.create({
      data: {
        ma_phieu: mp(104), tieu_de: 'Xero báo lỗi "Connection timeout" khi xuất báo cáo',
        mo_ta_chi_tiet: 'Mỗi lần xuất báo cáo cuối tháng đều bị timeout sau ~3 phút.',
        muc_do_anh_huong: 'CAO', muc_do_khan_cap: 'CAO', muc_do_uu_tien: 'CAO',
        trang_thai: 'DA_DONG', nguoi_tao_id: fin2.nhan_vien_id,
        nguoi_ho_tro_id: nvL2_1.nhan_vien_id, nhom_xu_ly_id: nhomL2.nhom_ho_tro_id,
        so_lan_mo_lai: 0, so_lan_thu_lai_L1: 1, so_lan_thu_lai_L2: 1, ngay_tao: c04,
      }
    });
    const r1 = hoursAfter(c04, 1), esc = hoursAfter(c04, 6), d = hoursAfter(c04, 14);
    await log(tx, t.phieu_ho_tro_id, fin2.nhan_vien_id, 'CREATED', null, null, c04);
    await log(tx, t.phieu_ho_tro_id, nvL1_3.nhan_vien_id, 'STATUS_CHANGED', 'DANG_GIAI_QUYET', 'MOI_TAO', r1);
    await log(tx, t.phieu_ho_tro_id, nvL1_3.nhan_vien_id, 'ESCALATED', 'L2', 'L1', esc);
    await log(tx, t.phieu_ho_tro_id, nvL2_1.nhan_vien_id, 'STATUS_CHANGED', 'DA_GIAI_QUYET', 'DANG_GIAI_QUYET', d);
    await log(tx, t.phieu_ho_tro_id, fin2.nhan_vien_id, 'STATUS_CHANGED', 'DA_DONG', 'DA_GIAI_QUYET', hoursAfter(d, 4));
    await comment(tx, t.phieu_ho_tro_id, nvL2_1.nhan_vien_id, 'Đã tăng timeout và tối ưu query DB Xero.', 'KET_QUA', 'CONG_KHAI', d);
    await sla(tx, t.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'PHAN_HOI', c04, hoursAfter(c04, 1), false, r1);
    await sla(tx, t.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'XU_LY', c04, hoursAfter(c04, 4), true, d);
    await tx.phieuDanhGia.create({
      data: {
        phieu_ho_tro_id: t.phieu_ho_tro_id, nguoi_danh_gia_id: fin2.nhan_vien_id,
        token_xac_thuc: 'rv_token_t04_used', hai_long: true, so_sao: 4,
        nhan_xet: 'Hơi lâu nhưng cuối cùng giải quyết được.', ngay_danh_gia: hoursAfter(d, 4),
      }
    });
  });

  // ────────────────────────────────────────────────────────────────
  // T05 (SW-2025-0105) — DA_DONG, ops1, L1, có file đính kèm
  // → closedTicketId chính, closedTicketAttachmentId
  // ────────────────────────────────────────────────────────────────
  const c05 = daysAgo(25);
  let t05id;
  let att05id;
  await prisma.$transaction(async (tx) => {
    const t = await tx.phieuHoTro.create({
      data: {
        ma_phieu: mp(105), tieu_de: 'Màn hình laptop Dell XPS bị sọc ngang',
        mo_ta_chi_tiet: 'Màn hình xuất hiện sọc ngang màu xanh từ sáng, không làm việc được.',
        muc_do_anh_huong: 'CAO', muc_do_khan_cap: 'CAO', muc_do_uu_tien: 'CAO',
        trang_thai: 'DA_DONG', nguoi_tao_id: ops1.nhan_vien_id,
        nguoi_ho_tro_id: nvL1_1.nhan_vien_id, nhom_xu_ly_id: nhomL1.nhom_ho_tro_id,
        so_lan_mo_lai: 0, so_lan_thu_lai_L1: 1, so_lan_thu_lai_L2: 0, ngay_tao: c05,
      }
    });
    t05id = t.phieu_ho_tro_id;
    const r1 = hoursAfter(c05, 0.5), d = hoursAfter(c05, 3);
    await log(tx, t.phieu_ho_tro_id, ops1.nhan_vien_id, 'CREATED', null, null, c05);
    await log(tx, t.phieu_ho_tro_id, nvL1_1.nhan_vien_id, 'STATUS_CHANGED', 'DANG_GIAI_QUYET', 'MOI_TAO', r1);
    await log(tx, t.phieu_ho_tro_id, nvL1_1.nhan_vien_id, 'STATUS_CHANGED', 'DA_GIAI_QUYET', 'DANG_GIAI_QUYET', d);
    await log(tx, t.phieu_ho_tro_id, ops1.nhan_vien_id, 'STATUS_CHANGED', 'DA_DONG', 'DA_GIAI_QUYET', hoursAfter(d, 2));
    await comment(tx, t.phieu_ho_tro_id, nvL1_1.nhan_vien_id, 'Đã cập nhật driver màn hình, vấn đề đã được giải quyết.', 'KET_QUA', 'CONG_KHAI', d);
    // File đính kèm
    const att = await tx.tepDinhKem.create({
      data: {
        ten_tep: 'screenshot_man_hinh_loi.jpg',
        duong_dan_file: '/uploads/attachments/uuid-a1b2c3d4-screenshot.jpg',
        dinh_dang: 'jpg', dung_luong_kb: 284,
        phieu_ho_tro_id: t.phieu_ho_tro_id, ngay_tao: c05,
      }
    });
    att05id = att.tep_dinh_kem_id;
    await sla(tx, t.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'PHAN_HOI', c05, hoursAfter(c05, 1), false, r1);
    await sla(tx, t.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'XU_LY', c05, hoursAfter(c05, 4), false, d);
    await tx.phieuDanhGia.create({
      data: {
        phieu_ho_tro_id: t.phieu_ho_tro_id, nguoi_danh_gia_id: ops1.nhan_vien_id,
        token_xac_thuc: 'rv_token_t05_used', hai_long: true, so_sao: 5,
        nhan_xet: 'Rất nhanh, rất chuyên nghiệp!', ngay_danh_gia: hoursAfter(d, 2),
      }
    });
  });

  // ────────────────────────────────────────────────────────────────
  // T06 (SW-2025-0106) — DA_DONG, mkt1, L1, không hài lòng → reopen → đóng lại
  // ────────────────────────────────────────────────────────────────
  const c06 = daysAgo(20);
  await prisma.$transaction(async (tx) => {
    const t = await tx.phieuHoTro.create({
      data: {
        ma_phieu: mp(106), tieu_de: 'Outlook không nhận được email từ khách hàng ngoài công ty',
        mo_ta_chi_tiet: 'Email gửi đến từ địa chỉ gmail và yahoo đều không thấy trong hộp thư.',
        muc_do_anh_huong: 'CAO', muc_do_khan_cap: 'CAO', muc_do_uu_tien: 'CAO',
        trang_thai: 'DA_DONG', nguoi_tao_id: mkt1.nhan_vien_id,
        nguoi_ho_tro_id: nvL1_1.nhan_vien_id, nhom_xu_ly_id: nhomL1.nhom_ho_tro_id,
        so_lan_mo_lai: 1, so_lan_thu_lai_L1: 2, so_lan_thu_lai_L2: 0, ngay_tao: c06,
      }
    });
    const r1 = hoursAfter(c06, 2), d1 = hoursAfter(c06, 5);
    const re = hoursAfter(d1, 4), d2 = hoursAfter(re, 3);
    await log(tx, t.phieu_ho_tro_id, mkt1.nhan_vien_id, 'CREATED', null, null, c06);
    await log(tx, t.phieu_ho_tro_id, nvL1_1.nhan_vien_id, 'STATUS_CHANGED', 'DANG_GIAI_QUYET', 'MOI_TAO', r1);
    await log(tx, t.phieu_ho_tro_id, nvL1_1.nhan_vien_id, 'STATUS_CHANGED', 'DA_GIAI_QUYET', 'DANG_GIAI_QUYET', d1);
    await log(tx, t.phieu_ho_tro_id, nvManager.nhan_vien_id, 'REOPENED', 'DANG_GIAI_QUYET', 'DA_GIAI_QUYET', re);
    await log(tx, t.phieu_ho_tro_id, nvL1_1.nhan_vien_id, 'STATUS_CHANGED', 'DA_GIAI_QUYET', 'DANG_GIAI_QUYET', d2);
    await log(tx, t.phieu_ho_tro_id, mkt1.nhan_vien_id, 'STATUS_CHANGED', 'DA_DONG', 'DA_GIAI_QUYET', hoursAfter(d2, 2));
    await comment(tx, t.phieu_ho_tro_id, nvL1_1.nhan_vien_id, 'Đã kiểm tra mail flow, chưa thấy vấn đề.', 'THUONG', 'CONG_KHAI', r1);
    await comment(tx, t.phieu_ho_tro_id, mkt1.nhan_vien_id, 'Vẫn không nhận được email, cần kiểm tra lại.', 'THUONG', 'CONG_KHAI', hoursAfter(d1, 1));
    await comment(tx, t.phieu_ho_tro_id, nvL1_1.nhan_vien_id, 'Đã tìm ra lỗi spam filter, đã whitelist domain. Vui lòng test lại.', 'KET_QUA', 'CONG_KHAI', d2);
    await sla(tx, t.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'PHAN_HOI', c06, hoursAfter(c06, 1), false, r1);
    await sla(tx, t.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'XU_LY', c06, hoursAfter(c06, 4), false, d2);
    await tx.phieuDanhGia.create({
      data: {
        phieu_ho_tro_id: t.phieu_ho_tro_id, nguoi_danh_gia_id: mkt1.nhan_vien_id,
        token_xac_thuc: 'rv_token_t06_used', hai_long: true, so_sao: 4,
        nhan_xet: 'Lần sau giải quyết nhanh hơn nhé.', ngay_danh_gia: hoursAfter(d2, 2),
      }
    });
  });

  // ────────────────────────────────────────────────────────────────
  // T07 (SW-2025-0107) — DA_GIAI_QUYET > 48h
  // → oldResolvedTicketId — test reopen expired (409)
  // ────────────────────────────────────────────────────────────────
  const c07 = daysAgo(10);
  let t07id;
  await prisma.$transaction(async (tx) => {
    const t = await tx.phieuHoTro.create({
      data: {
        ma_phieu: mp(107), tieu_de: 'Toàn bộ máy tính phòng Sales tầng 3 mất mạng',
        mo_ta_chi_tiet: 'Tất cả máy ở tầng 3 đột ngột mất kết nối mạng lúc 9h sáng.',
        muc_do_anh_huong: 'CAO', muc_do_khan_cap: 'CAO', muc_do_uu_tien: 'CAO',
        trang_thai: 'DA_GIAI_QUYET', nguoi_tao_id: sales2.nhan_vien_id,
        nguoi_ho_tro_id: nvL1_2.nhan_vien_id, nhom_xu_ly_id: nhomL1.nhom_ho_tro_id,
        so_lan_mo_lai: 0, so_lan_thu_lai_L1: 1, so_lan_thu_lai_L2: 0, ngay_tao: c07,
      }
    });
    t07id = t.phieu_ho_tro_id;
    const r1 = hoursAfter(c07, 0.75), d = hoursAfter(c07, 4);
    await log(tx, t.phieu_ho_tro_id, sales2.nhan_vien_id, 'CREATED', null, null, c07);
    await log(tx, t.phieu_ho_tro_id, nvL1_2.nhan_vien_id, 'STATUS_CHANGED', 'DANG_GIAI_QUYET', 'MOI_TAO', r1);
    await log(tx, t.phieu_ho_tro_id, nvL1_2.nhan_vien_id, 'STATUS_CHANGED', 'DA_GIAI_QUYET', 'DANG_GIAI_QUYET', d);
    await comment(tx, t.phieu_ho_tro_id, nvL1_2.nhan_vien_id, 'Switch loop đã được xử lý, spanning-tree đã bật.', 'KET_QUA', 'CONG_KHAI', d);
    await sla(tx, t.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'PHAN_HOI', c07, hoursAfter(c07, 1), false, r1);
    await sla(tx, t.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'XU_LY', c07, hoursAfter(c07, 4), false, d);
    // Chưa có đánh giá → pending review token
    await tx.phieuDanhGia.create({
      data: {
        phieu_ho_tro_id: t.phieu_ho_tro_id, nguoi_danh_gia_id: sales2.nhan_vien_id,
        token_xac_thuc: 'rv_token_t07_pending', hai_long: false, so_sao: 0,
        nhan_xet: null, ngay_danh_gia: d,
      }
    });
  });

  // ────────────────────────────────────────────────────────────────
  // T08 (SW-2025-0108) — DA_GIAI_QUYET trong 48h, có pending review token
  // → resolvedTicketId chính, reviewToken = rv_token_t08_pending
  // ────────────────────────────────────────────────────────────────
  const c08 = daysAgo(1);
  let t08id;
  await prisma.$transaction(async (tx) => {
    const t = await tx.phieuHoTro.create({
      data: {
        ma_phieu: mp(108), tieu_de: 'SharePoint không upload được file lớn hơn 500MB',
        mo_ta_chi_tiet: 'Mỗi lần upload file video training đều báo lỗi 413 Request Entity Too Large.',
        muc_do_anh_huong: 'TRUNG_BINH', muc_do_khan_cap: 'TRUNG_BINH', muc_do_uu_tien: 'TRUNG_BINH',
        trang_thai: 'DA_GIAI_QUYET', nguoi_tao_id: mkt2.nhan_vien_id,
        nguoi_ho_tro_id: nvL2_1.nhan_vien_id, nhom_xu_ly_id: nhomL2.nhom_ho_tro_id,
        so_lan_mo_lai: 0, so_lan_thu_lai_L1: 1, so_lan_thu_lai_L2: 1, ngay_tao: c08,
      }
    });
    t08id = t.phieu_ho_tro_id;
    const r1 = hoursAfter(c08, 0.75), esc = hoursAfter(c08, 4), d = hoursAfter(c08, 8);
    await log(tx, t.phieu_ho_tro_id, mkt2.nhan_vien_id, 'CREATED', null, null, c08);
    await log(tx, t.phieu_ho_tro_id, nvL1_1.nhan_vien_id, 'STATUS_CHANGED', 'DANG_GIAI_QUYET', 'MOI_TAO', r1);
    await log(tx, t.phieu_ho_tro_id, nvL1_1.nhan_vien_id, 'ESCALATED', 'L2', 'L1', esc);
    await log(tx, t.phieu_ho_tro_id, nvL2_1.nhan_vien_id, 'STATUS_CHANGED', 'DA_GIAI_QUYET', 'DANG_GIAI_QUYET', d);
    await comment(tx, t.phieu_ho_tro_id, nvL1_1.nhan_vien_id, 'Cần L2 tăng giới hạn upload SharePoint.', 'CHUYEN_CAP', 'NOI_BO', esc);
    await comment(tx, t.phieu_ho_tro_id, nvL2_1.nhan_vien_id, 'Đã cấu hình lại IIS request limit lên 2GB, vui lòng thử lại.', 'KET_QUA', 'CONG_KHAI', d);
    await sla(tx, t.phieu_ho_tro_id, slaTrungBinh.chinh_sach_sla_id, 'PHAN_HOI', c08, hoursAfter(c08, 4), false, r1);
    await sla(tx, t.phieu_ho_tro_id, slaTrungBinh.chinh_sach_sla_id, 'XU_LY', c08, hoursAfter(c08, 24), false, d);
    // Pending review token — đây là resolvedTicketId chính
    await tx.phieuDanhGia.create({
      data: {
        phieu_ho_tro_id: t.phieu_ho_tro_id, nguoi_danh_gia_id: mkt2.nhan_vien_id,
        token_xac_thuc: 'rv_token_t08_pending', hai_long: false, so_sao: 0,
        nhan_xet: null, ngay_danh_gia: d,
      }
    });
  });

  // ────────────────────────────────────────────────────────────────
  // T09 (SW-2025-0109) — DA_GIAI_QUYET trong 48h, CHƯA CÓ đánh giá
  // → noReviewTicketId (test TC-REV-009: 404 chưa có đánh giá)
  // ────────────────────────────────────────────────────────────────
  const c09 = hoursAfter(new Date(), -20);
  let t09id;
  await prisma.$transaction(async (tx) => {
    const t = await tx.phieuHoTro.create({
      data: {
        ma_phieu: mp(109), tieu_de: 'Không kết nối được máy chiếu qua HDMI phòng họp B',
        mo_ta_chi_tiet: 'Cắm dây HDMI nhưng màn hình vẫn không nhận tín hiệu.',
        muc_do_anh_huong: 'TRUNG_BINH', muc_do_khan_cap: 'TRUNG_BINH', muc_do_uu_tien: 'TRUNG_BINH',
        trang_thai: 'DA_GIAI_QUYET', nguoi_tao_id: pm2.nhan_vien_id,
        nguoi_ho_tro_id: nvL1_3.nhan_vien_id, nhom_xu_ly_id: nhomL1.nhom_ho_tro_id,
        so_lan_mo_lai: 0, so_lan_thu_lai_L1: 1, so_lan_thu_lai_L2: 0, ngay_tao: c09,
      }
    });
    t09id = t.phieu_ho_tro_id;
    const r1 = hoursAfter(c09, 1), d = hoursAfter(c09, 3);
    await log(tx, t.phieu_ho_tro_id, pm2.nhan_vien_id, 'CREATED', null, null, c09);
    await log(tx, t.phieu_ho_tro_id, nvL1_3.nhan_vien_id, 'STATUS_CHANGED', 'DANG_GIAI_QUYET', 'MOI_TAO', r1);
    await log(tx, t.phieu_ho_tro_id, nvL1_3.nhan_vien_id, 'STATUS_CHANGED', 'DA_GIAI_QUYET', 'DANG_GIAI_QUYET', d);
    await comment(tx, t.phieu_ho_tro_id, nvL1_3.nhan_vien_id, 'Đã thay cáp HDMI mới, kết nối bình thường.', 'KET_QUA', 'CONG_KHAI', d);
    await sla(tx, t.phieu_ho_tro_id, slaTrungBinh.chinh_sach_sla_id, 'PHAN_HOI', c09, hoursAfter(c09, 4), false, r1);
    await sla(tx, t.phieu_ho_tro_id, slaTrungBinh.chinh_sach_sla_id, 'XU_LY', c09, hoursAfter(c09, 24), false, d);
    // KHÔNG tạo PhieuDanhGia → noReviewTicketId
  });

  // ────────────────────────────────────────────────────────────────
  // T10 (SW-2025-0110) — DANG_GIAI_QUYET, ops2, L1 (huyentld)
  // → ticketId chính để test workflow: comment, history, assign, SLA
  //   nguoi_ho_tro = nvL1_1 (huyentld23406) → itL1Token
  // ────────────────────────────────────────────────────────────────
  const c10 = daysAgo(2);
  let t10id;
  await prisma.$transaction(async (tx) => {
    const t = await tx.phieuHoTro.create({
      data: {
        ma_phieu: mp(110), tieu_de: 'Outlook không đồng bộ được email sau khi đổi mật khẩu',
        mo_ta_chi_tiet: 'Sau khi đổi mật khẩu domain, Outlook liên tục yêu cầu nhập lại thông tin đăng nhập.',
        muc_do_anh_huong: 'CAO', muc_do_khan_cap: 'CAO', muc_do_uu_tien: 'CAO',
        trang_thai: 'DANG_GIAI_QUYET', nguoi_tao_id: ops2.nhan_vien_id,
        nguoi_ho_tro_id: nvL1_1.nhan_vien_id, nhom_xu_ly_id: nhomL1.nhom_ho_tro_id,
        so_lan_mo_lai: 0, so_lan_thu_lai_L1: 1, so_lan_thu_lai_L2: 0, ngay_tao: c10,
      }
    });
    t10id = t.phieu_ho_tro_id;
    const r1 = hoursAfter(c10, 0.5);
    await log(tx, t.phieu_ho_tro_id, ops2.nhan_vien_id, 'CREATED', null, null, c10);
    await log(tx, t.phieu_ho_tro_id, nvL1_1.nhan_vien_id, 'STATUS_CHANGED', 'DANG_GIAI_QUYET', 'MOI_TAO', r1);
    await comment(tx, t.phieu_ho_tro_id, nvL1_1.nhan_vien_id, 'Đang kiểm tra credential cache của Outlook.', 'THUONG', 'CONG_KHAI', r1);
    await comment(tx, t.phieu_ho_tro_id, nvL1_1.nhan_vien_id, 'Ghi chú nội bộ: cần xóa cached credential trong Credential Manager.', 'THUONG', 'NOI_BO', hoursAfter(r1, 0.5));
    // File đính kèm trên ticket đang mở
    const att = await tx.tepDinhKem.create({
      data: {
        ten_tep: 'error_outlook_screenshot.png',
        duong_dan_file: '/uploads/attachments/uuid-b2c3d4e5-outlook.png',
        dinh_dang: 'png', dung_luong_kb: 156,
        phieu_ho_tro_id: t.phieu_ho_tro_id, ngay_tao: c10,
      }
    });
    await sla(tx, t.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'PHAN_HOI', c10, hoursAfter(c10, 1), false, r1);
    await sla(tx, t.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'XU_LY', c10, hoursAfter(c10, 4), false, null);
  });

  // ────────────────────────────────────────────────────────────────
  // T11 (SW-2025-0111) — DANG_GIAI_QUYET, nhóm L2
  // → dùng để test comment L2, internal note
  //   nguoi_ho_tro = nvL2_1 (vanbtt23406)
  // ────────────────────────────────────────────────────────────────
  const c11 = daysAgo(3);
  let t11id;
  await prisma.$transaction(async (tx) => {
    const t = await tx.phieuHoTro.create({
      data: {
        ma_phieu: mp(111), tieu_de: 'Server backup chạy chậm, ảnh hưởng giờ làm việc',
        mo_ta_chi_tiet: 'Backup job chạy lúc 2h nhưng kéo dài đến 10h sáng làm chậm toàn hệ thống.',
        muc_do_anh_huong: 'CAO', muc_do_khan_cap: 'TRUNG_BINH', muc_do_uu_tien: 'TRUNG_BINH',
        trang_thai: 'DANG_GIAI_QUYET', nguoi_tao_id: ops3.nhan_vien_id,
        nguoi_ho_tro_id: nvL2_1.nhan_vien_id, nhom_xu_ly_id: nhomL2.nhom_ho_tro_id,
        so_lan_mo_lai: 0, so_lan_thu_lai_L1: 1, so_lan_thu_lai_L2: 1, ngay_tao: c11,
      }
    });
    t11id = t.phieu_ho_tro_id;
    const r1 = hoursAfter(c11, 1), esc = hoursAfter(c11, 4);
    await log(tx, t.phieu_ho_tro_id, ops3.nhan_vien_id, 'CREATED', null, null, c11);
    await log(tx, t.phieu_ho_tro_id, nvL1_3.nhan_vien_id, 'STATUS_CHANGED', 'DANG_GIAI_QUYET', 'MOI_TAO', r1);
    await log(tx, t.phieu_ho_tro_id, nvL1_3.nhan_vien_id, 'ESCALATED', 'L2', 'L1', esc);
    await comment(tx, t.phieu_ho_tro_id, nvL2_1.nhan_vien_id, 'Đang phân tích backup schedule và I/O throughput.', 'THUONG', 'CONG_KHAI', hoursAfter(esc, 1));
    await comment(tx, t.phieu_ho_tro_id, nvL2_1.nhan_vien_id, 'Internal: throttle backup bandwidth xuống 50MB/s để tránh ảnh hưởng giờ làm.', 'THUONG', 'NOI_BO', hoursAfter(esc, 2));
    await sla(tx, t.phieu_ho_tro_id, slaTrungBinh.chinh_sach_sla_id, 'PHAN_HOI', c11, hoursAfter(c11, 4), false, r1);
    await sla(tx, t.phieu_ho_tro_id, slaTrungBinh.chinh_sach_sla_id, 'XU_LY', c11, hoursAfter(c11, 24), false, null);
  });

  // ────────────────────────────────────────────────────────────────
  // T12 (SW-2025-0112) — DANG_GIAI_QUYET, tạo bởi sales3
  // → otherUserTicketId (NGUOI_YEU_CAU khác xem → 403)
  //   nguoi_ho_tro = nvL1_2 (ravi.kumar) — tài khoản khác với L1 chính
  // ────────────────────────────────────────────────────────────────
  const c12 = daysAgo(1);
  let t12id;
  await prisma.$transaction(async (tx) => {
    const t = await tx.phieuHoTro.create({
      data: {
        ma_phieu: mp(112), tieu_de: 'Không truy cập được hệ thống CRM Salesforce',
        mo_ta_chi_tiet: 'Đăng nhập Salesforce báo lỗi "SSO configuration error".',
        muc_do_anh_huong: 'CAO', muc_do_khan_cap: 'CAO', muc_do_uu_tien: 'CAO',
        trang_thai: 'DANG_GIAI_QUYET', nguoi_tao_id: sales3.nhan_vien_id,
        nguoi_ho_tro_id: nvL1_2.nhan_vien_id, nhom_xu_ly_id: nhomL1.nhom_ho_tro_id,
        so_lan_mo_lai: 0, so_lan_thu_lai_L1: 1, so_lan_thu_lai_L2: 0, ngay_tao: c12,
      }
    });
    t12id = t.phieu_ho_tro_id;
    const r1 = hoursAfter(c12, 1);
    await log(tx, t.phieu_ho_tro_id, sales3.nhan_vien_id, 'CREATED', null, null, c12);
    await log(tx, t.phieu_ho_tro_id, nvL1_2.nhan_vien_id, 'STATUS_CHANGED', 'DANG_GIAI_QUYET', 'MOI_TAO', r1);
    await comment(tx, t.phieu_ho_tro_id, nvL1_2.nhan_vien_id, 'Đang kiểm tra cấu hình SSO Azure AD.', 'THUONG', 'CONG_KHAI', r1);
    await sla(tx, t.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'PHAN_HOI', c12, hoursAfter(c12, 1), false, r1);
    await sla(tx, t.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'XU_LY', c12, hoursAfter(c12, 4), false, null);
  });

  // ────────────────────────────────────────────────────────────────
  // T13 (SW-2025-0113) — MOI_TAO, hr1, chưa assign
  // Buffer ticket mới để test POST /tickets workflow
  // ────────────────────────────────────────────────────────────────
  const c13 = minutesAfter(new Date(), -30);
  await prisma.$transaction(async (tx) => {
    const t = await tx.phieuHoTro.create({
      data: {
        ma_phieu: mp(113), tieu_de: 'Yêu cầu cài đặt Adobe Acrobat Pro cho máy mới',
        mo_ta_chi_tiet: 'Máy mới nhận về chưa có Adobe Acrobat, cần dùng để ký hợp đồng số.',
        muc_do_anh_huong: 'TRUNG_BINH', muc_do_khan_cap: 'TRUNG_BINH', muc_do_uu_tien: 'TRUNG_BINH',
        trang_thai: 'MOI_TAO', nguoi_tao_id: hr1.nhan_vien_id,
        nguoi_ho_tro_id: null, nhom_xu_ly_id: nhomL1.nhom_ho_tro_id,
        so_lan_mo_lai: 0, so_lan_thu_lai_L1: 0, so_lan_thu_lai_L2: 0, ngay_tao: c13,
      }
    });
    await log(tx, t.phieu_ho_tro_id, hr1.nhan_vien_id, 'CREATED', null, null, c13);
    await sla(tx, t.phieu_ho_tro_id, slaTrungBinh.chinh_sach_sla_id, 'PHAN_HOI', c13, hoursAfter(c13, 4), false, null);
    await sla(tx, t.phieu_ho_tro_id, slaTrungBinh.chinh_sach_sla_id, 'XU_LY', c13, hoursAfter(c13, 24), false, null);
  });

  // ────────────────────────────────────────────────────────────────
  // T14 (SW-2025-0114) — MOI_TAO, sales4
  // Buffer ticket thấp để test Priority = THAP
  // ────────────────────────────────────────────────────────────────
  const c14 = minutesAfter(new Date(), -15);
  await prisma.$transaction(async (tx) => {
    const t = await tx.phieuHoTro.create({
      data: {
        ma_phieu: mp(114), tieu_de: 'Yêu cầu cài thêm phần mềm WinRAR cho máy phòng kế toán',
        mo_ta_chi_tiet: 'Cần WinRAR để mở file .rar từ đối tác gửi về, máy hiện tại chưa cài.',
        muc_do_anh_huong: 'THAP', muc_do_khan_cap: 'THAP', muc_do_uu_tien: 'THAP',
        trang_thai: 'MOI_TAO', nguoi_tao_id: sales4.nhan_vien_id,
        nguoi_ho_tro_id: null, nhom_xu_ly_id: nhomL1.nhom_ho_tro_id,
        so_lan_mo_lai: 0, so_lan_thu_lai_L1: 0, so_lan_thu_lai_L2: 0, ngay_tao: c14,
      }
    });
    await log(tx, t.phieu_ho_tro_id, sales4.nhan_vien_id, 'CREATED', null, null, c14);
    await sla(tx, t.phieu_ho_tro_id, slaThap.chinh_sach_sla_id, 'PHAN_HOI', c14, hoursAfter(c14, 8), false, null);
    await sla(tx, t.phieu_ho_tro_id, slaThap.chinh_sach_sla_id, 'XU_LY', c14, hoursAfter(c14, 40), false, null);
  });

  // ────────────────────────────────────────────────────────────────
  // T15 (SW-2025-0115) — DA_GIAI_QUYET trong 48h, sales5
  // → thêm buffer resolvedTicketId dự phòng
  // Token: rv_token_t15_pending
  // ────────────────────────────────────────────────────────────────
  const c15 = hoursAfter(new Date(), -30);
  let t15id;
  await prisma.$transaction(async (tx) => {
    const t = await tx.phieuHoTro.create({
      data: {
        ma_phieu: mp(115), tieu_de: 'Máy tính chạy chậm sau khi cài Windows Update',
        mo_ta_chi_tiet: 'Sau khi Windows tự cập nhật đêm qua, máy khởi động mất 5-10 phút.',
        muc_do_anh_huong: 'TRUNG_BINH', muc_do_khan_cap: 'TRUNG_BINH', muc_do_uu_tien: 'TRUNG_BINH',
        trang_thai: 'DA_GIAI_QUYET', nguoi_tao_id: sales5.nhan_vien_id,
        nguoi_ho_tro_id: nvL1_3.nhan_vien_id, nhom_xu_ly_id: nhomL1.nhom_ho_tro_id,
        so_lan_mo_lai: 0, so_lan_thu_lai_L1: 1, so_lan_thu_lai_L2: 0, ngay_tao: c15,
      }
    });
    t15id = t.phieu_ho_tro_id;
    const r1 = hoursAfter(c15, 2), d = hoursAfter(c15, 5);
    await log(tx, t.phieu_ho_tro_id, sales5.nhan_vien_id, 'CREATED', null, null, c15);
    await log(tx, t.phieu_ho_tro_id, nvL1_3.nhan_vien_id, 'STATUS_CHANGED', 'DANG_GIAI_QUYET', 'MOI_TAO', r1);
    await log(tx, t.phieu_ho_tro_id, nvL1_3.nhan_vien_id, 'STATUS_CHANGED', 'DA_GIAI_QUYET', 'DANG_GIAI_QUYET', d);
    await comment(tx, t.phieu_ho_tro_id, nvL1_3.nhan_vien_id, 'Đã rollback update KB5034441 và tắt Windows Update tạm thời.', 'KET_QUA', 'CONG_KHAI', d);
    await sla(tx, t.phieu_ho_tro_id, slaTrungBinh.chinh_sach_sla_id, 'PHAN_HOI', c15, hoursAfter(c15, 4), false, r1);
    await sla(tx, t.phieu_ho_tro_id, slaTrungBinh.chinh_sach_sla_id, 'XU_LY', c15, hoursAfter(c15, 24), false, d);
    await tx.phieuDanhGia.create({
      data: {
        phieu_ho_tro_id: t.phieu_ho_tro_id, nguoi_danh_gia_id: sales5.nhan_vien_id,
        token_xac_thuc: 'rv_token_t15_pending', hai_long: false, so_sao: 0,
        nhan_xet: null, ngay_danh_gia: d,
      }
    });
  });

  // ────────────────────────────────────────────────────────────────
  // T16 (SW-2025-0116) — DA_DONG, pm3, reopen 2 lần, escalate L2
  // Buffer ticket có nhiều lịch sử phức tạp
  // ────────────────────────────────────────────────────────────────
  const c16 = daysAgo(50);
  await prisma.$transaction(async (tx) => {
    const t = await tx.phieuHoTro.create({
      data: {
        ma_phieu: mp(116), tieu_de: 'Lỗi kết nối database khi dùng phần mềm ERP nội bộ',
        mo_ta_chi_tiet: 'Phần mềm ERP báo "Cannot connect to database server" vào đầu giờ sáng.',
        muc_do_anh_huong: 'CAO', muc_do_khan_cap: 'CAO', muc_do_uu_tien: 'CAO',
        trang_thai: 'DA_DONG', nguoi_tao_id: pm3.nhan_vien_id,
        nguoi_ho_tro_id: nvL2_2.nhan_vien_id, nhom_xu_ly_id: nhomL2.nhom_ho_tro_id,
        so_lan_mo_lai: 2, so_lan_thu_lai_L1: 2, so_lan_thu_lai_L2: 2, ngay_tao: c16,
      }
    });
    const r1 = hoursAfter(c16, 1), esc = hoursAfter(c16, 6);
    const d1 = hoursAfter(c16, 12), re1 = hoursAfter(d1, 10);
    const d2 = hoursAfter(re1, 8), re2 = hoursAfter(d2, 12);
    const d3 = hoursAfter(re2, 6);
    await log(tx, t.phieu_ho_tro_id, pm3.nhan_vien_id, 'CREATED', null, null, c16);
    await log(tx, t.phieu_ho_tro_id, nvL1_1.nhan_vien_id, 'STATUS_CHANGED', 'DANG_GIAI_QUYET', 'MOI_TAO', r1);
    await log(tx, t.phieu_ho_tro_id, nvL1_1.nhan_vien_id, 'ESCALATED', 'L2', 'L1', esc);
    await log(tx, t.phieu_ho_tro_id, nvL2_2.nhan_vien_id, 'STATUS_CHANGED', 'DA_GIAI_QUYET', 'DANG_GIAI_QUYET', d1);
    await log(tx, t.phieu_ho_tro_id, nvManager.nhan_vien_id, 'REOPENED', 'DANG_GIAI_QUYET', 'DA_GIAI_QUYET', re1);
    await log(tx, t.phieu_ho_tro_id, nvL2_2.nhan_vien_id, 'STATUS_CHANGED', 'DA_GIAI_QUYET', 'DANG_GIAI_QUYET', d2);
    await log(tx, t.phieu_ho_tro_id, nvManager.nhan_vien_id, 'REOPENED', 'DANG_GIAI_QUYET', 'DA_GIAI_QUYET', re2);
    await log(tx, t.phieu_ho_tro_id, nvL2_2.nhan_vien_id, 'STATUS_CHANGED', 'DA_GIAI_QUYET', 'DANG_GIAI_QUYET', d3);
    await log(tx, t.phieu_ho_tro_id, pm3.nhan_vien_id, 'STATUS_CHANGED', 'DA_DONG', 'DA_GIAI_QUYET', hoursAfter(d3, 3));
    await comment(tx, t.phieu_ho_tro_id, nvL2_2.nhan_vien_id, 'Đã xử lý xong, nguyên nhân gốc là connection pool bị cạn kiệt.', 'KET_QUA', 'CONG_KHAI', d3);
    await sla(tx, t.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'PHAN_HOI', c16, hoursAfter(c16, 1), false, r1);
    await sla(tx, t.phieu_ho_tro_id, slaCao.chinh_sach_sla_id, 'XU_LY', c16, hoursAfter(c16, 4), true, d3);
    await tx.phieuDanhGia.create({
      data: {
        phieu_ho_tro_id: t.phieu_ho_tro_id, nguoi_danh_gia_id: pm3.nhan_vien_id,
        token_xac_thuc: 'rv_token_t16_used', hai_long: true, so_sao: 3,
        nhan_xet: 'Mất nhiều lần mới xong, cần cải thiện quy trình.', ngay_danh_gia: hoursAfter(d3, 3),
      }
    });
  });

  // ────────────────────────────────────────────────────────────────
  // T17 (SW-2025-0117) — DA_DONG, ops1 file attachment cho closed ticket
  // Thêm file cho T05 đã đóng → closedTicketAttachmentId
  // (T05 đã đóng nên file này là của ticket đóng)
  // Thêm 1 file cho ticket khác user → otherUserAttachmentId
  // ────────────────────────────────────────────────────────────────
  // Thêm file cho T05 (closed) — đây là closedTicketAttachmentId
  let att05_extra_id;
  {
    const att = await prisma.tepDinhKem.create({
      data: {
        ten_tep: 'bao_cao_su_co_man_hinh.pdf',
        duong_dan_file: '/uploads/attachments/uuid-c3d4e5f6-report.pdf',
        dinh_dang: 'pdf', dung_luong_kb: 512,
        phieu_ho_tro_id: t05id, ngay_tao: daysAgo(24),
      }
    });
    att05_extra_id = att.tep_dinh_kem_id;
  }

  // Thêm file cho T12 (sales3's ticket) → otherUserAttachmentId
  let att12id;
  {
    const att = await prisma.tepDinhKem.create({
      data: {
        ten_tep: 'salesforce_error_log.txt',
        duong_dan_file: '/uploads/attachments/uuid-d4e5f6a7-sfdc.txt',
        dinh_dang: 'txt', dung_luong_kb: 48,
        phieu_ho_tro_id: t12id, ngay_tao: daysAgo(1),
      }
    });
    att12id = att.tep_dinh_kem_id;
  }

  console.log('   ✓ 17 tickets + files đính kèm\n');

  // ════════════════════════════════════════════════════════════════
  // TỔNG KẾT VÀ IN COLLECTION VARIABLES
  // ════════════════════════════════════════════════════════════════
  const totalStaff = 7 + allRequesters.length;
  console.log('═'.repeat(65));
  console.log('✅  SEED v4.0 HOÀN TẤT — Map Pacific Singapore');
  console.log('═'.repeat(65));
  console.log(`\n📊  Tổng nhân viên  : ${totalStaff} (7 IT + ${allRequesters.length} NV nghiệp vụ)`);
  console.log(`    Tickets         : 17`);
  console.log(`    KB articles     : 10 (7 xuất bản, 3 nháp)`);
  console.log(`    SLA policies    : 4 (3 active, 1 inactive)`);
  console.log(`    Tệp đính kèm    : 4`);
  console.log(`\n🔑  Password        : Mappacific@2025`);

  console.log('\n' + '─'.repeat(65));
  console.log('📋  COLLECTION VARIABLES — copy paste vào Postman:');
  console.log('─'.repeat(65));
  console.log(`validUsername         = sales1`);
  console.log(`validPassword         = Mappacific@2025`);
  console.log(`lockedUsername        = locked_user`);
  console.log(`currentUserId         = ${sales1.nhan_vien_id}  (sales1)`);
  console.log(`itL1UserId            = ${nvL1_1.nhan_vien_id}  (huyentld23406)`);
  console.log(`itL2UserId            = ${nvL2_1.nhan_vien_id}  (vanbtt23406)`);
  console.log(`managerId             = ${nvManager.nhan_vien_id}  (thangpq23406)`);
  console.log(`validItL1Id           = ${nvL1_2.nhan_vien_id}  (ravi.kumar — cùng nhóm L1)`);
  console.log(`wrongGroupItId        = ${nvL2_2.nhan_vien_id}  (siti.rahimah — nhóm L2, khác nhóm với L1 ticket)`);
  console.log(`otherUserTicketId     = ${t12id}  (SW-2025-0112, tạo bởi sales3)`);
  console.log(`closedTicketId        = ${t05id}  (SW-2025-0105, DA_DONG)`);
  console.log(`resolvedTicketId      = ${t08id}  (SW-2025-0108, DA_GIAI_QUYET trong 48h)`);
  console.log(`oldResolvedTicketId   = ${t07id}  (SW-2025-0107, DA_GIAI_QUYET > 48h — 10 ngày trước)`);
  console.log(`noReviewTicketId      = ${t09id}  (SW-2025-0109, DA_GIAI_QUYET, chưa có đánh giá)`);
  console.log(`reviewToken           = rv_token_t08_pending  (T08, chưa dùng)`);
  console.log(`usedReviewToken       = rv_token_t01_used     (T01, đã dùng)`);
  console.log(`closedTicketAttachmentId = ${att05_extra_id}  (file PDF thuộc T05 đã đóng)`);
  console.log(`otherUserAttachmentId    = ${att12id}  (file thuộc T12, tạo bởi sales3)`);
  console.log(`kbArticleId           = 1  (DA_XUAT_BAN, tác giả vanbtt23406)`);
  console.log(`draftKbId             = 8  (NHAP, tác giả siti.rahimah)`);
  console.log(`roleId                = ${roleRequester.vai_tro_id}  (NGUOI_YEU_CAU)`);
  console.log(`teamId                = ${nhomL1.nhom_ho_tro_id}  (nhóm L1)`);
  console.log(`existingEmail         = sales1@mappacific.com`);
  console.log(`slaInactiveId         = ${slaCaoInactive.chinh_sach_sla_id}  (inactive CAO — dùng TC-SLA-008)`);
  console.log('─'.repeat(65));
  console.log('\n💡  Ghi chú:');
  console.log('    - itL1Token: login bằng huyentld23406 / Mappacific@2025');
  console.log('    - itL2Token: login bằng vanbtt23406 / Mappacific@2025');
  console.log('    - managerToken: login bằng thangpq23406 / Mappacific@2025');
  console.log('    - otherItL2Token: login bằng siti.rahimah / Mappacific@2025');
  console.log('    - ticketId: tự fill sau TC-TKT-001 (POST /tickets)');
  console.log('    - accessToken / refreshToken: tự fill sau TC-AUTH-001');
  console.log('═'.repeat(65));
}

main()
  .catch(e => { console.error('❌  Seed thất bại:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });