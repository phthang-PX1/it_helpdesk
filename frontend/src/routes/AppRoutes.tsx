/**
 * AppRoutes.tsx  –  Hệ thống định tuyến toàn diện
 *
 * UC-01 – Luồng điều hướng chuẩn (Role-based Routing):
 *   /                  → kiểm tra session → /login | /dashboard
 *   /login             → Public Route (KHÔNG bọc AppLayout)
 *   /dashboard         → Protected, phân luồng nội dung theo Role
 *   /tickets/my-tickets → Protected, dành riêng Người yêu cầu
 *   /tickets/create    → Protected, tạo phiếu
 *   /tickets/queue     → Protected, hàng đợi L1/L2/Admin
 *   /tickets/detail/:id → Protected, chi tiết phiếu
 *   /tickets/process/:id → Protected, xử lý L1
 *   /tickets/l2        → Protected, không gian L2
 *   /knowledge/*       → Protected
 *   /reports           → Protected, chỉ Quản lý IT
 *   /settings          → Protected, chỉ Quản lý IT
 *   /*                 → Redirect về /dashboard
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// ── Layout & Auth ──────────────────────────────────────────────────────────────
import { AppLayout }           from '../components/layout/AppLayout';
import { useAuth }             from '../context/AuthContext';

// ── Auth ───────────────────────────────────────────────────────────────────────
import { Login }               from '../features/auth/Login';

// ── Requester ─────────────────────────────────────────────────────────────────
import { Dashboard as RequesterDashboard } from '../features/requester/Dashboard';
import { CreateTicket }        from '../features/requester/CreateTicket';
import { TicketDetail }        from '../features/requester/TicketDetail';
import { MyTickets }           from '../features/requester/MyTickets';

// ── L1 ────────────────────────────────────────────────────────────────────────
import { TicketQueue }         from '../features/l1/TicketQueue';
import { TicketProcess }       from '../features/l1/TicketProcess';

// ── L2 ────────────────────────────────────────────────────────────────────────
import { L2Workplace }         from '../features/l2/L2Workplace';

// ── Knowledge ─────────────────────────────────────────────────────────────────
import { KnowledgeList }       from '../features/knowledge/KnowledgeList';
import { KnowledgeDetail }     from '../features/knowledge/KnowledgeDetail';
import { KnowledgeEditor }     from '../features/knowledge/KnowledgeEditor';

// ── Admin ─────────────────────────────────────────────────────────────────────
import { AdminDashboard }      from '../features/admin/AdminDashboard';
import { Reports }             from '../features/admin/Reports';
import { Settings }            from '../features/admin/Settings';

// ─────────────────────────────────────────────────────────────────────────────
//  Guard: Chặn truy cập nếu chưa đăng nhập
// ─────────────────────────────────────────────────────────────────────────────
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Guard: Chặn truy cập nếu không có đủ quyền (phân quyền cứng)
// ─────────────────────────────────────────────────────────────────────────────
interface RoleGuardProps {
  children: React.ReactNode;
  /** Danh sách vai trò được phép truy cập */
  allowed: string[];
  /** Tuyến đường fallback khi bị từ chối – mặc định /dashboard */
  fallback?: string;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowed, fallback = '/dashboard' }) => {
  const { hasRole } = useAuth();
  return hasRole(...allowed) ? <>{children}</> : <Navigate to={fallback} replace />;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Dashboard: Phân luồng nội dung theo vai trò (UC-01)
// ─────────────────────────────────────────────────────────────────────────────
const DashboardRouter: React.FC = () => {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;

  // Quản lý IT  →  Bảng điều khiển quản trị chuyên sâu
  if (session.role === 'Quản lý IT') return <AdminDashboard />;

  // Người yêu cầu  →  Cổng yêu cầu (Requester Portal)
  if (session.role === 'Người yêu cầu') return <RequesterDashboard triggerQuickCreate={0} />;

  // L1 / L2 / IT Support L1/L2  →  Support workspace Dashboard
  return <SupportDashboard />;
};

// ─────────────────────────────────────────────────────────────────────────────
//  SupportDashboard: Trang chủ dành cho L1 / L2
// ─────────────────────────────────────────────────────────────────────────────
const SupportDashboard: React.FC = () => {
  const { session } = useAuth();
  const ticketsPath = session?.role === 'L2' ? '/tickets/l2' : '/tickets/queue';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
    }}>
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 60%, #3B82F6 100%)',
        borderRadius: 16,
        padding: '32px 36px',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20,
        boxShadow: '0 8px 24px rgba(37,99,235,0.25)',
      }}>
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, opacity: 0.8, letterSpacing: 1, textTransform: 'uppercase' }}>
            Không gian tác nghiệp
          </p>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
            Xin chào, {session?.role} 👋
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: 14, opacity: 0.85 }}>
            Hôm nay bạn có <strong>7 phiếu</strong> đang chờ xử lý. Chúc bạn làm việc hiệu quả!
          </p>
        </div>
        <a
          href={ticketsPath}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1.5px solid rgba(255,255,255,0.5)',
            color: '#FFFFFF',
            borderRadius: 12,
            padding: '12px 24px',
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
            backdropFilter: 'blur(6px)',
            transition: 'background 0.2s',
          }}
        >
          ⚡ Mở hàng đợi →
        </a>
      </div>

      {/* Quick stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        {[
          { icon: '🆕', label: 'Mới tạo',       value: '7',  color: '#2563EB', bg: '#EFF6FF' },
          { icon: '⚙️', label: 'Đang xử lý',    value: '12', color: '#D97706', bg: '#FFFBEB' },
          { icon: '✅', label: 'Hoàn thành hôm nay', value: '5', color: '#16A34A', bg: '#F0FDF4' },
          { icon: '⚠️', label: 'Gần quá hạn',   value: '3',  color: '#DC2626', bg: '#FEF2F2' },
        ].map((c, i) => (
          <div key={i} style={{
            background: '#FFFFFF',
            border: `1px solid #E2E8F0`,
            borderRadius: 14,
            padding: '20px 18px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            transition: 'transform 0.2s',
          }}>
            <div style={{ fontSize: 26, padding: '8px', backgroundColor: c.bg, borderRadius: 10 }}>{c.icon}</div>
            <span style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textAlign: 'center' }}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {[
          { href: ticketsPath,   icon: '🎫', title: 'Hàng đợi Phiếu',   desc: 'Tiếp nhận và xử lý phiếu hỗ trợ đang chờ.',       color: '#2563EB' },
          { href: '/knowledge',  icon: '📚', title: 'Cơ sở tri thức',   desc: 'Tra cứu hướng dẫn và soạn bài viết tri thức.',      color: '#7C3AED' },
        ].map((card, i) => (
          <a key={i} href={card.href} style={{
            display: 'flex', gap: 16, alignItems: 'flex-start',
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14,
            padding: '20px 22px', textDecoration: 'none',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}>
            <div style={{ fontSize: 28, padding: 10, background: '#F8FAFC', borderRadius: 10 }}>{card.icon}</div>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: '#0F172A' }}>{card.title}</p>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{card.desc}</p>
              <span style={{ display: 'inline-block', marginTop: 8, fontSize: 13, fontWeight: 700, color: card.color }}>
                Truy cập →
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  AppRoutes – Root Router
// ─────────────────────────────────────────────────────────────────────────────
export const AppRoutes: React.FC = () => {
  const { isAuthenticated, session, login, logout } = useAuth();

  // Hàm truyền xuống AppLayout — logout() giờ là async (gọi API-03)
  const handleLogout = async () => {
    await logout();
  };

  const handleQuickTicketCreate = () => {
    window.location.href = '/tickets/create';
  };

  return (
    <Routes>

      {/* ══════════════════════════════════════════════════════
          1. ROOT "/"  →  tự động điều hướng theo trạng thái đăng nhập
         ══════════════════════════════════════════════════════ */}
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <Navigate to="/login"    replace />
        }
      />

      {/* ══════════════════════════════════════════════════════
          2. PUBLIC  –  /login   (KHÔNG bọc AppLayout)
         ══════════════════════════════════════════════════════ */}
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to="/dashboard" replace />   /* Đã đăng nhập → về dashboard */
            : <Login onLoginSuccess={login} />
        }
      />

      {/* ══════════════════════════════════════════════════════
          3. PROTECTED  –  bọc trong AppLayout tràn màn hình
         ══════════════════════════════════════════════════════ */}
      <Route
        path="/*"
        element={
          <RequireAuth>
            <AppLayout
              session={session!}
              onLogout={handleLogout}
              onQuickTicketCreate={handleQuickTicketCreate}
            >
              <Routes>

                {/* ─── Dashboard ─────────────────────────────────── */}
                <Route
                  path="dashboard"
                  element={<DashboardRouter />}
                />

                {/* ─── Phiếu hỗ trợ: Người yêu cầu ────────────────
                    /tickets/my-tickets  →  Danh sách phiếu cá nhân   */}
                <Route
                  path="tickets/my-tickets"
                  element={
                    <RoleGuard allowed={['Người yêu cầu']} fallback="/tickets/queue">
                      <MyTickets />
                    </RoleGuard>
                  }
                />

                {/* ─── Phiếu hỗ trợ: Tạo mới ───────────────────── */}
                <Route
                  path="tickets/create"
                  element={<CreateTicket />}
                />

                {/* ─── Phiếu hỗ trợ: Chi tiết ──────────────────── */}
                <Route
                  path="tickets/detail/:id"
                  element={<TicketDetail />}
                />

                {/* ─── Phiếu hỗ trợ: Hàng đợi L1/L2/Admin ─────────
                    /tickets/queue  →  TicketQueue                     */}
                <Route
                  path="tickets/queue"
                  element={
                    <RoleGuard allowed={['L1', 'L2', 'Quản lý IT', 'IT Support L1/L2']} fallback="/tickets/my-tickets">
                      <TicketQueue />
                    </RoleGuard>
                  }
                />

                {/* ─── Phiếu hỗ trợ: Xử lý chi tiết L1 ────────── */}
                <Route
                  path="tickets/process/:id"
                  element={
                    <RoleGuard allowed={['L1', 'Quản lý IT', 'IT Support L1/L2']}>
                      <TicketProcess />
                    </RoleGuard>
                  }
                />

                {/* ─── Phiếu hỗ trợ: Không gian L2 ─────────────── */}
                <Route
                  path="tickets/l2"
                  element={
                    <RoleGuard allowed={['L2', 'Quản lý IT', 'IT Support L1/L2']}>
                      <L2Workplace />
                    </RoleGuard>
                  }
                />

                {/* ─── Redirect /tickets → đúng phiếu theo role ─── */}
                <Route
                  path="tickets"
                  element={
                    session?.role === 'Người yêu cầu'
                      ? <Navigate to="/tickets/my-tickets" replace />
                      : session?.role === 'L2'
                        ? <Navigate to="/tickets/l2" replace />
                        : <Navigate to="/tickets/queue" replace />
                  }
                />

                {/* ─── Cơ sở tri thức ────────────────────────────── */}
                <Route path="knowledge"           element={<KnowledgeList />} />
                <Route path="knowledge/detail/:id" element={<KnowledgeDetail />} />
                <Route path="knowledge/create"    element={<KnowledgeEditor />} />
                <Route path="knowledge/edit/:id"  element={<KnowledgeEditor />} />

                {/* ─── Báo cáo (Chỉ Quản lý IT) ─────────────────── */}
                <Route
                  path="reports"
                  element={
                    <RoleGuard allowed={['Quản lý IT']}>
                      <Reports />
                    </RoleGuard>
                  }
                />

                {/* ─── Cài đặt (Chỉ Quản lý IT) ─────────────────── */}
                <Route
                  path="settings"
                  element={
                    <RoleGuard allowed={['Quản lý IT']}>
                      <Settings />
                    </RoleGuard>
                  }
                />

                {/* ─── Fallback ───────────────────────────────────── */}
                <Route path=""  element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />

              </Routes>
            </AppLayout>
          </RequireAuth>
        }
      />

    </Routes>
  );
};
