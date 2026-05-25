import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();

  const [taiKhoan, setTaiKhoan] =
    useState("");

  const [matKhau, setMatKhau] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!taiKhoan || !matKhau) {
      setError(
        "Vui lòng nhập đầy đủ thông tin"
      );
      return;
    }

    try {
      setLoading(true);

      const data = await login(
        taiKhoan,
        matKhau
      );

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "refresh_token",
        data.refresh_token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      navigate("/dashboard");
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Đăng nhập thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* LEFT */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#0F172A] to-[#2563EB] text-white p-12 flex-col justify-between">
        <div>
          <h1 className="text-5xl font-bold mb-6">
            Chào mừng quay lại
          </h1>

          <p className="text-lg text-blue-100">
            Đăng nhập để truy cập cổng hỗ
            trợ IT nội bộ.
          </p>

          <div className="mt-12 space-y-8">
            <div>
              <h3 className="text-xl font-semibold">
                Gửi yêu cầu hỗ trợ
              </h3>

              <p className="text-blue-100 mt-2">
                Nhanh chóng tạo ticket cho
                các sự cố kỹ thuật.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold">
                Theo dõi trạng thái
                ticket
              </h3>

              <p className="text-blue-100 mt-2">
                Cập nhật tiến độ xử lý
                theo thời gian thực.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold">
                Tra cứu cơ sở tri thức
              </h3>

              <p className="text-blue-100 mt-2">
                Tìm kiếm hướng dẫn và giải
                pháp phổ biến.
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-blue-100">
          Chỉ tài khoản nội bộ được cấp
          quyền mới có thể truy cập hệ
          thống.
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Đăng nhập
            </h2>

            <p className="text-gray-500 mt-2">
              Vui lòng nhập thông tin tài
              khoản để tiếp tục.
            </p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >
            <div>
              <label className="block mb-2 font-medium">
                Tài khoản
              </label>

              <input
                type="text"
                placeholder="Nhập tài khoản"
                value={taiKhoan}
                onChange={(e) =>
                  setTaiKhoan(
                    e.target.value
                  )
                }
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Mật khẩu
              </label>

              <div className="relative">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Nhập mật khẩu"
                  value={matKhau}
                  onChange={(e) =>
                    setMatKhau(
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-3 top-3 text-gray-500"
                >
                  {showPassword
                    ? "Ẩn"
                    : "Hiện"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
            >
              {loading
                ? "Đang đăng nhập..."
                : "Đăng nhập"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}