// src/routes/sla.routes.ts
import { Router } from 'express';
import { slaController } from '../controllers/sla.controller';
import { verifyToken, checkRole } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: SLA
 *   description: Quản lý thiết lập Chính sách và Tiêu chuẩn thời gian hỗ trợ (Chỉ Manager)
 */

router.use(verifyToken, checkRole(['QUAN_LY']));

/**
 * @openapi
 * /api/v1/sla/policies:
 *   get:
 *     summary: Lấy danh sách tất cả chính sách SLA (API-28)
 *     tags: [SLA]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: trang_thai
 *         in: query
 *         description: Lọc theo trạng thái active hoặc inactive
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         example: active
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChinhSachSla'
 *       401:
 *         description: Chưa xác thực hoặc không có quyền QUAN_LY
 */
router.get('/policies', slaController.getPolicies);

/**
 * @openapi
 * /api/v1/sla/policies:
 *   post:
 *     summary: Tạo chính sách SLA mới (API-29)
 *     description: Chỉ 1 policy được active cho mỗi mức độ ưu tiên.
 *     tags: [SLA]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ten_chinh_sach
 *               - loai_thoi_gian
 *               - muc_do_uu_tien
 *               - tg_phan_hoi
 *               - tg_xu_ly
 *             properties:
 *               ten_chinh_sach:
 *                 type: string
 *                 example: "SLA ưu tiên cao - Hành chính"
 *               loai_thoi_gian:
 *                 type: string
 *                 enum: [GIO_HANH_CHINH, H24_7]
 *                 example: "GIO_HANH_CHINH"
 *               muc_do_uu_tien:
 *                 type: string
 *                 enum: [CAO, TRUNG_BINH, THAP]
 *                 example: "CAO"
 *               tg_phan_hoi:
 *                 type: integer
 *                 description: Thời gian phản hồi tính bằng phút
 *                 example: 60
 *               tg_xu_ly:
 *                 type: integer
 *                 description: Thời gian xử lý tính bằng phút
 *                 example: 240
 *     responses:
 *       201:
 *         description: Tạo chính sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChinhSachSla'
 *       400:
 *         description: Thông tin không hợp lệ (Thời gian <= 0) hoặc thiếu trường bắt buộc
 *       409:
 *         description: Bị trùng mức độ ưu tiên với một SLA đang active
 */
router.post('/policies', slaController.createPolicy);

/**
 * @openapi
 * /api/v1/sla/policies/{id}:
 *   put:
 *     summary: Cập nhật chính sách SLA (API-30)
 *     description: Nếu sửa trạng thái thành bật (trang_thai=true), hệ thống sẽ check trùng lặp ưu tiên.
 *     tags: [SLA]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của chính sách SLA cần cập nhật
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ten_chinh_sach:
 *                 type: string
 *                 example: "SLA ưu tiên cao - Hành chính (cập nhật)"
 *               loai_thoi_gian:
 *                 type: string
 *                 enum: [GIO_HANH_CHINH, H24_7]
 *                 example: "H24_7"
 *               tg_phan_hoi:
 *                 type: integer
 *                 description: Thời gian phản hồi tính bằng phút
 *                 example: 30
 *               tg_xu_ly:
 *                 type: integer
 *                 description: Thời gian xử lý tính bằng phút
 *                 example: 180
 *               trang_thai:
 *                 type: boolean
 *                 description: Bật/tắt chính sách
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChinhSachSla'
 *       400:
 *         description: Dữ liệu không hợp lệ (thời gian <=0)
 *       404:
 *         description: ID không tồn tại
 *       409:
 *         description: Kích hoạt thất bại do trùng lặp mức độ ưu tiên với một SLA active khác
 */
router.put('/policies/:id', slaController.updatePolicy);

export default router;