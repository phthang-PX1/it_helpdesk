// src/routes/review.routes.ts
import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { verifyToken, checkRole } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Reviews
 *   description: Quản lý khảo sát và đánh giá hài lòng Ticket
 */

/**
 * @openapi
 * /api/v1/reviews/validate-token:
 *   get:
 *     summary: Kiểm tra token khảo sát (API-17)
 *     tags: [Reviews]
 *     parameters:
 *       - name: token
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Token xác thực được gửi qua email sau khi ticket được giải quyết
 *     responses:
 *       200:
 *         description: Token hợp lệ, có thể tiến hành đánh giá
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 ticket_id:
 *                   type: integer
 *                   example: 123
 *       400:
 *         description: Thiếu token
 *       404:
 *         description: Token không hợp lệ hoặc đã hết hạn
 */
router.get('/validate-token', reviewController.validateToken);

/**
 * @openapi
 * /api/v1/reviews:
 *   post:
 *     summary: Gửi đánh giá sau khi ticket được giải quyết (API-18)
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - hai_long
 *               - so_sao
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token xác thực nhận được qua email
 *                 example: "abc123xyz"
 *               hai_long:
 *                 type: boolean
 *                 description: Người dùng có hài lòng với quá trình xử lý không
 *                 example: true
 *               so_sao:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Đánh giá số sao (1-5)
 *                 example: 5
 *               nhan_xet:
 *                 type: string
 *                 description: Nhận xét chi tiết (tùy chọn)
 *                 example: "IT giải quyết nhanh chóng, rất hài lòng"
 *               ly_do_khong_hai_long:
 *                 type: string
 *                 description: Lý do không hài lòng (bắt buộc nếu hai_long = false)
 *                 example: "Xử lý quá chậm"
 *     responses:
 *       200:
 *         description: Đánh giá thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cảm ơn bạn đã đánh giá"
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ (thiếu trường, sai kiểu, hoặc lý do không hài lòng thiếu khi hai_long=false)
 *       404:
 *         description: Token không hợp lệ hoặc đã được sử dụng
 */
router.post('/', reviewController.submitReview);

/**
 * @openapi
 * /api/v1/reviews/{ticket_id}:
 *   get:
 *     summary: Xem kết quả đánh giá của một ticket (API-19)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: ticket_id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của ticket cần xem đánh giá
 *         example: 123
 *     responses:
 *       200:
 *         description: Lấy kết quả đánh giá thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hai_long:
 *                   type: boolean
 *                 so_sao:
 *                   type: integer
 *                 nhan_xet:
 *                   type: string
 *                 ngay_danh_gia:
 *                   type: string
 *                   format: date-time
 *       403:
 *         description: Không có quyền xem đánh giá của ticket này (chỉ IT_L1, IT_L2, QUAN_LY)
 *       404:
 *         description: Không tìm thấy ticket hoặc ticket chưa có đánh giá
 */
router.get('/:ticket_id', verifyToken, checkRole(['IT_L1', 'IT_L2', 'QUAN_LY']), reviewController.getReview);

export default router;