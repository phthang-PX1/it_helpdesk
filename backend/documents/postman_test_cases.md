# 🧪 BỘ TEST CASE API (POSTMAN) - IT HELPDESK MAP PACIFIC
*Tài liệu này được trích xuất 100% dựa trên các tệp mã nguồn mới nhất ở backend (`src/routes`, `src/validators`, `src/services`), hoàn toàn bỏ qua các tài liệu có thể đã lỗi thời.*

---

## 1. 🔐 MODULE AUTHENTICATION (`/api/v1/auth`)

### 1.1 Đăng nhập hệ thống (POST `/auth/login`)
- **Happy Path:**
  - **Body JSON:** `{ "tai_khoan": "user1", "mat_khau": "password123" }`
  - **Expected:** HTTP `200 OK`. Trả về Access Token, Refresh Token (lưu Redis TTL 7 ngày), user info (có `vai_tro`, `phong_ban`).
- **Unhappy Path:**
  - **Lỗi 400 (Zod):** Body rỗng hoặc thiếu `tai_khoan` / `mat_khau`.
  - **Lỗi 401:** Sai tài khoản, sai mật khẩu, hoặc `trang_thai = false` (tài khoản bị khóa).
  - **Lỗi 403:** Tài khoản chưa được gán vai trò (`vai_tro_id = null`).

### 1.2 Refresh Token (POST `/auth/refresh`)
- **Happy Path:**
  - **Body JSON:** `{ "refresh_token": "chuỗi-token-từ-redis" }`
  - **Expected:** HTTP `200 OK`. Cấp Access Token mới (không cấp lại Refresh Token).
- **Unhappy Path:**
  - **Lỗi 400:** Zod validation thiếu `refresh_token`.
  - **Lỗi 401:** Token không khớp với Redis, hoặc Token đã bị Logout/Thu hồi.

---

## 2. 🎫 MODULE TICKET WORKFLOW (`/api/v1/tickets`)
*(Yêu cầu Headers: `Authorization: Bearer <Access Token>`)*

### 2.1 Tạo phiếu hỗ trợ (POST `/tickets`)
- **Quyền yêu cầu:** Chỉ `NGUOI_YEU_CAU`.
- **Happy Path:**
  - **Body form-data:** 
    - `tieu_de`: "Máy in kẹt giấy"
    - `mo_ta_chi_tiet`: "Mô tả ít nhất 10 ký tự"
    - `muc_do_anh_huong`: `TRUNG_BINH`
    - `muc_do_khan_cap`: `CAO`
    - `files`: Đính kèm 1-5 file PDF/JPG.
  - **Expected:** HTTP `201 Created`. Priority sinh ra là CAO (Trung Bình x Cao). `ma_phieu` sinh tự động qua DB Lock. SLA được cấp ngay lập tức. Hệ thống tự động gán cho IT_L1 đang xử lý ít ticket nhất.
- **Unhappy Path:**
  - **Lỗi 400:** Tiêu đề < 5 ký tự, mô tả < 10 ký tự, enum ưu tiên sai chính tả. Vượt quá 5 file hoặc quá 20MB/file.
  - **Lỗi 403:** Login bằng tài khoản IT_L1 hoặc QUAN_LY.

### 2.2 Xem chi tiết phiếu (GET `/tickets/:id`)
- **Quyền yêu cầu:** Bất kỳ Role nào.
- **Happy Path:**
  - **Expected:** HTTP `200 OK`. Trả về kèm SLA, người xử lý, danh sách bình luận.
- **Unhappy Path:**
  - **Lỗi 403:** `NGUOI_YEU_CAU` cố tình nhập `:id` của một vé do user khác tạo.
  - **Lỗi 404:** Nhập mã ID không có trên DB.

### 2.3 Cập nhật trạng thái & Tạm dừng SLA (PUT `/tickets/:id/status`)
- **Quyền yêu cầu:** `IT_L1`, `IT_L2`, `QUAN_LY`.
- **Happy Path 1 (Tạm dừng):** 
  - **Body:** `{ "trang_thai": "CHO_PHAN_HOI", "ghi_chu": "Chờ mua linh kiện" }`
  - **Expected:** HTTP `200 OK`. DB tự động sinh `trace_id` mới. Thời gian SLA bị phong tỏa (`thoi_diem_tam_dung` = NOW).
- **Happy Path 2 (Đóng phiếu):**
  - **Body:** `{ "trang_thai": "DA_GIAI_QUYET", "ghi_chu": "Đã xong" }`
  - **Expected:** HTTP `200 OK`. Hệ thống chạy nền Nodemailer gửi mail Khảo Sát có đính kèm `review_token`.
- **Unhappy Path:**
  - **Lỗi 403:** IT_L1 cố đổi trạng thái vé do một IT_L1 khác phụ trách (`nguoi_ho_tro_id` không khớp).
  - **Lỗi 409:** Ticket đã ở trạng thái `DA_DONG` (vĩnh viễn không thể đổi).

### 2.4 Chuyển cấp L2 (POST `/tickets/:id/escalate`)
- **Quyền yêu cầu:** Chỉ `IT_L1`.
- **Happy Path:**
  - **Body:** `{ "ly_do": "Khó quá cần anh em L2 giúp (min 10 ký tự)", "cac_buoc_da_thu": "Đã reset máy (min 10 ký tự)" }`
  - **Expected:** HTTP `200 OK`. Ticket nhảy sang Group L2, `nguoi_ho_tro_id` reset về Null. Socket.IO phát Alert.
- **Unhappy Path:**
  - **Lỗi 400:** Lý do < 10 ký tự. Ticket đang không ở trạng thái DANG_GIAI_QUYET.
  - **Lỗi 403:** Kỹ thuật viên không trực tiếp xử lý vé này.

### 2.5 Bình luận - Chống lọt lộ dữ liệu (POST `/tickets/:id/comments`)
- **Quyền yêu cầu:** Mọi Role.
- **Happy Path 1 (Public):** `{ "noi_dung": "A", "loai_binh_luan": "public" }` → Mọi người đều xem được.
- **Happy Path 2 (Internal):** IT_L1 gửi `{ "loai_binh_luan": "internal" }` → Ghi nhận `QuyenXem.NOI_BO`.
- **Unhappy Path:**
  - **Lỗi 403:** NGUOI_YEU_CAU cố gửi body `loai_binh_luan: "internal"`.
  - **Lỗi 409:** Cố bình luận vào Ticket đã `DA_DONG`.

---

## 3. ⭐ MODULE ĐÁNH GIÁ DỊCH VỤ (`/api/v1/reviews`)

### 3.1 Gửi Form Khảo Sát (POST `/reviews`)
- **Quyền yêu cầu:** Public (Không cần Token).
- **Happy Path:**
  - **Body:** `{ "token": "chuỗi-crypto-hex", "hai_long": true, "so_sao": 5 }`
  - **Expected:** HTTP `200 OK`. Ticket tự chuyển thành `DA_DONG`.
- **Unhappy Path 1 (Phạt lỗi):** 
  - **Body:** `{ "token": "chuỗi", "hai_long": false, "so_sao": 1 }` (KHÔNG điền `ly_do_khong_hai_long`).
  - **Expected:** HTTP `400 Bad Request`. Bẫy lỗi của Zod bắt buộc phải điền lý do khi `hai_long = false`.
- **Unhappy Path 2 (Tự chuyển cấp):**
  - **Body:** `{ "hai_long": false, "ly_do_khong_hai_long": "Chưa xong", "so_sao": 1 }`
  - **Expected:** HTTP `200 OK`. Tự động Reopen (Mở lại phiếu). Nếu ticket bị reopen > 2 lần, hệ thống tự tước quyền IT hiện tại và đẩy ticket lên thẳng cho Group L2.
- **Unhappy Path 3:**
  - **Lỗi 404:** Token sai hoặc Token đã được sử dụng 1 lần (đánh giá 1 lần duy nhất).

---

## 4. 📚 MODULE TRI THỨC - KB (`/api/v1/kb`)

### 4.1 Lấy danh sách KB (GET `/kb`)
- **Quyền yêu cầu:** Mọi Role.
- **Happy Path:**
  - NGUOI_YEU_CAU: Chỉ thấy bài viết `DA_XUAT_BAN`.
  - QUAN_LY: Truyền Query `?trang_thai=NHAP` để thấy bài viết nháp.
- **Unhappy Path:** N/A.

### 4.2 Chi tiết KB & Redis View/Spam (GET `/kb/:id`)
- **Quyền yêu cầu:** Mọi Role.
- **Happy Path:**
  - Lần 1: Xem chi tiết → HTTP 200. `luot_xem` trong DB + 1. Key Redis TTL 3600s được tạo.
  - Lần 2 (Trong vòng 1 tiếng): Xem lại → HTTP 200. Nhưng `luot_xem` KHÔNG tăng.
- **Unhappy Path:**
  - **Lỗi 403:** NGUOI_YEU_CAU cố xem 1 ID bài viết đang ở trạng thái `NHAP`.

### 4.3 Đánh giá hữu ích (POST `/kb/:id/feedback`)
- **Quyền yêu cầu:** Mọi Role.
- **Happy Path:** `{ "huu_ich": true }` → Tăng vote. Redis sinh khóa TTL 24 tiếng.
- **Unhappy Path (Rate Limit):** 
  - **Lỗi 429 Too Many Requests:** Spam click gọi lại API lần 2 trong vòng 24h.

---

## 5. ⏱️ MODULE SLA (`/api/v1/sla`)

### 5.1 Tạo Policy SLA (POST `/sla/policies`)
- **Quyền yêu cầu:** Chỉ `QUAN_LY`.
- **Happy Path:**
  - **Body:** `{ "ten_chinh_sach": "SLA CAO", "loai_thoi_gian": "H24_7", "muc_do_uu_tien": "CAO", "tg_phan_hoi": 15, "tg_xu_ly": 240 }`
  - **Expected:** HTTP `201 Created`.
- **Unhappy Path:**
  - **Lỗi 400:** Thời gian xử lý là số âm, hoặc bằng 0.
  - **Lỗi 409 Conflict:** Đã có 1 Policy khác dành cho `CAO` đang `active`. Không thể tồn tại 2 Policy active cùng 1 mức ưu tiên.

---

## 6. 🛡️ MODULE ADMIN QUẢN TRỊ (`/api/v1/admin`)

### 6.1 Tạo Nhân viên (POST `/admin/users`)
- **Quyền yêu cầu:** Chỉ `QUAN_LY`.
- **Unhappy Path (Test Bảo Mật Zod):**
  - **Body:** `{ "mat_khau": "123456" }`
  - **Expected:** HTTP `400 Bad Request`. Mật khẩu bắt buộc Regex 8 ký tự, 1 Hoa, 1 Thường, 1 Số, 1 Đặc biệt.
  - **Lỗi 409:** Trùng `tai_khoan` hoặc `email` với nhân viên đã có.

### 6.2 Cập nhật Nhân viên (PUT `/admin/users/:id`)
- **Quyền yêu cầu:** Chỉ `QUAN_LY`.
- **Unhappy Path (Chốt bảo mật chặn khóa mình):**
  - Hành động: Quản lý đăng nhập và cố gọi PUT vào chính ID của mình, truyền body `{ "trang_thai": false }`.
  - **Expected:** HTTP `403 Forbidden`. Core code chặn không cho Manager tự khóa tài khoản của bản thân để tránh việc hệ thống bị "mất đầu" (Headless).
