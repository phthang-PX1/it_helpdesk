# IT Helpdesk System — Map Pacific Singapore

Hệ thống quản lý phiếu hỗ trợ kỹ thuật nội bộ dành cho công ty Map Pacific Singapore. 
Dự án được xây dựng với kiến trúc Client-Server hiện đại, chia làm 2 phần Frontend và Backend hoàn toàn độc lập.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 18, Vite, TypeScript
- **Routing:** React Router DOM
- **State Management:** React Context API
- **Styling:** CSS thuần (BEM methodology)
- **Deployment:** Vercel (Tự động build CI/CD từ GitHub)

### Backend
- **Framework:** Node.js 18+, Express 5, TypeScript
- **Database ORM:** Prisma 6
- **Database System:** PostgreSQL (Supabase)
- **Cache / Session:** Redis (Quản lý Refresh Token & Rate Limit)
- **Authentication:** JWT (Access Token 8h + Refresh Token 7d), Google OAuth2
- **Validation:** Zod
- **API Documentation:** Swagger UI (tại `/api-docs`)
- **Deployment:** Render (Web Service kết nối trực tiếp GitHub)

---

## 🚀 Hướng dẫn Triển khai (Cloud Deployment)

Dự án hiện đã được thiết lập để triển khai hoàn toàn tự động và miễn phí trên Cloud qua quy trình CI/CD.

### 1. Database (Supabase)
- Tạo project trên Supabase (PostgreSQL).
- Lấy chuỗi kết nối `DATABASE_URL` (hỗ trợ connection pooling).

### 2. Cache (Redis)
- Khởi tạo một Redis instance miễn phí trên Render hoặc Upstash.
- Lấy `REDIS_URL` (Internal URL nếu dùng Render).

### 3. Backend (Render)
- Tạo Web Service trên Render, liên kết với thư mục `backend/` trong Github Repo.
- **Build Command:** `npm install && npx prisma generate && npm run build`
- **Start Command:** `npm start`
- **Environment Variables bắt buộc:**
  - `DATABASE_URL`: Đường dẫn kết nối Supabase
  - `REDIS_URL`: Đường dẫn kết nối Redis
  - `JWT_SECRET` & `REFRESH_JWT_SECRET`: Khóa bí mật mã hóa JWT
  - `GOOGLE_CLIENT_ID`: Client ID đăng nhập Google OAuth
  - `COMPANY_EMAIL_DOMAIN`: Các tên miền email công ty được phép đăng nhập (VD: `gmail.com,mappacific.com`)

### 4. Frontend (Vercel)
- Tạo Framework Preset là Vite, đặt Root Directory là thư mục `frontend/`.
- **Environment Variables bắt buộc:**
  - `VITE_API_URL`: Đường dẫn của Web Service Backend trên Render (VD: `https://your-backend.onrender.com/api/v1`). Không cần thiết lập biến này ở local.

---

## 💻 Hướng dẫn Chạy Local (Development)

### 1. Yêu cầu Hệ thống
- Node.js >= 18.x
- PostgreSQL và Redis (Khuyên dùng Docker Compose được tích hợp sẵn: `docker compose up -d`)

### 2. Thiết lập Backend
```bash
cd backend
npm install
```
- Copy file `.env.example` thành `.env` và điền cấu hình Database/Redis. Mặc định file đã khớp với config của Docker Compose.
- Khởi tạo cấu trúc Database và nạp dữ liệu mẫu:
```bash
npx prisma db push
npx prisma db seed
```
- Khởi chạy server:
```bash
npm run dev
```
*(Backend sẽ chạy tại `http://localhost:3000` và Swagger UI tại `http://localhost:3000/api-docs`)*

### 3. Thiết lập Frontend
```bash
cd frontend
npm install
```
- Khởi chạy giao diện:
```bash
npm run dev
```
*(Giao diện sẽ chạy tại `http://localhost:5173`)*

---

## 👥 Danh sách Tài khoản Kiểm thử (Demo Accounts)

Sau khi chạy script seed dữ liệu mẫu, cơ sở dữ liệu sẽ có sẵn 71 tài khoản chia làm 4 vai trò thực tế.

> **Mật khẩu dùng chung cho mọi tài khoản demo:** `Mappacific@2025`

| Vai trò (Role) | Tài khoản / Email tiêu biểu | Quyền hạn |
| :--- | :--- | :--- |
| **QUẢN LÝ (Manager)** | `thangpq23406` | Quản lý IT - Xem báo cáo Dashboard, cấu hình SLA, phân công phiếu và duyệt bài viết KB. |
| **IT Tuyến 1 (L1)** | `huyentld23406` / `ravi.kumar` | Hỗ trợ cấp 1 - Tiếp nhận phiếu, xử lý sự cố cơ bản, chuyển cấp lên L2 khi cần thiết. |
| **IT Tuyến 2 (L2)** | `vanbtt23406` / `siti.rahimah` | Hỗ trợ chuyên sâu - Nhận phiếu từ L1, xử lý sự cố phức tạp, soạn thảo Cơ sở tri thức (KB). |
| **NGƯỜI YÊU CẦU** | `sales1` / `fin1` / `ops1` | Nhân viên nghiệp vụ - Tạo phiếu yêu cầu hỗ trợ, theo dõi trạng thái, tham gia khảo sát đánh giá. |

---

## 🏗 Kiến trúc & Phân quyền (RBAC)

### Vòng đời Phiếu hỗ trợ (Ticket Lifecycle)
`MỚI TẠO` ➡️ `ĐANG GIẢI QUYẾT` ➡️ `ĐÃ GIẢI QUYẾT` ➡️ `ĐÃ ĐÓNG`

*(Quy tắc tự động: Nếu nhân viên đánh giá khảo sát là "Không hài lòng", phiếu sẽ tự động mở lại ở trạng thái `ĐANG GIẢI QUYẾT`. Nếu một phiếu bị mở lại quá 2 lần, hệ thống ép buộc phiếu phải được chuyển cấp sang nhóm L2 xử lý).*

### Backend Request Pipeline
Mọi Request gửi đến API đều đi qua đường ống chuẩn hóa:
`HTTP Request` ➡️ `Express Route` ➡️ `Middleware (Verify JWT + Role)` ➡️ `Controller` ➡️ `Zod Validator (Bắt lỗi Schema)` ➡️ `Service (Business Logic)` ➡️ `Prisma Repository` ➡️ `Database`

---
*Dự án Hệ thống quản lý sự cố kỹ thuật nội bộ (Helpdesk) - Đồ án Kiến tập Nhóm 4.*
