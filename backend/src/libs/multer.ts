// src/libs/multer.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middlewares/errorHandler';

// Sử dụng Memory Storage để hứng buffer tệp trước khi ghi nhận vào DB (GIỮ NGUYÊN 100% GỐC CỦA BẠN)
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
  // Chặn nghiêm ngặt định dạng file theo đặc tả Map Pacific Singapore (GIỮ NGUYÊN 100% GỐC CỦA BẠN)
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

// ĐỂ KHÔNG XUNG ĐỘT API CŨ: Giữ nguyên tên biến và cấu hình xuất khẩu của bạn
export const uploadTicketFiles = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // Chặn cứng file > 20MB tại cửa ngõ Network
  },
  fileFilter: fileFilter,
});

/**
 * 🚀 ARCHITECT HELPER: HÀM GHI BÀI VÀO Ổ CỨNG TỪ BUFFER RAM
 * Tác dụng: Chuyển dữ liệu từ Express.Multer.File (Memory Storage) lưu xuống ổ cứng Local khi Dev
 * Sử dụng chính xác thư viện uuidv4 bạn đã import để tránh xung đột tên file.
 */
export const saveMemoryFileToDisk = (file: any, subFolder: 'attachments' | 'kb' = 'attachments'): {
  ten_tep: string;
  duong_dan_file: string;
  dinh_dang: string;
  dung_luong_kb: number;
} => {
  // 1. Quy hoạch thư mục đích vật lý
  const targetDir = path.join('uploads', subFolder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 2. Thuật toán băm tên file độc bản bằng UUIDv4 tránh trùng lặp tệp
  const ext = path.extname(file.originalname).toLowerCase();
  const uniqueFileName = `${uuidv4()}${ext}`;
  const fullPath = path.join(targetDir, uniqueFileName);

  // 3. Thực hiện ghi luồng dữ liệu Buffer nhị phân trực tiếp từ RAM Cache xuống Disk
  fs.writeFileSync(fullPath, file.buffer);

  // 4. Trả ra Payload chuẩn hóa, format đường dẫn xiên xuôi `/` để Frontend/S3 dễ map
  return {
    ten_tep: file.originalname,
    duong_dan_file: `uploads/${subFolder}/${uniqueFileName}`.replace(/\\/g, '/'),
    dinh_dang: ext.replace('.', ''),
    dung_luong_kb: Math.round(file.size / 1024)
  };
};