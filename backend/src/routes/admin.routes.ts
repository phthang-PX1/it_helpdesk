// src/routes/admin.routes.ts
import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { verifyToken, checkRole } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Admin
 *   description: Quản trị Hệ thống, Tài khoản, Vai trò và Phân quyền (Chỉ dành cho QUAN_LY)
 */

// Bọc lớp bảo vệ toàn bộ Route Admin: Bắt buộc Đăng nhập và phải là QUAN_LY
router.use(verifyToken, checkRole(['QUAN_LY']));

/**
 * @openapi
 * /api/v1/admin/users:
 *   get:
 *     summary: Lấy danh sách nhân viên toàn hệ thống (API-34)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi trên một trang
 *       - name: vai_tro_id
 *         in: query
 *         schema:
 *           type: integer
 *         description: Lọc theo ID vai trò
 *       - name: nhom_ho_tro_id
 *         in: query
 *         schema:
 *           type: integer
 *         description: Lọc theo ID nhóm hỗ trợ
 *       - name: trang_thai
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái hoạt động (true/false)
 *       - name: keyword
 *         in: query
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo họ tên, tài khoản, email
 *     responses:
 *       200:
 *         description: Trả về danh sách nhân viên (không bao gồm mat_khau)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NhanVien'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Chưa xác thực hoặc không có quyền QUAN_LY
 */
router.get('/users', adminController.getUsers);

/**
 * @openapi
 * /api/v1/admin/users:
 *   post:
 *     summary: Tạo tài khoản nhân viên mới (API-35)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ho_ten
 *               - email
 *               - tai_khoan
 *               - mat_khau
 *               - vai_tro_id
 *               - phong_ban_id
 *             properties:
 *               ho_ten:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "nguyenvana@company.com"
 *               tai_khoan:
 *                 type: string
 *                 example: "nguyenvana"
 *               mat_khau:
 *                 type: string
 *                 format: password
 *                 example: "P@ssw0rd123"
 *               vai_tro_id:
 *                 type: integer
 *                 example: 2
 *               phong_ban_id:
 *                 type: integer
 *                 example: 1
 *               nhom_ho_tro_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 3
 *     responses:
 *       201:
 *         description: Tạo mới thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NhanVien'
 *       400:
 *         description: Thông tin hoặc mật khẩu không đạt chuẩn
 *       409:
 *         description: Tài khoản / Email đã tồn tại
 */
router.post('/users', adminController.createUser);

/**
 * @openapi
 * /api/v1/admin/users/{id}:
 *   put:
 *     summary: Cập nhật thông tin nhân viên (API-36)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID nhân viên cần cập nhật
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ho_ten:
 *                 type: string
 *                 example: "Nguyễn Văn B"
 *               vai_tro_id:
 *                 type: integer
 *                 example: 3
 *               phong_ban_id:
 *                 type: integer
 *                 example: 2
 *               nhom_ho_tro_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *               trang_thai:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NhanVien'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy nhân viên
 */
router.put('/users/:id', adminController.updateUser);

/**
 * @openapi
 * /api/v1/admin/roles:
 *   get:
 *     summary: Lấy danh sách vai trò và quyền hạn hiện tại (API-37)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về dữ liệu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VaiTro'
 */
router.get('/roles', adminController.getRoles);

/**
 * @openapi
 * /api/v1/admin/roles/{id}/permissions:
 *   put:
 *     summary: Cập nhật quyền hạn của một vai trò (API-38)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID vai trò cần cập nhật quyền
 *         example: 2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quyen_han
 *             properties:
 *               quyen_han:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách quyền hạn (dạng string)
 *                 example: ["ticket:create", "ticket:view_own", "kb:view"]
 *     responses:
 *       200:
 *         description: Cập nhật quyền thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cập nhật quyền thành công"
 *       400:
 *         description: Dữ liệu quyền hạn không hợp lệ
 *       404:
 *         description: Không tìm thấy vai trò
 */
router.put('/roles/:id/permissions', adminController.updateRolePermissions);

/**
 * @openapi
 * /api/v1/admin/teams:
 *   get:
 *     summary: Lấy danh sách nhóm hỗ trợ và thành viên (API-39)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Tải danh sách nhóm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NhomHoTro'
 */
router.get('/teams', adminController.getTeams);

/**
 * @openapi
 * /api/v1/admin/teams/{id}/members:
 *   put:
 *     summary: Cập nhật thành viên trong nhóm hỗ trợ (Replace toàn bộ) (API-40)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID nhóm hỗ trợ cần cập nhật thành viên
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nhan_vien_ids
 *             properties:
 *               nhan_vien_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Danh sách ID nhân viên sẽ thay thế toàn bộ thành viên hiện tại
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Cập nhật thành viên nhóm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cập nhật thành viên thành công"
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy nhóm hỗ trợ hoặc một số nhân viên
 */
router.put('/teams/:id/members', adminController.updateTeamMembers);

/**
 * @openapi
 * /api/v1/admin/departments:
 *   get:
 *     summary: Lấy danh sách phòng ban (API-41)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách phòng ban thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PhongBan'
 */
router.get('/departments', adminController.getDepartments);

export default router;