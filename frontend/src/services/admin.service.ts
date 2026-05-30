import axiosInstance from '../libs/axios';

// ─── Interfaces ──────────────────────────────────────────────────────────────
export interface Role {
  vai_tro_id: number;
  ma_vai_tro: string;
  ten_vai_tro: string;
  quyen_han: string[] | string | null;
}

export interface Department {
  phong_ban_id: number;
  ten_phong_ban: string;
  so_nhan_vien?: number;
  truong_phong?: string | null;
}

export interface SupportTeam {
  nhom_ho_tro_id: number;
  ten_nhom: string;
  mo_ta?: string | null;
  so_thanh_vien?: number;
  thanh_vien?: Array<{
    nhan_vien_id: number;
    ho_ten: string;
    email: string;
  }>;
}

export interface Employee {
  nhan_vien_id: number;
  phong_ban_id: number;
  vai_tro_id: number;
  nhom_ho_tro_id?: number | null;
  tai_khoan: string;
  email: string;
  ho_ten: string;
  trang_thai: boolean;
  ngay_tao?: string;
  vai_tro?: Role;
  phong_ban?: Department;
  nhom_ho_tro?: SupportTeam | null;
}

export interface UserQueryFilters {
  page?: number;
  limit?: number;
  vai_tro_id?: number;
  nhom_ho_tro_id?: number;
  trang_thai?: boolean;
  keyword?: string;
}

export interface UserListResponse {
  data: Employee[];
  total: number;
  page: number;
  limit: number;
}

// ─── Service Methods ──────────────────────────────────────────────────────────
export const adminService = {
  getUsers: async (filters: UserQueryFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.vai_tro_id) params.append('vai_tro_id', filters.vai_tro_id.toString());
    if (filters.nhom_ho_tro_id) params.append('nhom_ho_tro_id', filters.nhom_ho_tro_id.toString());
    if (filters.trang_thai !== undefined) params.append('trang_thai', filters.trang_thai.toString());
    if (filters.keyword) params.append('keyword', filters.keyword);

    const response = await axiosInstance.get<UserListResponse>(`/admin/users?${params.toString()}`);
    return response.data;
  },

  createUser: async (payload: {
    ho_ten: string;
    email: string;
    tai_khoan: string;
    mat_khau: string;
    vai_tro_id: number;
    phong_ban_id: number;
    nhom_ho_tro_id?: number | null;
  }) => {
    const response = await axiosInstance.post<Employee>('/admin/users', payload);
    return response.data;
  },

  updateUser: async (
    id: number,
    payload: {
      ho_ten?: string;
      vai_tro_id?: number;
      phong_ban_id?: number;
      nhom_ho_tro_id?: number | null;
      trang_thai?: boolean;
    }
  ) => {
    const response = await axiosInstance.put<Employee>(`/admin/users/${id}`, payload);
    return response.data;
  },

  getRoles: async () => {
    const response = await axiosInstance.get<Role[]>('/admin/roles');
    return response.data;
  },

  updateRolePermissions: async (id: number, quyen_han: string[]) => {
    const response = await axiosInstance.put<{ message: string }>(`/admin/roles/${id}/permissions`, {
      quyen_han,
    });
    return response.data;
  },

  getTeams: async () => {
    const response = await axiosInstance.get<SupportTeam[]>('/admin/teams');
    return response.data;
  },

  updateTeamMembers: async (id: number, nhan_vien_ids: number[]) => {
    const response = await axiosInstance.put<{ message: string }>(`/admin/teams/${id}/members`, {
      nhan_vien_ids,
    });
    return response.data;
  },

  getDepartments: async () => {
    const response = await axiosInstance.get<Department[]>('/admin/departments');
    return response.data;
  },
};
