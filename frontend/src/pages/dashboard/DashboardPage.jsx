import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <aside className="fixed left-0 top-0 hidden lg:flex h-screen w-[280px] flex-col bg-slate-900 text-white">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold">Enterprise IT Ops</h2>
          <p className="text-sm text-slate-300">Hệ thống Vận hành</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <a className="block rounded-lg bg-blue-600 px-4 py-3">Trang chủ</a>
          <a className="block rounded-lg px-4 py-3 hover:bg-white/10">Cổng yêu cầu</a>
          <a className="block rounded-lg px-4 py-3 hover:bg-white/10">L1 Support</a>
          <a className="block rounded-lg px-4 py-3 hover:bg-white/10">L2 Support</a>
          <a className="block rounded-lg px-4 py-3 hover:bg-white/10">Cơ sở tri thức</a>
          <a className="block rounded-lg px-4 py-3 hover:bg-white/10">Báo cáo</a>
          <a className="block rounded-lg px-4 py-3 hover:bg-white/10">Cài đặt</a>
        </nav>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-4 py-3 text-left hover:bg-white/10"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-40 h-[72px] bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:ml-[280px]">
        <h1 className="text-xl font-bold text-blue-700">Trang chủ</h1>

        <div className="flex items-center gap-4">
          <p className="hidden sm:block text-right">
            <span className="block font-semibold">
              {user?.ho_ten || "Người dùng"}
            </span>
            <span className="text-sm text-gray-500">
              {user?.vai_tro?.ten_vai_tro || "User"}
            </span>
          </p>

          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            {user?.ho_ten?.charAt(0) || "U"}
          </div>
        </div>
      </header>

      <main className="lg:ml-[280px] p-6">
        <section className="mb-6">
          <h2 className="text-3xl font-bold">
            Xin chào, {user?.ho_ten || "Người dùng"}
          </h2>
          <p className="text-gray-500 mt-1">
            Chúc bạn có một ngày làm việc hiệu quả.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <p className="text-gray-500 font-medium">Tổng số ticket</p>
            <h3 className="text-4xl font-bold mt-4">1,284</h3>
            <p className="text-green-600 mt-2">+12% so với tháng trước</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <p className="text-gray-500 font-medium">Đang xử lý</p>
            <h3 className="text-4xl font-bold mt-4">342</h3>
            <p className="text-gray-500 mt-2">Ổn định</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <p className="text-gray-500 font-medium">Đã giải quyết</p>
            <h3 className="text-4xl font-bold mt-4">918</h3>
            <p className="text-green-600 mt-2">94% hoàn thành</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-red-500">
            <p className="text-gray-500 font-medium">Sắp hết hạn SLA</p>
            <h3 className="text-4xl font-bold mt-4 text-red-600">24</h3>
            <p className="text-red-600 mt-2">Cần chú ý ngay</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border min-h-[400px]">
          <h2 className="text-2xl font-semibold">Khu vực nội dung chính</h2>
          <p className="text-gray-500 mt-1">
            Các màn hình chức năng sẽ được hiển thị tại đây.
          </p>
        </section>
      </main>
    </div>
  );
}