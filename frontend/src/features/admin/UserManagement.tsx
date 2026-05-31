import React, { useState, useEffect } from 'react';
import './UserManagement.css';
import { adminService, type Employee, type Role, type Department, type SupportTeam } from '../../services/admin.service';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<SupportTeam[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Employee | null>(null);
  
  const [formData, setFormData] = useState({
    ho_ten: '',
    email: '',
    tai_khoan: '',
    mat_khau: '',
    vai_tro_id: '',
    phong_ban_id: '',
    nhom_ho_tro_id: '',
    trang_thai: true
  });

  useEffect(() => {
    fetchData();
  }, [roleFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesData, deptsData, teamsData] = await Promise.all([
        adminService.getUsers({ limit: 100, vai_tro_id: roleFilter ? Number(roleFilter) : undefined }),
        adminService.getRoles(),
        adminService.getDepartments(),
        adminService.getTeams()
      ]);
      setUsers(usersRes.data);
      setRoles(rolesData);
      setDepartments(deptsData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Failed to fetch user management data', error);
      alert('Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: Employee) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        ho_ten: user.ho_ten,
        email: user.email,
        tai_khoan: user.tai_khoan,
        mat_khau: '', // Không tải mật khẩu
        vai_tro_id: user.vai_tro_id.toString(),
        phong_ban_id: user.phong_ban_id.toString(),
        nhom_ho_tro_id: user.nhom_ho_tro_id ? user.nhom_ho_tro_id.toString() : '',
        trang_thai: user.trang_thai
      });
    } else {
      setEditingUser(null);
      setFormData({
        ho_ten: '', email: '', tai_khoan: '', mat_khau: '',
        vai_tro_id: '', phong_ban_id: '', nhom_ho_tro_id: '', trang_thai: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await adminService.updateUser(editingUser.nhan_vien_id, {
          ho_ten: formData.ho_ten,
          vai_tro_id: Number(formData.vai_tro_id),
          phong_ban_id: Number(formData.phong_ban_id),
          nhom_ho_tro_id: formData.nhom_ho_tro_id ? Number(formData.nhom_ho_tro_id) : null,
          trang_thai: formData.trang_thai
        });
        alert('Cập nhật thành công!');
      } else {
        if (!formData.mat_khau) {
          alert('Vui lòng nhập mật khẩu cho nhân viên mới!');
          return;
        }
        await adminService.createUser({
          ...formData,
          vai_tro_id: Number(formData.vai_tro_id),
          phong_ban_id: Number(formData.phong_ban_id),
          nhom_ho_tro_id: formData.nhom_ho_tro_id ? Number(formData.nhom_ho_tro_id) : null,
        });
        alert('Tạo nhân viên thành công!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredUsers = users.filter(u => 
    u.ho_ten.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.tai_khoan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="user-management-container">
      <div className="um-header">
        <div>
          <h1 className="um-title">👥 Quản lý Nhân sự & Phòng ban</h1>
          <p className="um-subtitle">Quản lý danh sách nhân viên, phòng ban và phân bổ vào các nhóm hỗ trợ.</p>
        </div>
        <div className="um-actions">
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            + Thêm nhân viên
          </button>
        </div>
      </div>

      <div className="um-filters">
        <input 
          type="text" 
          className="um-filter-input" 
          placeholder="Tìm kiếm tên, tài khoản, email..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select 
          className="um-filter-select"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">Tất cả vai trò</option>
          {roles.map(r => (
            <option key={r.vai_tro_id} value={r.vai_tro_id}>{r.ten_vai_tro}</option>
          ))}
        </select>
      </div>

      <div className="um-table-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Đang tải dữ liệu...</div>
        ) : (
          <table className="um-table">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Tài khoản</th>
                <th>Phòng ban</th>
                <th>Vai trò</th>
                <th>Nhóm hỗ trợ</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.nhan_vien_id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0F172A' }}>{user.ho_ten}</div>
                    <div style={{ fontSize: '13px', color: '#64748B' }}>{user.email}</div>
                  </td>
                  <td>{user.tai_khoan}</td>
                  <td>{user.phong_ban?.ten_phong_ban || 'N/A'}</td>
                  <td>
                    <span className="badge badge-role">{user.vai_tro?.ten_vai_tro}</span>
                  </td>
                  <td>{user.nhom_ho_tro?.ten_nhom || '-'}</td>
                  <td>
                    {user.trang_thai ? (
                      <span className="badge badge-status active">Hoạt động</span>
                    ) : (
                      <span className="badge badge-status inactive">Khóa</span>
                    )}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleOpenModal(user)}
                      style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Sửa
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                    Không tìm thấy nhân viên nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Thêm/Sửa User */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">{editingUser ? 'Sửa thông tin nhân viên' : 'Thêm nhân viên mới'}</h3>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Họ và tên *</label>
                  <input required className="form-input" value={formData.ho_ten} onChange={e => setFormData({...formData, ho_ten: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input required type="email" className="form-input" disabled={!!editingUser} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tài khoản *</label>
                  <input required className="form-input" disabled={!!editingUser} value={formData.tai_khoan} onChange={e => setFormData({...formData, tai_khoan: e.target.value})} />
                </div>
                {!editingUser && (
                  <div className="form-group">
                    <label className="form-label">Mật khẩu *</label>
                    <input required type="password" className="form-input" value={formData.mat_khau} onChange={e => setFormData({...formData, mat_khau: e.target.value})} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Phòng ban *</label>
                  <select required className="form-select" value={formData.phong_ban_id} onChange={e => setFormData({...formData, phong_ban_id: e.target.value})}>
                    <option value="">-- Chọn phòng ban --</option>
                    {departments.map(d => <option key={d.phong_ban_id} value={d.phong_ban_id}>{d.ten_phong_ban}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Vai trò *</label>
                  <select required className="form-select" value={formData.vai_tro_id} onChange={e => setFormData({...formData, vai_tro_id: e.target.value})}>
                    <option value="">-- Chọn vai trò --</option>
                    {roles.map(r => <option key={r.vai_tro_id} value={r.vai_tro_id}>{r.ten_vai_tro}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nhóm hỗ trợ (Tùy chọn)</label>
                  <select className="form-select" value={formData.nhom_ho_tro_id} onChange={e => setFormData({...formData, nhom_ho_tro_id: e.target.value})}>
                    <option value="">-- Không thuộc nhóm nào --</option>
                    {teams.map(t => <option key={t.nhom_ho_tro_id} value={t.nhom_ho_tro_id}>{t.ten_nhom}</option>)}
                  </select>
                </div>
                {editingUser && (
                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <input type="checkbox" id="trang_thai" checked={formData.trang_thai} onChange={e => setFormData({...formData, trang_thai: e.target.checked})} />
                    <label htmlFor="trang_thai" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Tài khoản đang hoạt động</label>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-primary">Lưu thông tin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
