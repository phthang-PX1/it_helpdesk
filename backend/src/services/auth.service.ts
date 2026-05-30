import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import * as authRepo from '../repositories/auth.repository';
import { AppError } from '../middlewares/errorHandler';
import { saveRefreshTokenRedis, getRefreshTokenRedis, deleteRefreshTokenRedis } from '../libs/redis';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateAccessToken = (user: any) => {
  return jwt.sign(
    { 
      nhan_vien_id: user.nhan_vien_id, 
      tai_khoan: user.tai_khoan || null, 
      vai_tro: user.vai_tro?.ma_vai_tro || user.ma_vai_tro || null 
    },
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any }
  );
};

const generateRefreshToken = (nhanVienId: number): string => {
  return jwt.sign(
    { nhan_vien_id: nhanVienId }, 
    process.env.REFRESH_JWT_SECRET as string, 
    { expiresIn: '7d' as any }
  );
};

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

  const token = generateAccessToken(nhanVien);
  const refresh_token = generateRefreshToken(nhanVien.nhan_vien_id);

  await saveRefreshTokenRedis(refresh_token, nhanVien.nhan_vien_id);

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

export const googleLoginUser = async (google_id_token: string) => {
  let payload;
  try {
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

  const allowedDomains = (process.env.COMPANY_EMAIL_DOMAIN || '').split(',');
  const userDomain = email.split('@')[1];
  const isDomainValid = allowedDomains.includes(userDomain);

  if (!isDomainValid) {
    throw new AppError('Bị từ chối! Email không thuộc danh sách domain được cấp phép của công ty.', 403);
  }

  const nhanVien = await authRepo.findUserByEmail(email);
  if (!nhanVien) {
    throw new AppError('Tài khoản email này chưa được đồng bộ hoặc tạo lập trên hệ thống.', 404);
  }

  if (!nhanVien.trang_thai) {
    throw new AppError('Tài khoản của bạn hiện đang bị khóa tạm thời. Vui lòng liên hệ Admin!', 403);
  }

  if (!nhanVien.vai_tro_id) {
    throw new AppError('Tài khoản của bạn tồn tại nhưng chưa được cấu hình vai trò trên hệ thống.', 403);
  }

  const fullNhanVienInfo = await authRepo.findUserById(nhanVien.nhan_vien_id);

  const token = generateAccessToken(fullNhanVienInfo);
  const refresh_token = generateRefreshToken(nhanVien.nhan_vien_id);

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

export const logoutUser = async (refresh_token: string) => {
  const nhanVienIdStr = await getRefreshTokenRedis(refresh_token);
  if (!nhanVienIdStr) {
    throw new AppError('Yêu cầu không hợp lệ! Mã refresh_token này không tồn tại hoặc đã bị thu hồi trước đó.', 400);
  }

  await deleteRefreshTokenRedis(refresh_token);
  return { message: 'Đăng xuất tài khoản khỏi hệ thống thành công.' };
};

export const refreshAccessToken = async (refresh_token: string) => {
  const nhanVienIdStr = await getRefreshTokenRedis(refresh_token);
  
  if (!nhanVienIdStr) {
    throw new AppError('Mã phiên hoạt động hết hạn hoặc không hợp lệ. Vui lòng tiến hành đăng nhập lại!', 401);
  }

  const nhan_vien_id = parseInt(nhanVienIdStr, 10);

  const nhanVien = await authRepo.findUserById(nhan_vien_id);
  if (!nhanVien || !nhanVien.trang_thai) {
    throw new AppError('Xác thực thất bại! Tài khoản nhân viên liên quan không hợp lệ hoặc đã bị vô hiệu hóa.', 401);
  }

  const token = generateAccessToken(nhanVien);
  return { token };
};

export const getMe = async (nhan_vien_id: number) => {
  const nhanVien = await authRepo.findUserById(nhan_vien_id);
  if (!nhanVien) {
    throw new AppError('Không tìm thấy dữ liệu hồ sơ nhân sự trên hệ thống.', 404);
  }

  const { mat_khau, ...userWithoutPassword } = nhanVien;
  return userWithoutPassword;
};