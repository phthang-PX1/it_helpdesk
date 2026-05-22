Implementation Plan: API-02 đến API-05 — Module Auth

Bối cảnh & Mục tiêu

API-01 (login cơ bản) đã hoàn thành. Cần bổ sung 4 API còn lại của nhóm Auth để hoàn thiện vòng đời xác thực:



#EndpointMô tảAPI-02POST /api/v1/auth/login-googleĐăng nhập qua Google OAuthAPI-03POST /api/v1/auth/logoutĐăng xuất, thu hồi refresh tokenAPI-04POST /api/v1/auth/refreshCấp access token mới từ refresh tokenAPI-05GET /api/v1/auth/meLấy thông tin user đang đăng nhập

Quyết định thiết kế quan trọng

IMPORTANT

Lưu Refresh Token trong Redis (ioredis): Đây là giải pháp chuẩn Enterprise — Redis lưu token với TTL tự động, thu hồi tức thì, không làm phình DB. Key pattern: refresh_token:<token> → Value: nhan_vien_id (string), TTL = 7 ngày (604800 giây).

NOTE

API-02 Google Login: Cần cài google-auth-library. Cần biến môi trường GOOGLE_CLIENT_ID và COMPANY_EMAIL_DOMAIN (ví dụ: mappacific.com.sg) trong 





.env.

NOTE

Redis connection: Tạo singleton Redis client tại src/libs/redis.ts, tương tự pattern 





src/libs/prisma.ts hiện có. Cần biến môi trường REDIS_URL trong 

.env.

Proposed Changes

1. Redis Client (mới)

[NEW] 

redis.ts

Tạo Redis singleton client:

typescript



import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis };

export const redis = globalForRedis.redis || new Redis(process.env.REDIS_URL!);

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

Key pattern cho Refresh Token:

Lưu: SET refresh_token:<token> <nhan_vien_id> EX 604800 (7 ngày)

Kiểm tra: GET refresh_token:<token> → trả về nhan_vien_id hoặc null

Thu hồi: DEL refresh_token:<token>

2. Cài đặt packages

bash



npm install google-auth-library ioredis

npm install -D @types/cors

Thêm vào 





.env:

REDIS_URL=redis://localhost:6379

GOOGLE_CLIENT_ID=your_google_client_id

COMPANY_EMAIL_DOMAIN=mappacific.com.sg

REFRESH_JWT_SECRET=your_refresh_secret_key

3. Validators

[MODIFY] 

auth.validator.ts

Thêm 3 schema Zod mới:

googleLoginSchema: { google_id_token: string min 1 }

logoutSchema: { refresh_token: string min 1 }

refreshTokenSchema: { refresh_token: string min 1 }

4. Repository

[MODIFY] 

auth.repository.ts

Thêm các hàm mới (Prisma — không đụng schema DB):

findUserByEmail(email) — dùng cho Google login

findUserById(nhan_vien_id) — dùng cho /me (include phong_ban, vai_tro, nhom_ho_tro)

Thêm các hàm Redis tại src/libs/redis.ts (hoặc helper trong service):

saveRefreshTokenRedis(token, nhan_vien_id) — SET refresh_token:<token> <id> EX 604800

getRefreshTokenRedis(token) — GET refresh_token:<token>

deleteRefreshTokenRedis(token) — DEL refresh_token:<token>

5. Service

[MODIFY] 

auth.service.ts

Bổ sung logic cho 4 hàm:

googleLoginUser(google_id_token)

Verify token qua GoogleAuthClient.verifyIdToken()

Lấy email từ payload → throws 401 nếu token Google không hợp lệ

Kiểm tra email domain → throws 403 "Email không thuộc domain công ty"

Tìm nhân viên theo email → throws 404 "Không có tài khoản trong hệ thống"

Kiểm tra trang_thai và vai_tro → throws 403 "Chưa được phân quyền"

Sign access token (8h) + refresh token (7 ngày)

Lưu refresh token vào Redis qua saveRefreshTokenRedis(token, nhan_vien_id)

Trả về { token, refresh_token, user: { nhan_vien_id, ho_ten, email, vai_tro, nhom_ho_tro_id } }

logoutUser(refresh_token)

Gọi deleteRefreshTokenRedis(refresh_token) xóa token khỏi Redis

Nếu Redis không tìm thấy key → throws 400 "refresh_token không hợp lệ"

Trả về { message: "Đăng xuất thành công" }

refreshAccessToken(refresh_token)

Gọi getRefreshTokenRedis(refresh_token) — tìm token trong Redis

Nếu trả về null → token không tồn tại hoặc đã bị xóa (hết hạn / đã logout) → throws 401

Nếu có data → token hợp lệ và chưa bị xóa, lấy nhan_vien_id từ value

Sign và trả về access token mới (8h); giữ nguyên refresh token cũ trong Redis

Trả về { token: string }

getMe(nhan_vien_id)

Query findUserById với include phong_ban, vai_tro, nhom_ho_tro

Loại bỏ mat_khau khỏi response

Trả về { nhan_vien_id, ho_ten, email, vai_tro, phong_ban, nhom_ho_tro, trang_thai }

Refactor 





loginUser (API-01): Bổ sung bước sign refresh token và gọi saveRefreshTokenRedis để đồng bộ với API-03/04. Response bổ sung thêm field refresh_token.6. Controller

[MODIFY] 

auth.controller.ts

Thêm 4 hàm export: googleLogin, logout, refreshToken, getMe.

7. Routes

[MODIFY] 

auth.routes.ts

Thêm 4 route mới kèm Swagger JSDoc:



POST /login-google → googleLogin

POST /logout → verifyToken + logout

POST /refresh → refreshToken

GET /me → verifyToken + getMe

8. Server

[MODIFY] 

server.ts

Thêm Swagger security scheme (BearerAuth) vào swaggerOptions.definition để các route có 





verifyToken hiển thị đúng trên Swagger UI.Verification Plan

Thủ công qua Swagger UI (http://localhost:3000/api-docs)

Bước chuẩn bị: DB đã có seed data (chạy node prisma/seed.js), server đang chạy (npm run dev).

API-01 (regression) + Refresh Token:

POST /api/v1/auth/login với tai_khoan/mat_khau hợp lệ → expect 200 + token + refresh_token trong response

API-03 Logout:

Dùng refresh_token vừa lấy → POST /api/v1/auth/logout → expect 200 Đăng xuất thành công

Gọi lại refresh với cùng token → expect 401

API-04 Refresh Token:

Lấy refresh_token mới (login lại) → POST /api/v1/auth/refresh → expect 200 + token mới

Dùng access token cũ → vẫn hoạt động cho đến khi hết 8h (không thu hồi access token)

API-05 Get Me:

GET /api/v1/auth/me với Bearer token hợp lệ → expect 200 + thông tin user (không có mat_khau)

Không có token → expect 401

API-02 Google Login (nếu có Google Client ID):

Tạo Google ID Token hợp lệ → POST /api/v1/auth/login-google → expect 200

Token giả → expect 401

Email ngoài domain → expect 403

Email đúng domain nhưng không có trong DB → expect 404

Kiểm tra edge case bảo mật

/me với token hết hạn → 401

/logout không có Authorization header → 401 (bị chặn bởi 

verifyToken vì cần biết danh tính người đăng xuất)

/logout có token hợp lệ nhưng thiếu body refresh_token → 400 (Zod validation)

/refresh với token đã logout (đã bị DEL khỏi Redis) → 401

/refresh với token hết hạn TTL (Redis tự xóa) → 401

Dùng refresh_token của user A để gọi /refresh trong session user B → 200 (Cấp Access Token của A)