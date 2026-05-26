// src/routes/notification.routes.ts
import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Notifications
 *   description: Hệ thống thông báo cá nhân cho người dùng
 *
 * components:
 *   schemas:
 *     ThongBao:
 *       type: object
 *       properties:
 *         notification_id:
 *           type: integer
 *           example: 1
 *         loai:
 *           type: string
 *           example: "TICKET_CREATED"
 *         tieu_de:
 *           type: string
 *           example: "Phiếu hỗ trợ mới cần xử lý"
 *         noi_dung:
 *           type: string
 *           example: "Bạn vừa được gán vào phiếu lỗi máy in khẩn cấp."
 *         phieu_ho_tro_id:
 *           type: integer
 *           nullable: true
 *           example: 10
 *         da_doc:
 *           type: boolean
 *           example: false
 *         ngay_tao:
 *           type: string
 *           format: date-time
 */

// Tất cả các API thông báo đều yêu cầu đăng nhập
router.use(verifyToken);

/**
 * @openapi
 * /api/v1/notifications:
 *   get:
 *     summary: Lấy danh sách thông báo của người dùng hiện tại (API-42)
 *     tags: [Notifications]
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
 *           default: 20
 *         description: Số lượng thông báo trên mỗi trang
 *       - name: da_doc
 *         in: query
 *         description: Lọc theo trạng thái đọc (true = đã đọc, false = chưa đọc)
 *         schema:
 *           type: boolean
 *         example: false
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ThongBao'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Chưa xác thực (thiếu hoặc sai token)
 */
router.get('/', notificationController.getAll);

/**
 * @openapi
 * /api/v1/notifications/read-all:
 *   put:
 *     summary: Đánh dấu tất cả thông báo của user hiện tại là đã đọc (API-44)
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Đã đánh dấu tất cả thông báo là đã đọc"
 *                 updated_count:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: Chưa xác thực
 */
router.put('/read-all', notificationController.readAll);

/**
 * @openapi
 * /api/v1/notifications/{id}/read:
 *   put:
 *     summary: Đánh dấu một thông báo là đã đọc (API-43)
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của thông báo cần đánh dấu đã đọc
 *         example: 15
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Đã đánh dấu thông báo là đã đọc"
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không phải thông báo của bạn
 *       404:
 *         description: Không tìm thấy thông báo
 */
router.put('/:id/read', notificationController.readOne);

export default router;