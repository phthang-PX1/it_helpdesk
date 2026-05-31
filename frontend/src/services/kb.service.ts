import axiosInstance from '../libs/axios';

export interface KBArticle {
  tri_thuc_id: number;
  tieu_de: string;
  noi_dung: string;
  loai_su_co: string;
  the_tags?: string | null;
  tac_gia_id: number;
  phieu_ho_tro_id?: number | null;
  trang_thai: 'NHAP' | 'DA_XUAT_BAN';
  quyen_xem: 'CONG_KHAI' | 'NOI_BO';
  luot_xem: number;
  luot_huu_ich: number;
  luot_khong_huu_ich: number;
  ngay_tao: string;
  ngay_cap_nhat: string;
  tac_gia?: {
    ho_ten: string;
  };
}

export interface KBListResponse {
  success: boolean;
  data: KBArticle[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export const kbService = {
  search: async (q: string, limit = 5) => {
    const response = await axiosInstance.get<{ success: boolean; data: KBArticle[] }>(`/kb/search?q=${encodeURIComponent(q)}&limit=${limit}`);
    return response.data.data;
  },

  getAll: async (filters: {
    page?: number;
    limit?: number;
    loai_su_co?: string;
    the?: string;
    trang_thai?: string;
    sort?: 'luot_xem' | 'luot_huu_ich' | 'ngay_tao';
  } = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.loai_su_co) params.append('loai_su_co', filters.loai_su_co);
    if (filters.the) params.append('the', filters.the);
    if (filters.trang_thai) params.append('trang_thai', filters.trang_thai);
    if (filters.sort) params.append('sort', filters.sort);

    const response = await axiosInstance.get<KBListResponse>(`/kb?${params.toString()}`);
    return response.data;
  },

  getDetail: async (id: number) => {
    const response = await axiosInstance.get<{ success: boolean; data: KBArticle }>(`/kb/${id}`);
    return response.data.data;
  },

  create: async (formData: FormData) => {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: KBArticle }>('/kb', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  update: async (id: number, payload: {
    tieu_de?: string;
    noi_dung?: string;
    loai_su_co?: string;
    the_tags?: string;
    trang_thai?: 'NHAP' | 'DA_XUAT_BAN';
    quyen_xem?: 'CONG_KHAI' | 'NOI_BO';
  }) => {
    const response = await axiosInstance.put<{ success: boolean; message: string; data: KBArticle }>(`/kb/${id}`, payload);
    return response.data.data;
  },

  feedback: async (id: number, huu_ich: boolean) => {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: any }>(`/kb/${id}/feedback`, {
      huu_ich,
    });
    return response.data;
  },
};
