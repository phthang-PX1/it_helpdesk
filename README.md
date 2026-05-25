# 🖥️ IT Helpdesk System — Map Pacific Singapore

Hệ thống quản lý phiếu hỗ trợ kỹ thuật nội bộ cho công ty Map Pacific Singapore.

---

## 📁 Cấu trúc thư mục

```
project_code/
├── backend/                        # Node.js + Express + TypeScript
│   ├── prisma/
│   │   ├── schema.prisma           # Định nghĩa toàn bộ schema database
│   │   ├── seed.js                 # Dữ liệu mẫu khởi tạo
│   │   ├── clear.js                # Script xóa toàn bộ dữ liệu
│   │   └── migrations/             # Lịch sử migration Prisma
│   ├── src/
│   │   ├── server.ts               # Entry point, khởi động Express + Swagger
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts  # Xử lý request xác thực
│   │   │   └── ticket.controller.ts# Xử lý request phiếu hỗ trợ
│   │   ├── services/
│   │   │   ├── auth.service.ts     # Logic nghiệp vụ xác thực (JWT, bcrypt)
│   │   │   └── ticket.service.ts   # Logic nghiệp vụ phiếu (SLA, workflow)
│   │   ├── repositories/
│   │   │   ├── auth.repository.ts  # Truy vấn database cho auth
│   │   │   └── ticket.repository.ts# Truy vấn database cho ticket
│   │   ├── routes/
│   │   │   ├── auth.routes.ts      # Định nghĩa route + Swagger docs cho auth
│   │   │   └── ticket.routes.ts    # Định nghĩa route + Swagger docs cho ticket
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts  # verifyToken, checkRole
│   │   │   └── errorHandler.ts     # Xử lý lỗi tập trung
│   │   ├── validators/
│   │   │   ├── auth.validator.ts   # Zod schema validate login
│   │   │   └── ticket.schema.ts    # Zod schema validate tạo/cập nhật ticket
│   │   ├── libs/
│   │   │   ├── prisma.ts           # Khởi tạo Prisma Client singleton
│   │   │   └── redis.ts            # Khởi tạo Redis (ioredis) singleton
│   │   └── utils/
│   │       ├── catchAsync.ts       # Wrapper bắt lỗi async/await
│   │       └── redisHelpers.ts     # Hàm tiện ích thao tác Redis
│   ├── .env                        # Biến môi trường (không commit)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                       # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── main.jsx                # Entry point React
│   │   ├── App.jsx                 # Router chính
│   │   ├── pages/
│   │   │   ├── auth/               # Trang đăng nhập
│   │   │   └── dashboard/          # Trang quản lý ticket
│   │   └── services/               # Gọi API với Axios
│   ├── index.html
│   └── package.json
│
└── documents/                      # Tài liệu dự án
    ├── erd.md                      # Entity Relationship Diagram
    ├── usecase.md                  # Đặc tả Use Case
    ├── bpmn_created_ticket.md      # Luồng tạo phiếu hỗ trợ
    ├── bpmn_incidient_management.md# Luồng xử lý sự cố
    └── bpmn_knowledgebase_management.md # Luồng quản lý knowledge base
```

---

## ⚙️ Tech Stack

| Layer      | Công nghệ                                          |
|------------|----------------------------------------------------|
| Backend    | Node.js, Express 5, TypeScript                     |
| ORM        | Prisma 6 + PostgreSQL                              |
| Cache      | Redis (ioredis)                                    |
| Auth       | JWT (Access + Refresh Token), Google OAuth2        |
| Validation | Zod                                                |
| File Upload| Multer (tối đa 5 file, 20MB/file)                  |
| API Docs   | Swagger UI (`/api-docs`)                           |
| Frontend   | React 19, Vite, TailwindCSS 4, React Router DOM 7  |

---

## 🚀 Hướng dẫn chạy

### Yêu cầu
- Node.js >= 18
- PostgreSQL (port `5434`)
- Redis (port `6379`)

### Backend

```bash
cd backend

# Cài dependencies
npm install

# Tạo database và chạy migration
npx prisma migrate dev

# Seed dữ liệu mẫu
npx prisma db seed

# Chạy dev server (port 3000)
npm run dev
```

> API Docs: http://localhost:3000/api-docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Biến môi trường (backend/.env)

| Biến                   | Mô tả                                  |
|------------------------|----------------------------------------|
| `PORT`                 | Port chạy server (mặc định: 3000)      |
| `DATABASE_URL`         | Connection string PostgreSQL            |
| `JWT_SECRET`           | Secret key cho Access Token            |
| `REFRESH_JWT_SECRET`   | Secret key cho Refresh Token           |
| `JWT_EXPIRES_IN`       | Thời hạn Access Token (mặc định: 8h)   |
| `REDIS_URL`            | URL kết nối Redis                      |
| `GOOGLE_CLIENT_ID`     | Client ID Google OAuth2                |
| `COMPANY_EMAIL_DOMAIN` | Domain email hợp lệ (ngăn cách bằng `,`)|

---

## 📋 API Endpoints

### Auth — `/api/v1/auth`

| Method | Endpoint         | Mô tả                                  | Auth     |
|--------|------------------|----------------------------------------|----------|
| POST   | `/login`         | Đăng nhập bằng tài khoản/mật khẩu     | ❌        |
| POST   | `/login-google`  | Đăng nhập bằng Google OAuth2           | ❌        |
| POST   | `/logout`        | Đăng xuất, thu hồi Refresh Token       | ✅ Bearer |
| POST   | `/refresh`       | Cấp lại Access Token mới               | ❌        |
| GET    | `/me`            | Lấy thông tin người dùng hiện tại      | ✅ Bearer |

### Tickets — `/api/v1/tickets`

| Method | Endpoint          | Mô tả                                          | Vai trò yêu cầu              |
|--------|-------------------|------------------------------------------------|------------------------------|
| POST   | `/`               | Tạo ticket mới, khởi tạo SLA, đẩy queue thông báo | `NGUOI_YEU_CAU`          |
| GET    | `/`               | Lấy danh sách ticket (phân trang, lọc, tìm kiếm)  | Tất cả vai trò               |
| GET    | `/:id`            | Xem chi tiết ticket, SLA, lịch sử, bình luận  | Tất cả vai trò               |
| PUT    | `/:id/status`     | Cập nhật trạng thái và ghi lịch sử workflow    | `IT_L1`, `IT_L2`, `QUAN_LY`  |

---

## 👥 Vai trò người dùng (Roles)

| Role           | Mô tả                                      |
|----------------|--------------------------------------------|
| `NGUOI_YEU_CAU`| Nhân viên — tạo và theo dõi phiếu của mình |
| `IT_L1`        | Kỹ thuật viên cấp 1 — tiếp nhận và xử lý  |
| `IT_L2`        | Kỹ thuật viên cấp 2 — xử lý sự cố phức tạp|
| `QUAN_LY`      | Quản lý IT — toàn quyền giám sát hệ thống |

---

## 🔄 Trạng thái phiếu (Ticket Status)

```
MOI_TAO → DANG_GIAI_QUYET → DA_GIAI_QUYET → DA_DONG
```

---

## 🏗️ Kiến trúc Backend

```
Request → Route → Middleware (verifyToken / checkRole)
       → Controller → Service (business logic)
       → Repository → Prisma (DB) / Redis (cache)
```

- **Controller**: nhận request, trả response.
- **Service**: xử lý nghiệp vụ (SLA, workflow, token).
- **Repository**: tầng truy vấn database thuần túy.
- **Middleware**: xác thực JWT và phân quyền theo role.
- **Validator**: kiểm tra đầu vào bằng Zod trước khi vào service.
