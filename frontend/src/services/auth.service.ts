import axiosInstance from '../libs/axios';

export interface LoginUser {
  nhan_vien_id: number;
  ho_ten: string;
  email: string;
  vai_tro: {
    ma_vai_tro: string;
    ten_vai_tro: string;
  };
  nhom_ho_tro_id?: number | null;
}

export interface LoginApiResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    refresh_token: string;
    user: LoginUser;
  };
}

export const authService = {
  login: async (tai_khoan: string, mat_khau: string) => {
    const response = await axiosInstance.post<LoginApiResponse>('/auth/login', {
      tai_khoan,
      mat_khau,
    });
    return response.data;
  },

  googleLogin: async (googleIdToken: string) => {
    const response = await axiosInstance.post<LoginApiResponse>('/auth/login-google', {
      google_id_token: googleIdToken,
    });
    return response.data;
  },

  logout: async (refreshToken: string) => {
    const response = await axiosInstance.post<{ success: boolean; message: string }>('/auth/logout', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  getMe: async () => {
    const response = await axiosInstance.get<{ success: boolean; data: any }>('/auth/me');
    return response.data;
  },
};
