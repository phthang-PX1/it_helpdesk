import api from "./api";

export const login = async (tai_khoan, mat_khau) => {
  const response = await api.post("/auth/login", {
    tai_khoan,
    mat_khau,
  });

  return response.data.data;
};