import axiosInstance from '../libs/axios';

// ─── Interfaces ──────────────────────────────────────────────────────────────
export interface UserBrief {
  ho_ten: string;
  email?: string;
  tai_khoan?: string;
}

export interface SLAEntry {
  sla_id: number;
  phieu_ho_tro_id: number;
  chinh_sach_sla_id: number;
  loai_sla: 'PHAN_HOI' | 'XU_LY';
  trang_thai_muc_tieu: 'TIEP_NHAN' | 'DA_GIAI_QUYET';
  thoi_diem_bat_dau: string;
  han_chot: string;
  thoi_diem_dat?: string | null;
  da_vi_pham: boolean;
}

export interface Attachment {
  tep_dinh_kem_id: number;
  ten_tep: string;
  duong_dan_file: string;
  dinh_dang: string;
  dung_luong_kb: number;
  ngay_tao: string;
}

export interface CommentUser {
  ho_ten: string;
  vai_tro: {
    ma_vai_tro: string;
  };
}

export interface Comment {
  binh_luan_id: number;
  phieu_ho_tro_id: number;
  nguoi_gui_id: number;
  noi_dung: string;
  loai_binh_luan: string;
  quyen_xem: 'CONG_KHAI' | 'NOI_BO';
  ngay_tao: string;
  nguoi_gui: CommentUser;
  danh_sach_file?: Attachment[];
}

export interface AuditLog {
  lich_su_id: number;
  phieu_ho_tro_id: number;
  nguoi_thuc_hien_id: number;
  hanh_dong: string;
  gia_tri_cu?: string | null;
  gia_tri_moi?: string | null;
  ngay_thuc_hien: string;
  ghi_chu?: string | null;
  nguoi_thuc_hien: {
    ho_ten: string;
    vai_tro: {
      ma_vai_tro: string;
    };
  };
}

export interface Ticket {
  phieu_ho_tro_id: number;
  ma_phieu: string;
  tieu_de: string;
  mo_ta_chi_tiet: string;
  muc_do_uu_tien: 'THAP' | 'TRUNG_BINH' | 'CAO';
  trang_thai: 'MOI_TAO' | 'DANG_GIAI_QUYET' | 'DA_GIAI_QUYET' | 'DA_DONG';
  nguoi_tao_id: number;
  nguoi_ho_tro_id?: number | null;
  nhom_xu_ly_id: number;
  phieu_lien_quan_id?: number | null;
  so_lan_mo_lai: number;
  ngay_tao: string;
  ngay_cap_nhat: string;
  nguoi_tao: UserBrief;
  nguoi_ho_tro?: UserBrief | null;
  nhom_xu_ly?: {
    nhom_ho_tro_id: number;
    ten_nhom: string;
  } | null;
  danh_sach_sla?: SLAEntry[];
  danh_sach_file?: Attachment[];
  danh_sach_bl?: Comment[];
  danh_sach_log?: AuditLog[];
  so_lan_thu_lai_L1?: number;
  so_lan_thu_lai_L2?: number;
}

export interface SLAStatus {
  sla_phan_hoi?: {
    han_chot: string;
    thoi_gian_con_lai_giay: number;
    da_vi_pham: boolean;
    thoi_diem_dat?: string | null;
  };
  sla_xu_ly?: {
    han_chot: string;
    thoi_gian_con_lai_giay: number;
    da_vi_pham: boolean;
    thoi_diem_dat?: string | null;
  };
}

export interface TicketQueryFilters {
  page?: number;
  limit?: number;
  trang_thai?: string;
  muc_do_uu_tien?: string;
  keyword?: string;
}

export interface TicketListResponse {
  success: boolean;
  message: string;
  data: Ticket[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface TicketDetailResponse {
  success: boolean;
  message: string;
  data: Ticket;
}

export interface CommentListResponse {
  success: boolean;
  message: string;
  data: Comment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

// ─── Service Methods ──────────────────────────────────────────────────────────
export const ticketService = {
  getTickets: async (filters: TicketQueryFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.trang_thai) params.append('trang_thai', filters.trang_thai);
    if (filters.muc_do_uu_tien) params.append('muc_do_uu_tien', filters.muc_do_uu_tien);
    if (filters.keyword) params.append('keyword', filters.keyword);

    const response = await axiosInstance.get<TicketListResponse>(`/tickets?${params.toString()}`);
    return response.data;
  },

  getTicketDetail: async (id: number) => {
    const response = await axiosInstance.get<TicketDetailResponse>(`/tickets/${id}`);
    return response.data;
  },

  createTicket: async (tieu_de: string, mo_ta_chi_tiet: string, files: File[] = []) => {
    const formData = new FormData();
    formData.append('tieu_de', tieu_de);
    formData.append('mo_ta_chi_tiet', mo_ta_chi_tiet);
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await axiosInstance.post<{ success: boolean; message: string; data: Ticket }>('/tickets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateStatus: async (id: number, trang_thai: string, ghi_chu?: string) => {
    const response = await axiosInstance.put<{ success: boolean; message: string; data: Ticket }>(`/tickets/${id}/status`, {
      trang_thai,
      ghi_chu,
    });
    return response.data;
  },

  escalateTicket: async (id: number, ly_do: string, cac_buoc_da_thu: string) => {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: any }>(`/tickets/${id}/escalate`, {
      ly_do,
      cac_buoc_da_thu,
    });
    return response.data;
  },

  reopenTicket: async (id: number, ly_do: string) => {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: any }>(`/tickets/${id}/reopen`, {
      ly_do,
    });
    return response.data;
  },

  getComments: async (id: number, page = 1, limit = 20) => {
    const response = await axiosInstance.get<CommentListResponse>(`/tickets/${id}/comments?page=${page}&limit=${limit}`);
    return response.data;
  },

  addComment: async (id: number, noi_dung: string, loai_binh_luan: 'public' | 'internal', files: File[] = []) => {
    const formData = new FormData();
    formData.append('noi_dung', noi_dung);
    formData.append('loai_binh_luan', loai_binh_luan);
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await axiosInstance.post<{ success: boolean; message: string; data: Comment }>(`/tickets/${id}/comments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getHistory: async (id: number) => {
    const response = await axiosInstance.get<{ success: boolean; data: AuditLog[] }>(`/tickets/${id}/history`);
    return response.data;
  },

  assignTicket: async (id: number, nguoi_ho_tro_id: number) => {
    const response = await axiosInstance.put<{ success: boolean; message: string; data: any }>(`/tickets/${id}/assign`, {
      nguoi_ho_tro_id,
    });
    return response.data;
  },

  getSLA: async (id: number) => {
    const response = await axiosInstance.get<{ success: boolean; data: SLAStatus }>(`/tickets/${id}/sla`);
    return response.data;
  },

  // ─── Reviews API ────────────────────────────────────────────────────────────
  validateReviewToken: async (token: string) => {
    const response = await axiosInstance.get<{ success: boolean; valid: boolean; ticket: any }>(`/reviews/validate-token?token=${token}`);
    return response.data;
  },

  submitReview: async (payload: { token: string; hai_long: boolean; so_sao: number; nhan_xet?: string; ly_do_khong_hai_long?: string }) => {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: any }>('/reviews', payload);
    return response.data;
  },
};
