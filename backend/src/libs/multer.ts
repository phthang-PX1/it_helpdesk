// src/libs/multer.ts
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middlewares/errorHandler';

// Sử dụng Memory Storage để hứng buffer tệp trước khi ghi nhận vào DB
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
  // Chặn nghiêm ngặt định dạng file theo đặc tả Map Pacific Singapore
  const allowedExtensions = /jpeg|jpg|png|pdf|docx|xlsx/;
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 
    'application/pdf', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // xlsx
  ];

  const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimeTypeValid = allowedMimeTypes.includes(file.mimetype);

  if (extName && mimeTypeValid) {
    return callback(null, true);
  }
  
  callback(new AppError('File không hợp lệ! Hệ thống chỉ chấp nhận định dạng jpg, png, pdf, docx, xlsx', 400));
};

export const uploadTicketFiles = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // Chặn cứng file > 20MB tại cửa ngõ Network
  },
  fileFilter: fileFilter,
});