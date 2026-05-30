const fs = require('fs');
const path = require('path');

const content = `# IT Helpdesk System — Map Pacific Singapore

He thong quan ly phieu ho tro ky thuat noi bo cho cong ty Map Pacific Singapore.

---

## Cau truc thu muc (Backend)

\`\`\`
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
\`\`\`

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

## Huong dan chay

### Yeu cau
- Node.js >= 18
- PostgreSQL (port 5434)
- Redis (port 6379)

### Cai dat & Khoi dong

\`\`\`bash
cd backend

# 1. Cai dependencies
npm install

# 2. Cau hinh moi truong
# Tao file .env tu mau .env.example va dien cac gia tri

# 3. Chay migration va tao bang
npx prisma migrate dev

# 4. Seed du lieu mau (50+ nhan vien, 4 vai tro, SLA mac dinh)
node prisma/seed.js

# 5. Khoi dong dev server (port 3000, hot-reload)
npm run dev
\`\`\`

API Docs: http://localhost:3000/api-docs
Prisma Studio: npx prisma studio

### Scripts huu ich

\`\`\`bash
# Xoa toan bo data (giu cau truc bang), dung khi reset testing
node prisma/clear.js

# Seed lai data mau sau khi clear
node prisma/seed.js

# Them thong bao gia cho tai khoan IT_L1 (dung khi test Folder 3 Postman)
node seed_noti.js
\`\`\`

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
`;

const outPath = path.join(__dirname, '..', 'README.md');
fs.writeFileSync(outPath, content, 'utf8');
console.log('README.md written successfully to: ' + outPath);
