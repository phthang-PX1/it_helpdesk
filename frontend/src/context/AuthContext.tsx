/**
 * AuthContext.tsx
 * Quản lý phiên đăng nhập tập trung cho toàn bộ ứng dụng.
 * Cung cấp: session, login(), logout(), isAuthenticated, hasRole()
 *
 * Phiên bản này đã đấu nối với API Backend thật (API-01 → API-04).
 * Token và refresh_token được lưu vào localStorage qua các key
 * được export từ libs/axios.ts để dùng chung.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import axiosInstance, {
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  SESSION_KEY,
} from '../libs/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Mapping từ mã vai trò Backend (ma_vai_tro) sang chuỗi hiển thị
 * được dùng trong Sidebar, AppRoutes và mọi nơi khác trong Frontend.
 */
export type UserRole =
  | 'Người yêu cầu'  // NGUOI_YEU_CAU
  | 'L1'             // IT_L1
  | 'L2'             // IT_L2
  | 'Quản lý IT';   // QUAN_LY

/** Ánh xạ ma_vai_tro → UserRole tiếng Việt */
export const mapMaVaiTroToRole = (maVaiTro: string): UserRole => {
  switch (maVaiTro) {
    case 'IT_L1':         return 'L1';
    case 'IT_L2':         return 'L2';
    case 'QUAN_LY':       return 'Quản lý IT';
    case 'NGUOI_YEU_CAU':
    default:              return 'Người yêu cầu';
  }
};

/** Thông tin phiên người dùng lưu trong localStorage và Context */
export interface UserSession {
  nhan_vien_id: number;
  email:        string;
  ho_ten:       string;
  /** Role hiển thị tiếng Việt (đã được map từ ma_vai_tro) */
  role:         UserRole | string;
  /** ma_vai_tro gốc từ Backend — dùng để kiểm tra quyền chính xác */
  ma_vai_tro:   string;
}

/** Dữ liệu user trả về từ API-01 /auth/login */
interface LoginApiUser {
  nhan_vien_id: number;
  ho_ten:       string;
  email:        string;
  vai_tro: {
    ma_vai_tro:  string;
    ten_vai_tro: string;
  };
  nhom_ho_tro_id?: number | null;
}

interface AuthContextValue {
  session: UserSession | null;
  isAuthenticated: boolean;
  /**
   * Gọi sau khi nhận response thành công từ API /auth/login.
   * Nhận đầy đủ token + refresh_token + thông tin user từ Backend.
   */
  login: (token: string, refreshToken: string, user: LoginApiUser) => void;
  logout: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
  /** Trả về đường dẫn Dashboard phù hợp với vai trò hiện tại */
  getDashboardPath: () => string;
  /** Trả về đường dẫn Phiếu hỗ trợ phù hợp với vai trò hiện tại */
  getTicketsPath: () => string;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /** Khởi tạo session từ localStorage (nếu đã từng đăng nhập) */
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as UserSession) : null;
    } catch {
      return null;
    }
  });

  /**
   * Lưu token, refresh_token và thông tin user sau khi đăng nhập thành công.
   * Được gọi từ Login.tsx sau khi nhận response 200 từ API-01.
   */
  const login = useCallback(
    (token: string, refreshToken: string, user: LoginApiUser) => {
      // Ánh xạ ma_vai_tro → role tiếng Việt
      const role = mapMaVaiTroToRole(user.vai_tro.ma_vai_tro);

      const s: UserSession = {
        nhan_vien_id: user.nhan_vien_id,
        email:        user.email,
        ho_ten:       user.ho_ten,
        role,
        ma_vai_tro:   user.vai_tro.ma_vai_tro,
      };

      // Lưu tất cả vào localStorage
      localStorage.setItem(TOKEN_KEY,         token);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(SESSION_KEY,       JSON.stringify(s));

      setSession(s);
    },
    [],
  );

  /**
   * Đăng xuất: gọi API-03 /auth/logout để vô hiệu hóa refresh_token trên server,
   * sau đó xóa toàn bộ dữ liệu phiên khỏi localStorage.
   */
  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      if (refreshToken) {
        // API-03: POST /auth/logout — gửi refresh_token để thu hồi trên Redis
        await axiosInstance.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch {
      // Bỏ qua lỗi mạng khi logout — vẫn tiếp tục xóa session phía client
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
      setSession(null);
    }
  }, []);

  const hasRole = useCallback(
    (...roles: string[]) =>
      !!session && (roles.includes(session.role) || roles.includes(session.ma_vai_tro)),
    [session],
  );

  /**
   * UC-01 – Luồng điều hướng chuẩn:
   * - Người yêu cầu (NGUOI_YEU_CAU) → Cổng yêu cầu cá nhân (/tickets/my-tickets)
   * - Quản lý IT    (QUAN_LY)        → Bảng điều khiển quản trị (/dashboard)
   * - L1 / L2       (IT_L1 / IT_L2)  → /dashboard (DashboardRouter xử lý tiếp)
   */
  const getDashboardPath = useCallback((): string => {
    if (!session) return '/login';
    return '/dashboard';
  }, [session]);

  /**
   * Điều hướng tab "Phiếu hỗ trợ" theo vai trò:
   * - Người yêu cầu → /tickets/my-tickets
   * - L2            → /tickets/l2
   * - Tất cả còn lại → /tickets/queue
   */
  const getTicketsPath = useCallback((): string => {
    if (!session) return '/login';
    if (session.role === 'Người yêu cầu') return '/tickets/my-tickets';
    if (session.role === 'L2')            return '/tickets/l2';
    return '/tickets/queue';
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: !!session,
        login,
        logout,
        hasRole,
        getDashboardPath,
        getTicketsPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
