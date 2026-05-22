import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import * as authRepo from '../repositories/auth.repository';
import { AppError } from '../middlewares/errorHandler';
import { saveRefreshTokenRedis, getRefreshTokenRedis, deleteRefreshTokenRedis } from '../libs/redis';

// Khởi tạo Google OAuth2 Client để xác thực Token từ Google
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Hàm helper tự động tạo chuỗi Token Access (Thời hạn 8 giờ)
 */
const generateAccessToken = (user: any) => {
  return jwt.sign(
    { 
      nhan_vien_id: user.nhan_vien_id, 
      tai_khoan: user.tai_khoan || null, 
      vai_tro: user.vai_tro?.ma_vai_tro || user.ma_vai_tro || null 
    },
    process.env.JWT_SECRET as string,
    { 
      expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any 
    }
  );
};

/**
 * Hàm helper tự động tạo chuỗi Refresh Token (Thời hạn 7 ngày)
 */
const generateRefreshToken = (nhanVienId: number): string => {
  return jwt.sign(
    { nhan_vien_id: nhanVienId }, 
    process.env.REFRESH_JWT_SECRET as string, 
    { expiresIn: '7d' }
  );
};

/**
 * API-01 (Refactored): Đăng nhập truyền thống bằng tài khoản + mật khẩu
 */
export const loginUser = async (tai_khoan: string, mat_khau: string) => {
  const nhanVien = await authRepo.findUserByTaiKhoan(tai_khoan);

  if (!nhanVien || !nhanVien.trang_thai) {
    throw new AppError('Tài khoản hoặc mật khẩu không chính xác, hoặc đã bị khóa!', 401);
  }

  const isMatch = await bcrypt.compare(mat_khau, nhanVien.mat_khau);
  if (!isMatch) {
    throw new AppError('Tài khoản hoặc mật khẩu không chính xác!', 401);
  }

  if (!nhanVien.vai_tro) {
    throw new AppError('Tài khoản của bạn chưa được cấp quyền truy cập hệ thống.', 403);
  }

  // 1. Sinh Access Token (8h) & Refresh Token (7 ngày)
  const token = generateAccessToken(nhanVien);
  const refresh_token = generateRefreshToken(nhanVien.nhan_vien_id);

  // 2. LƯU Refresh Token vào bộ nhớ RAM của Redis
  await saveRefreshTokenRedis(refresh_token, nhanVien.nhan_vien_id);

  // 3. Trả về đúng định dạng mong đợi của tài liệu thiết kế api_document
  return { 
    token, 
    refresh_token,
    user: {
      nhan_vien_id: nhanVien.nhan_vien_id,
      ho_ten: nhanVien.ho_ten,
      email: nhanVien.email,
      vai_tro: {
        ma_vai_tro: nhanVien.vai_tro.ma_vai_tro,
        ten_vai_tro: nhanVien.vai_tro.ten_vai_tro
      },
      nhom_ho_tro_id: nhanVien.nhom_ho_tro_id
    }
  };
};

/**
 * API-02: Đăng nhập thông qua Google OAuth Token
 */
export const googleLoginUser = async (google_id_token: string) => {
  let payload;
  try {
    // 1. Gửi token sang Google Server để kiểm tra tính hợp pháp
    const ticket = await googleClient.verifyIdToken({
      idToken: google_id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error) {
    throw new AppError('Mã xác thực Google ID Token không hợp lệ hoặc đã hết hạn!', 401);
  }

  if (!payload || !payload.email) {
    throw new AppError('Không thể trích xuất thông tin email từ tài khoản Google này!', 401);
  }

  const email = payload.email;

  // 2. Chặn nghiêm ngặt: Email bắt buộc phải có đuôi domain của công ty
  if (!email.endsWith(`@${process.env.COMPANY_EMAIL_DOMAIN}`)) {
    throw new AppError('Bị từ chối! Email không thuộc phạm vi sở hữu của công ty.', 403);
  }

  // 3. Tìm kiếm thông tin hồ sơ nhân viên dựa trên email công ty
  const nhanVien = await authRepo.findUserByEmail(email);
  if (!nhanVien) {
    throw new AppError('Tài khoản email này chưa được đồng bộ hoặc tạo lập trên hệ thống.', 404);
  }

  // 4. Kiểm tra trạng thái tài khoản
  if (!nhanVien.trang_thai) {
    throw new AppError('Tài khoản của bạn hiện đang bị khóa tạm thời. Vui lòng liên hệ Admin!', 403);
  }

  if (!nhanVien.vai_tro_id) {
    throw new AppError('Tài khoản của bạn tồn tại nhưng chưa được cấu hình vai trò trên hệ thống.', 403);
  }

  // Đọc đầy đủ dữ liệu thông tin chi tiết vai trò của nhân viên này để nhét vào token payload
  const fullNhanVienInfo = await authRepo.findUserById(nhanVien.nhan_vien_id);

  // 5. Ký phát hành bộ đôi Token mới
  const token = generateAccessToken(fullNhanVienInfo);
  const refresh_token = generateRefreshToken(nhanVien.nhan_vien_id);

  // 6. Ghi phiên hoạt động mới vào cơ sở lưu trữ Redis
  await saveRefreshTokenRedis(refresh_token, nhanVien.nhan_vien_id);

  return {
    token,
    refresh_token,
    user: {
      nhan_vien_id: fullNhanVienInfo!.nhan_vien_id,
      ho_ten: fullNhanVienInfo!.ho_ten,
      email: fullNhanVienInfo!.email,
      vai_tro: {
        ma_vai_tro: fullNhanVienInfo!.vai_tro!.ma_vai_tro,
        ten_vai_tro: fullNhanVienInfo!.vai_tro!.ten_vai_tro
      },
      nhom_ho_tro_id: fullNhanVienInfo!.nhom_ho_tro_id,
    },
  };
};

/**
 * API-03: Đăng xuất, hủy bỏ quyền năng và thu hồi mã Refresh Token
 */
export const logoutUser = async (refresh_token: string) => {
  // 1. Kiểm tra mã token cần thu hồi có tồn tại thực tế trên bộ nhớ Redis không
  const nhanVienIdStr = await getRefreshTokenRedis(refresh_token);
  if (!nhanVienIdStr) {
    throw new AppError('Yêu cầu không hợp lệ! Mã refresh_token này không tồn tại hoặc đã bị thu hồi trước đó.', 400);
  }

  // 2. Chạy lệnh xóa dứt điểm token khỏi bộ nhớ RAM của Redis
  await deleteRefreshTokenRedis(refresh_token);

  return { message: 'Đăng xuất tài khoản khỏi hệ thống thành công.' };
};

/**
 * API-04: Cấp đổi Access Token mới cho client từ Refresh Token còn hạn
 */
export const refreshAccessToken = async (refresh_token: string) => {
  // 1. Tìm token trong Redis
  const nhanVienIdStr = await getRefreshTokenRedis(refresh_token);
  
  // 2. Nếu trả về null nghĩa là token không tồn tại, đã logout hoặc bị cơ chế TTL của Redis xóa rác tự động
  if (!nhanVienIdStr) {
    throw new AppError('Mã phiên hoạt động hết hạn hoặc không hợp lệ. Vui lòng tiến hành đăng nhập lại!', 401);
  }

  const nhan_vien_id = parseInt(nhanVienIdStr, 10);

  // 3. Lấy lại profile đầy đủ của nhân viên để ký lại vào payload của Access Token mới
  const nhanVien = await authRepo.findUserById(nhan_vien_id);
  if (!nhanVien || !nhanVien.trang_thai) {
    throw new AppError('Xác thực thất bại! Tài khoản nhân viên liên quan không hợp lệ hoặc đã bị vô hiệu hóa.', 401);
  }

  // 4. Sinh Access Token mới (8h), giữ nguyên Refresh Token cũ nằm trên RAM
  const token = generateAccessToken(nhanVien);

  return { token };
};

/**
 * API-05: Lấy thông tin chi tiết toàn diện của tài khoản đang kết nối
 */
export const getMe = async (nhan_vien_id: number) => {
  // 1. Thực hiện kết nối DB qua repository, nạp đầy đủ thông tin phòng ban, nhóm hỗ trợ
  const nhanVien = await authRepo.findUserById(nhan_vien_id);
  if (!nhanVien) {
    throw new AppError('Không tìm thấy dữ liệu hồ sơ nhân sự trên hệ thống.', 404);
  }

  // 2. Thực hiện bóc tách loại bỏ thuộc tính mật khẩu ra khỏi kết quả trả về để bảo mật dữ liệu tuyệt đối
  const { mat_khau, ...userWithoutPassword } = nhanVien;

  return userWithoutPassword;
};