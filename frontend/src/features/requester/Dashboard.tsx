import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

interface DashboardProps {
  triggerQuickCreate?: number;
}

interface Ticket {
  id: string;
  title: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'New' | 'Pending' | 'Resolved' | 'Closed';
  slaDeadline: number; // timestamp
  assignee: string;
  updatedAt: string;
}

interface KnowledgeArticle {
  id: string;
  category: string;
  title: string;
  helpfulCount: number;
  content: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ triggerQuickCreate }) => {
  const navigate = useNavigate();
  // --- MOCK DATA ---
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'HW-2026-0042',
      title: 'Hỗ trợ lỗi màn hình xanh (BSOD) khi đang họp Zoom',
      priority: 'High',
      status: 'Pending',
      slaDeadline: Date.now() + 2 * 3600 * 1000 + 14 * 60 * 1000 + 35 * 1000, // 2h 14m 35s
      assignee: 'Nguyễn Văn Hỗ Trợ (L1)',
      updatedAt: '10 phút trước',
    },
    {
      id: 'SW-2026-0045',
      title: 'Yêu cầu cấp phát bản quyền phần mềm Figma Design Pro',
      priority: 'Medium',
      status: 'New',
      slaDeadline: Date.now() + 15 * 3600 * 1000, // 15h
      assignee: 'Chưa phân công (L1 nhận)',
      updatedAt: '30 phút trước',
    },
    {
      id: 'NW-2026-0041',
      title: 'Không kết nối được vào mạng Wifi Office_HCM_5G',
      priority: 'High',
      status: 'Pending',
      slaDeadline: Date.now() + 4 * 60 * 1000 + 12 * 1000, // 4m 12s
      assignee: 'Phạm Văn Mạng (L2)',
      updatedAt: '5 phút trước',
    },
    {
      id: 'HW-2026-0038',
      title: 'Thay pin máy tính xách tay Dell Latitude 7420 bị chai',
      priority: 'Low',
      status: 'Resolved',
      slaDeadline: Date.now() - 2 * 3600 * 1000, // đã hoàn thành
      assignee: 'Nguyễn Văn Hỗ Trợ (L1)',
      updatedAt: 'Hôm qua',
    },
  ]);

  const [articles] = useState<KnowledgeArticle[]>([
    {
      id: 'KB-001',
      category: 'Mạng & Kết nối',
      title: 'Hướng dẫn cấu hình VPN công ty để làm việc từ xa (WFA) trên macOS và Windows',
      helpfulCount: 142,
      content: 'Để kết nối VPN, trước tiên bạn cần tải phần mềm FortiClient... Sau đó nhập cổng kết nối vpn.company.com và thông tin tài khoản AD được cấp.',
    },
    {
      id: 'KB-002',
      category: 'Tài khoản & Bảo mật',
      title: 'Quy trình tự thiết lập xác thực đa yếu tố (MFA) Microsoft Authenticator cho người mới',
      helpfulCount: 98,
      content: 'Tải ứng dụng Microsoft Authenticator trên thiết bị di động... Vào trang security.company.com quét mã QR để kích hoạt xác thực hai lớp.',
    },
    {
      id: 'KB-003',
      category: 'Thiết bị & Phần cứng',
      title: 'Mẹo khắc phục nhanh khi máy in kẹt giấy hoặc không nhận lệnh in từ mạng LAN nội bộ',
      helpfulCount: 67,
      content: 'Tắt nguồn máy in, rút giắc mạng LAN và cắm lại. Mở khay giấy kiểm tra xem có mẩu giấy thừa nào bị kẹt không. Clear queue in Spooler trên máy tính.',
    },
  ]);

  // --- STATE FOR INTERACTIVITY ---
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showHotlineModal, setShowHotlineModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  
  // Form input states
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newDesc, setNewDesc] = useState('');

  // --- SLA COUNTDOWN REAL-TIME LOGIC ---
  const [timeNow, setTimeNow] = useState(Date.now());

  // Listen to quick create trigger from Topbar
  useEffect(() => {
    if (triggerQuickCreate !== undefined && triggerQuickCreate > 0) {
      setShowCreateForm(true);
    }
  }, [triggerQuickCreate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatSLA = (ticket: Ticket) => {
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
      return <span className="sla-timer sla-ok">Đạt SLA ✓</span>;
    }

    const diff = ticket.slaDeadline - timeNow;
    if (diff <= 0) {
      return <span className="sla-timer sla-danger">Quá hạn! (Vi phạm)</span>;
    }

    const hours = Math.floor(diff / (3600 * 1000));
    const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
    const secs = Math.floor((diff % (60 * 1000)) / 1000);

    const pad = (num: number) => String(num).padStart(2, '0');
    const displayStr = `${pad(hours)}g ${pad(mins)}p ${pad(secs)}s`;

    if (diff < 15 * 60 * 1000) {
      // dưới 15 phút hiển thị đỏ cảnh báo nguy cơ
      return <span className="sla-timer sla-danger">Hạn: {displayStr} ⚠</span>;
    } else if (diff < 120 * 60 * 1000) {
      // dưới 2 tiếng hiển thị vàng
      return <span className="sla-timer sla-warning">Hạn: {displayStr}</span>;
    }
    return <span className="sla-timer sla-ok">Hạn: {displayStr}</span>;
  };

  // --- ACTIONS HANDLERS ---
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTicket: Ticket = {
      id: `SW-2026-0${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle,
      priority: newPriority,
      status: 'New',
      slaDeadline: Date.now() + (newPriority === 'High' ? 4 : newPriority === 'Medium' ? 12 : 24) * 3600 * 1000,
      assignee: 'Chưa phân công (L1 nhận)',
      updatedAt: 'Vừa xong',
    };

    setTickets([newTicket, ...tickets]);
    setShowCreateForm(false);
    
    // Reset form
    setNewTitle('');
    setNewPriority('Medium');
    setNewDesc('');
    
    alert(`Tạo phiếu thành công! Mã phiếu mới: ${newTicket.id}`);
  };

  // Đếm số lượng ticket theo trạng thái
  const countByStatus = (status: Ticket['status']) => {
    return tickets.filter(t => t.status === status).length;
  };

  return (
    <div className="dashboard-container" style={{ padding: 0 }}>
      <div className="dashboard-content">

        {/* 1. Hero nội bộ */}
        <section className="hero-section">
          <div className="hero-glow"></div>
          <h1 className="hero-headline">Hỗ trợ IT nội bộ nhanh</h1>
          <p className="hero-subheadline">
            Cổng dịch vụ kỹ thuật trực tiếp của bạn: giúp tạo phiếu mới, theo dõi tiến độ giải quyết sự cố thời gian thực và tự tra cứu tài liệu hướng dẫn nhanh chóng chỉ trong một nơi duy nhất.
          </p>
          <div className="hero-ctas">
            <button className="btn-cta-primary" onClick={() => navigate('/tickets/create')}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Tạo phiếu hỗ trợ
            </button>
            <button 
              className="btn-cta-secondary" 
              onClick={() => {
                document.getElementById('kb-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
              Tra cứu cơ sở tri thức
            </button>
          </div>
        </section>

        {/* 2. Khu vực thao tác nhanh */}
        <section className="quick-actions-section">
          <div className="section-title-container">
            <h2 className="section-title">Thao tác nhanh</h2>
          </div>
          <div className="quick-actions-grid">
            
            <div className="action-card" onClick={() => navigate('/tickets/create')}>
              <div className="action-icon-wrapper">
                <svg viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                </svg>
              </div>
              <h3 className="action-card-title">Tạo phiếu hỗ trợ</h3>
              <p className="action-card-desc">Gửi yêu cầu giải quyết lỗi phần mềm, cấp thiết bị hoặc tài khoản.</p>
            </div>

            <div className="action-card" onClick={() => {
              document.getElementById('tickets-table')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              <div className="action-icon-wrapper">
                <svg viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v-2H7v-2h7V7h2v10h-2z"/>
                </svg>
              </div>
              <h3 className="action-card-title">Phiếu của tôi</h3>
              <p className="action-card-desc">Theo dõi tiến độ, xem phản hồi và lịch sử của các yêu cầu của bạn.</p>
            </div>

            <div className="action-card" onClick={() => {
              document.getElementById('kb-section')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              <div className="action-icon-wrapper">
                <svg viewBox="0 0 24 24">
                  <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/>
                </svg>
              </div>
              <h3 className="action-card-title">Cơ sở tri thức</h3>
              <p className="action-card-desc">Đọc các bài viết hướng dẫn tự xử lý nhanh các sự cố thông thường.</p>
            </div>

            <div className="action-card" onClick={() => setShowHotlineModal(true)}>
              <div className="action-icon-wrapper" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                <svg viewBox="0 0 24 24">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-2.23 2.23c-2.82-1.48-5.11-3.77-6.59-6.59l2.23-2.22c.28-.28.36-.67.25-1.02C8.79 6.35 8.59 5.16 8.59 3.92c0-.55-.45-1-1-1H3.92c-.55 0-1 .45-1 1 0 9.39 7.63 17.02 17.02 17.02.55 0 1-.45 1-1v-4.56c0-.55-.45-1-1-1z"/>
                </svg>
              </div>
              <h3 className="action-card-title">Liên hệ IT khẩn</h3>
              <p className="action-card-desc">Số điện thoại đường dây nóng hỗ trợ khẩn cấp tại văn phòng.</p>
            </div>

          </div>
        </section>

        {/* 3. Thẻ tổng quan phiếu hỗ trợ */}
        <section className="summary-section">
          <div className="section-title-container">
            <h2 className="section-title">Thống kê phiếu hỗ trợ của bạn</h2>
          </div>
          <div className="summary-grid">
            
            <div className="summary-card">
              <div className="summary-info">
                <span className="summary-count">{countByStatus('New')}</span>
                <span className="summary-label">Mới tạo</span>
              </div>
              <div className="summary-icon-wrapper state-new">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-info">
                <span className="summary-count">{countByStatus('Pending')}</span>
                <span className="summary-label">Đang giải quyết</span>
              </div>
              <div className="summary-icon-wrapper state-pending">
                <svg viewBox="0 0 24 24">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-info">
                <span className="summary-count">{countByStatus('Resolved')}</span>
                <span className="summary-label">Đã giải quyết</span>
              </div>
              <div className="summary-icon-wrapper state-resolved">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-info">
                <span className="summary-count">{countByStatus('Closed')}</span>
                <span className="summary-label">Đã đóng</span>
              </div>
              <div className="summary-icon-wrapper state-closed">
                <svg viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </div>
            </div>

          </div>
        </section>

        {/* 4. Bảng phiếu gần đây (Antigravity Table) */}
        <section className="table-section" id="tickets-table">
          <div className="section-title-container">
            <h2 className="section-title">Danh sách phiếu hỗ trợ gần đây</h2>
          </div>
          <div className="table-card">
            <div className="table-responsive-container">
              <table className="antigravity-table">
                <thead>
                  <tr>
                    <th>Mã Phiếu</th>
                    <th>Tiêu đề</th>
                    <th>Độ ưu tiên</th>
                    <th>Trạng thái</th>
                    <th>Hạn SLA (Đếm ngược)</th>
                    <th>Kỹ thuật viên phụ trách</th>
                    <th>Cập nhật cuối</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(ticket => (
                    <tr key={ticket.id}>
                      <td>
                        <span className="ticket-id-link" onClick={() => navigate(`/tickets/detail/${ticket.id}`)}>{ticket.id}</span>
                      </td>
                      <td>
                        <div className="ticket-title-cell" title={ticket.title}>
                          {ticket.title}
                        </div>
                      </td>
                      <td>
                        {ticket.priority === 'High' && <span className="badge-priority priority-high">Cao</span>}
                        {ticket.priority === 'Medium' && <span className="badge-priority priority-medium">Trung bình</span>}
                        {ticket.priority === 'Low' && <span className="badge-priority priority-low">Thấp</span>}
                      </td>
                      <td>
                        {ticket.status === 'New' && <span className="badge-status status-new">Mới tạo</span>}
                        {ticket.status === 'Pending' && <span className="badge-status status-pending">Đang giải quyết</span>}
                        {ticket.status === 'Resolved' && <span className="badge-status status-resolved">Đã giải quyết</span>}
                        {ticket.status === 'Closed' && <span className="badge-status status-closed">Đã đóng</span>}
                      </td>
                      <td>
                        {formatSLA(ticket)}
                      </td>
                      <td>
                        <span style={{ fontSize: '13.5px', color: '#334155', fontWeight: 500 }}>
                          {ticket.assignee}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: '#64748B' }}>
                          {ticket.updatedAt}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 5. Khu vực bài viết tri thức gợi ý */}
        <section className="knowledge-section" id="kb-section">
          <div className="section-title-container">
            <h2 className="section-title">Hướng dẫn khắc phục nhanh khuyên dùng</h2>
          </div>
          <div className="knowledge-grid">
            {articles.map(article => (
              <div key={article.id} className="article-card">
                <div className="article-top">
                  <span className="article-category">{article.category}</span>
                  <h3 className="article-title">{article.title}</h3>
                </div>
                <div className="article-footer">
                  <div className="article-helpful">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    <span>{article.helpfulCount} người thấy hữu ích</span>
                  </div>
                  <button 
                    className="btn-view-article"
                    onClick={() => setSelectedArticle(article)}
                  >
                    Xem hướng dẫn
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* --- MOCK CREATION FORM MODAL --- */}
      {showCreateForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0',
            width: '90%', maxWidth: '500px', padding: '32px', boxSizing: 'border-box',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', animation: 'fadeIn 0.2s ease-out'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0' }}>Gửi yêu cầu tạo Ticket (UC-02)</h3>
            <p style={{ fontSize: '13.5px', color: '#64748B', margin: '0 0 20px 0' }}>Vui lòng điền thông tin sự cố kỹ thuật của bạn.</p>
            
            <form onSubmit={handleCreateTicket}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, marginBottom: '6px' }}>Tiêu đề lỗi (*)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: Không thể đăng nhập VPN, lỗi Outlook..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB',
                    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, marginBottom: '6px' }}>Mức độ ảnh hưởng (*)</label>
                <select 
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB',
                    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'
                  }}
                >
                  <option value="Low">Thấp (Chỉ mình tôi bị ảnh hưởng nhẹ)</option>
                  <option value="Medium">Trung bình (Ảnh hưởng đến công việc hàng ngày)</option>
                  <option value="High">Cao (Lỗi khẩn cấp, chặn đứng công việc)</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, marginBottom: '6px' }}>Mô tả chi tiết (*)</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Mô tả cụ thể hiện tượng lỗi, ảnh chụp lỗi..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB',
                    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', padding: '10px 18px',
                    borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  style={{
                    backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', padding: '10px 18px',
                    borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MOCK HOTLINE MODAL --- */}
      {showHotlineModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0',
            width: '90%', maxWidth: '400px', padding: '32px', boxSizing: 'border-box',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', animation: 'fadeIn 0.2s ease-out',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px', height: '56px', backgroundColor: '#FEF2F2', color: '#DC2626',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center',
              margin: '0 auto 16px auto', justifyContent: 'center'
            }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-2.23 2.23c-2.82-1.48-5.11-3.77-6.59-6.59l2.23-2.22c.28-.28.36-.67.25-1.02C8.79 6.35 8.59 5.16 8.59 3.92c0-.55-.45-1-1-1H3.92c-.55 0-1 .45-1 1 0 9.39 7.63 17.02 17.02 17.02.55 0 1-.45 1-1v-4.56c0-.55-.45-1-1-1z"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#0F172A' }}>Liên hệ IT Khẩn cấp</h3>
            <p style={{ fontSize: '13.5px', color: '#64748B', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Đối với sự cố chặn đứng hoạt động của toàn văn phòng hoặc các lỗi bảo mật nghiêm trọng.
            </p>

            <div style={{
              backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px',
              padding: '16px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#64748B' }}>Hotline máy bàn:</span>
                <strong style={{ color: '#2563EB' }}>Máy lẻ: 2200 (IT Support)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#64748B' }}>Điện thoại di động:</span>
                <strong style={{ color: '#0F172A' }}>090-1234-567 (Trưởng nhóm L1)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#64748B' }}>Kênh liên lạc:</span>
                <strong style={{ color: '#10B981' }}>MS Teams / Slack: @IT-Helpdesk</strong>
              </div>
            </div>

            <button 
              type="button" 
              onClick={() => setShowHotlineModal(false)}
              style={{
                width: '100%', backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none',
                padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* --- MOCK ARTICLE READER MODAL --- */}
      {selectedArticle && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0',
            width: '90%', maxWidth: '600px', padding: '32px', boxSizing: 'border-box',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', animation: 'fadeIn 0.2s ease-out'
          }}>
            <span style={{
              fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#2563EB',
              backgroundColor: '#EFF6FF', padding: '4px 10px', borderRadius: '6px', display: 'inline-block',
              marginBottom: '12px'
            }}>
              {selectedArticle.category}
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 16px 0', lineHeight: 1.3 }}>
              {selectedArticle.title}
            </h3>

            <div style={{
              fontSize: '14.5px', color: '#334155', lineHeight: 1.6,
              maxHeight: '250px', overflowY: 'auto', paddingRight: '10px', marginBottom: '24px'
            }}>
              <p style={{ fontWeight: 600, color: '#0F172A' }}>Nội dung bài viết:</p>
              <p>{selectedArticle.content}</p>
              <p style={{ fontSize: '13.5px', color: '#64748B', marginTop: '16px', fontStyle: 'italic' }}>
                * Lưu ý: Nếu làm theo các bước trên vẫn không khắc phục được lỗi, bạn hãy bấm nút "Tạo phiếu hỗ trợ" bên ngoài màn hình chính để kỹ thuật viên IT trực tiếp xử lý.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B' }}>
                <span>Bài viết có hữu ích không?</span>
                <button 
                  onClick={() => {
                    alert('Cảm ơn bạn đã phản hồi!');
                    setSelectedArticle(null);
                  }}
                  style={{
                    backgroundColor: '#EFF6FF', border: 'none', color: '#2563EB', padding: '6px 12px',
                    borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Có 👍
                </button>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedArticle(null)}
                style={{
                  backgroundColor: '#0F172A', color: '#FFFFFF', border: 'none', padding: '10px 18px',
                  borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
