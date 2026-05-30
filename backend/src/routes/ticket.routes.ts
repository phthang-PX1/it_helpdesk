// src/routes/ticket.routes.ts
import { Router } from 'express';
import { ticketController } from '../controllers/ticket.controller';
import { verifyToken, checkRole } from '../middlewares/auth.middleware';
import { uploadTicketFiles } from '../libs/multer';


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
 *               muc_do_anh_huong:
 *                 type: string
 *                 enum: [THAP, TRUNG_BINH, CAO]
 *                 example: "CAO"
 *               muc_do_khan_cap:
 *                 type: string
 *                 enum: [THAP, TRUNG_BINH, CAO]
 *                 example: "TRUNG_BINH"
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
router.post('/', verifyToken, checkRole(['NGUOI_YEU_CAU']), uploadTicketFiles.array('files', 5), ticketController.create);
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
 *                 enum: [MOI_TAO, DANG_GIAI_QUYET, CHO_PHAN_HOI, DA_GIAI_QUYET, DA_DONG]
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

/**
 * @openapi
 * /api/v1/tickets/{id}/escalate:
 *   post:
 *     summary: L1 chuyển cấp ticket sang nhóm L2 (API-10)
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã ticket cần chuyển cấp
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ly_do
 *               - cac_buoc_da_thu
 *             properties:
 *               ly_do:
 *                 type: string
 *                 example: "Vấn đề ngoài khả năng xử lý của L1"
 *               cac_buoc_da_thu:
 *                 type: string
 *                 example: "Đã restart máy in và cài lại driver nhưng không được"
 *     responses:
 *       200:
 *         description: Chuyển cấp thành công
 *       403:
 *         description: Không có quyền (chỉ IT_L1)
 *       404:
 *         description: Không tìm thấy ticket
 */
router.post('/:id/escalate', verifyToken, checkRole(['IT_L1']), ticketController.escalate);

/**
 * @openapi
 * /api/v1/tickets/{id}/reopen:
 *   post:
 *     summary: Hệ thống/Quản lý/Người yêu cầu mở lại ticket sau đánh giá (API-11)
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mở lại ticket thành công hoặc tạo ticket mới nếu mở lại quá 2 lần
 *       403:
 *         description: Chỉ Quản lý hoặc Người tạo mới có quyền
 *       404:
 *         description: Ticket không tồn tại
 */
router.post('/:id/reopen', verifyToken, checkRole(['NGUOI_YEU_CAU', 'QUAN_LY']), ticketController.reopen);

/**
 * @openapi
 * /api/v1/tickets/{id}/comments:
 *   post:
 *     summary: Thêm bình luận vào ticket (API-12)
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - noi_dung
 *             properties:
 *               noi_dung:
 *                 type: string
 *               loai_binh_luan:
 *                 type: string
 *                 enum: [public, internal]
 *                 example: "public"
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Bình luận đã được thêm
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập ticket này
 */
router.post(
  '/:id/comments', 
  verifyToken, 
  checkRole(['NGUOI_YEU_CAU', 'IT_L1', 'IT_L2', 'QUAN_LY']), 
  uploadTicketFiles.array('files', 5), // Chặn nghiêm ngặt cấu hình 5 files / tối đa 20MB như kiến trúc
  ticketController.createComment
);

/**
 * @openapi
 * /api/v1/tickets/{id}/comments:
 *   get:
 *     summary: Lấy danh sách bình luận của ticket (API-13)
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách bình luận (có phân quyền xem nội bộ/công khai)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       403:
 *         description: Không có quyền xem ticket này
 *       404:
 *         description: Ticket không tồn tại
 */
router.get('/:id/comments', verifyToken, checkRole(['NGUOI_YEU_CAU', 'IT_L1', 'IT_L2', 'QUAN_LY']), ticketController.getComments);

/**
 * @openapi
 * /api/v1/tickets/{id}/history:
 *   get:
 *     summary: Lấy toàn bộ lịch sử thay đổi của ticket (API-14)
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã ticket cần xem lịch sử
 *     responses:
 *       200:
 *         description: Danh sách lịch sử thay đổi (trạng thái, người xử lý, ưu tiên, v.v.)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LichSuPhieu'
 *       403:
 *         description: Không có quyền xem ticket này
 *       404:
 *         description: Không tìm thấy ticket
 */
router.get('/:id/history', verifyToken, checkRole(['NGUOI_YEU_CAU', 'IT_L1', 'IT_L2', 'QUAN_LY']), ticketController.getHistory);

/**
 * @openapi
 * /api/v1/tickets/{id}/assign:
 *   put:
 *     summary: Manager chỉ định lại kỹ thuật viên phụ trách ticket (API-15)
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã ticket cần chỉ định lại
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nguoi_ho_tro_id]
 *             properties:
 *               nguoi_ho_tro_id:
 *                 type: integer
 *                 description: ID của kỹ thuật viên mới được chỉ định
 *                 example: 15
 *     responses:
 *       200:
 *         description: Chỉ định lại kỹ thuật viên thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PhieuHoTro'
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ (thiếu nguoi_ho_tro_id hoặc ID không tồn tại)
 *       403:
 *         description: Không có quyền (chỉ QUAN_LY)
 *       404:
 *         description: Không tìm thấy ticket hoặc kỹ thuật viên
 */
router.put('/:id/assign', verifyToken, checkRole(['QUAN_LY']), ticketController.assignManager);

/**
 * @openapi
 * /api/v1/tickets/{id}/sla:
 *   get:
 *     summary: Xem trạng thái SLA hiện tại của ticket (Real-time) (API-16)
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã ticket cần kiểm tra SLA
 *     responses:
 *       200:
 *         description: Trạng thái SLA chi tiết (còn thời gian, đã vi phạm, deadline, v.v.)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tg_phan_hoi:
 *                   type: object
 *                   properties:
 *                     han_chot:
 *                       type: string
 *                       format: date-time
 *                     con_lai:
 *                       type: string
 *                     da_vi_pham:
 *                       type: boolean
 *                 tg_xu_ly:
 *                   type: object
 *                   properties:
 *                     han_chot:
 *                       type: string
 *                       format: date-time
 *                     con_lai:
 *                       type: string
 *                     da_vi_pham:
 *                       type: boolean
 *       403:
 *         description: Không có quyền (chỉ IT_L1, IT_L2, QUAN_LY)
 *       404:
 *         description: Không tìm thấy ticket
 */
router.get('/:id/sla', verifyToken, checkRole(['IT_L1', 'IT_L2', 'QUAN_LY']), ticketController.getSLA);


export default router;