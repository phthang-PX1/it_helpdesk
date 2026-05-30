// src/controllers/attachment.controller.ts
import { Response } from 'express';
import { attachmentService } from '../services/attachment.service';
import { ticketIdParamSchema, attachmentIdParamSchema } from '../validators/attachment.schema';
import { AppError } from '../middlewares/errorHandler';

export const attachmentController = {
  uploadToTicket: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user) throw new AppError('Yêu cầu xác thực tài khoản', 401);
      
      const { ticket_id } = ticketIdParamSchema.parse(req.params);
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw new AppError('Vui lòng đính kèm ít nhất một file', 400);
      }

      const userRole = req.user.vai_tro?.ma_vai_tro || req.user.vai_tro;
      const uploadedFiles = await attachmentService.uploadToTicket(ticket_id, req.user.nhan_vien_id, userRole, files);

      // 🔗 REALTIME SOCKET.IO TRIGGER: Phát cho phòng chat của ticket
      const io = require('../libs/socket').getIo();
      io.to(`ticket_${ticket_id}`).emit('new_attachment_uploaded', {
        success: true,
        message: 'Có tệp đính kèm mới được tải lên',
        data: uploadedFiles
      });

      res.status(201).json({
        success: true,
        message: 'Upload file đính kèm thành công',
        data: uploadedFiles
      });
    } catch (error) { next(error); }
  },

  deleteAttachment: async (req: any, res: Response, next: any) => {
    try {
      if (!req.user) throw new AppError('Yêu cầu xác thực tài khoản', 401);
      
      const { id } = attachmentIdParamSchema.parse(req.params);
      const userRole = req.user.vai_tro?.ma_vai_tro || req.user.vai_tro;

      const ticket_id = await attachmentService.deleteAttachment(id, req.user.nhan_vien_id, userRole);

      if (ticket_id) {
        const io = require('../libs/socket').getIo();
        io.to(`ticket_${ticket_id}`).emit('attachment_deleted', {
          success: true,
          message: 'Một tệp đính kèm đã bị xóa',
          attachment_id: id
        });
      }

      res.status(200).json({
        success: true,
        message: 'Xóa thành công'
      });
    } catch (error) { next(error); }
  }
};