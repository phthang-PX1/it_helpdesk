# 📋 Tài liệu API — IT Helpdesk Map Pacific Singapore

> **Tổng quan:** 41 endpoints, chia thành 8 nhóm chức năng. Backend: Express 5 + TypeScript + Prisma + PostgreSQL + Redis + Socket.IO.
>
> **Base URL:** `http://localhost:3000/api/v1`
> **Xác thực:** Bearer JWT (Access Token, thời hạn 8h)
> **Luồng request chuẩn:** `Route → Middleware (verifyToken + checkRole) → Controller → Validator (Zod) → Service → Repository → DB`

---

## Quy ước chung

| Ký hiệu | Ý nghĩa |
|---------|---------|
| `verifyToken` | Xác thực Bearer JWT; gắn `req.user` vào request |
| `checkRole([...])` | Kiểm tra `vai_tro` của user nằm trong danh sách cho phép |
| `uploadTicketFiles` | Multer (memoryStorage) chặn ≤ 5 file, ≤ 20 MB/file, đúng định dạng |
| `upload` (KB) | Multer (memoryStorage) chặn ≤ 10 file, ≤ 20 MB/file |
| Zod | Validate body / query trước khi vào Service |

---

## 🔐 Nhóm 1: Authentication — `/api/v1/auth`

> **Router file:** `src/routes/auth.routes.ts`

| # | Endpoint | Mô tả | Method | Input | Output | Middleware | Errors | Logic End-to-End |
|---|----------|-------|--------|-------|--------|-----------|--------|-----------------|
| 1 | `/auth/login` | Đăng nhập bằng tài khoản & mật khẩu | POST | **Body JSON:** `tai_khoan` (string, ≥1 ký tự, bắt buộc), `mat_khau` (string, ≥1 ký tự, bắt buộc) | `{ success, message, data: { token, refresh_token, user } }` | _(Public)_ | 400 Zod fail · 401 Sai TK/MK hoặc bị khóa · 403 Chưa có vai trò | 1. Zod validate body → 2. Query DB tìm nhân viên theo `tai_khoan` → 3. Kiểm tra `trang_thai = true` (false → 401) → 4. `bcrypt.compare(mat_khau, hash)` (sai → 401) → 5. Kiểm tra `vai_tro_id ≠ null` (null → 403) → 6. Ký Access Token JWT (8h) + Refresh Token JWT (7 ngày) → 7. `redis.SET(refresh_token → nhan_vien_id)` TTL 7 ngày → 8. Trả về 2 token + thông tin user |
| 2 | `/auth/login-google` | Đăng nhập OAuth2 bằng Google | POST | **Body JSON:** `google_id_token` (string, bắt buộc) | `{ success, message, data: { token, refresh_token, user } }` | _(Public)_ | 401 Token Google không hợp lệ · 403 Email ngoài domain công ty · 404 Tài khoản chưa tồn tại | 1. Zod validate body → 2. Gọi `google-auth-library.verifyIdToken()` với `GOOGLE_CLIENT_ID` → 3. Lấy `email` từ payload Google → 4. Kiểm tra email thuộc domain công ty (`COMPANY_EMAIL_DOMAIN`) → 5. Tìm nhân viên trong DB theo email → 6. Kiểm tra `trang_thai` và `vai_tro_id` → 7. Sinh Access Token + Refresh Token → 8. Lưu Redis → 9. Trả về token + user |
| 3 | `/auth/logout` | Đăng xuất, thu hồi Refresh Token khỏi Redis | POST | **Body JSON:** `refresh_token` (string, bắt buộc) | `{ success: true, message: "Đăng xuất thành công" }` | `verifyToken` | 400 Token không hợp lệ / đã thu hồi · 401 Chưa có Access Token | 1. `verifyToken` xác thực Access Token → 2. Zod validate body → 3. `redis.GET(refresh_token)` → không tồn tại → 400 → 4. `redis.DEL(refresh_token)` → xóa khỏi bộ nhớ → 5. Trả về thành công (Token bị thu hồi vĩnh viễn) |
| 4 | `/auth/refresh` | Cấp lại Access Token từ Refresh Token | POST | **Body JSON:** `refresh_token` (string, bắt buộc) | `{ success, message, data: { token } }` _(chỉ Access Token mới)_ | _(Public)_ | 400 Zod fail · 401 Token hết hạn / không tồn tại trong Redis | 1. Zod validate body → 2. `redis.GET(refresh_token)` → không tồn tại → 401 → 3. Lấy `nhan_vien_id` từ Redis value → 4. Tìm user trong DB, kiểm tra `trang_thai = true` → 5. Ký Access Token mới (8h) — **không** cấp lại Refresh Token → 6. Trả về `{ token }` |
| 5 | `/auth/me` | Lấy thông tin cá nhân user đang đăng nhập | GET | _(Lấy userId từ JWT `req.user`)_ | `{ success, message, data: { nhan_vien_id, ho_ten, email, vai_tro, phong_ban, nhom_ho_tro, ... } }` _(không có mat_khau)_ | `verifyToken` | 401 Token không hợp lệ / hết hạn · 404 Không tìm thấy user | 1. `verifyToken` decode JWT → gắn `req.user` → 2. Lấy `nhan_vien_id` từ `req.user` → 3. Query DB với `select` loại bỏ trường `mat_khau`, join `vai_tro`, `phong_ban`, `nhom_ho_tro` → 4. Trả về thông tin đầy đủ |

---

## 🎫 Nhóm 2: Tickets — `/api/v1/tickets`

> **Router file:** `src/routes/ticket.routes.ts`

| # | Endpoint | Mô tả | Method | Input | Output | Middleware | Errors | Logic End-to-End |
|---|----------|-------|--------|-------|--------|-----------|--------|-----------------|
| 6 | `/tickets` | Tạo phiếu hỗ trợ mới | POST | **Body multipart/form-data:** `tieu_de` (string, ≥5 ký tự), `mo_ta_chi_tiet` (string, ≥10 ký tự), `muc_do_anh_huong` (enum: THAP/TRUNG_BINH/CAO), `muc_do_khan_cap` (enum: THAP/TRUNG_BINH/CAO); **Files:** `files[]` (≤5 file, ≤20MB/file) | HTTP 201. `{ success, message: "...phản hồi trước HH:MM:SS", data: { ...ticket, sla: { han_chot_phan_hoi, han_chot_xu_ly } } }` | `verifyToken`, `checkRole(['NGUOI_YEU_CAU'])`, `uploadTicketFiles` | 400 Validate fail / sai enum / file lỗi · 401 Token không hợp lệ · 403 Không có vai trò NGUOI_YEU_CAU | 1. Zod validate body → 2. Sinh `traceId = crypto.randomUUID()` → 3. `calculatePriority(impact, urgency)` → tính `muc_do_uu_tien` → 4. **Load balancing:** Query tất cả IT_L1 đang `trang_thai=true`, đếm ticket đang xử lý, sắp xếp tăng dần → chọn người có ít ticket nhất (tie-breaker: người rảnh lâu hơn) → 5. Nếu không có IT_L1 nào → nhận nhóm mặc định, `nguoi_ho_tro_id = null` → 6. **SLA:** Tìm policy active theo `muc_do_uu_tien`, nếu không có thì tự tạo → tính `han_chot_phan_hoi` và `han_chot_xu_ly` bằng `addBusinessMinutes()` (bỏ qua T7/CN, ngoài 08:00-17:00) → 7. **File:** Map buffer Multer → UUID rename → tạo metadata → 8. Ghi DB trong 1 transaction (ticket + 2 SLA records + file records + audit log với `trace_id`) → `ma_phieu = SW-{year}-{sequence}` qua DB Lock → 9. **Gửi email xác nhận** cho người tạo (nền, không `await`) → 10. Trả về ticket + SLA deadlines |
| 7 | `/tickets` | Lấy danh sách phiếu có phân trang, lọc và phân quyền | GET | **Query:** `page` (int, min 1, default 1), `limit` (int, 1-100, default 10), `trang_thai` (enum), `muc_do_uu_tien` (enum), `keyword` (string) | `{ success, message, data: [...tickets], pagination: { total, page, limit } }` | `verifyToken`, `checkRole(['NGUOI_YEU_CAU','IT_L1','IT_L2','QUAN_LY'])` | 400 Tham số sai enum · 401 Chưa đăng nhập | 1. Zod validate query → 2. Build `whereClause` từ query params → 3. **Phân quyền mềm:** `NGUOI_YEU_CAU` → chỉ thấy phiếu của mình (`nguoi_tao_id = userId`); IT_L1/L2 → thấy phiếu mình phụ trách HOẶC chưa có người nhận trong nhóm mình; QUAN_LY → không lọc → 4. Nếu có `keyword` → OR filter LIKE trên `tieu_de` và `ma_phieu` → 5. Query DB với `skip/limit` → 6. Trả về danh sách + pagination |
| 8 | `/tickets/:id` | Xem chi tiết một phiếu (kèm SLA, lịch sử, bình luận) | GET | **Param:** `id` (int) | `{ success, message, data: { ...ticket, nguoi_tao, nguoi_ho_tro, nhom_xu_ly, danh_sach_bl, danh_sach_sla } }` | `verifyToken`, `checkRole(['NGUOI_YEU_CAU','IT_L1','IT_L2','QUAN_LY'])` | 403 NGUOI_YEU_CAU xem phiếu người khác · 404 Phiếu không tồn tại | 1. Parse & validate `id` → 2. Query DB join đầy đủ (người tạo, người hỗ trợ, nhóm xử lý, SLA, bình luận, file) → 404 nếu không có → 3. **Phân quyền:** NGUOI_YEU_CAU xem phiếu người khác → 403 → 4. **Lọc bình luận:** Nếu là NGUOI_YEU_CAU → filter bỏ tất cả bình luận `quyen_xem = NOI_BO` → 5. Trả về toàn bộ chi tiết |
| 9 | `/tickets/:id/status` | Cập nhật trạng thái phiếu theo Workflow | PUT | **Param:** `id` (int); **Body JSON:** `trang_thai` (enum, bắt buộc), `ghi_chu` (string, tùy chọn) | `{ success, message, data: { ...ticket đã cập nhật } }` | `verifyToken`, `checkRole(['IT_L1','IT_L2','QUAN_LY'])` | 400 Sai Workflow · 403 IT không phụ trách phiếu này · 409 Phiếu đã `DA_DONG` | 1. Tìm ticket (kèm email người tạo) → 404/409 → 2. **Kiểm tra Workflow cứng:** MOI_TAO→DANG_GIAI_QUYET, DANG_GIAI_QUYET→{DA_GIAI_QUYET, CHO_PHAN_HOI}, CHO_PHAN_HOI→DANG_GIAI_QUYET, DA_GIAI_QUYET→DA_DONG → sai → 400 → 3. IT_L1/L2: `nguoi_ho_tro_id ≠ userId` → 403 → 4. Sinh `traceId` → Cập nhật trạng thái + ghi audit log vào DB → 5. Tạo thông báo in-app cho người tạo phiếu → 6. **SLA Phan Hoi:** MOI_TAO→DANG_GIAI_QUYET → ghi `thoi_diem_dat` cho SLA Phản hồi (dừng đồng hồ phản hồi) → 7. **SLA Pause:** →CHO_PHAN_HOI → ghi `thoi_diem_tam_dung` → 8. **SLA Resume:** CHO_PHAN_HOI→DANG_GIAI_QUYET → tính `pause_duration`, cộng vào `tong_thoi_gian_tam_dung`, đẩy `han_chot` thêm → 9. **Khi DA_GIAI_QUYET:** Stop SLA xử lý (`thoi_diem_dat = now`) → sinh `reviewToken = crypto.randomBytes(32)` → `upsert PhieuDanhGia` (tránh lỗi trùng nếu reopen) → gửi email khảo sát có link token (nền, không `await`) → 10. Trả về ticket đã cập nhật |
| 10 | `/tickets/:id/escalate` | IT_L1 chuyển cấp phiếu sang nhóm L2 | POST | **Param:** `id` (int); **Body JSON:** `ly_do` (string, ≥10 ký tự, bắt buộc), `cac_buoc_da_thu` (string, ≥10 ký tự, bắt buộc) | `{ success, message, data: { phieu_ho_tro_id, nhom_ho_tro_moi: "L2", trang_thai } }` | `verifyToken`, `checkRole(['IT_L1'])` | 400 Lý do <10 ký tự / ticket không ở DANG_GIAI_QUYET · 403 Không trực tiếp phụ trách · 404 Ticket không tồn tại | 1. Tìm ticket → 404 → 2. Kiểm tra `trang_thai = DANG_GIAI_QUYET` (sai → 409) → 3. Kiểm tra `nguoi_ho_tro_id = userId` (sai → 403) → 4. Tìm nhóm L2 (`ten_nhom LIKE '%L2%'`) → 5. Cập nhật ticket: `nhom_xu_ly_id = nhomL2Id`, `nguoi_ho_tro_id = null` + ghi audit log với `trace_id` → 6. Tạo thông báo in-app cho tất cả thành viên nhóm L2 → 7. **Socket.IO:** emit `ticket_escalated_alert` đến room `group_2` → 8. Trả về kết quả |
| 11 | `/tickets/:id/reopen` | Quản lý mở lại phiếu đã giải quyết | POST | **Param:** `id` (int); **Body JSON:** `ly_do` (string, ≥5 ký tự, bắt buộc) | `{ success, message, data: { phieu_ho_tro_id, trang_thai, so_lan_mo_lai } }` | `verifyToken`, `checkRole(['QUAN_LY'])` | 403 Chỉ QUAN_LY · 404 Ticket không tồn tại · 409 Không ở DA_GIAI_QUYET / quá 48h | 1. Tìm ticket → 404 → 2. Kiểm tra `trang_thai = DA_GIAI_QUYET` → 3. Tính giờ từ khi giải quyết → >48h → 409 → 4. Tăng `so_lan_mo_lai += 1` → 5. Nếu `so_lan_mo_lai > 2` → `newGroupId = nhomL2Id` (tự chuyển cấp L2); ngược lại giữ nhóm cũ → 6. Cập nhật ticket: `trang_thai = DANG_GIAI_QUYET`, `nhom_xu_ly_id = newGroupId`, `nguoi_ho_tro_id = null` + ghi audit log → 7. Tạo SLA mới từ đầu cho ticket → 8. Tạo thông báo cho nhóm phụ trách → 9. **Socket.IO:** emit `ticket_reopened_event` đến room `group_{nhom_xu_ly_id}` → 10. Trả về ticket đã mở lại |
| 12 | `/tickets/:id/comments` | Thêm bình luận (public/nội bộ) kèm file | POST | **Param:** `id` (int); **Body multipart/form-data:** `noi_dung` (string, ≥1 ký tự, bắt buộc), `loai_binh_luan` (enum: public/internal, bắt buộc); **Files:** `files[]` (≤5 file) | HTTP 201. `{ success, message, data: { binhLuan mới kèm files } }` | `verifyToken`, `checkRole(['NGUOI_YEU_CAU','IT_L1','IT_L2','QUAN_LY'])`, `uploadTicketFiles` | 403 NGUOI_YEU_CAU gửi `internal` · 409 Ticket đã DA_DONG | 1. Tìm ticket → 404 → 2. Kiểm tra `trang_thai ≠ DA_DONG` → 409 → 3. Phân quyền: NGUOI_YEU_CAU gửi `internal` → 403 → 4. Map `loai_binh_luan` → `QuyenXem` (NOI_BO/CONG_KHAI) → 5. Map files Multer buffer → `saveMemoryFileToDisk()` → UUID rename → ghi disk → 6. Sinh `traceId` → Ghi bình luận + file records + audit log trong 1 DB transaction → 7. **Socket.IO:** `public` → emit `new_comment_message` vào room `ticket_{id}`; `internal` → emit `new_internal_note_alert` vào room `group_{groupId}` → 8. Trả về bình luận đầy đủ |
| 13 | `/tickets/:id/comments` | Lấy danh sách bình luận (có phân trang + phân quyền) | GET | **Param:** `id` (int); **Query:** `page` (int, default 1), `limit` (int, max 100, default 10) | `{ success, message, data: [...binhLuan], pagination: { total, page, limit } }` | `verifyToken`, `checkRole(['NGUOI_YEU_CAU','IT_L1','IT_L2','QUAN_LY'])` | 403 NGUOI_YEU_CAU không phải chủ ticket · 404 Ticket không tồn tại | 1. Tìm ticket → 404 → 2. NGUOI_YEU_CAU: `nguoi_tao_id ≠ userId` → 403 → 3. Nếu là NGUOI_YEU_CAU → `restrictInternal = true` → query loại bỏ bình luận `quyen_xem = NOI_BO` → 4. Phân trang (skip/limit) → 5. Trả về danh sách bình luận đã được lọc + metadata tệp đính kèm |
| 14 | `/tickets/:id/history` | Xem toàn bộ lịch sử thay đổi của phiếu | GET | **Param:** `id` (int) | `{ success, message, data: [...lichSu] }` — Mỗi bản ghi có `trace_id`, `hanh_dong`, `gia_tri_cu`, `gia_tri_moi`, `ngay_thuc_hien` | `verifyToken`, `checkRole(['NGUOI_YEU_CAU','IT_L1','IT_L2','QUAN_LY'])` | 403 NGUOI_YEU_CAU không phải chủ ticket · 404 Ticket không tồn tại | 1. Tìm ticket → 404 → 2. NGUOI_YEU_CAU: `nguoi_tao_id ≠ userId` → 403 → 3. Query bảng `LichSuPhieu` theo `phieu_ho_tro_id`, order by `ngay_thuc_hien DESC` → 4. Trả về toàn bộ lịch sử (gồm `trace_id` giúp trace request gốc) |
| 15 | `/tickets/:id/assign` | Quản lý chỉ định lại kỹ thuật viên phụ trách | PUT | **Param:** `id` (int); **Body JSON:** `nguoi_ho_tro_id` (int, ≥1, bắt buộc) | `{ success, message, data: { phieu_ho_tro_id, nguoi_ho_tro_cu, nguoi_ho_tro_moi, ngay_cap_nhat } }` | `verifyToken`, `checkRole(['QUAN_LY'])` | 400 KTV không tồn tại / không cùng nhóm ticket · 403 Không phải QUAN_LY · 404 Ticket không tồn tại | 1. Tìm ticket → 404 → 2. Tìm kỹ thuật viên mới theo `nguoi_ho_tro_id` → 400 nếu không có → 3. Kiểm tra `trang_thai_nv = true` → 400 nếu bị khóa → 4. Kiểm tra `nhom_ho_tro_id` của KTV phải khớp `nhom_xu_ly_id` của ticket → 400 nếu khác nhóm → 5. Sinh `traceId` → Cập nhật `nguoi_ho_tro_id` + ghi audit log trong 1 transaction → 6. Tạo thông báo in-app cho kỹ thuật viên mới → 7. **Socket.IO:** emit `ticket_reassigned` vào room `group_{nhom_xu_ly_id}` → 8. Trả về thông tin KTV cũ/mới |
| 16 | `/tickets/:id/sla` | Xem trạng thái SLA real-time của phiếu | GET | **Param:** `id` (int) | `{ success, message, data: { sla_phan_hoi: { han_chot, thoi_gian_con_lai_giay, da_vi_pham, thoi_diem_dat }, sla_xu_ly: { ... } } }` | `verifyToken`, `checkRole(['IT_L1','IT_L2','QUAN_LY'])` | 403 Không có quyền · 404 Ticket không tồn tại | 1. Tìm ticket → 404 → 2. Query bảng `SlaTheoDoi` theo `phieu_ho_tro_id` → 3. Với mỗi SLA: nếu `thoi_diem_dat = null` (còn đang chạy) → tính `thoi_gian_con_lai_giay = max(0, (han_chot - now) / 1000)` real-time; nếu đã đạt → `con_lai = 0`, `da_vi_pham = (thoi_diem_dat > han_chot)` → 4. Gom thành object `{ sla_phan_hoi, sla_xu_ly }` → trả về |

### 📐 Bảng tính Priority (Impact × Urgency) — `src/utils/ticket.utils.ts`

| Impact \ Urgency | CAO | TRUNG_BINH | THAP |
|---|---|---|---|
| **CAO** | CAO | TRUNG_BINH | TRUNG_BINH |
| **TRUNG_BINH** | CAO | TRUNG_BINH | THAP |
| **THAP** | TRUNG_BINH | THAP | THAP |

### ⏱️ Cấu hình SLA theo Priority — `src/services/ticket.service.ts`

| Mức độ ưu tiên | Phản hồi | Xử lý |
|---|---|---|
| CAO | 15 phút | 240 phút (4h) |
| TRUNG_BINH | 60 phút (1h) | 480 phút (8h) |
| THAP | 240 phút (4h) | 1440 phút (3 ngày) |

> **SLA Engine:** Sử dụng `addBusinessMinutes()` — Chỉ tính giờ hành chính (08:00-17:00), bỏ qua thứ 7, Chủ nhật.

---

## 📎 Nhóm 3: Attachments — `/api/v1/attachments`

> **Router file:** `src/routes/attachment.routes.ts`

| # | Endpoint | Mô tả | Method | Input | Output | Middleware | Errors | Logic End-to-End |
|---|----------|-------|--------|-------|--------|-----------|--------|-----------------|
| 17 | `/attachments/tickets/:ticket_id` | Upload file đính kèm bổ sung vào phiếu | POST | **Param:** `ticket_id` (int); **Body multipart/form-data:** `files[]` (≤5 file, ≤20MB/file) | HTTP 201. `{ success, message, data: [...file metadata] }` | `verifyToken`, `checkRole(['NGUOI_YEU_CAU','IT_L1','IT_L2','QUAN_LY'])`, `upload.array('files', 5)` | 400 File sai/vượt giới hạn · 401 Chưa xác thực · 403 Không quyền · 404 Ticket không tồn tại · 409 Ticket đã đóng | 1. Tìm ticket theo `ticket_id` → 404 → 2. Kiểm tra `trang_thai ≠ DA_DONG` → 409 → 3. Với mỗi file từ Multer buffer: gọi `saveMemoryFileToDisk(f, 'attachments')` → UUID rename → ghi file vật lý vào `/uploads/attachments/` → 4. Lưu metadata (`ten_tep, duong_dan_file, dinh_dang, dung_luong_kb`) vào bảng `TepDinhKem` trong DB → 5. Trả về danh sách file metadata đã lưu |
| 18 | `/attachments/:id` | Xóa file đính kèm (dọn DB và file vật lý) | DELETE | **Param:** `id` (int, ID file đính kèm) | `{ success: true, message: "Xóa file thành công" }` | `verifyToken`, `checkRole(['NGUOI_YEU_CAU','IT_L1','IT_L2','QUAN_LY'])` | 401 Chưa xác thực · 403 Không phải chủ sở hữu · 404 File không tồn tại · 409 Ticket đã đóng | 1. Tìm attachment trong DB kèm join ticket → 404 → 2. Kiểm tra ticket `trang_thai ≠ DA_DONG` → 409 → 3. **Phân quyền xóa:** QUAN_LY được xóa bất kỳ; người tạo ticket hoặc IT đang phụ trách mới được xóa → 403 nếu không thỏa → 4. Xóa bản ghi trong DB → 5. `fs.unlinkSync(duong_dan_file)` dọn file vật lý (bắt lỗi ENOENT nếu file đã mất) → 6. Trả về kết quả |

---

## ⭐ Nhóm 4: Reviews — `/api/v1/reviews`

> **Router file:** `src/routes/review.routes.ts`

| # | Endpoint | Mô tả | Method | Input | Output | Middleware | Errors | Logic End-to-End |
|---|----------|-------|--------|-------|--------|-----------|--------|-----------------|
| 19 | `/reviews/validate-token` | Kiểm tra token khảo sát từ email trước khi hiển thị form | GET | **Query:** `token` (string, bắt buộc) | `{ success, message, data: { phieu_ho_tro_id, ma_phieu, tieu_de, trang_thai } }` | _(Public — không cần JWT)_ | 400 Thiếu token · 404 Token không hợp lệ hoặc đã dùng | 1. Zod validate query → 2. Tìm bản ghi `PhieuDanhGia` có `token_xac_thuc = token` VÀ `so_sao = 0` (pending, chưa được dùng) → 404 nếu không có → 3. Lấy thông tin ticket gốc → 4. Trả về thông tin ticket để frontend hiển thị form khảo sát |
| 20 | `/reviews` | Gửi đánh giá sau khi ticket giải quyết | POST | **Body JSON:** `token` (string, bắt buộc), `hai_long` (boolean, bắt buộc), `so_sao` (int 1-5, bắt buộc), `nhan_xet` (string, tùy chọn), `ly_do_khong_hai_long` (string, **bắt buộc nếu `hai_long=false`**) | `{ success, message, data: { ket_qua: "CLOSED" hoặc "REOPENED", ticketId } }` | _(Public)_ | 400 Thiếu trường / sai kiểu / thiếu lý do khi không hài lòng · 404 Token sai / đã dùng | 1. Zod validate body (refine: `hai_long=false` bắt buộc có `ly_do_khong_hai_long` hoặc `nhan_xet`) → 2. Tìm `PhieuDanhGia` pending theo token → 404 → 3. Cập nhật phiếu đánh giá → 4. **Nếu `hai_long=true`:** cập nhật ticket → `DA_DONG` + ghi lịch sử (`ket_qua = CLOSED`) → **Nếu `hai_long=false`:** tăng `so_lan_mo_lai += 1` → >2 thì chuyển nhóm L2 → mở lại ticket → `DANG_GIAI_QUYET` + ghi lịch sử (`ket_qua = REOPENED`) → 5. Trả về kết quả hành động |
| 21 | `/reviews/:ticket_id` | Xem kết quả đánh giá của một phiếu | GET | **Param:** `ticket_id` (int) | `{ success, message, data: { hai_long, so_sao, nhan_xet, ly_do_khong_hai_long, ngay_danh_gia, nguoi_danh_gia } }` | `verifyToken`, `checkRole(['IT_L1','IT_L2','QUAN_LY'])` | 403 Không có quyền xem · 404 Ticket không tồn tại hoặc chưa có đánh giá | 1. `verifyToken` + `checkRole` → 2. Query DB tìm `PhieuDanhGia` theo `phieu_ho_tro_id` → 404 nếu chưa có → 3. Trả về chi tiết đánh giá bao gồm thông tin người đánh giá |

---

## 📚 Nhóm 5: Knowledge Base — `/api/v1/kb`

> **Router file:** `src/routes/kb.routes.ts`

| # | Endpoint | Mô tả | Method | Input | Output | Middleware | Errors | Logic End-to-End |
|---|----------|-------|--------|-------|--------|-----------|--------|-----------------|
| 22 | `/kb/search` | Full-text search bài viết tri thức | GET | **Query:** `q` (string, ≥2 ký tự, bắt buộc), `limit` (int, default 5) | `{ success, message, data: [...{ tieu_de, loai_su_co, the_tags, mo_dau (150 ký tự), luot_xem, luot_huu_ich }] }` | `verifyToken` | 400 Từ khóa <2 ký tự | 1. Zod validate query → 2. Query DB: tìm bài `DA_XUAT_BAN` có `tieu_de`, `noi_dung`, hoặc `the_tags` chứa từ khóa (LIKE insensitive) → giới hạn `limit` bản ghi → 3. **Format:** cắt `noi_dung` lấy 150 ký tự đầu làm `mo_dau`, loại bỏ `noi_dung` gốc → 4. Trả về danh sách gọn |
| 23 | `/kb` | Lấy danh sách bài viết tri thức | GET | **Query:** `page`, `limit` (max 50), `loai_su_co`, `the`, `trang_thai` (NHAP/DA_XUAT_BAN), `sort` (luot_xem/luot_huu_ich/ngay_tao, default: ngay_tao) | `{ success, message, data: [...baiViet], total, page, limit }` | `verifyToken` | 401 Token không hợp lệ | 1. Validate query → 2. **Phân quyền xem mềm:** NGUOI_YEU_CAU/IT_L1 → cố định filter `trang_thai = DA_XUAT_BAN`; IT_L2/QUAN_LY → dùng tham số `trang_thai` từ query → 3. Áp dụng filter `loai_su_co`, `the_tags` → 4. Build `orderBy` theo `sort` → 5. Query DB với phân trang → trả về |
| 24 | `/kb/:id` | Xem chi tiết bài viết (tăng lượt xem, chống đếm trùng) | GET | **Param:** `id` (int) | `{ success, message, data: { ...baiViet đầy đủ kèm tac_gia, danh_sach_tep } }` | `verifyToken` | 403 Bài nháp — không đủ quyền · 404 Bài viết không tồn tại | 1. Tìm bài viết trong DB → 404 → 2. **Phân quyền bài nháp:** `trang_thai = NHAP` → không phải IT_L2/QUAN_LY VÀ không phải tác giả → 403 → 3. **Chống đếm view trùng (Redis):** `redis.GET(kb_view:{id}:{userId})` → chưa tồn tại → tăng `luot_xem` trong DB, `redis.SETEX` TTL 3600s → đã tồn tại → bỏ qua, không đếm → 4. Trả về chi tiết đầy đủ |
| 25 | `/kb` | Tạo bài viết tri thức mới | POST | **Body multipart/form-data:** `tieu_de` (≥5 ký tự), `noi_dung` (≥20 ký tự), `loai_su_co`, `the_tags`, `trang_thai` (NHAP/DA_XUAT_BAN), `quyen_xem` (CONG_KHAI/NOI_BO, default: NOI_BO), `phieu_ho_tro_id` (tùy chọn); **Files:** `files[]` (≤10 file) | HTTP 201. `{ success, message, data: { ...baiViet mới } }` | `verifyToken`, `checkRole(['IT_L2','QUAN_LY'])`, `upload.array('files', 10)` | 400 Thiếu trường bắt buộc · 403 Không phải IT_L2/QUAN_LY | 1. Validate body → 2. Lấy `userId` từ JWT → gán `tac_gia_id` → 3. Xử lý file từ Multer buffer: `saveMemoryFileToDisk(f, 'kb')` → UUID rename → ghi vào `/uploads/kb/` → tạo metadata → 4. Tạo bản ghi bài viết + file records trong DB → 5. Trả về bài viết mới |
| 26 | `/kb/:id` | Cập nhật nội dung bài viết tri thức | PUT | **Param:** `id` (int); **Body JSON:** `tieu_de`, `noi_dung`, `loai_su_co`, `the_tags`, `trang_thai`, `quyen_xem` — tất cả tùy chọn | `{ success, message, data: { ...baiViet đã cập nhật } }` | `verifyToken`, `checkRole(['IT_L2','QUAN_LY'])` | 403 Không phải tác giả hoặc không có quyền · 404 Bài viết không tồn tại | 1. Tìm bài viết trong DB → 404 → 2. **Kiểm tra tác giả:** `tac_gia_id ≠ userId` VÀ không phải QUAN_LY → 403 → 3. Cập nhật các trường được truyền vào (partial update) → 4. Trả về bài viết đã cập nhật |
| 27 | `/kb/:id/feedback` | Đánh giá độ hữu ích (Rate Limit Redis 24h) | POST | **Param:** `id` (int); **Body JSON:** `huu_ich` (boolean, bắt buộc) | `{ success, message, data: { luot_huu_ich (đã cập nhật) } }` | `verifyToken` | 404 Bài viết không tồn tại · 429 Đã đánh giá trong 24h | 1. Tìm bài viết → 404 → 2. **Chống spam vote (Redis):** `redis.GET(kb_feedback:{id}:{userId})` → đã tồn tại → 429 Too Many Requests → 3. Cập nhật `luot_huu_ich` trong DB: `huu_ich=true` → tăng; `huu_ich=false` → giảm → 4. `redis.SETEX(kb_feedback:{id}:{userId}, 86400, '1')` TTL 24h → 5. Trả về số `luot_huu_ich` mới |

---

## ⏱️ Nhóm 6: SLA — `/api/v1/sla`

> **Router file:** `src/routes/sla.routes.ts`
> **Toàn bộ nhóm:** `router.use(verifyToken, checkRole(['QUAN_LY']))`

| # | Endpoint | Mô tả | Method | Input | Output | Middleware | Errors | Logic End-to-End |
|---|----------|-------|--------|-------|--------|-----------|--------|-----------------|
| 28 | `/sla/policies` | Lấy danh sách chính sách SLA | GET | **Query:** `trang_thai` (enum: active/inactive, tùy chọn) | `{ success, message, data: [...chinhSachSla] }` | `verifyToken`, `checkRole(['QUAN_LY'])` _(router.use)_ | 401 Không phải QUAN_LY | 1. Validate query → 2. Build `where`: `active` → `trang_thai=true`, `inactive` → `trang_thai=false`, không truyền → lấy tất cả → 3. Query bảng `ChinhSachSla` → 4. Trả về danh sách |
| 29 | `/sla/policies` | Tạo chính sách SLA mới | POST | **Body JSON:** `ten_chinh_sach` (string, ≥3 ký tự), `loai_thoi_gian` (enum: GIO_HANH_CHINH/H24_7), `muc_do_uu_tien` (enum: CAO/TRUNG_BINH/THAP), `tg_phan_hoi` (int, >0 phút), `tg_xu_ly` (int, >0 phút) | HTTP 201. `{ success, message, data: { ...chinh_sach mới } }` | `verifyToken`, `checkRole(['QUAN_LY'])` _(router.use)_ | 400 Thông tin không hợp lệ · 409 Đã có SLA active cùng mức ưu tiên | 1. Validate body (Zod đảm bảo thời gian >0) → 2. **Kiểm tra xung đột:** tìm SLA `trang_thai=true` cho `muc_do_uu_tien` này → 409 nếu đã có (tối đa 1 policy active per mức ưu tiên) → 3. Tạo mới với `trang_thai = true` → 4. Trả về policy mới |
| 30 | `/sla/policies/:id` | Cập nhật chính sách SLA | PUT | **Param:** `id` (int); **Body JSON:** `ten_chinh_sach`, `loai_thoi_gian`, `tg_phan_hoi`, `tg_xu_ly`, `trang_thai` (boolean) — tất cả tùy chọn | `{ success, message, data: { ...chinh_sach đã cập nhật } }` | `verifyToken`, `checkRole(['QUAN_LY'])` _(router.use)_ | 400 Thời gian ≤ 0 · 404 ID không tồn tại · 409 Trùng ưu tiên khi kích hoạt | 1. Tìm policy theo ID → 404 → 2. **Nếu `trang_thai = true`:** kiểm tra xung đột với policy active khác cùng mức ưu tiên (exclude chính nó) → 409 nếu có → 3. Cập nhật các trường được truyền vào DB → 4. Trả về policy đã cập nhật |

---

## 🛡️ Nhóm 7: Admin — `/api/v1/admin`

> **Router file:** `src/routes/admin.routes.ts`
> **Toàn bộ nhóm:** `router.use(verifyToken, checkRole(['QUAN_LY']))`

| # | Endpoint | Mô tả | Method | Input | Output | Middleware | Errors | Logic End-to-End |
|---|----------|-------|--------|-------|--------|-----------|--------|-----------------|
| 31 | `/admin/users` | Lấy danh sách nhân viên toàn hệ thống | GET | **Query:** `page` (int, default 1), `limit` (int, max 100), `vai_tro_id` (int), `nhom_ho_tro_id` (int), `trang_thai` (boolean), `keyword` (string) | `{ success, message, data: [...nhanVien (không có mat_khau)], pagination }` | `verifyToken`, `checkRole(['QUAN_LY'])` _(router.use)_ | 401 Không phải QUAN_LY | 1. Validate query → 2. Build `where` từ params: `keyword` → OR filter LIKE trên `ho_ten`, `email`, `tai_khoan` → 3. Query bảng `NhanVien` với phân trang, join `vai_tro`, `phong_ban`, `nhom_ho_tro` → 4. Loại trường `mat_khau` khỏi kết quả → 5. Trả về danh sách |
| 32 | `/admin/users` | Tạo tài khoản nhân viên mới | POST | **Body JSON:** `ho_ten` (string, ≥2 ký tự), `email` (email format), `tai_khoan` (string, ≥3 ký tự), `mat_khau` (Regex: ≥8 ký tự + chữ hoa + thường + số + ký tự đặc biệt), `vai_tro_id` (int), `phong_ban_id` (int), `nhom_ho_tro_id` (int, tùy chọn) | HTTP 201. `{ success, message, data: { ...nhanVien mới (không có mat_khau) } }` | `verifyToken`, `checkRole(['QUAN_LY'])` _(router.use)_ | 400 Mật khẩu không đạt Regex · 409 Email hoặc tài khoản đã tồn tại | 1. Validate body (Regex mật khẩu: ≥8 ký tự, có chữ hoa, thường, số, ký tự đặc biệt `@$!%*?&`) → 2. Kiểm tra `email` VÀ `tai_khoan` chưa tồn tại trong DB → 409 nếu trùng → 3. `bcrypt.hash(mat_khau, 12)` → 4. Tạo bản ghi `NhanVien` với `trang_thai = true` → 5. Trả về user mới (bỏ `mat_khau`) |
| 33 | `/admin/users/:id` | Cập nhật thông tin nhân viên (bao gồm khóa/mở tài khoản) | PUT | **Param:** `id` (int); **Body JSON:** `ho_ten`, `vai_tro_id`, `phong_ban_id`, `nhom_ho_tro_id`, `trang_thai` (boolean) — tất cả tùy chọn | `{ success, message, data: { ...nhanVien đã cập nhật } }` | `verifyToken`, `checkRole(['QUAN_LY'])` _(router.use)_ | 400 Dữ liệu không hợp lệ · 403 Manager tự khóa tài khoản chính mình · 404 Nhân viên không tồn tại | 1. Tìm user theo ID → 404 → 2. **Chốt bảo mật:** nếu `trang_thai = false` VÀ `targetUserId = currentManagerId` → 403 (chống headless system) → 3. Cập nhật các trường được truyền vào DB → 4. Trả về user đã cập nhật |
| 34 | `/admin/roles` | Lấy danh sách vai trò và quyền hạn | GET | _(Không có input)_ | `{ success, message, data: [{ vai_tro_id, ma_vai_tro, ten_vai_tro, quyen_han (JSON array) }] }` | `verifyToken`, `checkRole(['QUAN_LY'])` _(router.use)_ | 401 Không phải QUAN_LY | 1. Query toàn bộ bảng `VaiTro` → 2. Trả về danh sách kèm trường `quyen_han` (JSON array string) |
| 35 | `/admin/roles/:id/permissions` | Cập nhật danh sách quyền hạn cho một vai trò | PUT | **Param:** `id` (int); **Body JSON:** `quyen_han` (string[], ≥1 phần tử, bắt buộc) | `{ success, message, data: { ...vai_tro đã cập nhật } }` | `verifyToken`, `checkRole(['QUAN_LY'])` _(router.use)_ | 400 Danh sách quyền rỗng · 404 Vai trò không tồn tại | 1. Validate body (mảng string không rỗng) → 2. Tìm vai trò theo ID → 404 → 3. Cập nhật trường `quyen_han` (JSON array) trong DB → 4. Trả về vai trò đã cập nhật |
| 36 | `/admin/teams` | Lấy danh sách nhóm hỗ trợ kèm thành viên | GET | _(Không có input)_ | `{ success, message, data: [{ nhom_ho_tro_id, ten_nhom, mo_ta, so_thanh_vien, thanh_vien: [...] }] }` | `verifyToken`, `checkRole(['QUAN_LY'])` _(router.use)_ | 401 Không phải QUAN_LY | 1. Query bảng `NhomHoTro` kèm `_count.danh_sach_it` và join danh sách thành viên (không có `mat_khau`) → 2. Format: map sang object với `so_thanh_vien` → 3. Trả về danh sách nhóm |
| 37 | `/admin/teams/:id/members` | Cập nhật thành viên nhóm hỗ trợ (Replace toàn bộ) | PUT | **Param:** `id` (int); **Body JSON:** `nhan_vien_ids` (int[], bắt buộc) | `{ success, message, data: { ...nhom đã cập nhật } }` | `verifyToken`, `checkRole(['QUAN_LY'])` _(router.use)_ | 400 Dữ liệu không hợp lệ · 404 Nhóm hoặc nhân viên không tồn tại | 1. Validate body → 2. Kiểm tra nhóm tồn tại → 404 → 3. **Replace toàn bộ:** `updateMany` set `nhom_ho_tro_id = null` cho tất cả thành viên cũ → `updateMany` set `nhom_ho_tro_id = teamId` cho danh sách ID mới → 4. Trả về nhóm đã cập nhật |
| 38 | `/admin/departments` | Lấy danh sách phòng ban | GET | _(Không có input)_ | `{ success, message, data: [{ phong_ban_id, ten_phong_ban, so_nhan_vien, truong_phong }] }` | `verifyToken`, `checkRole(['QUAN_LY'])` _(router.use)_ | 401 Không phải QUAN_LY | 1. Query bảng `PhongBan` kèm `_count.danh_sach_nv` và join `truong_phong` → 2. Format: map sang object với `so_nhan_vien` và `truong_phong.ho_ten` → 3. Trả về danh sách phòng ban |

---

## 🔔 Nhóm 8: Notifications — `/api/v1/notifications`

> **Router file:** `src/routes/notification.routes.ts`
> **Toàn bộ nhóm:** `router.use(verifyToken)`

| # | Endpoint | Mô tả | Method | Input | Output | Middleware | Errors | Logic End-to-End |
|---|----------|-------|--------|-------|--------|-----------|--------|-----------------|
| 39 | `/notifications` | Lấy danh sách thông báo của user hiện tại | GET | **Query:** `page` (int, default 1), `limit` (int, max 100, default 10), `da_doc` (boolean, tùy chọn) | `{ success, message, data: [...thongBao], so_chua_doc, pagination }` | `verifyToken` _(router.use)_ | 401 Chưa xác thực | 1. Lấy `userId` từ JWT → 2. Build `where`: bắt buộc `nguoi_nhan_id = userId`, tùy chọn filter `da_doc` → 3. Query DB song song: đếm tổng `da_doc = false` (số chưa đọc) + lấy danh sách phân trang → 4. Chuẩn hóa key: `thong_bao_id` → `notification_id` → 5. Trả về data + `so_chua_doc` + pagination |
| 40 | `/notifications/read-all` | Đánh dấu tất cả thông báo của user là đã đọc | PUT | _(Không có input)_ | `{ success, message, data: { so_da_cap_nhat: N } }` | `verifyToken` _(router.use)_ | 401 Chưa xác thực | 1. Lấy `userId` từ JWT → 2. `updateMany` tất cả thông báo `nguoi_nhan_id = userId` → set `da_doc = true` → 3. Prisma trả về `{ count: N }` → map sang `{ so_da_cap_nhat: N }` → 4. Trả về |
| 41 | `/notifications/:id/read` | Đánh dấu một thông báo là đã đọc | PUT | **Param:** `id` (int, ID thông báo) | `{ success, message, data: { notification_id, da_doc: true } }` | `verifyToken` _(router.use)_ | 401 Chưa xác thực · 403 Không phải thông báo của bạn · 404 Thông báo không tồn tại | 1. Parse & validate `id` → 2. Tìm thông báo theo ID → 404 → 3. **Bảo mật:** `nguoi_nhan_id ≠ userId` → 403 → 4. Cập nhật `da_doc = true` trong DB → 5. Trả về `{ notification_id, da_doc: true }` |

> **Lưu ý thứ tự route:** `/read-all` được đăng ký TRƯỚC `/:id/read` để tránh Express parse nhầm literal `read-all` thành tham số `:id`.

---

## 📊 Tóm tắt tổng hợp

### Thống kê theo nhóm

| Nhóm | Router | Số API | Middleware mặc định |
|------|--------|--------|---------------------|
| Authentication | `/api/v1/auth` | 5 | Tùy endpoint (Public / verifyToken) |
| Tickets | `/api/v1/tickets` | 11 | `verifyToken` + `checkRole(...)` (phân quyền mềm) |
| Attachments | `/api/v1/attachments` | 2 | `verifyToken` + `checkRole(...)` |
| Reviews | `/api/v1/reviews` | 3 | Public (validate-token + submit) / `verifyToken+checkRole` (xem) |
| KnowledgeBase | `/api/v1/kb` | 6 | `verifyToken` (phân quyền mềm theo role) |
| SLA | `/api/v1/sla` | 3 | `router.use(verifyToken, checkRole(['QUAN_LY']))` |
| Admin | `/api/v1/admin` | 8 | `router.use(verifyToken, checkRole(['QUAN_LY']))` |
| Notifications | `/api/v1/notifications` | 3 | `router.use(verifyToken)` |
| **Tổng** | | **41** | |

### HTTP Status Codes

| Status | Ý nghĩa |
|--------|---------|
| 200 | Thành công (GET, PUT, DELETE) |
| 201 | Tạo mới thành công (POST) |
| 400 | Lỗi validate Zod / tham số không hợp lệ / sai workflow |
| 401 | Chưa xác thực (thiếu/sai Access Token) |
| 403 | Không đủ quyền truy cập |
| 404 | Không tìm thấy tài nguyên |
| 409 | Xung đột dữ liệu (đã tồn tại / ticket đã đóng / SLA trùng) |
| 429 | Rate Limit — Redis anti-spam (KB feedback) |

### Các cơ chế kỹ thuật đặc biệt

| Cơ chế | Endpoint áp dụng | Mô tả |
|--------|-----------------|-------|
| **Redis Refresh Token** | Login, Logout, Refresh | Lưu `{token → nhan_vien_id}` TTL 7 ngày |
| **Redis Anti-Spam View** | `GET /kb/:id` | Key `kb_view:{id}:{userId}` TTL 1h |
| **Redis Anti-Spam Vote** | `POST /kb/:id/feedback` | Key `kb_feedback:{id}:{userId}` TTL 24h |
| **DB Sequence Lock (ma_phieu)** | `POST /tickets` | `MaPhieuSequence.upsert` trong transaction — loại bỏ Race Condition |
| **Priority Matrix** | `POST /tickets` | `calculatePriority(impact, urgency)` → Enum: THAP/TRUNG_BINH/CAO |
| **SLA Business Hours** | `POST /tickets` | `addBusinessMinutes()` — Chỉ tính giờ hành chính, bỏ qua T7/CN |
| **Stop/Pause/Resume SLA** | `PUT /tickets/:id/status` | CHO_PHAN_HOI → Pause; Back to DANG_GIAI_QUYET → Resume + tịnh tiến `han_chot` |
| **Trace ID Audit Log** | Mọi thao tác ghi lịch sử | `crypto.randomUUID()` → `LichSuPhieu.trace_id` |
| **Nodemailer Background Email** | `PUT /tickets/:id/status` → DA_GIAI_QUYET | Gửi email khảo sát không `await` (chạy nền) |
| **Crypto Review Token** | `PUT /tickets/:id/status` → DA_GIAI_QUYET | `crypto.randomBytes(32).toString('hex')` |
| **Auto L2 Escalation** | `POST /reviews` (không hài lòng lần 3+) | `so_lan_mo_lai > 2` → tự chuyển nhóm L2 |
| **Load Balancing Auto-Assign** | `POST /tickets` | Tìm IT_L1 đang hoạt động có ít ticket nhất (tie-breaker: rảnh lâu hơn) |
| **Socket.IO Realtime** | Escalate, Reopen, Comment, Assign | Emit event vào room `group_{id}` / `ticket_{id}` |
| **Multer Memory + UUID rename** | Upload file | Buffer RAM → UUID rename → ghi disk |
| **bcrypt Password Hash** | Login, Tạo user | Salt rounds = 12 |
| **Zod Schema Validation** | Tất cả endpoint có body/query | Validate trước khi vào Service layer |
