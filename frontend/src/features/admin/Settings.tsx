/**
 * Settings.tsx  –  UC-14: Phân quyền & Cấu hình hệ thống
 * Phân hệ Cài đặt hệ thống – chỉ dành cho Quản lý IT.
 *
 * ⚠️  STUB – Đang chờ tích hợp API quản trị và dữ liệu nhân sự.
 */
import React, { useState } from 'react';
import './Settings.css';

// ─── Mock roles & permissions ─────────────────────────────────────────────────
interface Permission {
  id: string;
  label: string;
  desc: string;
}

interface Role {
  id: string;
  name: string;
  permissions: Record<string, boolean>;
}

const ALL_PERMISSIONS: Permission[] = [
  { id: 'read_ticket',   label: 'Đọc phiếu hỗ trợ',      desc: 'Xem nội dung và lịch sử phiếu' },
  { id: 'take_ticket',   label: 'Tiếp nhận phiếu',        desc: 'Nhận phiếu từ hàng đợi xử lý' },
  { id: 'close_ticket',  label: 'Đóng phiếu',             desc: 'Chuyển trạng thái thành Đã đóng' },
  { id: 'escalate',      label: 'Chuyển cấp (Escalate)',  desc: 'Chuyển phiếu từ L1 lên L2' },
  { id: 'view_reports',  label: 'Xem báo cáo',            desc: 'Truy cập phân hệ Báo cáo thống kê' },
  { id: 'manage_sla',    label: 'Quản lý SLA',            desc: 'Tạo và cấu hình chính sách SLA' },
  { id: 'manage_users',  label: 'Quản lý nhân sự',        desc: 'Thêm/sửa/xóa tài khoản và phân nhóm' },
  { id: 'system_config', label: 'Cấu hình hệ thống',      desc: 'Thay đổi tham số vận hành hệ thống' },
];

const INITIAL_ROLES: Role[] = [
  {
    id: 'requester', name: 'Người yêu cầu',
    permissions: { read_ticket: true, take_ticket: false, close_ticket: false, escalate: false, view_reports: false, manage_sla: false, manage_users: false, system_config: false },
  },
  {
    id: 'l1', name: 'IT Support L1',
    permissions: { read_ticket: true, take_ticket: true, close_ticket: true, escalate: true, view_reports: true, manage_sla: false, manage_users: false, system_config: false },
  },
  {
    id: 'l2', name: 'IT Support L2',
    permissions: { read_ticket: true, take_ticket: true, close_ticket: true, escalate: false, view_reports: true, manage_sla: false, manage_users: false, system_config: false },
  },
  {
    id: 'admin', name: 'Quản lý IT',
    permissions: { read_ticket: true, take_ticket: true, close_ticket: true, escalate: true, view_reports: true, manage_sla: true, manage_users: true, system_config: true },
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roles' | 'teams' | 'channels'>('roles');
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [selectedRole, setSelectedRole] = useState<string>('l1');
  const [saved, setSaved] = useState(false);

  const currentRole = roles.find(r => r.id === selectedRole)!;

  const togglePerm = (permId: string) => {
    setRoles(prev => prev.map(r =>
      r.id === selectedRole
        ? { ...r, permissions: { ...r.permissions, [permId]: !r.permissions[permId] } }
        : r
    ));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const TABS = [
    { id: 'roles' as const,    icon: '🔐', label: 'Phân quyền vai trò' },
    { id: 'teams' as const,    icon: '👥', label: 'Quản lý nhóm hỗ trợ' },
    { id: 'channels' as const, icon: '📡', label: 'Kênh tiếp nhận' },
  ];

  return (
    <div className="settings-container">

      {/* ── Header ── */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">⚙️ Cài đặt & Cấu hình hệ thống</h1>
          <p className="settings-subtitle">Quản lý phân quyền vai trò, nhóm hỗ trợ và cấu hình kênh tiếp nhận yêu cầu.</p>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="settings-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            id={`settings-tab-${tab.id}`}
            className={`settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Phân quyền vai trò ── */}
      {activeTab === 'roles' && (
        <div className="settings-roles-layout">

          {/* Role list */}
          <div className="roles-sidebar">
            <p className="roles-sidebar-title">Chọn vai trò</p>
            {roles.map(role => (
              <button
                key={role.id}
                className={`role-item ${selectedRole === role.id ? 'active' : ''}`}
                onClick={() => setSelectedRole(role.id)}
              >
                <span className="role-name">{role.name}</span>
                <span className="role-perm-count">
                  {Object.values(role.permissions).filter(Boolean).length}/{ALL_PERMISSIONS.length} quyền
                </span>
              </button>
            ))}
          </div>

          {/* Permissions table */}
          <div className="permissions-card">
            <div className="permissions-header">
              <h3 className="permissions-title">Quyền hạn – {currentRole.name}</h3>
              <button id="btn-save-permissions" className="btn-save" onClick={handleSave}>
                {saved ? '✅ Đã lưu!' : '💾 Cập nhật quyền'}
              </button>
            </div>

            <div className="permissions-list">
              {ALL_PERMISSIONS.map(perm => {
                const checked = currentRole.permissions[perm.id];
                return (
                  <label key={perm.id} className="perm-row">
                    <div className="perm-info">
                      <span className="perm-label">{perm.label}</span>
                      <span className="perm-desc">{perm.desc}</span>
                    </div>
                    <div className={`perm-toggle ${checked ? 'on' : 'off'}`} onClick={() => togglePerm(perm.id)}>
                      <div className="perm-toggle-thumb" />
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Quản lý nhóm hỗ trợ ── */}
      {activeTab === 'teams' && (
        <div className="settings-placeholder-card">
          <div className="placeholder-icon">👥</div>
          <h3 className="placeholder-title">Quản lý nhóm hỗ trợ</h3>
          <p className="placeholder-desc">
            Tạo và quản lý các nhóm kỹ thuật viên. Thêm / xóa thành viên, đặt trưởng nhóm
            và cấu hình quy tắc phân công phiếu tự động.
          </p>
          <div className="placeholder-badge">🚧 Đang phát triển</div>
        </div>
      )}

      {/* ── Tab: Kênh tiếp nhận ── */}
      {activeTab === 'channels' && (
        <div className="settings-placeholder-card">
          <div className="placeholder-icon">📡</div>
          <h3 className="placeholder-title">Cấu hình kênh tiếp nhận</h3>
          <p className="placeholder-desc">
            Quản lý các kênh yêu cầu hỗ trợ: Email, Web Portal, Microsoft Teams, và tích hợp ITSM khác.
            Cấu hình quy tắc chuyển tiếp và ưu tiên xử lý theo kênh.
          </p>
          <div className="placeholder-badge">🚧 Đang phát triển</div>
        </div>
      )}

    </div>
  );
};
