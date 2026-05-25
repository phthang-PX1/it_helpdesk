/**
 * libs/axios.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Axios instance dùng chung cho toàn bộ Frontend.
 *
 * Tính năng:
 *  1. baseURL đọc từ biến môi trường VITE_API_URL (mặc định http://localhost:3000/api/v1)
 *  2. Request Interceptor  – tự đính kèm Bearer token vào header
 *  3. Response Interceptor – Auto-Refresh: khi nhận 401 → gọi /auth/refresh
 *     → lưu token mới → retry request gốc mà không bắt user đăng nhập lại
 */
import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

// ─── Storage Keys (đồng bộ với AuthContext) ───────────────────────────────────
export const TOKEN_KEY         = 'it_helpdesk_token';
export const REFRESH_TOKEN_KEY = 'it_helpdesk_refresh_token';
export const SESSION_KEY       = 'it_helpdesk_session';

// ─── Tạo Instance ─────────────────────────────────────────────────────────────
const BASE_URL = (import.meta as ImportMeta & { env: Record<string, string> })
  .env.VITE_API_URL ?? 'http://localhost:3000/api/v1';


const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Tự động đính kèm Access Token vào header Authorization nếu tồn tại
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor (Auto-Refresh Token) ────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject:  (reason?: unknown) => void;
}> = [];

/** Xử lý tất cả request đang chờ sau khi token được làm mới */
const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  // Trường hợp thành công – trả về nguyên vẹn
  (response) => response,

  // Trường hợp lỗi
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Chỉ xử lý Auto-Refresh khi:
    //  - Mã lỗi là 401
    //  - Chưa retry lần nào (tránh vòng lặp vô tận)
    //  - Không phải request đến chính endpoint /auth/refresh hay /auth/login
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Đã có một request đang refresh → xếp hàng chờ
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            (originalRequest.headers as Record<string, string>)['Authorization'] =
              `Bearer ${token}`;
          }
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        // Không có refresh token → xóa session, reload về login
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(SESSION_KEY);
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Gọi API-04: POST /auth/refresh
        const { data } = await axios.post<{ token: string }>(
          `${BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken },
        );

        const newToken = data.token;
        localStorage.setItem(TOKEN_KEY, newToken);

        // Cập nhật header mặc định cho các request tiếp theo
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        processQueue(null, newToken);

        // Retry request gốc với token mới
        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>)['Authorization'] =
            `Bearer ${newToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh thất bại → đẩy lỗi xuống hàng đợi, xóa session
        processQueue(refreshError as AxiosError, null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(SESSION_KEY);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
