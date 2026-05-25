// src/routes/attachment.routes.ts
import { Router } from 'express';
import { attachmentController } from '../controllers/attachment.controller';
import { verifyToken, checkRole } from '../middlewares/auth.middleware';
import { uploadTicketFiles as upload } from '../libs/multer';


const router = Router();

/**
 * @openapi
 * tags:
 *   name: Attachments
 *   description: API Quản lý file đính kèm (Upload cục bộ / S3, Dọn rác)
 */

/**
 * @openapi
 * /api/v1/attachments/tickets/{ticket_id}:
 *   post:
 *     summary: Upload file đính kèm trực tiếp vào ticket (API-26)
 *     tags: [Attachments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: ticket_id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của ticket cần upload file đính kèm
 *         example: 123
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Hỗ trợ tối đa 5 files. Định dạng jpg, png, pdf, docx, xlsx. (Tối đa 20MB/file)
 *     responses:
 *       201:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Upload thành công"
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TepDinhKem'
 *       400:
 *         description: File sai định dạng, vượt quá dung lượng, hoặc không có file
 *       401:
 *         description: Chưa xác thực (thiếu hoặc sai token)
 *       403:
 *         description: Không có quyền truy cập ticket này
 *       404:
 *         description: Không tìm thấy ticket
 *       409:
 *         description: Ticket đã đóng, không thể upload
 */
router.post(
  '/tickets/:ticket_id',
  verifyToken,
  checkRole(['NGUOI_YEU_CAU', 'IT_L1', 'IT_L2', 'QUAN_LY']),
  upload.array('files', 5), // Chặn nghiêm ngặt tối đa 5 file
  attachmentController.uploadToTicket
);

/**
 * @openapi
 * /api/v1/attachments/{id}:
 *   delete:
 *     summary: Xóa một file đính kèm (API-27)
 *     description: Xóa record trong Database và dọn rác file vật lý. Cần quyền sở hữu hoặc Manager.
 *     tags: [Attachments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của file đính kèm cần xóa
 *         example: 456
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Xóa file thành công"
 *       401:
 *         description: Chưa xác thực (thiếu hoặc sai token)
 *       403:
 *         description: Không phải chủ sở hữu file hoặc không có quyền xóa
 *       404:
 *         description: File không tồn tại
 *       409:
 *         description: Ticket đã đóng, không thể xóa file
 */
router.delete(
  '/:id',
  verifyToken,
  checkRole(['NGUOI_YEU_CAU', 'IT_L1', 'IT_L2', 'QUAN_LY']),
  attachmentController.deleteAttachment
);

export default router;