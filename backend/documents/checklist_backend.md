# 🚀 CHECKLIST TRIỂN KHAI BACKEND HELPDESK (DÀNH CHO NGƯỜI MỚI)

## 📌 QUY TẮC VÀNG (LUÔN GHI NHỚ TRƯỚC KHI CODE)
- [ ] **Zod First:** Luôn viết Schema kiểm tra dữ liệu đầu vào (Zod) trước khi viết logic.
- [ ] **Layer Isolation:** Tuyệt đối tuân thủ luồng: `Route` -> `Controller` -> `Service` -> `Repository`.
- [ ] **No Raw Prisma:** Không viết lệnh gọi database (`prisma.create`, `prisma.findMany`) trực tiếp trong file Service.
- [ ] **AppError Center:** Mọi lỗi nghiệp vụ phải được ném ra qua custom class `AppError` để Middleware tổng xử lý. 

---

## 🌟 PHASE 1: FOUNDATION – KHỞI TẠO DỰ ÁN & MÓNG (1-2 Tuần)
*Mục tiêu: Dựng xong khung xương, kết nối Database, làm API Đăng nhập và Swagger.*

### Bước 1.1: Khởi tạo Project
- [X] Chạy `npm init -y` để tạo dự án Node.js.
- [X] Cài đặt thư viện lõi: `express - Framework web phổ biến cho Node.js, giúp tạo server và định nghĩa route`, `dotenv - Dùng để quản lý biến môi trường qua file .env`, `cors - Cho phép hoặc chặn truy cập từ domain khác`, `nodemon - Tự động restart server mỗi khi bạn thay đổi file `.
- [X] Dựng cấu trúc thư mục chuẩn: `routes/ - định nghĩa endpoint`, `controllers/ - logic xử lý cho từng request`, `services/ - business logic`, `repositories/ - hàm làm việc trực tiếp với database`, `middlewares/ - hàm chạy trước khi request tới controller  `.

### Bước 1.2: Thiết lập Prisma & Database
- [X] Cài đặt PostgreSQL 16, tạo Database trống trên pgadmin4
- [X] Cài đặt Prisma ORM ` thư viện @prisma/client phục vụ việc query, công cụ Prisma CLI dưới dạng công cụ phát triển`. Cấu hình chuỗi kết nối PostgreSQL 16 trong file `.env`.
- [X] Khai báo đủ 12 bảng (từ ERD) vào file `schema.prisma` kèm theo các khóa ngoại.
- [X] Chạy lệnh `npx prisma migrate dev` để tạo bảng thực tế dưới Database.

### Bước 1.3: Dữ liệu mồi (Seed Data)
- [X] Dùng thư viện `faker để sinh dữ liệu thật`
- [X] Viết script `seed.js` để bơm sẵn các Vai trò (Role) và Phòng ban mặc định vào DB. `clear` dùng để xóa dữ liệu giả lập
- [X] Chạy lệnh `npx prisma db seed` để đẩy dữ liệu.

### Bước 1.4: Phân quyền & Đăng nhập (UC-01)
- [ ] Viết API `POST /api/v1/auth/login`. So sánh mật khẩu bằng `bcrypt`.
- [ ] Cấp phát Token bằng `jsonwebtoken` (JWT) chứa ID và Vai trò của user.

### Bước 1.5: Middleware Bảo vệ
- [ ] Viết `verifyToken` để chặn request không có thẻ đăng nhập hợp lệ.
- [ ] Viết `checkRole` để chặn quyền truy cập (VD: Khách không được vào API của IT).
- [ ] Viết `errorHandler` để xử lý lỗi trung tâm.

### Bước 1.6: Tài liệu API (Swagger)
- [ ] Cài đặt `swagger-ui-express` và `swagger-jsdoc`. 
- [ ] Khai báo Swagger cho các API nhóm Auth để test thử giao diện tự động.

---

## 🎫 PHASE 2: CORE – TICKET & FILE UPLOAD (2-3 Tuần)
*Mục tiêu: Cho phép người dùng tạo phiếu hỗ trợ, đính kèm file và bình luận.*

### Bước 2.1: API Tạo phiếu hỗ trợ (UC-02)
- [ ] Viết API `POST /api/v1/tickets`. Tự động sinh mã phiếu (VD: `SW-2026-0001`).
- [ ] Auto-assign: Tự động tìm IT L1 đang rảnh để gán vào phiếu.

### Bước 2.2: Tích hợp Đính kèm file
- [ ] Cài đặt thư viện `multer`. Viết logic chặn file nguy hiểm, giới hạn dung lượng 20MB.
- [ ] Viết API lưu thông tin file vào bảng `tep_dinh_kem`.

### Bước 2.3: API Bình luận
- [ ] Viết API `POST /api/v1/tickets/:id/comments`.
- [ ] Tích hợp kiểm tra quyền: Phân biệt bình luận công khai (Khách thấy) và ghi chú nội bộ (Chỉ IT thấy).

### Bước 2.4: API Danh sách & Chi tiết
- [ ] Viết `GET /api/v1/tickets` có tính năng phân trang (`page`, `limit`) và bộ lọc.
- [ ] Viết `GET /api/v1/tickets/:id` dùng tính năng `include` của Prisma để lấy phiếu kèm theo toàn bộ bình luận và file.

---

## 🧠 PHASE 3: ADVANCED – TỰ ĐỘNG SLA & CHUYỂN CẤP (2-3 Tuần)
*Mục tiêu: Đưa não bộ nghiệp vụ vào hệ thống (Chuyển cấp, Reopen, Audit Log).*

### Bước 3.1: Nhúng logic tự động SLA
- [ ] Cập nhật API Tạo phiếu: Tra bảng `chinh_sach_sla` để lấy số phút theo độ ưu tiên.
- [ ] Tính toán thời gian bắt đầu và kết thúc, lưu vào bảng `sla_theo_doi`.

### Bước 3.2: Ghi Audit Log tự động (UC-03)
- [ ] Viết helper lưu lịch sử. Bắt buộc chèn 1 dòng vào `lich_su_phieu` mỗi khi phiếu bị đổi trạng thái hoặc đổi người xử lý.

### Bước 3.3: Logic Chuyển cấp L1 -> L2 (UC-08)
- [ ] Viết API `POST /api/v1/tickets/:id/escalate`.
- [ ] Logic: Đổi nhóm xử lý sang L2, ghi log lý do chuyển cấp.

### Bước 3.4: Đánh giá & Reopen (UC-04, UC-05)
- [ ] Viết API nhận số sao (1-5 sao) khi đóng phiếu.
- [ ] Logic: Nếu khách rate 1-2 sao và `so_lan_mo_lai <= 2`, tự động chuyển trạng thái phiếu về lại "Đang xử lý". Nếu >2, ép chuyển cấp lên L2.

---

## 🤖 PHASE 4: AUTOMATION & REALTIME (1-2 Tuần)
*Mục tiêu: Robot chạy ngầm và thông báo theo thời gian thực.*

### Bước 4.1: Robot chạy ngầm (Node-cron)
- [ ] Cài `node-cron`. Viết script tự động đóng phiếu (Auto-close) sau 48h nếu khách không phản hồi.
- [ ] Viết script tự động cảnh báo khi thời gian SLA chỉ còn 20%.

### Bước 4.2: Cơ sở Tri thức (UC-06)
- [ ] Viết CRUD API cho bảng `co_so_tri_thuc`.
- [ ] Tích hợp tính năng tìm kiếm bài viết bằng từ khóa (Full-text search).

### Bước 4.3: Realtime với Socket.IO (Có thể làm sau cùng)
- [ ] Cài đặt `socket.io`. Phát thông báo ngay lập tức về trình duyệt khi có bình luận mới hoặc phiếu bị đổi trạng thái.

---

## 📊 PHASE 5: POLISH – THỐNG KÊ & BÁO CÁO (1 Tuần)
*Mục tiêu: Làm màn hình cho Quản lý và hoàn thiện dự án.*

### Bước 5.1: Dashboard Thống kê (UC-12)
- [ ] Viết API `GET /api/v1/dashboard/stats`. Dùng tính năng `groupBy` và `count` của Prisma để tính tổng số phiếu, tỷ lệ vi phạm SLA, KPI nhân viên.

### Bước 5.2: Xuất Báo cáo (UC-15)
- [ ] Viết API dùng thư viện `exceljs` để xuất dữ liệu bảng thống kê ra file Excel cho người dùng tải về.

### Bước 5.3: Hoàn thiện Error Handling & Testing
- [ ] Dọn dẹp các dòng `console.log` thừa. Đảm bảo mọi API đều bọc qua khối Try/Catch an toàn.