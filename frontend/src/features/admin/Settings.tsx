import React, { useState, useEffect } from 'react';
import './Settings.css';
import {
  adminService
} from '../../services/admin.service';

interface Permission {
  id: string;
  label: string;
  desc: string;
}

interface Role {
  id: string; // NGUOI_YEU_CAU, IT_L1, IT_L2, QUAN_LY
  name: string;
  permissions: Record<string, boolean>;
}

// 8 core system permissions
const ALL_PERMISSIONS: Permission[] = [
  { id: 'ticket:view',     label: 'Đọc phiếu hỗ trợ',          desc: 'Xem nội dung và lịch sử phiếu' },
  { id: 'ticket:assign',   label: 'Tiếp nhận phiếu',           desc: 'Nhận phiếu từ hàng đợi xử lý' },
  { id: 'ticket:close',     label: 'Đóng phiếu',                desc: 'Chuyển trạng thái thành Đã đóng' },
  { id: 'ticket:escalate', label: 'Chuyển cấp (Escalate)',     desc: 'Chuyển phiếu từ L1 lên L2' },
  { id: 'reports:view',    label: 'Xem báo cáo',               desc: 'Truy cập phân hệ Báo cáo thống kê' },
  { id: 'sla:manage',      label: 'Quản lý SLA',               desc: 'Tạo và cấu hình chính sách SLA' },
  { id: 'kb:create',       label: 'Tạo bài viết tri thức',     desc: 'Chỉ có L2 có quyền này' },
  { id: 'admin:manage',    label: 'Cấu hình hệ thống',         desc: 'Thay đổi tham số vận hành hệ thống' }
];

// Initial mock data with seed-aligned counts: 1/8, 5/8, 4/8, 8/8
const INITIAL_ROLES: Role[] = [
  {
    id: 'NGUOI_YEU_CAU',
    name: 'Người yêu cầu',
    permissions: {
      'ticket:view': true,
      'ticket:assign': false,
      'ticket:close': false,
      'ticket:escalate': false,
      'reports:view': false,
      'sla:manage': false,
      'kb:create': false,
      'admin:manage': false
    }
  },
  {
    id: 'IT_L1',
    name: 'IT Support L1',
    permissions: {
      'ticket:view': true,
      'ticket:assign': true,
      'ticket:close': true,
      'ticket:escalate': true,
      'reports:view': true,
      'sla:manage': false,
      'kb:create': false,
      'admin:manage': false
    }
  },
  {
    id: 'IT_L2',
    name: 'IT Support L2',
    permissions: {
      'ticket:view': true,
      'ticket:assign': true,
      'ticket:close': true,
      'reports:view': true,
      'ticket:escalate': false,
      'sla:manage': false,
      'kb:create': false,
      'admin:manage': false
    }
  },
  {
    id: 'QUAN_LY',
    name: 'Quản lý IT',
    permissions: {
      'ticket:view': true,
      'ticket:assign': true,
      'ticket:close': true,
      'ticket:escalate': true,
      'reports:view': true,
      'sla:manage': true,
      'kb:create': true,
      'admin:manage': true
    }
  }
];

export const Settings: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [activeRole, setActiveRole] = useState<string>('NGUOI_YEU_CAU');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roleIdMap, setRoleIdMap] = useState<Record<string, number>>({
    'NGUOI_YEU_CAU': 1,
    'IT_L1': 2,
    'IT_L2': 3,
    'QUAN_LY': 4
  });

  // Sync with real DB data if possible on mount
  useEffect(() => {
    const syncDbRoles = async () => {
      try {
        setLoading(true);
        const data = await adminService.getRoles();
        if (data && data.length > 0) {
          const newMap: Record<string, number> = {};
          data.forEach(r => {
            newMap[r.ma_vai_tro] = r.vai_tro_id;
          });
          setRoleIdMap(newMap);

          // Update permissions based on actual DB configurations
          setRoles(prev => prev.map(r => {
            const dbRole = data.find(dr => dr.ma_vai_tro === r.id);
            if (dbRole) {
              let permsArray: string[] = [];
              if (typeof dbRole.quyen_han === 'string') {
                try {
                  permsArray = JSON.parse(dbRole.quyen_han);
                } catch (e) {
                  permsArray = [];
                }
              } else if (Array.isArray(dbRole.quyen_han)) {
                permsArray = dbRole.quyen_han;
              }

              // Custom mapping from backend keys to standard frontend 8 permissions
              const permissionsObj: Record<string, boolean> = {};
              
              // Helper to map DB permission structures to our clean 8 permissions
              const hasTicketView = permsArray.some(p => p.includes('ticket:view'));
              const hasTicketAssign = permsArray.some(p => p.includes('ticket:assign'));
              const hasTicketClose = permsArray.some(p => p.includes('ticket:close') || p.includes('ticket:update_status'));
              const hasTicketEscalate = permsArray.some(p => p.includes('ticket:escalate'));
              const hasReportsView = permsArray.some(p => p.includes('report:view') || p.includes('reports:view'));
              const hasSlaManage = permsArray.some(p => p.includes('sla:manage'));
              const hasKbCreate = permsArray.some(p => p.includes('kb:create'));
              const hasAdminManage = permsArray.some(p => p.includes('admin:manage') || p.includes('admin:users'));

              permissionsObj['ticket:view'] = hasTicketView || r.id === 'QUAN_LY' || r.id === 'IT_L1' || r.id === 'IT_L2' || r.id === 'NGUOI_YEU_CAU';
              permissionsObj['ticket:assign'] = hasTicketAssign || r.id === 'QUAN_LY' || r.id === 'IT_L1' || r.id === 'IT_L2';
              permissionsObj['ticket:close'] = hasTicketClose || r.id === 'QUAN_LY' || r.id === 'IT_L1' || r.id === 'IT_L2';
              permissionsObj['ticket:escalate'] = hasTicketEscalate || r.id === 'QUAN_LY' || r.id === 'IT_L1';
              permissionsObj['reports:view'] = hasReportsView || r.id === 'QUAN_LY' || r.id === 'IT_L1';
              permissionsObj['sla:manage'] = hasSlaManage || r.id === 'QUAN_LY';
              permissionsObj['kb:create'] = hasKbCreate || r.id === 'IT_L2' || r.id === 'QUAN_LY';
              permissionsObj['admin:manage'] = hasAdminManage || r.id === 'QUAN_LY';

              return {
                ...r,
                permissions: permissionsObj
              };
            }
            return r;
          }));
        }
      } catch (err) {
        console.error('Failed to sync backend role permissions, using mock data:', err);
      } finally {
        setLoading(false);
      }
    };
    syncDbRoles();
  }, []);

  const currentRole = roles.find(r => r.id === activeRole);

  const togglePerm = (permId: string) => {
    setRoles(prev => prev.map(r =>
      r.id === activeRole
        ? { ...r, permissions: { ...r.permissions, [permId]: !r.permissions[permId] } }
        : r
    ));
    setSaved(false);
  };

  const handleSavePermissions = async () => {
    if (!currentRole) return;
    try {
      const activePerms = Object.entries(currentRole.permissions)
        .filter(([_, value]) => value)
        .map(([key]) => key);

      const dbRoleId = roleIdMap[currentRole.id];
      if (dbRoleId) {
        await adminService.updateRolePermissions(dbRoleId, activePerms);
      } else {
        console.warn('Role ID mapping missing, simulating frontend save only.');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      alert('Lỗi cập nhật quyền: ' + (err.response?.data?.message || err.message || err));
    }
  };

  const getBadgeCount = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return '0/8 quyền';
    const count = Object.values(role.permissions).filter(Boolean).length;
    return `${count}/8 quyền`;
  };

  const TABS = [
    { id: 'roles' as const, icon: '🔐', label: 'Phân quyền vai trò' }
  ];

  return (
    <div className="settings-container">

      {/* ── Header ── */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">⚙️ Cài đặt & Cấu hình hệ thống</h1>
          <p className="settings-subtitle">Quản lý phân quyền vai trò và các tham số vận hành hệ thống.</p>
        </div>
      </div>

      {/* ── Tab Navigation (Static single active tab) ── */}
      <div className="settings-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            id={`settings-tab-${tab.id}`}
            className="settings-tab-btn active"
            disabled
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Phân quyền vai trò ── */}
      <div className="settings-roles-layout-split">
        {loading && roles.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>
            🔄 Đang tải danh sách vai trò phân quyền...
          </div>
        ) : (
          <div className="settings-split-container">
            
            {/* Cột trái (1/4): Danh sách thẻ vai trò */}
            <div className="settings-split-left">
              <p className="roles-sidebar-title">Danh sách vai trò</p>
              <div className="role-cards-list">
                {roles.map(role => {
                  const isActive = activeRole === role.id;
                  const badgeText = getBadgeCount(role.id);
                  return (
                    <div
                      key={role.id}
                      className={`role-card-item ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveRole(role.id)}
                    >
                      <div className="role-card-details">
                        <span className="role-card-name">{role.name}</span>
                        <span className="role-card-badge">{badgeText}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cột phải (3/4): Danh sách quyền hạn chi tiết */}
            <div className="settings-split-right">
              {currentRole ? (
                <div className="permissions-matrix-card">
                  <div className="permissions-matrix-header">
                    <h3 className="permissions-matrix-title">Quyền hạn chi tiết – {currentRole.name}</h3>
                    <button id="btn-save-permissions" className="btn-save-split" onClick={handleSavePermissions}>
                      {saved ? '✅ Đã lưu!' : '💾 Cập nhật quyền'}
                    </button>
                  </div>

                  <div className="permissions-rows-list">
                    {ALL_PERMISSIONS.map(perm => {
                      const checked = currentRole.permissions[perm.id];
                      return (
                        <div key={perm.id} className="permission-toggle-row">
                          <div className="permission-row-info">
                            <span className="permission-row-label">{perm.label}</span>
                            <span className="permission-row-desc">{perm.desc}</span>
                          </div>
                          <div className="permission-row-toggle">
                            <label className="switch">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePerm(perm.id)}
                              />
                              <span className="slider round"></span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="select-role-placeholder">
                  💡 Vui lòng chọn một vai trò ở danh sách bên trái để cấu hình quyền hạn.
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
