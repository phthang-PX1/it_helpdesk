/**
 * App.tsx  –  Entry point của ứng dụng IT Helpdesk
 *
 * Kiến trúc:
 *   BrowserRouter (main.tsx)
 *     └── AuthProvider  (quản lý session tập trung)
 *           └── AppRoutes  (toàn bộ định tuyến)
 *
 * Mọi logic routing & role-guard đã được chuyển vào AppRoutes.tsx.
 * App.tsx chỉ giữ trách nhiệm cung cấp context và render router.
 */
import { AuthProvider } from './context/AuthContext';
import { AppRoutes }   from './routes/AppRoutes';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
