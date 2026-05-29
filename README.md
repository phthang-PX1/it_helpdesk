# IT Helpdesk System — Map Pacific Singapore

He thong quan ly phieu ho tro ky thuat noi bo cho cong ty Map Pacific Singapore.

---

## Cau truc thu muc (Backend)

```
backend/
├── prisma/
│   ├── schema.prisma           # Dinh nghia 12 models, 7 enums, toan bo quan he DB
│   ├── seed.js                 # Script seed du lieu mau (50+ nhan vien, 4 vai tro)
│   ├── clear.js                # Script xoa toan bo du lieu (dung khi reset testing)
│   └── migrations/             # Lich su migration Prisma
│
├── src/
│   ├── server.ts               # Entry point: Khoi tao Express, mount routes, Swagger
│   ├── controllers/            # Nhan Request, goi Service, tra Response
│   ├── services/               # Business Logic (quy tac nghiep vu, xu ly chinh)
│   ├── repositories/           # Tang truy van DB thuan tuy (Prisma ORM)
│   ├── routes/                 # Dinh nghia route + tai lieu Swagger (JSDoc)
│   ├── middlewares/            # verifyToken (JWT), checkRole (RBAC), errorHandler
│   ├── validators/             # Zod schema kiem tra dau vao
│   ├── libs/                   # prisma, redis, multer, email singletons
│   └── utils/                  # catchAsync wrapper
│
├── uploads/                    # Thu muc luu file vat ly (tickets/, attachments/, kb/)
├── .env                        # Bien moi truong (KHONG commit len Git)
├── seed_noti.js                # Script tao thong bao mau cho IT_L1 (dung khi testing)
├── package.json
└── tsconfig.json
```

---

## Tech Stack

| Layer        | Cong nghe                                             |
|--------------|-------------------------------------------------------|
| Runtime      | Node.js >= 18, TypeScript                             |
| Framework    | Express 5                                             |
| ORM          | Prisma 6 + PostgreSQL (port 5434)                     |
| Cache        | Redis/ioredis (chong spam vote, chong dem view trung) |
| Auth         | JWT (Access Token 8h + Refresh Token 7d), Google OAuth2 |
| Validation   | Zod (toan bo body/query duoc validate truoc service)  |
| File Upload  | Multer Memory Storage (toi da 5 file, 20MB/file)      |
| Email        | Nodemailer (gui link khao sat khi ticket DA_GIAI_QUYET)|
| API Docs     | Swagger UI tai /api-docs                              |

---

## Hướng dẫn Chạy Dự án (End-to-End Setup Guide)

Dự án bao gồm 2 phần chính: **Backend** (Node.js/Express + Prisma + PostgreSQL + Redis) và **Frontend** (React + Vite + TypeScript). 

Dưới đây là hướng dẫn từng bước để cài đặt và chạy dự án từ đầu sau khi clone về máy.

---

### 1. Yêu cầu Hệ thống (Prerequisites)
Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
- **Node.js** (Phiên bản `>= 18.x`)
- **Docker & Docker Desktop** (Khuyên dùng - để khởi chạy PostgreSQL và Redis nhanh chóng chỉ bằng 1 lệnh, không cần cài đặt trực tiếp lên hệ điều hành)
- **Git**

---

### 2. Bước 1: Clone Mã nguồn (Clone Repository)
Mở terminal và chạy lệnh sau để tải mã nguồn về máy:
```bash
git clone <URL_CỦA_REPOSITORY>
cd project_code
```

---

### 3. Bước 2: Khởi chạy Database & Redis bằng Docker
Tại thư mục gốc của dự án (nơi có tệp `docker-compose.yml` vừa được thiết lập), chạy lệnh sau để khởi động PostgreSQL (cổng `5434`) và Redis (cổng `6379`) chạy ngầm:
```bash
docker compose up -d
```
*Lưu ý: Đảm bảo Docker Desktop đã được mở trước khi chạy lệnh này.*

---

### 4. Bước 3: Thiết lập Backend
Di chuyển vào thư mục backend và cài đặt thư viện:
```bash
cd backend
npm install
```

#### Cấu hình biến môi trường (`.env`)
1. Trong thư mục `backend`, tạo file `.env` bằng cách copy từ file mẫu [backend/.env.example](file:///g:/UEL/nam3/kientap/project_code/backend/.env.example):
   - **Windows (PowerShell):** `copy .env.example .env`
   - **Linux/macOS:** `cp .env.example .env`
2. Mở file `.env` vừa tạo. Do ta dùng Docker Compose, các cấu hình mặc định (Database port `5434`, mật khẩu `admin123` và Redis port `6379`) đã được thiết lập khớp hoàn hảo với Docker. Bạn **không cần phải chỉnh sửa gì thêm** trong file `.env` trừ khi muốn cấu hình Google OAuth hay gửi mail thực tế.


#### Khởi tạo Cơ sở dữ liệu & Seed dữ liệu mẫu
Khi chạy lần đầu, bạn cần khởi tạo cấu trúc bảng và nạp dữ liệu mẫu (70 nhân viên, 8 tickets demo, SLA, Cơ sở tri thức):
```bash
# 1. Chạy Prisma Migration để tạo bảng trong PostgreSQL
npx prisma migrate dev --name init

# 2. Seed dữ liệu mẫu vào Database
npx prisma db seed
```
*(Nếu muốn xóa sạch cơ sở dữ liệu để làm mới lại từ đầu, chạy: `node prisma/clear.js` rồi chạy lại lệnh `npx prisma db seed`).*

#### Khởi chạy Backend
Khởi động máy chủ backend ở chế độ phát triển (Development mode):
```bash
npm run dev
```
- Máy chủ Backend sẽ chạy tại: **`http://localhost:3000`**
- Trang tài liệu API Swagger tích hợp tại: **`http://localhost:3000/api-docs`**
- Mở giao diện quản lý DB trực quan (Prisma Studio): **`npx prisma studio`**

---

### 5. Bước 4: Thiết lập Frontend
Mở một cửa sổ terminal mới (song song với terminal chạy backend), di chuyển vào thư mục frontend và cài đặt thư viện:
```bash
cd frontend
npm install
```

#### Cấu hình biến môi trường (`.env`)
1. Tạo file `.env` bằng cách copy từ file mẫu [frontend/.env.example](file:///g:/UEL/nam3/kientap/project_code/frontend/.env.example):
   - **Windows (PowerShell):** `copy .env.example .env`
   - **Linux/macOS:** `cp .env.example .env`
2. Mặc định file chứa `VITE_API_URL=http://localhost:3000/api/v1` kết nối tới Backend ở cổng 3000 của bạn. Bạn có thể giữ nguyên giá trị này.

#### Khởi chạy Frontend
Chạy lệnh sau để khởi động dự án React ở môi trường local:
```bash
npm run dev
```
- Giao diện người dùng (Frontend) sẽ chạy tại: **`http://localhost:5173`** (hoặc cổng được hiển thị trong terminal). Mở địa chỉ này trên trình duyệt để sử dụng ứng dụng.

---

### 6. Danh sách Tài khoản Kiểm thử (Demo Accounts)
Sau khi chạy script seed dữ liệu mẫu, hệ thống sẽ được cấu hình sẵn **70 tài khoản** thuộc 4 vai trò khác nhau. Tất cả tài khoản demo sử dụng chung một mật khẩu mặc định:

> [!IMPORTANT]
> **Mật khẩu mặc định cho toàn bộ tài khoản:** `Mappacific@2025`

| Vai trò (Role) | Tài khoản / Email | Mô tả |
| :--- | :--- | :--- |
| **QUẢN LÝ (Manager)** | `thangpq23406@st.uel.edu.vn` (hoặc username `thangpq23406`) | Quản lý IT - Có toàn quyền cấu hình SLA, phân công công việc, duyệt bài viết KB và xem báo cáo dashboard. |
| **IT Tuyến 1 (IT_L1)** | `huyentld23406@st.uel.edu.vn` (username `huyentld23406`) <br> `ravi.kumar@mappacific.com` (username `ravi.kumar`) | Hỗ trợ cấp 1 - Tiếp nhận phiếu, xử lý nhanh, chuyển cấp lên L2 nếu cần thiết. |
| **IT Tuyến 2 (IT_L2)** | `vanbtt23406@st.uel.edu.vn` (username `vanbtt23406`) <br> `siti.rahimah@mappacific.com` (username `siti.rahimah`) | Hỗ trợ chuyên sâu - Nhận phiếu chuyển cấp từ L1, viết bài viết Cơ sở tri thức (KB). |
| **NGƯỜI YÊU CẦU (Requester)** | `sales1@mappacific.com` (username `sales1`) <br> `fin1@mappacific.com` (username `fin1`) <br> `ops1@mappacific.com` (username `ops1`) | Nhân viên nghiệp vụ - Tạo phiểu yêu cầu hỗ trợ sự cố, xem bình luận và đánh giá chất lượng (khảo sát SLA). |

### Các Scripts hữu ích khác
Trong thư mục `backend`, bạn có thể chạy các script sau để phục vụ kiểm thử nhanh:
- `node prisma/clear.js`: Xóa sạch dữ liệu trong các bảng (giữ nguyên cấu trúc database).
- `node seed_noti.js`: Tạo thông báo giả lập cho IT_L1 để test luồng thông báo trong Postman/Frontend.

---

## Bien moi truong (backend/.env)

| Bien                   | Mo ta                                         | Bat buoc |
|------------------------|-----------------------------------------------|----------|
| PORT                   | Port chay server (mac dinh: 3000)             | Khong    |
| DATABASE_URL           | Connection string PostgreSQL                  | Co       |
| JWT_SECRET             | Secret key ky Access Token                    | Co       |
| REFRESH_JWT_SECRET     | Secret key ky Refresh Token                   | Co       |
| JWT_EXPIRES_IN         | Thoi han Access Token (mac dinh: 8h)          | Khong    |
| REDIS_URL              | URL ket noi Redis                             | Co       |
| GOOGLE_CLIENT_ID       | Client ID Google OAuth2                       | Co       |
| COMPANY_EMAIL_DOMAIN   | Domain email hop le (phan tach bang dau phay) | Co       |
| EMAIL_USER             | Tai khoan email Nodemailer gui khao sat       | Co       |
| EMAIL_PASS             | App password email Nodemailer                 | Co       |

---

## Vai tro nguoi dung (RBAC)

| Role            | Mo ta                                                      |
|-----------------|------------------------------------------------------------|
| NGUOI_YEU_CAU   | Nhan vien noi bo - tao va theo doi phieu cua chinh minh    |
| IT_L1           | Ky thuat vien cap 1 - tiep nhan, xu ly, chuyen cap phieu   |
| IT_L2           | Ky thuat vien cap 2 - xu ly su co phuc tap, viet KB        |
| QUAN_LY         | Quan ly IT - toan quyen giam sat, phan cong, cau hinh SLA  |

---

## Vong doi Phieu ho tro

MOI_TAO -> DANG_GIAI_QUYET -> DA_GIAI_QUYET -> DA_DONG
                                     |
                   (Auto khi khao sat = khong hai long)
                                     v
                             DANG_GIAI_QUYET
                    (Mo lai > 2 lan thi ep chuyen sang nhom L2)

---

## Danh sach 41 API Endpoints

### Auth - /api/v1/auth

| # | Method | Endpoint         | Phan quyen |
|---|--------|------------------|------------|
| 1 | POST   | /login           | Public     |
| 2 | POST   | /login-google    | Public     |
| 3 | POST   | /logout          | Bearer JWT |
| 4 | POST   | /refresh         | Public     |
| 5 | GET    | /me              | Bearer JWT |

### Tickets - /api/v1/tickets

| #  | Method | Endpoint           | Phan quyen                  |
|----|--------|--------------------|-----------------------------|
| 6  | POST   | /                  | NGUOI_YEU_CAU               |
| 7  | GET    | /                  | Tat ca (loc theo vai tro)   |
| 8  | GET    | /:id               | Tat ca (loc theo vai tro)   |
| 9  | PUT    | /:id/status        | IT_L1, IT_L2, QUAN_LY       |
| 10 | POST   | /:id/escalate      | IT_L1                       |
| 11 | POST   | /:id/reopen        | QUAN_LY                     |
| 12 | POST   | /:id/comments      | Tat ca                      |
| 13 | GET    | /:id/comments      | Tat ca (loc theo vai tro)   |
| 14 | GET    | /:id/history       | Tat ca (loc theo vai tro)   |
| 15 | PUT    | /:id/assign        | QUAN_LY                     |
| 16 | GET    | /:id/sla           | Tat ca                      |

### Attachments - /api/v1/attachments

| #  | Method | Endpoint         | Phan quyen                   |
|----|--------|------------------|------------------------------|
| 26 | POST   | /tickets/:id     | Tat ca                       |
| 27 | DELETE | /:attachmentId   | Tat ca (kiem tra chu so huu) |

### Knowledge Base - /api/v1/kb

| #  | Method | Endpoint       | Phan quyen                       |
|----|--------|----------------|----------------------------------|
| 20 | GET    | /search        | Tat ca                           |
| 21 | GET    | /              | Tat ca (loc trang thai theo role)|
| 22 | GET    | /:id           | Tat ca (kiem tra bai nhap)       |
| 23 | POST   | /              | IT_L2, QUAN_LY                   |
| 24 | PUT    | /:id           | Tac gia hoac QUAN_LY             |
| 25 | POST   | /:id/feedback  | Tat ca (chong spam Redis 24h)    |

### Notifications - /api/v1/notifications

| #  | Method | Endpoint     | Phan quyen |
|----|--------|--------------|------------|
| 42 | GET    | /            | Bearer JWT |
| 43 | PUT    | /:id/read    | Bearer JWT |
| 44 | PUT    | /read-all    | Bearer JWT |

### Reviews - /api/v1/reviews

| #  | Method | Endpoint         | Phan quyen |
|----|--------|------------------|------------|
| 17 | GET    | /validate-token  | Public     |
| 18 | POST   | /                | Public     |
| 19 | GET    | /:ticketId       | QUAN_LY    |

### SLA - /api/v1/sla

| #  | Method | Endpoint       | Phan quyen |
|----|--------|----------------|------------|
| 28 | GET    | /policies      | QUAN_LY    |
| 29 | POST   | /policies      | QUAN_LY    |
| 30 | PUT    | /policies/:id  | QUAN_LY    |

### Admin - /api/v1/admin

| #  | Method | Endpoint                 | Phan quyen |
|----|--------|--------------------------|------------|
| 34 | GET    | /users                   | QUAN_LY    |
| 35 | POST   | /users                   | QUAN_LY    |
| 36 | PUT    | /users/:id               | QUAN_LY    |
| 37 | GET    | /roles                   | QUAN_LY    |
| 38 | PUT    | /roles/:id/permissions   | QUAN_LY    |
| 39 | GET    | /teams                   | QUAN_LY    |
| 40 | PUT    | /teams/:id/members       | QUAN_LY    |
| 41 | GET    | /departments             | QUAN_LY    |

---

## Kien truc Request Pipeline

HTTP Request
    |
Route (Express Router)
    |
Middleware: verifyToken -> checkRole
    |
Controller (nhan req, goi Service, tra res)
    |
Validator (Zod - kiem tra body/query)
    |
Service (Business Logic: SLA, workflow, email, Redis)
    |
Repository (Prisma ORM - truy van DB / Redis)
    |
Database (PostgreSQL) / Cache (Redis)

| Tang         | Vai tro                                                         |
|--------------|-----------------------------------------------------------------|
| Route        | Dinh nghia method + path, gan middleware + controller           |
| Middleware   | Xac thuc JWT (verifyToken) va kiem tra vai tro (checkRole)      |
| Controller   | Dieu phoi: nhan request, goi service, format response           |
| Validator    | Zod schema - chan du lieu sai format truoc khi vao service      |
| Service      | Logic nghiep vu (SLA, workflow, email, Redis, phan quyen mem)   |
| Repository   | Truy van DB thuan tuy qua Prisma - khong chua business logic    |
| errorHandler | Bat & chuan hoa loi thanh JSON: ZodError, AppError, P2002, P2003|
