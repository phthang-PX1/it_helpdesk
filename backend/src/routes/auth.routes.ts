import { Router } from 'express';
import { getMe, googleLogin, login, logout, refreshToken } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Authentication
 *   description: Các API quản lý xác thực và phân quyền người dùng
 */

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Đăng nhập vào hệ thống IT Helpdesk (UC-01)
 *     tags:
 *       [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tai_khoan
 *               - mat_khau
 *             properties:
 *               tai_khoan:
 *                 type: string
 *                 example: "admin_it"
 *                 description: "Tài khoản nhân viên đăng nhập"
 *               mat_khau:
 *                 type: string
 *                 example: "123456"
 *                 description: "Mật khẩu chưa mã hóa"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công và cấp Token
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ (Lỗi Zod)
 *       401:
 *         description: Sai tài khoản hoặc mật khẩu
 *       403:
 *         description: Tài khoản bị khóa hoặc chưa được cấp quyền truy cập hệ thống
 */
router.post('/login', login);

/**
 * @openapi
 * /auth/login-google:
 *   post:
 *     summary: Đăng nhập bằng tài khoản Google (OAuth2)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [google_id_token]
 *             properties:
 *               google_id_token:
 *                 type: string
 *                 description: Chuỗi ID Token lấy từ Google
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       401:
 *         description: Token Google không hợp lệ
 *       403:
 *         description: Email không thuộc domain công ty
 *       404:
 *         description: Tài khoản chưa tồn tại trên hệ thống
 */
router.post('/login-google', googleLogin);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất khỏi hệ thống
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng xuất thành công, đã thu hồi phiên hoạt động
 *       400:
 *         description: Refresh Token không hợp lệ hoặc đã bị thu hồi
 *       401:
 *         description: Chưa xác thực (Chưa cung cấp Access Token)
 */
router.post('/logout', verifyToken, logout);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Cấp lại Access Token mới
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cấp lại Token thành công
 *       401:
 *         description: Refresh Token hết hạn hoặc không tồn tại (cần login lại)
 */
router.post('/refresh', refreshToken);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Lấy thông tin cá nhân của người dùng đang đăng nhập
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công (không bao gồm mật khẩu)
 *       401:
 *         description: Access Token không hợp lệ hoặc đã hết hạn
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.get('/me', verifyToken, getMe);



export default router;