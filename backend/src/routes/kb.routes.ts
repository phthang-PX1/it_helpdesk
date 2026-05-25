// src/routes/kb.routes.ts
import { Router } from 'express';
import { kbController } from '../controllers/kb.controller';
import { verifyToken, checkRole } from '../middlewares/auth.middleware';
import multer from 'multer';

// Giới hạn file đính kèm tri thức: 20MB theo quy định
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } }); 
const router = Router();

/**
 * @openapi
 * tags:
 *   name: KnowledgeBase
 *   description: Module Quản lý và Tra cứu Cơ sở Tri thức (Knowledge Base)
 */

/**
 * @openapi
 * /api/v1/kb/search:
 *   get:
 *     summary: Tìm kiếm bài viết tri thức theo từ khóa (API-20)
 *     description: Full-text search trên tiêu đề, nội dung và thẻ. Chỉ trả bài Đã xuất bản (Dùng cho L1 hoặc gợi ý popup).
 *     tags: [KnowledgeBase]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         description: Từ khóa tìm kiếm (tối thiểu 2 ký tự)
 *         schema:
 *           type: string
 *         example: "lỗi mạng"
 *       - name: limit
 *         in: query
 *         description: Số lượng kết quả trả về (mặc định 5)
 *         schema:
 *           type: integer
 *           default: 5
 *         example: 10
 *     responses:
 *       200:
 *         description: Trả về danh sách bài viết khớp từ khóa
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CoSoTriThuc'
 *       400:
 *         description: Từ khóa quá ngắn hoặc bị thiếu
 */
router.get('/search', verifyToken, kbController.search);

/**
 * @openapi
 * /api/v1/kb:
 *   get:
 *     summary: Lấy danh sách bài viết tri thức kèm bộ lọc (API-21)
 *     description: L1/Requester chỉ thấy bài Đã xuất bản. L2/Manager thấy cả bài Nháp.
 *     tags: [KnowledgeBase]
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
 *       - name: loai_su_co
 *         in: query
 *         schema:
 *           type: string
 *         description: Lọc theo loại sự cố
 *         example: "mạng"
 *       - name: the
 *         in: query
 *         schema:
 *           type: string
 *         description: Lọc theo thẻ (tag)
 *         example: "urgent"
 *       - name: trang_thai
 *         in: query
 *         schema:
 *           type: string
 *           enum: [NHAP, DA_XUAT_BAN]
 *         description: Lọc theo trạng thái (chỉ Manager/L2 mới thấy NHAP)
 *       - name: sort
 *         in: query
 *         description: Sắp xếp theo luot_xem, luot_huu_ich hoặc ngay_tao
 *         schema:
 *           type: string
 *           enum: [luot_xem, luot_huu_ich, ngay_tao]
 *           default: ngay_tao
 *     responses:
 *       200:
 *         description: Tải danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CoSoTriThuc'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 */
router.get('/', verifyToken, kbController.getAll);

/**
 * @openapi
 * /api/v1/kb/{id}:
 *   get:
 *     summary: Xem chi tiết bài viết tri thức (API-22)
 *     description: Tự động tăng lượt xem (có debounce bằng Redis). Người dùng không có quyền sẽ không xem được bài Nháp.
 *     tags: [KnowledgeBase]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID bài viết tri thức
 *         example: 1
 *     responses:
 *       200:
 *         description: Trả về chi tiết bài viết
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CoSoTriThuc'
 *       403:
 *         description: Bài nháp - không có quyền xem
 *       404:
 *         description: Bài viết không tồn tại
 */
router.get('/:id', verifyToken, kbController.getDetail);

/**
 * @openapi
 * /api/v1/kb:
 *   post:
 *     summary: Tạo bài viết tri thức mới (API-23)
 *     description: L2/Manager soạn thảo bài viết. Hỗ trợ đính kèm tối đa 10 file.
 *     tags: [KnowledgeBase]
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
 *               - noi_dung
 *               - loai_su_co
 *             properties:
 *               tieu_de:
 *                 type: string
 *                 example: "Hướng dẫn xử lý lỗi VPN"
 *               noi_dung:
 *                 type: string
 *                 example: "Bước 1: Kiểm tra kết nối mạng..."
 *               loai_su_co:
 *                 type: string
 *                 example: "mạng"
 *               the_tags:
 *                 type: string
 *                 description: Các tag phân cách bằng dấu phẩy
 *                 example: "vpn, mạng, xử lý lỗi"
 *               trang_thai:
 *                 type: string
 *                 enum: [NHAP, DA_XUAT_BAN]
 *                 default: NHAP
 *               quyen_xem:
 *                 type: string
 *                 enum: [CONG_KHAI, NOI_BO]
 *                 default: NOI_BO
 *               phieu_ho_tro_id:
 *                 type: integer
 *                 description: ID ticket nguồn (nếu có)
 *                 example: 123
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Tạo bài viết thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CoSoTriThuc'
 *       400:
 *         description: Thiếu thông tin bắt buộc
 *       403:
 *         description: Không có quyền thực hiện (chỉ IT_L2, QUAN_LY)
 */
router.post('/', verifyToken, checkRole(['IT_L2', 'QUAN_LY']), upload.array('files', 10), kbController.create);

/**
 * @openapi
 * /api/v1/kb/{id}:
 *   put:
 *     summary: Cập nhật bài viết tri thức (API-24)
 *     description: Chỉ tác giả hoặc Manager mới được phép sửa.
 *     tags: [KnowledgeBase]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID bài viết cần cập nhật
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tieu_de:
 *                 type: string
 *                 example: "Hướng dẫn xử lý lỗi VPN - Cập nhật"
 *               noi_dung:
 *                 type: string
 *                 example: "Bước 1: Kiểm tra kết nối mạng (cập nhật)..."
 *               loai_su_co:
 *                 type: string
 *                 example: "mạng"
 *               the_tags:
 *                 type: string
 *                 example: "vpn, mạng, xử lý lỗi, quan trọng"
 *               trang_thai:
 *                 type: string
 *                 enum: [NHAP, DA_XUAT_BAN]
 *               quyen_xem:
 *                 type: string
 *                 enum: [CONG_KHAI, NOI_BO]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CoSoTriThuc'
 *       403:
 *         description: Không phải tác giả bài viết hoặc không có quyền
 *       404:
 *         description: Không tìm thấy bài viết
 */
router.put('/:id', verifyToken, checkRole(['IT_L2', 'QUAN_LY']), kbController.update);

/**
 * @openapi
 * /api/v1/kb/{id}/feedback:
 *   post:
 *     summary: Đánh giá độ hữu ích của bài viết (API-25)
 *     description: Dùng Redis tránh một user đánh giá nhiều lần cùng bài (TTL 24h).
 *     tags: [KnowledgeBase]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID bài viết cần đánh giá
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - huu_ich
 *             properties:
 *               huu_ich:
 *                 type: boolean
 *                 description: true = hữu ích, false = không hữu ích
 *                 example: true
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
 *       404:
 *         description: Không tìm thấy bài viết
 *       429:
 *         description: Đã đánh giá trong vòng 24h qua (Rate Limit)
 */
router.post('/:id/feedback', verifyToken, kbController.feedback);

export default router;