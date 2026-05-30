import axiosInstance from '../libs/axios';

export interface NotificationItem {
  notification_id: number;
  loai: string;
  tieu_de: string;
  noi_dung: string;
  phieu_ho_tro_id?: number | null;
  da_doc: boolean;
  ngay_tao: string;
}

export interface NotificationListResponse {
  data: NotificationItem[];
  total: number;
  page: number;
  limit: number;
}

export const notificationService = {
  getAll: async (filters: { page?: number; limit?: number; da_doc?: boolean } = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.da_doc !== undefined) params.append('da_doc', filters.da_doc.toString());

    const response = await axiosInstance.get<NotificationListResponse>(`/notifications?${params.toString()}`);
    return response.data;
  },

  readAll: async () => {
    const response = await axiosInstance.put<{ message: string; updated_count: number }>('/notifications/read-all');
    return response.data;
  },

  readOne: async (id: number) => {
    const response = await axiosInstance.put<{ message: string }>(`/notifications/${id}/read`);
    return response.data;
  }
};
