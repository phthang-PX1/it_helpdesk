# 📋 Tài Liệu Kiểm Thử API — IT Helpdesk Map Pacific Singapore

> **Phiên bản:** v2.0 | **Ngày:** 2026-05-30  
> **Tổng số API:** 41 endpoints | **Tổng số Test Case:** 170+  
> **Base URL:** `http://localhost:3000/api/v1`  
> **Mật khẩu mặc định seed:** `Mappacific@2025`

---

## 🔑 Tài Khoản Kiểm Thử (Từ Seed Data)

| Role | Tài khoản | Email | Ghi chú |
|---|---|---|---|
| `NGUOI_YEU_CAU` | `sales1` | `sales1@mappacific.com` | Token chính cho requester |
| `IT_L1` | `huyentld23406` | `huyentld23406@st.uel.edu.vn` | Token IT_L1 chính |
| `IT_L1` #2 | `ravi.kumar` | `ravi.kumar@mappacific.com` | Dùng cho assign test |
| `IT_L2` | `vanbtt23406` | `vanbtt23406@st.uel.edu.vn` | Token IT_L2 chính |
| `IT_L2` #2 | `siti.rahimah` | `siti.rahimah@mappacific.com` | Token IT_L2 khác nhóm |
| `QUAN_LY` | `thangpq23406` | `thangpq23406@st.uel.edu.vn` | Token Manager |
| Bị khóa | `locked_user` | `locked.user@mappacific.com` | Tài khoản bị vô hiệu hóa |

---

## 🔐 Nhóm 1: Authentication — `/api/v1/auth`

### TC-AUTH-001 | Login thành công (NGUOI_YEU_CAU)
- **Endpoint:** `POST /auth/login`
- **Precondition:** Server đang chạy, user `sales1` tồn tại trong DB
- **Input:** `{ "tai_khoan": "sales1", "mat_khau": "Mappacific@2025" }`
- **Expected:** HTTP 200, trả về `{ data: { token, refresh_token, user } }`, `user` không có `mat_khau`
- **Auto-script:** Lưu `accessToken` (requesterToken), `refreshToken` vào collection variable

### TC-AUTH-002 | Login thành công (IT_L1)
- **Endpoint:** `POST /auth/login`
- **Input:** `{ "tai_khoan": "huyentld23406", "mat_khau": "Mappacific@2025" }`
- **Expected:** HTTP 200, trả về token hợp lệ
- **Auto-script:** Lưu `itL1Token` vào collection variable

### TC-AUTH-003 | Login thành công (IT_L2)
- **Endpoint:** `POST /auth/login`
- **Input:** `{ "tai_khoan": "vanbtt23406", "mat_khau": "Mappacific@2025" }`
- **Expected:** HTTP 200
- **Auto-script:** Lưu `itL2Token`

### TC-AUTH-004 | Login thành công (QUAN_LY)
- **Endpoint:** `POST /auth/login`
- **Input:** `{ "tai_khoan": "thangpq23406", "mat_khau": "Mappacific@2025" }`
- **Expected:** HTTP 200
- **Auto-script:** Lưu `managerToken`

### TC-AUTH-005 | Login thành công (IT_L2 #2)
- **Endpoint:** `POST /auth/login`
- **Input:** `{ "tai_khoan": "siti.rahimah", "mat_khau": "Mappacific@2025" }`
- **Expected:** HTTP 200
- **Auto-script:** Lưu `otherItL2Token`

### TC-AUTH-006 | Login — sai mật khẩu
- **Endpoint:** `POST /auth/login`
- **Input:** `{ "tai_khoan": "sales1", "mat_khau": "SaiMatKhau@999" }`
- **Expected:** HTTP 401, có `message`

### TC-AUTH-007 | Login — tài khoản không tồn tại
- **Endpoint:** `POST /auth/login`
- **Input:** `{ "tai_khoan": "user_khong_ton_tai", "mat_khau": "Mappacific@2025" }`
- **Expected:** HTTP 401

### TC-AUTH-008 | Login — tài khoản bị khóa
- **Endpoint:** `POST /auth/login`
- **Input:** `{ "tai_khoan": "locked_user", "mat_khau": "Mappacific@2025" }`
- **Expected:** HTTP 401, message đề cập tài khoản bị khóa

### TC-AUTH-009 | Login — thiếu tai_khoan
- **Endpoint:** `POST /auth/login`
- **Input:** `{ "mat_khau": "Mappacific@2025" }`
- **Expected:** HTTP 400, Zod validation error

### TC-AUTH-010 | Login — body rỗng
- **Endpoint:** `POST /auth/login`
- **Input:** `{}`
- **Expected:** HTTP 400

### TC-AUTH-011 | GET /me — lấy thông tin cá nhân
- **Endpoint:** `GET /auth/me`
- **Header:** `Authorization: Bearer {{requesterToken}}`
- **Expected:** HTTP 200, data có `nhan_vien_id`, `ho_ten`, `email`, `vai_tro`, không có `mat_khau`

### TC-AUTH-012 | GET /me — không có token
- **Endpoint:** `GET /auth/me`
- **Expected:** HTTP 401

### TC-AUTH-013 | Refresh Token thành công
- **Endpoint:** `POST /auth/refresh`
- **Input:** `{ "refresh_token": "{{refreshToken}}" }`
- **Expected:** HTTP 200, trả về `token` mới, KHÔNG có `refresh_token` mới
- **Auto-script:** Cập nhật `requesterToken` với token mới

### TC-AUTH-014 | Refresh Token — token không hợp lệ
- **Endpoint:** `POST /auth/refresh`
- **Input:** `{ "refresh_token": "invalid_token_xyz" }`
- **Expected:** HTTP 401

### TC-AUTH-015 | Logout thành công
- **Endpoint:** `POST /auth/logout`
- **Header:** `Authorization: Bearer {{requesterToken}}`
- **Input:** `{ "refresh_token": "{{refreshToken}}" }`
- **Expected:** HTTP 200, message bao gồm "thành công"

### TC-AUTH-016 | Login lại sau logout (re-acquire token)
- **Endpoint:** `POST /auth/login`
- **Input:** `{ "tai_khoan": "sales1", "mat_khau": "Mappacific@2025" }`
- **Expected:** HTTP 200
- **Auto-script:** Cập nhật lại `requesterToken`, `refreshToken`

---

## 🎫 Nhóm 2: Tickets — `/api/v1/tickets`

> **Lưu ý:** Folder này chạy theo thứ tự để tạo workflow hoàn chỉnh.  
> Ticket được tạo ở TC-TKT-001 sẽ được sử dụng xuyên suốt các TC tiếp theo.

### TC-TKT-001 | Tạo ticket thành công — AI tự đánh giá mức độ (không truyền impact/urgency)
- **Endpoint:** `POST /tickets`
- **Header:** `Authorization: Bearer {{requesterToken}}`
- **Body (form-data):**
  - `tieu_de`: "Toàn bộ hệ thống email công ty bị ngắt kết nối từ sáng"
  - `mo_ta_chi_tiet`: "Không gửi hoặc nhận được email, ảnh hưởng toàn bộ nhân viên văn phòng Singapore"
- **Expected:** HTTP 201, `muc_do_uu_tien` được tự động set bởi Gemini AI, `ma_phieu` có format `SW-YYYY-N`
- **Auto-script:** Lưu `ticketId` = `data.phieu_ho_tro_id`

### TC-TKT-002 | Tạo ticket thành công — truyền đầy đủ mức độ
- **Endpoint:** `POST /tickets`
- **Header:** `Authorization: Bearer {{requesterToken}}`
- **Body (form-data):**
  - `tieu_de`: "Lỗi không in được tài liệu tại phòng sales"
  - `mo_ta_chi_tiet`: "Máy in tầng 3 không nhận lệnh in từ hôm qua sáng"
  - `muc_do_anh_huong`: TRUNG_BINH
  - `muc_do_khan_cap`: CAO
- **Expected:** HTTP 201, `muc_do_uu_tien = CAO` (TRUNG_BINH × CAO = CAO theo ma trận), SLA deadlines có mặt
- **Auto-script:** Lưu `ticketId2`

### TC-TKT-003 | Tạo ticket — Priority Matrix: Impact=CAO + Urgency=CAO → Priority=CAO
- **Endpoint:** `POST /tickets`
- **Body (form-data):** `muc_do_anh_huong=CAO`, `muc_do_khan_cap=CAO`, tiêu đề đủ dài
- **Expected:** HTTP 201, `muc_do_uu_tien = CAO`

### TC-TKT-004 | Tạo ticket — Priority Matrix: Impact=THAP + Urgency=THAP → Priority=THAP
- **Body (form-data):** `muc_do_anh_huong=THAP`, `muc_do_khan_cap=THAP`
- **Expected:** HTTP 201, `muc_do_uu_tien = THAP`

### TC-TKT-005 | Tạo ticket — Priority Matrix: Impact=CAO + Urgency=THAP → Priority=TRUNG_BINH
- **Body (form-data):** `muc_do_anh_huong=CAO`, `muc_do_khan_cap=THAP`
- **Expected:** HTTP 201, `muc_do_uu_tien = TRUNG_BINH`

### TC-TKT-006 | Tạo ticket — tieu_de < 5 ký tự
- **Body:** `tieu_de = "Lỗi"` (3 ký tự)
- **Expected:** HTTP 400, Zod error

### TC-TKT-007 | Tạo ticket — mo_ta_chi_tiet < 10 ký tự
- **Body:** `mo_ta_chi_tiet = "Lỗi nhỏ"` (7 ký tự)
- **Expected:** HTTP 400, Zod error

### TC-TKT-008 | Tạo ticket — sai enum muc_do_anh_huong
- **Body:** `muc_do_anh_huong = "INVALID_VALUE"`
- **Expected:** HTTP 400

### TC-TKT-009 | Tạo ticket — role IT_L1 bị từ chối
- **Header:** `Authorization: Bearer {{itL1Token}}`
- **Expected:** HTTP 403

### TC-TKT-010 | Tạo ticket — không có token
- **Expected:** HTTP 401

### TC-TKT-011 | Danh sách ticket — NGUOI_YEU_CAU chỉ thấy của mình
- **Endpoint:** `GET /tickets?page=1&limit=10`
- **Header:** `Authorization: Bearer {{requesterToken}}`
- **Expected:** HTTP 200, tất cả ticket trong data có `nguoi_tao_id` = currentUserId, có pagination

### TC-TKT-012 | Danh sách ticket — IT_L1 thấy ticket nhóm mình + được gán
- **Header:** `Authorization: Bearer {{itL1Token}}`
- **Expected:** HTTP 200, danh sách có thể rộng hơn

### TC-TKT-013 | Danh sách ticket — lọc theo trang_thai=MOI_TAO
- **Endpoint:** `GET /tickets?trang_thai=MOI_TAO`
- **Header:** `Authorization: Bearer {{managerToken}}`
- **Expected:** HTTP 200, tất cả item có `trang_thai = MOI_TAO`

### TC-TKT-014 | Danh sách ticket — lọc keyword
- **Endpoint:** `GET /tickets?keyword=email`
- **Expected:** HTTP 200, có ticket liên quan từ "email"

### TC-TKT-015 | Danh sách ticket — page < 1
- **Endpoint:** `GET /tickets?page=0`
- **Expected:** HTTP 400

### TC-TKT-016 | Chi tiết ticket — người tạo xem của mình
- **Endpoint:** `GET /tickets/{{ticketId}}`
- **Header:** `Authorization: Bearer {{requesterToken}}`
- **Expected:** HTTP 200, data có `danh_sach_sla`, `danh_sach_bl`, bình luận NOI_BO bị lọc bỏ

### TC-TKT-017 | Chi tiết ticket — NGUOI_YEU_CAU xem ticket người khác
- **Endpoint:** `GET /tickets/{{ticketId2}}` (ticket tạo bởi user khác)
- **Header:** `Authorization: Bearer {{otherRequesterToken}}`
- **Expected:** HTTP 403

### TC-TKT-018 | Chi tiết ticket — ID không tồn tại
- **Endpoint:** `GET /tickets/999999`
- **Expected:** HTTP 404

### TC-TKT-019 | Chi tiết ticket — ID không phải số
- **Endpoint:** `GET /tickets/abc`
- **Expected:** HTTP 400

### TC-TKT-020 | Cập nhật trạng thái: MOI_TAO → CHO_PHAN_HOI (trạng thái đặc biệt)
- **Endpoint:** `PUT /tickets/{{ticketId}}/status`
- **Header:** `Authorization: Bearer {{itL1Token}}`
- **Body:** `{ "trang_thai": "CHO_PHAN_HOI", "ghi_chu": "Chờ phản hồi thêm thông tin từ người dùng" }`
- **Expected:** HTTP 200, SLA được pause (`thoi_diem_tam_dung` được set)

### TC-TKT-021 | Cập nhật trạng thái: CHO_PHAN_HOI → DANG_GIAI_QUYET (resume)
- **Endpoint:** `PUT /tickets/{{ticketId}}/status`
- **Body:** `{ "trang_thai": "DANG_GIAI_QUYET" }`
- **Expected:** HTTP 200, SLA PHAN_HOI được đánh dấu `thoi_diem_dat`, `han_chot` SLA được đẩy thêm

### TC-TKT-022 | Cập nhật trạng thái: DANG_GIAI_QUYET → CHO_PHAN_HOI
- **Endpoint:** `PUT /tickets/{{ticketId}}/status`
- **Body:** `{ "trang_thai": "CHO_PHAN_HOI" }`
- **Expected:** HTTP 200

### TC-TKT-023 | Cập nhật trạng thái: CHO_PHAN_HOI → DANG_GIAI_QUYET (lần 2)
- **Expected:** HTTP 200

### TC-TKT-024 | Cập nhật trạng thái: DANG_GIAI_QUYET → DA_GIAI_QUYET
- **Body:** `{ "trang_thai": "DA_GIAI_QUYET", "ghi_chu": "Đã khắc phục xong sự cố email server" }`
- **Expected:** HTTP 200, SLA XU_LY được đánh dấu `thoi_diem_dat`, email đánh giá được gửi (background)
- **Auto-script:** Lưu `resolvedTicketId = ticketId`

### TC-TKT-025 | Chuyển trạng thái sai workflow: DA_GIAI_QUYET → CHO_PHAN_HOI (bị chặn)
- **Body:** `{ "trang_thai": "CHO_PHAN_HOI" }`
- **Expected:** HTTP 400, message mô tả lỗi workflow

### TC-TKT-026 | Chuyển trạng thái sai workflow: DA_GIAI_QUYET → DANG_GIAI_QUYET
- **Body:** `{ "trang_thai": "DANG_GIAI_QUYET" }`
- **Expected:** HTTP 400

### TC-TKT-027 | DA_GIAI_QUYET → DA_DONG
- **Body:** `{ "trang_thai": "DA_DONG" }`
- **Expected:** HTTP 200
- **Auto-script:** Lưu `closedTicketId`

### TC-TKT-028 | Cập nhật ticket đã DA_DONG
- **Body:** `{ "trang_thai": "DANG_GIAI_QUYET" }`
- **Expected:** HTTP 409

### TC-TKT-029 | Cập nhật trạng thái — IT không phụ trách
- **Precondition:** Dùng ticket được gán cho L1 khác
- **Header:** `Authorization: Bearer {{otherItL2Token}}`
- **Expected:** HTTP 403

### TC-TKT-030 | Cập nhật trạng thái — role NGUOI_YEU_CAU bị từ chối
- **Header:** `Authorization: Bearer {{requesterToken}}`
- **Expected:** HTTP 403

### TC-TKT-031 | Escalate ticket thành công
- **Endpoint:** `POST /tickets/{{ticketId2}}/escalate`
- **Precondition:** ticketId2 phải ở trạng thái DANG_GIAI_QUYET, được gán cho itL1
- **Header:** `Authorization: Bearer {{itL1Token}}`
- **Body:** `{ "ly_do": "Vấn đề phần cứng ngoài tầm xử lý của L1", "cac_buoc_da_thu": "Đã restart và cài lại driver nhưng không được" }`
- **Expected:** HTTP 200, `nhom_ho_tro_moi = L2`, Socket.IO emit đến group_2

### TC-TKT-032 | Escalate — ticket không ở DANG_GIAI_QUYET
- **Endpoint:** `POST /tickets/{{closedTicketId}}/escalate`
- **Expected:** HTTP 409

### TC-TKT-033 | Escalate — không phải IT_L1 đang phụ trách
- **Header:** `Authorization: Bearer {{otherItL2Token}}`
- **Expected:** HTTP 403

### TC-TKT-034 | Escalate — ly_do < 10 ký tự
- **Body:** `{ "ly_do": "Ngắn", "cac_buoc_da_thu": "Ngắn" }`
- **Expected:** HTTP 400

### TC-TKT-035 | Thêm bình luận public thành công
- **Endpoint:** `POST /tickets/{{ticketId2}}/comments`
- **Body (form-data):** `noi_dung = "Đã kiểm tra driver máy in, cần reset firmware"`, `loai_binh_luan = public`
- **Expected:** HTTP 201, `quyen_xem = CONG_KHAI`
- **Auto-script:** Lưu `commentId`

### TC-TKT-036 | Thêm bình luận internal (IT only)
- **Header:** `Authorization: Bearer {{itL1Token}}`
- **Body:** `noi_dung = "Ghi chú nội bộ: cần order phụ tùng từ kho"`, `loai_binh_luan = internal`
- **Expected:** HTTP 201, `quyen_xem = NOI_BO`

### TC-TKT-037 | Thêm bình luận internal — NGUOI_YEU_CAU bị từ chối
- **Header:** `Authorization: Bearer {{requesterToken}}`
- **Body:** `loai_binh_luan = internal`
- **Expected:** HTTP 403

### TC-TKT-038 | Thêm bình luận — ticket đã DA_DONG
- **Endpoint:** `POST /tickets/{{closedTicketId}}/comments`
- **Expected:** HTTP 409

### TC-TKT-039 | Lấy danh sách bình luận — NGUOI_YEU_CAU không thấy NOI_BO
- **Endpoint:** `GET /tickets/{{ticketId2}}/comments`
- **Header:** `Authorization: Bearer {{requesterToken}}`
- **Expected:** HTTP 200, không có bình luận nào có `quyen_xem = NOI_BO`

### TC-TKT-040 | Lấy danh sách bình luận — IT thấy cả NOI_BO
- **Header:** `Authorization: Bearer {{itL1Token}}`
- **Expected:** HTTP 200, có thể có bình luận NOI_BO

### TC-TKT-041 | Lấy lịch sử ticket
- **Endpoint:** `GET /tickets/{{ticketId}}/history`
- **Header:** `Authorization: Bearer {{managerToken}}`
- **Expected:** HTTP 200, array các `LichSuPhieu` có `trace_id`, `hanh_dong`, `gia_tri_cu`, `gia_tri_moi`

### TC-TKT-042 | Lấy lịch sử — NGUOI_YEU_CAU xem của mình
- **Header:** `Authorization: Bearer {{requesterToken}}`
- **Expected:** HTTP 200

### TC-TKT-043 | Assign ticket cho IT_L1 #2 thành công
- **Endpoint:** `PUT /tickets/{{ticketId2}}/assign`
- **Header:** `Authorization: Bearer {{managerToken}}`
- **Body:** `{ "nguoi_ho_tro_id": {{validItL1Id}} }` (ID của ravi.kumar)
- **Expected:** HTTP 200, `nguoi_ho_tro_moi = validItL1Id`, thông báo và Socket.IO emit

### TC-TKT-044 | Assign — role không phải QUAN_LY
- **Header:** `Authorization: Bearer {{itL1Token}}`
- **Expected:** HTTP 403

### TC-TKT-045 | Assign — KTV không thuộc nhóm đang xử lý ticket
- **Body:** `{ "nguoi_ho_tro_id": {{wrongGroupItId}} }` (ID của L2 trong khi ticket ở nhóm L1)
- **Expected:** HTTP 400

### TC-TKT-046 | Xem SLA real-time
- **Endpoint:** `GET /tickets/{{ticketId2}}/sla`
- **Header:** `Authorization: Bearer {{managerToken}}`
- **Expected:** HTTP 200, có `sla_phan_hoi` và `sla_xu_ly` với `han_chot`, `thoi_gian_con_lai_giay`, `da_vi_pham`

### TC-TKT-047 | Xem SLA — NGUOI_YEU_CAU bị từ chối
- **Header:** `Authorization: Bearer {{requesterToken}}`
- **Expected:** HTTP 403

### TC-TKT-048 | Reopen ticket thành công (lần 1) — gán lại người cũ
- **Endpoint:** `POST /tickets/{{resolvedTicketId}}/reopen`
- **Precondition:** `resolvedTicketId` là ticket đã DA_GIAI_QUYET (chưa đóng), trong vòng 48h
- **Header:** `Authorization: Bearer {{managerToken}}`
- **Body:** `{ "ly_do": "Sự cố vẫn còn, email vẫn chưa hoạt động" }`
- **Expected:** HTTP 200, `action = REOPENED`, `trang_thai = DANG_GIAI_QUYET`, `nguoi_ho_tro_id` được gán lại người cuối cùng xử lý, notification + email gửi đến người đó

### TC-TKT-049 | Reopen — ticket không ở DA_GIAI_QUYET
- **Endpoint:** `POST /tickets/{{closedTicketId}}/reopen`
- **Expected:** HTTP 400

### TC-TKT-050 | Reopen — role IT_L1 bị từ chối
- **Header:** `Authorization: Bearer {{itL1Token}}`
- **Expected:** HTTP 403

### TC-TKT-051 | Reopen — ly_do < 5 ký tự
- **Body:** `{ "ly_do": "Lỗi" }`
- **Expected:** HTTP 400

---

## 📎 Nhóm 3: Attachments — `/api/v1/attachments`

### TC-ATT-001 | Upload file đính kèm vào ticket thành công
- **Endpoint:** `POST /attachments/tickets/{{ticketId2}}`
- **Header:** `Authorization: Bearer {{requesterToken}}`
- **Body (form-data):** `files[]` — file ảnh hợp lệ (PNG/JPG < 20MB)
- **Expected:** HTTP 201, array file metadata có `ten_tep`, `duong_dan_file`, `dinh_dang`, `dung_luong_kb`
- **Auto-script:** Lưu `attachmentId = data[0].tep_dinh_kem_id`

### TC-ATT-002 | Upload — ticket không tồn tại
- **Endpoint:** `POST /attachments/tickets/999999`
- **Expected:** HTTP 404

### TC-ATT-003 | Upload — ticket đã DA_DONG
- **Endpoint:** `POST /attachments/tickets/{{closedTicketId}}`
- **Expected:** HTTP 409

### TC-ATT-004 | Upload — không có token
- **Expected:** HTTP 401

### TC-ATT-005 | Upload — không có file
- **Body:** form-data rỗng (không có `files[]`)
- **Expected:** HTTP 400

### TC-ATT-006 | Xóa file đính kèm thành công
- **Endpoint:** `DELETE /attachments/{{attachmentId}}`
- **Header:** `Authorization: Bearer {{requesterToken}}`
- **Expected:** HTTP 200, `success = true`

### TC-ATT-007 | Xóa file — không phải chủ sở hữu
- **Header:** `Authorization: Bearer {{otherItL2Token}}`
- **Expected:** HTTP 403

### TC-ATT-008 | Xóa file — file không tồn tại
- **Endpoint:** `DELETE /attachments/999999`
- **Expected:** HTTP 404

---

## ⭐ Nhóm 4: Reviews — `/api/v1/reviews`

> **Precondition:** Cần ticket đã ở trạng thái DA_GIAI_QUYET để có `reviewToken`.  
> `reviewToken` được tự động lưu sau TC-TKT-024.

### TC-REV-001 | Validate review token hợp lệ
- **Endpoint:** `GET /reviews/validate-token?token={{reviewToken}}`
- **Expected:** HTTP 200, trả về thông tin ticket `{ phieu_ho_tro_id, ma_phieu, tieu_de, trang_thai }`

### TC-REV-002 | Validate review token — token không hợp lệ
- **Endpoint:** `GET /reviews/validate-token?token=invalid_xyz_token`
- **Expected:** HTTP 404

### TC-REV-003 | Validate review token — thiếu token
- **Endpoint:** `GET /reviews/validate-token`
- **Expected:** HTTP 400

### TC-REV-004 | Gửi đánh giá hài lòng → Ticket đóng tự động
- **Endpoint:** `POST /reviews`
- **Body:** `{ "token": "{{reviewToken}}", "hai_long": true, "so_sao": 5, "nhan_xet": "IT giải quyết nhanh chóng, rất hài lòng" }`
- **Expected:** HTTP 200, `ket_qua = CLOSED`
- **Auto-script:** Lưu `reviewedTicketId`

### TC-REV-005 | Gửi đánh giá không hài lòng → Ticket reopen
- **Precondition:** Cần `reviewToken` khác (từ ticket DA_GIAI_QUYET thứ 2)
- **Body:** `{ "token": "{{reviewToken2}}", "hai_long": false, "so_sao": 2, "ly_do_khong_hai_long": "Xử lý quá chậm, vấn đề vẫn còn" }`
- **Expected:** HTTP 200, `ket_qua = REOPENED`

### TC-REV-006 | Gửi đánh giá — token đã dùng
- **Body:** `{ "token": "{{reviewToken}}", "hai_long": true, "so_sao": 4 }`
- **Expected:** HTTP 404

### TC-REV-007 | Gửi đánh giá — thiếu ly_do khi hai_long=false
- **Body:** `{ "hai_long": false, "so_sao": 1 }` (không có `ly_do_khong_hai_long`)
- **Expected:** HTTP 400

### TC-REV-008 | Gửi đánh giá — so_sao ngoài khoảng 1-5
- **Body:** `{ "so_sao": 6, "hai_long": true }`
- **Expected:** HTTP 400

### TC-REV-009 | Xem đánh giá ticket — IT_L1 có quyền
- **Endpoint:** `GET /reviews/{{reviewedTicketId}}`
- **Header:** `Authorization: Bearer {{itL1Token}}`
- **Expected:** HTTP 200, data có `hai_long`, `so_sao`, `nhan_xet`, `nguoi_danh_gia`

### TC-REV-010 | Xem đánh giá — NGUOI_YEU_CAU bị từ chối
- **Header:** `Authorization: Bearer {{requesterToken}}`
- **Expected:** HTTP 403

### TC-REV-011 | Xem đánh giá — ticket chưa có đánh giá
- **Endpoint:** `GET /reviews/{{ticketId2}}`
- **Expected:** HTTP 404

---

## 📚 Nhóm 5: Knowledge Base — `/api/v1/kb`

### TC-KB-001 | Tìm kiếm KB — có kết quả
- **Endpoint:** `GET /kb/search?q=máy+in&limit=5`
- **Header:** `Authorization: Bearer {{requesterToken}}`
- **Expected:** HTTP 200, array bài viết, mỗi item có `mo_dau` (150 ký tự), không có `noi_dung` đầy đủ

### TC-KB-002 | Tìm kiếm KB — từ khóa < 2 ký tự
- **Endpoint:** `GET /kb/search?q=a`
- **Expected:** HTTP 400

### TC-KB-003 | Tìm kiếm KB — không có kết quả
- **Endpoint:** `GET /kb/search?q=xyzabc12345notexist`
- **Expected:** HTTP 200, `data = []`

### TC-KB-004 | Danh sách KB — IT_L2 thấy cả NHAP và DA_XUAT_BAN
- **Endpoint:** `GET /kb?page=1&limit=10`
- **Header:** `Authorization: Bearer {{itL2Token}}`
- **Expected:** HTTP 200, có thể thấy bài nháp

### TC-KB-005 | Danh sách KB — NGUOI_YEU_CAU chỉ thấy DA_XUAT_BAN
- **Header:** `Authorization: Bearer {{requesterToken}}`
- **Expected:** HTTP 200, tất cả item có `trang_thai = DA_XUAT_BAN`

### TC-KB-006 | Danh sách KB — lọc loai_su_co
- **Endpoint:** `GET /kb?loai_su_co=hardware`
- **Expected:** HTTP 200

### TC-KB-007 | Danh sách KB — sort theo luot_xem
- **Endpoint:** `GET /kb?sort=luot_xem`
- **Expected:** HTTP 200

### TC-KB-008 | Xem chi tiết bài KB — tăng lượt xem
- **Endpoint:** `GET /kb/{{kbArticleId}}`
- **Header:** `Authorization: Bearer {{itL1Token}}`
- **Expected:** HTTP 200, `luot_xem` tăng lên 1 (chống đếm trùng Redis)

### TC-KB-009 | Xem chi tiết KB lần 2 — không tăng lượt xem (Redis TTL 1h)
- **Endpoint:** `GET /kb/{{kbArticleId}}`
- **Expected:** HTTP 200, `luot_xem` giữ nguyên

### TC-KB-010 | Xem chi tiết KB — bài nháp với NGUOI_YEU_CAU bị từ chối
- **Endpoint:** `GET /kb/{{draftKbId}}`
- **Header:** `Authorization: Bearer {{requesterToken}}`
- **Expected:** HTTP 403

### TC-KB-011 | Tạo bài KB thành công
- **Endpoint:** `POST /kb`
- **Header:** `Authorization: Bearer {{itL2Token}}`
- **Body (form-data):** `tieu_de = "Hướng dẫn khắc phục lỗi máy in kẹt giấy"`, `noi_dung = "Các bước xử lý chuẩn khi máy in báo lỗi kẹt giấy..."`, `loai_su_co = "hardware"`, `trang_thai = DA_XUAT_BAN`
- **Expected:** HTTP 201
- **Auto-script:** Lưu `kbArticleId`

### TC-KB-012 | Tạo bài KB — role NGUOI_YEU_CAU bị từ chối
- **Header:** `Authorization: Bearer {{requesterToken}}`
- **Expected:** HTTP 403

### TC-KB-013 | Tạo bài KB — noi_dung < 20 ký tự
- **Body:** `noi_dung = "Nội dung ngắn"`
- **Expected:** HTTP 400

### TC-KB-014 | Cập nhật bài KB — tác giả có quyền
- **Endpoint:** `PUT /kb/{{kbArticleId}}`
- **Header:** `Authorization: Bearer {{itL2Token}}`
- **Body:** `{ "tieu_de": "Hướng dẫn khắc phục lỗi máy in kẹt giấy (cập nhật)" }`
- **Expected:** HTTP 200, `tieu_de` đã thay đổi

### TC-KB-015 | Cập nhật bài KB — không phải tác giả, không phải QUAN_LY
- **Header:** `Authorization: Bearer {{otherItL2Token}}`
- **Expected:** HTTP 403

### TC-KB-016 | Feedback KB — hữu ích (rate limit 24h)
- **Endpoint:** `POST /kb/{{kbArticleId}}/feedback`
- **Body:** `{ "huu_ich": true }`
- **Expected:** HTTP 200, `luot_huu_ich` tăng

### TC-KB-017 | Feedback KB — spam vote lần 2 trong 24h (Rate Limit)
- **Endpoint:** `POST /kb/{{kbArticleId}}/feedback`
- **Body:** `{ "huu_ich": true }`
- **Expected:** HTTP 429

---

## ⏱️ Nhóm 6: SLA Policies — `/api/v1/sla`

> **Lưu ý:** Tất cả API SLA chỉ dành cho `QUAN_LY`.

### TC-SLA-001 | Lấy danh sách SLA — không filter
- **Endpoint:** `GET /sla/policies`
- **Header:** `Authorization: Bearer {{managerToken}}`
- **Expected:** HTTP 200, array các policy

### TC-SLA-002 | Lấy danh sách SLA — filter active
- **Endpoint:** `GET /sla/policies?trang_thai=active`
- **Expected:** HTTP 200, tất cả item có `trang_thai = true`

### TC-SLA-003 | Lấy danh sách SLA — filter inactive
- **Endpoint:** `GET /sla/policies?trang_thai=inactive`
- **Expected:** HTTP 200, tất cả item có `trang_thai = false`

### TC-SLA-004 | Lấy SLA — role không phải QUAN_LY bị từ chối
- **Header:** `Authorization: Bearer {{itL1Token}}`
- **Expected:** HTTP 403

### TC-SLA-005 | Tạo SLA mới thành công
- **Endpoint:** `POST /sla/policies`
- **Header:** `Authorization: Bearer {{managerToken}}`
- **Body:** `{ "ten_chinh_sach": "SLA Test CAO-24/7", "loai_thoi_gian": "H24_7", "muc_do_uu_tien": "CAO", "tg_phan_hoi": 15, "tg_xu_ly": 240 }`
- **Precondition:** Không có SLA active nào cho cặp (CAO, H24_7)
- **Expected:** HTTP 201, `trang_thai = true`
- **Auto-script:** Lưu `slaId`

### TC-SLA-006 | Tạo SLA — conflict (cùng mức độ ưu tiên + loại thời gian đang active)
- **Body:** `{ "muc_do_uu_tien": "CAO", "loai_thoi_gian": "H24_7", ... }` (trùng với TC-SLA-005)
- **Expected:** HTTP 409

### TC-SLA-007 | Tạo SLA — thiếu trường bắt buộc
- **Body:** thiếu `tg_phan_hoi`
- **Expected:** HTTP 400

### TC-SLA-008 | Tạo SLA — tg_phan_hoi <= 0
- **Body:** `{ "tg_phan_hoi": 0 }`
- **Expected:** HTTP 400

### TC-SLA-009 | Tạo SLA — loai_thoi_gian khác nhau, cùng mức độ (không conflict)
- **Body:** `{ "muc_do_uu_tien": "CAO", "loai_thoi_gian": "GIO_HANH_CHINH", ... }`
- **Expected:** HTTP 201 (vì loại thời gian khác nhau, không conflict)

### TC-SLA-010 | Cập nhật SLA thành công
- **Endpoint:** `PUT /sla/policies/{{slaId}}`
- **Body:** `{ "tg_phan_hoi": 20, "ten_chinh_sach": "SLA Test CAO-24/7 (updated)" }`
- **Expected:** HTTP 200, `tg_phan_hoi = 20`

### TC-SLA-011 | Cập nhật SLA — ID không tồn tại
- **Endpoint:** `PUT /sla/policies/999999`
- **Expected:** HTTP 404

### TC-SLA-012 | Cập nhật SLA — vô hiệu hóa (trang_thai = false)
- **Body:** `{ "trang_thai": false }`
- **Expected:** HTTP 200, `trang_thai = false`

### TC-SLA-013 | Cập nhật SLA — kích hoạt lại conflict
- **Precondition:** SLA khác cùng cặp (priority, time_type) đang active
- **Body:** `{ "trang_thai": true }`
- **Expected:** HTTP 409

---

## 🛡️ Nhóm 7: Admin — `/api/v1/admin`

> **Lưu ý:** Tất cả API Admin chỉ dành cho `QUAN_LY`.

### TC-ADM-001 | Lấy danh sách nhân viên
- **Endpoint:** `GET /admin/users?page=1&limit=10`
- **Header:** `Authorization: Bearer {{managerToken}}`
- **Expected:** HTTP 200, không có `mat_khau` trong response, có pagination

### TC-ADM-002 | Danh sách nhân viên — lọc keyword
- **Endpoint:** `GET /admin/users?keyword=sales`
- **Expected:** HTTP 200, danh sách nhân viên phòng Sales

### TC-ADM-003 | Danh sách nhân viên — lọc trang_thai=true
- **Endpoint:** `GET /admin/users?trang_thai=true`
- **Expected:** HTTP 200, tất cả nhân viên có `trang_thai = true`

### TC-ADM-004 | Danh sách nhân viên — role IT_L1 bị từ chối
- **Header:** `Authorization: Bearer {{itL1Token}}`
- **Expected:** HTTP 403

### TC-ADM-005 | Tạo tài khoản nhân viên mới thành công
- **Endpoint:** `POST /admin/users`
- **Header:** `Authorization: Bearer {{managerToken}}`
- **Body:** `{ "ho_ten": "Test New Employee", "email": "test.new.emp@mappacific.com", "tai_khoan": "test.new.emp", "mat_khau": "NewPass@123", "vai_tro_id": 1, "phong_ban_id": 2 }`
- **Expected:** HTTP 201, không có `mat_khau` trong response
- **Auto-script:** Lưu `newUserId`

### TC-ADM-006 | Tạo tài khoản — email đã tồn tại
- **Body:** Email của user đã có trong DB (VD: `sales1@mappacific.com`)
- **Expected:** HTTP 409

### TC-ADM-007 | Tạo tài khoản — tai_khoan đã tồn tại
- **Body:** `tai_khoan = "sales1"` (đã tồn tại)
- **Expected:** HTTP 409

### TC-ADM-008 | Tạo tài khoản — mat_khau không đạt chuẩn regex
- **Body:** `mat_khau = "weakpassword"` (thiếu ký tự đặc biệt, chữ hoa)
- **Expected:** HTTP 400

### TC-ADM-009 | Cập nhật thông tin nhân viên
- **Endpoint:** `PUT /admin/users/{{newUserId}}`
- **Body:** `{ "ho_ten": "Test Employee Updated" }`
- **Expected:** HTTP 200, `ho_ten` đã thay đổi

### TC-ADM-010 | Khóa tài khoản nhân viên
- **Endpoint:** `PUT /admin/users/{{newUserId}}`
- **Body:** `{ "trang_thai": false }`
- **Expected:** HTTP 200, `trang_thai = false`

### TC-ADM-011 | Manager tự khóa tài khoản mình — bị chặn
- **Endpoint:** `PUT /admin/users/{{managerId}}`
- **Body:** `{ "trang_thai": false }`
- **Expected:** HTTP 403

### TC-ADM-012 | Cập nhật nhân viên không tồn tại
- **Endpoint:** `PUT /admin/users/999999`
- **Expected:** HTTP 404

### TC-ADM-013 | Lấy danh sách vai trò
- **Endpoint:** `GET /admin/roles`
- **Expected:** HTTP 200, có 4 role (`NGUOI_YEU_CAU`, `IT_L1`, `IT_L2`, `QUAN_LY`), mỗi role có `quyen_han`
- **Auto-script:** Lưu `roleId = data[0].vai_tro_id`

### TC-ADM-014 | Cập nhật quyền hạn vai trò
- **Endpoint:** `PUT /admin/roles/{{roleId}}/permissions`
- **Body:** `{ "quyen_han": ["ticket:create", "ticket:view_own", "kb:view"] }`
- **Expected:** HTTP 200, `quyen_han` đã cập nhật

### TC-ADM-015 | Cập nhật quyền — quyen_han rỗng
- **Body:** `{ "quyen_han": [] }`
- **Expected:** HTTP 400

### TC-ADM-016 | Lấy danh sách nhóm hỗ trợ
- **Endpoint:** `GET /admin/teams`
- **Expected:** HTTP 200, có 2 nhóm (L1, L2), mỗi nhóm có `so_thanh_vien`, `thanh_vien`
- **Auto-script:** Lưu `teamId = data[0].nhom_ho_tro_id`

### TC-ADM-017 | Cập nhật thành viên nhóm hỗ trợ
- **Endpoint:** `PUT /admin/teams/{{teamId}}/members`
- **Body:** `{ "nhan_vien_ids": [{{itL1Id}}, {{itL1Id2}}] }`
- **Expected:** HTTP 200

### TC-ADM-018 | Cập nhật thành viên — nhóm không tồn tại
- **Endpoint:** `PUT /admin/teams/999999/members`
- **Expected:** HTTP 404

### TC-ADM-019 | Lấy danh sách phòng ban
- **Endpoint:** `GET /admin/departments`
- **Expected:** HTTP 200, có 7 phòng ban, mỗi phòng ban có `so_nhan_vien`, `truong_phong`

---

## 🔔 Nhóm 8: Notifications — `/api/v1/notifications`

### TC-NOTIF-001 | Lấy danh sách thông báo của user
- **Endpoint:** `GET /notifications?page=1&limit=10`
- **Header:** `Authorization: Bearer {{itL1Token}}`
- **Expected:** HTTP 200, data có `notification_id` (không phải `thong_bao_id`), có `so_chua_doc`
- **Auto-script:** Lưu `notificationId = data[0].notification_id` (nếu có)

### TC-NOTIF-002 | Lấy thông báo — lọc chưa đọc
- **Endpoint:** `GET /notifications?da_doc=false`
- **Expected:** HTTP 200, tất cả item có `da_doc = false`

### TC-NOTIF-003 | Lấy thông báo — không có token
- **Expected:** HTTP 401

### TC-NOTIF-004 | Đánh dấu một thông báo là đã đọc
- **Endpoint:** `PUT /notifications/{{notificationId}}/read`
- **Header:** `Authorization: Bearer {{itL1Token}}`
- **Expected:** HTTP 200, `da_doc = true`

### TC-NOTIF-005 | Đánh dấu thông báo — thông báo của người khác
- **Header:** `Authorization: Bearer {{managerToken}}` (token khác chủ thông báo)
- **Expected:** HTTP 403

### TC-NOTIF-006 | Đánh dấu thông báo — ID không tồn tại
- **Endpoint:** `PUT /notifications/999999/read`
- **Expected:** HTTP 404

### TC-NOTIF-007 | Đánh dấu TẤT CẢ thông báo là đã đọc
- **Endpoint:** `PUT /notifications/read-all`
- **Header:** `Authorization: Bearer {{itL1Token}}`
- **Expected:** HTTP 200, `so_da_cap_nhat >= 0`

### TC-NOTIF-008 | Xác nhận sau read-all — so_chua_doc = 0
- **Endpoint:** `GET /notifications?da_doc=false`
- **Expected:** HTTP 200, `data = []` hoặc `so_chua_doc = 0`

---

## 📊 Tổng Kết Test Coverage

| Nhóm | Số TC | Happy Path | Error Path |
|---|---|---|---|
| Authentication | 16 | 5 | 11 |
| Tickets | 51 | 20 | 31 |
| Attachments | 8 | 2 | 6 |
| Reviews | 11 | 4 | 7 |
| Knowledge Base | 17 | 8 | 9 |
| SLA Policies | 13 | 5 | 8 |
| Admin | 19 | 8 | 11 |
| Notifications | 8 | 3 | 5 |
| **Tổng** | **143** | **55** | **88** |

---

## 🔄 Thứ Tự Chạy Collection Runner

```
Folder 00 — Setup: Login All Roles
  → TC-AUTH-001 (Requester) → lưu requesterToken
  → TC-AUTH-002 (IT_L1)    → lưu itL1Token
  → TC-AUTH-003 (IT_L2)    → lưu itL2Token
  → TC-AUTH-004 (Manager)  → lưu managerToken
  → TC-AUTH-005 (IT_L2 #2) → lưu otherItL2Token
  → TC-AUTH-006 (IT_L1 #2) → lưu itL1TokenAlt

Folder 01 — Authentication (test error cases)

Folder 02 — Tickets (chạy theo thứ tự workflow)
  → Tạo ticket (TC-TKT-001) → lưu ticketId
  → Workflow ticket: MOI_TAO → CHO_PHAN_HOI → DANG_GIAI_QUYET → DA_GIAI_QUYET → DA_DONG
  → Escalate ticket khác
  → Comment, History, Assign, SLA
  → Reopen

Folder 03 — Attachments
Folder 04 — Reviews (cần reviewToken từ Folder 02)
Folder 05 — Knowledge Base
Folder 06 — SLA Policies
Folder 07 — Admin
Folder 08 — Notifications
```
