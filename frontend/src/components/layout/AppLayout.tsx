import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AppLayout.css';
// NOTE: AppLayout nhận session qua props để tương thích ngược với AppRoutes.tsx

interface UserSession {
  email: string;
  role: string;
  ho_ten?: string;
  ma_vai_tro?: string;
}

interface AppLayoutProps {
  children: React.ReactNode;
  session: UserSession;
  onLogout: () => void;
  onQuickTicketCreate?: () => void;
}

type MenuItemId = 'dashboard' | 'tickets' | 'kb' | 'reports' | 'settings';

interface MenuItem {
  id: MenuItemId;
  label: string;
  path: string;
  icon: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  session,
  onLogout,
  onQuickTicketCreate
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * UC-01 – Điều hướng tab Phiếu hỗ trợ theo vai trò:
   * - Người yêu cầu  → /tickets/my-tickets (danh sách phiếu cá nhân)
   * - L2             → /tickets/l2 (không gian chuyên gia)
   * - L1 / Admin     → /tickets/queue (hàng đợi xử lý)
   */
  const ticketPath = (() => {
    const role = session.ma_vai_tro || session.role;
    if (role === 'Người yêu cầu' || role === 'NGUOI_YEU_CAU') return '/tickets/my-tickets';
    if (role === 'L2' || role === 'IT_L2')            return '/tickets/l2';
    return '/tickets/queue';
  })();

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Bảng điều khiển',
      path: '/dashboard',
      icon: (
        <svg viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      )
    },
    {
      id: 'tickets',
      label: 'Phiếu hỗ trợ',
      /* UC-01: phân luồng cứng theo role */
      path: ticketPath,
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5zm3 4h10M7 13h10M7 17h6" />
        </svg>
      )
    },
    {
      id: 'kb',
      label: 'Cơ sở tri thức',
      path: '/knowledge',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V3.5A2.5 2.5 0 0 1 6.5 1H20v16H6.5" />
        </svg>
      )
    },
    {
      id: 'reports',
      label: 'Báo cáo',
      path: '/reports',
      icon: (
        <svg viewBox="0 0 24 24">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Cài đặt',
      path: '/settings',
      icon: (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    }
  ];

  // ── Lọc menu theo vai trò (UC-01 Role-based Routing) ──────────────────────
  const filteredMenuItems = menuItems.filter(item => {
    const role = session.ma_vai_tro || session.role;
    // Người yêu cầu: chỉ Dashboard, Phiếu hỗ trợ, Cơ sở tri thức
    if (role === 'Người yêu cầu' || role === 'NGUOI_YEU_CAU') {
      return ['dashboard', 'tickets', 'kb'].includes(item.id);
    }
    // L1 / L2: ẩn Báo cáo và Cài đặt – chỉ Quản lý IT mới được xem Báo cáo
    if (['L1', 'L2', 'IT Support L1/L2', 'IT_L1', 'IT_L2'].includes(role)) {
      return !['reports', 'settings'].includes(item.id);
    }
    // Quản lý IT: toàn quyền, hiển thị đầy đủ (bao gồm Báo cáo)
    return true;
  });

  const getActiveMenuId = (): MenuItemId => {
    const path = location.pathname;
    if (path.startsWith('/tickets'))   return 'tickets';
    if (path.startsWith('/knowledge')) return 'kb';
    if (path.startsWith('/reports'))   return 'reports';
    if (path.startsWith('/settings'))  return 'settings';
    return 'dashboard';
  };

  const activeMenu = getActiveMenuId();

  const handleMenuClick = (item: MenuItem) => {
    navigate(item.path);
    setIsSidebarOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      alert(`Tìm kiếm hệ thống cho từ khóa: "${searchQuery}"`);
    }
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  // Mock Avatar URL
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.email)}&backgroundColor=2563EB&textColor=ffffff`;

  return (
    <div className="app-layout">
      
      {/* MOBILE NAV HEADER (Chỉ hiện dưới 900px) */}
      <div className="mobile-nav-header">
        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle navigation drawer"
        >
          <svg viewBox="0 0 24 24">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="sidebar-logo-icon" style={{ padding: '6px' }}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M12 2C6.48 2 2 6.48 2 12v5c0 1.66 1.34 3 3 3h3v-8H4v-2c0-4.41 3.59-8 8-8s8 3.59 8 8v2h-4v8h3c1.66 0 3-1.34 3-3v-5c0-5.52-4.48-10-10-10z" />
            </svg>
          </div>
          <span className="sidebar-brand-name" style={{ fontSize: '15px' }}>IT Helpdesk</span>
        </div>
        <img src={avatarUrl} alt="Avatar" className="profile-avatar-img" style={{ width: '30px', height: '30px' }} />
      </div>

      {/* 1. Sidebar cố định bên trái */}
      <aside className={`app-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        
        {/* Logo IT Helpdesk */}
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12v5c0 1.66 1.34 3 3 3h3v-8H4v-2c0-4.41 3.59-8 8-8s8 3.59 8 8v2h-4v8h3c1.66 0 3-1.34 3-3v-5c0-5.52-4.48-10-10-10z" />
            </svg>
          </div>
          <span className="sidebar-brand-name">IT Helpdesk</span>
        </div>

        {/* Danh sách Menu tiếng Việt lọc động theo vai trò */}
        <nav className="sidebar-menu">
          {filteredMenuItems.map(item => (
            <button
              key={item.id}
              className={`menu-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => handleMenuClick(item)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Đăng xuất bên dưới chân Sidebar */}
        <div className="sidebar-footer">
          <button onClick={handleLogoutClick} className="btn-sidebar-logout menu-item">
            <svg viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Wrapper nội dung chính */}
      <div className="app-main-wrapper">
        
        {/* 2. Topbar cố định ở đầu */}
        <header className="app-topbar">
          
          {/* Ô tìm kiếm toàn hệ thống */}
          <form onSubmit={handleSearchSubmit} className="topbar-search-box">
            <span className="topbar-search-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input 
              type="text" 
              className="topbar-search-input" 
              placeholder="Tìm kiếm phiếu, bài viết..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Cụm hành động bên phải */}
          <div className="topbar-actions">
            
            {/* Nút Tạo phiếu nhanh (Màu #2563EB) */}
            <button 
              className="btn-quick-create"
              onClick={onQuickTicketCreate}
            >
              <svg viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              <span>Tạo phiếu nhanh</span>
            </button>

            {/* Biểu tượng thông báo */}
            <button 
              className="topbar-notify-btn"
              onClick={() => alert('Chưa có thông báo mới.')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="topbar-notify-badge"></span>
            </button>

            {/* Ảnh đại diện & Nhãn vai trò người dùng */}
            <div className="topbar-profile">
              <div className="profile-info">
                <span className="profile-name">{session.ho_ten || 'Nguyễn Văn A'}</span>
                <span className="profile-role-badge">
                  {session.role}
                </span>
              </div>
              <img 
                src={avatarUrl} 
                alt={`Hồ sơ của ${session.email}`}
                className="profile-avatar-img"
              />
            </div>

          </div>
        </header>

        {/* 3. Khu vực nội dung chính */}
        <main className="app-content">
          {children}
        </main>

      </div>
    </div>
  );
};
