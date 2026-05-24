// src/routes/ticket.routes.ts
import { Router } from 'express';
import { ticketController } from '../controllers/ticket.controller';
import { verifyToken, checkRole } from '../middlewares/auth.middleware';
import multer from 'multer';

const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 }
});

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Tickets
 *   description: Các API quản lý và xử lý phiếu hỗ trợ kỹ thuật (Phase 2)
 */

/**
 * @openapi
 * /api/v1/tickets:
 *   post:
 *     summary: Tạo ticket mới, khởi tạo SLA và đẩy hàng đợi thông báo (API-06)
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - tieu_de
 *               - mo_ta_chi_tiet
 *             properties:
 *               tieu_de:
 *                 type: string
 *                 example: "Máy in phòng xuất nhập khẩu bị kẹt giấy"
 *               mo_ta_chi_tiet:
 *                 type: string
 *                 example: "Máy in HP không kéo được giấy, liên tục báo lỗi kẹt cơ."
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Khởi tạo ticket thành công và trả về thông tin phiếu (Định dạng JSON chuẩn)
 *       400:
 *         description: Thiếu thông tin bắt buộc hoặc file sai định dạng/dung lượng
 *       401:
 *         description: Access Token không hợp lệ hoặc đã hết hạn
 *       403:
 *         description: Tài khoản không có vai trò NGUOI_YEU_CAU
 */
router.post('/', verifyToken, checkRole(['NGUOI_YEU_CAU']), upload.array('files', 5), ticketController.create);

/**
 * @openapi
 * /api/v1/tickets:
 *   get:
 *     summary: Lấy danh sách ticket phân tầng bảo mật dữ liệu (API-07)
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: trang_thai
 *         in: query
 *         schema:
 *           type: string
 *           enum: [MOI_TAO, DANG_GIAI_QUYET, DA_GIAI_QUYET, DA_DONG]
 *       - name: muc_do_uu_tien
 *         in: query
 *         schema:
 *           type: string
 *           enum: [THAP, TRUNG_BINH, CAO]
 *       - name: keyword
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tải danh sách dữ liệu và phân trang hoàn tất
 *       400:
 *         description: Tham số điều kiện lọc không hợp lệ
 *       401:
 *         description: Chưa đăng nhập hoặc phiên làm việc hết hạn
 */
router.get('/', verifyToken, checkRole(['NGUOI_YEU_CAU', 'IT_L1', 'IT_L2', 'QUAN_LY']), ticketController.getAll);

/**
 * @openapi
 * /api/v1/tickets/{id}:
 *   get:
 *     summary: Xem thông tin chi tiết toàn diện của một ticket (API-08)
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tải dữ liệu chi tiết phiếu, SLA, lịch sử và bình luận thành công
 *       403:
 *         description: Bạn không có quyền truy cập thông tin phiếu hỗ trợ này
 *       404:
 *         description: Ticket không tồn tại trên hệ thống Map Pacific
 */
router.get('/:id', verifyToken, checkRole(['NGUOI_YEU_CAU', 'IT_L1', 'IT_L2', 'QUAN_LY']), ticketController.getDetail);

/**
 * @openapi
 * /api/v1/tickets/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái phiếu và ghi nhận lịch sử Workflow (API-09)
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trang_thai
 *             properties:
 *               trang_thai:
 *                 type: string
 *                 enum: [MOI_TAO, DANG_GIAI_QUYET, DA_GIAI_QUYET, DA_DONG]
 *                 example: "DANG_GIAI_QUYET"
 *               ghi_chu:
 *                 type: string
 *                 example: "Đã xử lý xong phần kẹt cơ khay giấy."
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái và lưu lịch sử thay đổi thành công
 *       400:
 *         description: Chuyển đổi sai luồng quy định của Workflow
 *       403:
 *         description: Không có quyền xử lý phiếu thuộc nhóm khác phụ trách
 *       409:
 *         description: Phiếu hỗ trợ này đã đóng, không thể chỉnh sửa
 */
router.put('/:id/status', verifyToken, checkRole(['IT_L1', 'IT_L2', 'QUAN_LY']), ticketController.updateStatus);

export default router;