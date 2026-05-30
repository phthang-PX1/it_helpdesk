import axiosInstance from '../libs/axios';

export interface SLAPolicy {
  chinh_sach_sla_id: number;
  ten_chinh_sach: string;
  loai_thoi_gian: 'GIO_HANH_CHINH' | 'H24_7';
  muc_do_uu_tien: 'THAP' | 'TRUNG_BINH' | 'CAO';
  tg_phan_hoi: number; // minutes
  tg_xu_ly: number; // minutes
  trang_thai: boolean;
  ngay_tao?: string;
}

export interface SLAPolicyPayload {
  ten_chinh_sach: string;
  loai_thoi_gian: 'GIO_HANH_CHINH' | 'H24_7';
  muc_do_uu_tien: 'THAP' | 'TRUNG_BINH' | 'CAO';
  tg_phan_hoi: number;
  tg_xu_ly: number;
  trang_thai?: boolean;
}

export interface SLAUpdatePayload {
  ten_chinh_sach?: string;
  loai_thoi_gian?: 'GIO_HANH_CHINH' | 'H24_7';
  tg_phan_hoi?: number;
  tg_xu_ly?: number;
  trang_thai?: boolean;
}

export const slaService = {
  getPolicies: async (trang_thai?: 'active' | 'inactive') => {
    const params = new URLSearchParams();
    if (trang_thai) params.append('trang_thai', trang_thai);
    const response = await axiosInstance.get<{ success: boolean; data: SLAPolicy[] }>(`/sla/policies?${params.toString()}`);
    return response.data;
  },

  createPolicy: async (payload: SLAPolicyPayload) => {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: SLAPolicy }>('/sla/policies', payload);
    return response.data;
  },

  updatePolicy: async (id: number, payload: SLAUpdatePayload) => {
    const response = await axiosInstance.put<{ success: boolean; message: string; data: SLAPolicy }>(`/sla/policies/${id}`, payload);
    return response.data;
  },
};
