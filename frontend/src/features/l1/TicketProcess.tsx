import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TicketProcess.css';

interface Comment {
  id: string;
  author: string;
  role: string;
  text: string;
  date: string;
  isSystem?: boolean;
}

interface AuditLog {
  id: string;
  action: string;
  time: string;
  user: string;
  message?: string;
  active?: boolean;
}

interface Ticket {
  id: string;
  title: string;
  requesterName: string;
  requesterEmail: string;
  department: string;
  deviceSoftware: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'New' | 'Pending' | 'Resolved' | 'Closed';
  slaDeadline: number; // timestamp
  assignee: string;
  group: 'IT L1' | 'IT L2';
  createdAt: string;
  description: string;
  isReopened?: boolean;
}

const DEFAULT_TICKET: Ticket = {
  id: 'HW-2026-0042',
  title: 'Hỗ trợ lỗi màn hình xanh (BSOD) khi đang họp Zoom',
  requesterName: 'Nguyễn Văn A',
  requesterEmail: 'user@company.com',
  department: 'Bộ phận Thiết kế (Văn phòng HCM)',
  deviceSoftware: 'Laptop Dell Latitude 7420 / Windows 11 Pro',
  priority: 'High',
  status: 'Pending',
  slaDeadline: Date.now() + 2 * 3600 * 1000 + 14 * 60 * 1000,
  assignee: 'Nguyễn Văn Hỗ Trợ (IT L1)',
  group: 'IT L1',
  createdAt: '2026-05-25',
  description: 'Tôi đang sử dụng ứng dụng Zoom để họp với đối tác thì máy tính bỗng nhiên hiển thị màn hình xanh chết chóc (BSOD) với mã lỗi WHEA_UNCORRECTABLE_ERROR. Hiện tại máy khởi động lại rất chậm và thường xuyên bị treo sau 5-10 phút sử dụng.'
};

export const TicketProcess: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Load ticket list from localStorage to keep it synchronized with the queue
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('l1_mock_tickets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Find target ticket or fallback
  const [ticket, setTicket] = useState<Ticket>(() => {
    const saved = localStorage.getItem('l1_mock_tickets');
    if (saved && id) {
      try {
        const list = JSON.parse(saved) as Ticket[];
        const found = list.find(t => t.id === id);
        if (found) return found;
      } catch (e) {}
    }
    return { ...DEFAULT_TICKET, id: id || DEFAULT_TICKET.id };
  });

  // System audit log
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'L-1',
      action: 'Tạo phiếu hỗ trợ',
      time: '25/05/2026 10:30:00',
      user: ticket.requesterName,
      message: 'Người dùng gửi yêu cầu thành công từ Cổng thông tin nội bộ.'
    },
    {
      id: 'L-2',
      action: 'Hệ thống phân công',
      time: '25/05/2026 10:30:05',
      user: 'Hệ thống tự động',
      message: 'Tự động gán phiếu vào hàng đợi IT L1 và khởi tạo cam kết SLA.',
      active: true
    }
  ]);

  // Comments
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'C-1',
      author: ticket.requesterName,
      role: 'Người yêu cầu',
      text: 'Máy cứ chạy Zoom bật camera lên khoảng 3 phút là tự động hiện màn hình xanh BSOD và sập nguồn.',
      date: '25/05/2026 10:32:00'
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [timeTicker, setTimeTicker] = useState(Date.now());
  const [showEscalateModal, setShowEscalateModal] = useState(false);

  // Form Escalate L2
  const [escalateReason, setEscalateReason] = useState('');
  const [escalateStepsTried, setEscalateStepsTried] = useState('');
  const [escalateFile, setEscalateFile] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Đồng hồ đếm ngược SLA
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTicker(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Đồng bộ ticket detail về danh sách tickets trong localStorage
  const updateTicketInStorage = (updatedTicket: Ticket, logEntry?: AuditLog, newCommentObj?: Comment) => {
    setTicket(updatedTicket);
    const updatedList = tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t);
    setTickets(updatedList);
    localStorage.setItem('l1_mock_tickets', JSON.stringify(updatedList));

    if (logEntry) {
      setAuditLogs(prev => [logEntry, ...prev]);
    }
    if (newCommentObj) {
      setComments(prev => [...prev, newCommentObj]);
    }
  };

  // 1. Nút "Bắt đầu xử lý"
  const handleStartProcessing = () => {
    const nowStr = new Date().toLocaleString('vi-VN');
    const updatedTicket: Ticket = {
      ...ticket,
      status: 'Pending',
      assignee: 'Nguyễn Văn Hỗ Trợ (IT L1)'
    };
    const log: AuditLog = {
      id: `L-${Date.now()}`,
      action: 'Bắt đầu xử lý',
      time: nowStr,
      user: 'Nguyễn Văn Hỗ Trợ (IT L1)',
      message: 'Kỹ thuật viên L1 tiếp nhận sự cố và bắt đầu giải quyết.',
      active: true
    };
    const comment: Comment = {
      id: `C-${Date.now()}`,
      author: 'Hệ thống',
      role: 'System',
      text: '[Cập nhật hệ thống] Kỹ thuật viên Nguyễn Văn Hỗ Trợ đã tiếp nhận và bắt đầu xử lý phiếu.',
      date: nowStr,
      isSystem: true
    };

    updateTicketInStorage(updatedTicket, log, comment);
    alert('Đã tiếp nhận ticket thành công!');
  };

  // 2. Nút "Cập nhật kết quả" (Viết bình luận mang tính kỹ thuật)
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const nowStr = new Date().toLocaleString('vi-VN');
    const commentObj: Comment = {
      id: `C-${Date.now()}`,
      author: 'Nguyễn Văn Hỗ Trợ',
      role: 'IT Support L1',
      text: newComment,
      date: nowStr
    };

    setComments(prev => [...prev, commentObj]);
    setNewComment('');
  };

  // Cập nhật kết quả nhanh (Simulation)
  const handleQuickUpdate = () => {
    const updateText = prompt('Nhập nội dung cập nhật tiến độ xử lý kỹ thuật:', 'Đã gỡ driver card đồ họa cũ và tiến hành cài đặt bản Driver ổn định nhất từ nhà sản xuất Dell.');
    if (updateText === null || !updateText.trim()) return;

    const nowStr = new Date().toLocaleString('vi-VN');
    const commentObj: Comment = {
      id: `C-${Date.now()}`,
      author: 'Nguyễn Văn Hỗ Trợ',
      role: 'IT Support L1',
      text: `[Cập nhật kỹ thuật]: ${updateText}`,
      date: nowStr
    };
    const log: AuditLog = {
      id: `L-${Date.now()}`,
      action: 'Cập nhật tiến độ',
      time: nowStr,
      user: 'Nguyễn Văn Hỗ Trợ (IT L1)',
      message: updateText
    };

    setComments(prev => [...prev, commentObj]);
    setAuditLogs(prev => [log, ...prev]);
  };

  // 3. Nút "Đánh dấu đã giải quyết" (Resolved)
  const handleMarkResolved = () => {
    const nowStr = new Date().toLocaleString('vi-VN');
    const updatedTicket: Ticket = {
      ...ticket,
      status: 'Resolved'
    };
    const log: AuditLog = {
      id: `L-${Date.now()}`,
      action: 'Đã giải quyết',
      time: nowStr,
      user: 'Nguyễn Văn Hỗ Trợ (IT L1)',
      message: 'Sự cố đã được khắc phục. Chờ người dùng xác nhận đánh giá hài lòng.',
      active: true
    };
    const comment: Comment = {
      id: `C-${Date.now()}`,
      author: 'Nguyễn Văn Hỗ Trợ',
      role: 'IT Support L1',
      text: '[Xác nhận giải quyết] Đã kiểm tra liên tục 20 phút chạy thử Zoom meeting không phát sinh lỗi BSOD. Đã đóng ứng dụng và bàn giao máy cho người dùng test.',
      date: nowStr
    };

    updateTicketInStorage(updatedTicket, log, comment);
    alert('Đã cập nhật trạng thái: Đã giải quyết!');
  };

  // 4. Modal Chuyển cấp L2 (Escalate L2)
  const handleOpenEscalateModal = () => {
    setModalError(null);
    setShowEscalateModal(true);
  };

  const handleConfirmEscalate = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    // Validate fields
    if (!escalateReason.trim()) {
      setModalError('Vui lòng nhập lý do chuyển cấp L2.');
      return;
    }
    if (!escalateStepsTried.trim()) {
      setModalError('Vui lòng nhập các bước L1 đã thử xử lý.');
      return;
    }

    const nowStr = new Date().toLocaleString('vi-VN');
    const updatedTicket: Ticket = {
      ...ticket,
      status: 'Pending',
      group: 'IT L2',
      assignee: 'Phạm Văn Mạng (IT L2)' // Assigned to L2
    };

    const log: AuditLog = {
      id: `L-${Date.now()}`,
      action: 'Chuyển cấp L2',
      time: nowStr,
      user: 'Nguyễn Văn Hỗ Trợ (IT L1)',
      message: `Chuyển cấp lên đội L2. Lý do: "${escalateReason}". Các bước đã thử: "${escalateStepsTried}".`,
      active: true
    };

    const comment: Comment = {
      id: `C-${Date.now()}`,
      author: 'Hệ thống',
      role: 'System',
      text: `[Chuyển cấp L2] Phiếu yêu cầu đã được bàn giao lên tuyến hỗ trợ L2.\n- Lý do chuyển cấp: ${escalateReason}\n- Các bước L1 đã thử: ${escalateStepsTried}${escalateFile ? `\n- File đi kèm: ${escalateFile}` : ''}`,
      date: nowStr,
      isSystem: true
    };

    updateTicketInStorage(updatedTicket, log, comment);
    setShowEscalateModal(false);
    setEscalateReason('');
    setEscalateStepsTried('');
    setEscalateFile('');
    alert('Đã chuyển cấp lên L2 thành công!');
  };

  // SLA Time Countdown Renderer
  const renderSLACountdown = () => {
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
      return <span className="sla-countdown-time" style={{ color: '#16A34A' }}>Đạt SLA ✓</span>;
    }

    const diff = ticket.slaDeadline - timeTicker;
    if (diff <= 0) {
      return <span className="sla-countdown-time danger">Quá hạn (Vi phạm)</span>;
    }

    const hours = Math.floor(diff / (3600 * 1000));
    const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
    const secs = Math.floor((diff % (60 * 1000)) / 1000);
    const pad = (num: number) => String(num).padStart(2, '0');

    const displayStr = `${pad(hours)}g ${pad(mins)}p ${pad(secs)}s`;

    if (diff < 15 * 60 * 1000) {
      return <span className="sla-countdown-time danger">{displayStr} ⚠</span>;
    } else if (diff < 2 * 3600 * 1000) {
      return <span className="sla-countdown-time warning">{displayStr}</span>;
    }
    return <span className="sla-countdown-time">{displayStr}</span>;
  };

  return (
    <div className="ticket-process-container">
      <div className="ticket-process-content">
        
        {/* Header chi tiết xử lý */}
        <div className="process-header-card">
          <div className="process-header-row">
            <button 
              type="button" 
              className="btn-action-secondary"
              onClick={() => navigate('/tickets/queue')}
              style={{
                width: 'auto',
                padding: '6px 12px',
                marginRight: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Quay lại Hàng đợi
            </button>
            <span className="ticket-id-tag">{ticket.id}</span>

            {/* Huy hiệu trạng thái */}
            {ticket.status === 'New' && <span className="badge-status-detail" style={{ backgroundColor: '#EFF6FF', color: '#1E40AF' }}>Mới tạo</span>}
            {ticket.status === 'Pending' && <span className="badge-status-detail" style={{ backgroundColor: '#FFFBEB', color: '#92400E' }}>Đang giải quyết</span>}
            {ticket.status === 'Resolved' && <span className="badge-status-detail" style={{ backgroundColor: '#ECFDF5', color: '#065F46' }}>Đã giải quyết</span>}
            {ticket.status === 'Closed' && <span className="badge-status-detail" style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>Đã đóng</span>}

            {/* Huy hiệu nhóm xử lý */}
            <span className="badge-status-detail" style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>
              Nhóm phụ trách: {ticket.group}
            </span>

            {/* Huy hiệu độ ưu tiên */}
            {ticket.priority === 'High' && <span className="badge-priority-detail" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>Ưu tiên: Cao</span>}
            {ticket.priority === 'Medium' && <span className="badge-priority-detail" style={{ backgroundColor: '#FFFBEB', color: '#F59E0B' }}>Ưu tiên: Trung bình</span>}
            {ticket.priority === 'Low' && <span className="badge-priority-detail" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>Ưu tiên: Thấp</span>}
          </div>
          <h1 className="process-ticket-title">{ticket.title}</h1>
        </div>

        {/* Layout 3 cột chính */}
        <div className="process-layout">
          
          {/* CỘT TRÁI: THÔNG TIN CHI TIẾT TICKET & NGƯỜI DÙNG */}
          <div className="left-column">
            
            {/* 1. Chi tiết sự cố */}
            <div className="process-card">
              <h3 className="process-card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                Chi tiết sự cố
              </h3>
              <div className="left-info-group">
                <div className="left-info-item">
                  <span className="left-info-label">Thiết bị / Phần mềm</span>
                  <span className="left-info-value">{ticket.deviceSoftware || 'Không khai báo'}</span>
                </div>
                <div className="left-info-item">
                  <span className="left-info-label">Thời điểm phát sinh</span>
                  <span className="left-info-value">{ticket.createdAt}</span>
                </div>
                <div className="left-info-item">
                  <span className="left-info-label">Nội dung chi tiết</span>
                  <div className="process-description-box">
                    {ticket.description}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Thông tin người dùng */}
            <div className="process-card">
              <h3 className="process-card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Thông tin người tạo
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div className="user-avatar-placeholder">
                  {ticket.requesterName.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0F172A' }}>{ticket.requesterName}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{ticket.requesterEmail}</div>
                </div>
              </div>
              <div className="left-info-group">
                <div className="left-info-item">
                  <span className="left-info-label">Phòng ban làm việc</span>
                  <span className="left-info-value">{ticket.department || 'Bộ phận Kỹ thuật / Văn phòng HCM'}</span>
                </div>
              </div>
            </div>

            {/* 3. Tệp đính kèm phiếu */}
            <div className="process-card">
              <h3 className="process-card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
                Tệp đính kèm gốc
              </h3>
              <div className="ticket-attachments-list">
                {ticket.id === 'HW-2026-0042' ? (
                  <div className="ticket-attachment-item">
                    <span className="ticket-attachment-name">anh_man_hinh_xanh.png</span>
                    <span className="ticket-attachment-size">842 KB</span>
                    <button 
                      type="button" 
                      className="btn-download-attachment"
                      onClick={() => alert('Đang tải tệp tin: anh_man_hinh_xanh.png')}
                    >
                      ⬇
                    </button>
                  </div>
                ) : (
                  <span className="attachments-empty">Không có tệp đính kèm nào.</span>
                )}
              </div>
            </div>

          </div>

          {/* CỘT GIỮA: Ô NHẬP BÌNH LUẬN PHẢN HỒI & NHẬT KÝ THAO TÁC HỆ THỐNG */}
          <div className="center-column">
            
            {/* 1. Trao đổi / Phản hồi */}
            <div className="process-card">
              <h3 className="process-card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Trao đổi, thảo luận giải quyết sự cố
              </h3>

              <div className="comments-list" style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '20px', paddingRight: '8px' }}>
                {comments.map((comment) => (
                  <div key={comment.id} className="comment-card" style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                    <div className="comment-bubble" style={{ 
                      flex: 1, 
                      backgroundColor: comment.isSystem ? '#F8FAFC' : '#EFF6FF',
                      border: comment.isSystem ? '1px dashed #CBD5E1' : '1px solid #BFDBFE',
                      borderRadius: '10px',
                      padding: '10px 14px'
                    }}>
                      <div className="comment-meta-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: 700 }}>{comment.author}</span>
                          <span className="comment-role-tag">{comment.role}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>{comment.date}</span>
                      </div>
                      <p style={{ fontSize: '13.5px', margin: 0, whiteSpace: 'pre-wrap', color: '#334155' }}>{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ô soạn thảo bình luận */}
              <form onSubmit={handlePostComment} className="comment-input-area" style={{ border: 'none', paddingTop: 0 }}>
                <textarea
                  className="comment-textarea"
                  placeholder="Gõ nội dung hướng dẫn, phản hồi hoặc yêu cầu người dùng cung cấp thông tin..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={ticket.status === 'Closed'}
                ></textarea>
                <div className="comment-actions-bar">
                  <button 
                    type="button" 
                    className="btn-comment-attach"
                    onClick={() => alert('Đính kèm file bình luận thành công.')}
                    disabled={ticket.status === 'Closed'}
                  >
                    Đính kèm tệp
                  </button>
                  <button 
                    type="submit" 
                    className="btn-comment-submit"
                    disabled={!newComment.trim() || ticket.status === 'Closed'}
                  >
                    Gửi phản hồi
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Nhật ký hoạt động (Audit Logs) */}
            <div className="process-card">
              <h3 className="process-card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Nhật ký thao tác hệ thống (Audit Trail)
              </h3>
              <div className="system-log-list">
                {auditLogs.map((log) => (
                  <div key={log.id} className="system-log-item">
                    <div className={`system-log-dot ${log.active ? 'active' : ''}`}></div>
                    <div className="system-log-body">
                      <div className="system-log-header">
                        <span className="system-log-action">{log.action}</span>
                        <span className="system-log-time">{log.time}</span>
                      </div>
                      <div className="system-log-user">Thực hiện: <strong>{log.user}</strong></div>
                      {log.message && <div className="system-log-message">{log.message}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* CỘT PHẢI: HẠN SLA & PANEL HÀNH ĐỘNG CỦA L1 */}
          <div className="right-column">
            
            {/* 1. Đếm ngược SLA */}
            <div className="sla-countdown-card">
              <div className="sla-countdown-label">Hạn SLA xử lý</div>
              {renderSLACountdown()}
              <div className="sla-countdown-desc">
                Thời gian cam kết khắc phục sự cố theo quy định quy trình IT Helpdesk công ty.
              </div>
            </div>

            {/* 2. Người xử lý */}
            <div className="sla-countdown-card">
              <div className="sla-countdown-label">Nhân viên hỗ trợ</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="user-avatar-placeholder" style={{ width: '36px', height: '36px', fontSize: '15px' }}>
                  {ticket.assignee.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700 }}>{ticket.assignee}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Tuyến giải quyết sự cố</div>
                </div>
              </div>
            </div>

            {/* 3. Panel hành động */}
            <div className="process-card">
              <h3 className="process-card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Thao tác xử lý
              </h3>

              <div className="actions-vertical-group">
                {ticket.status === 'New' && (
                  <button 
                    type="button" 
                    className="btn-action-primary"
                    onClick={handleStartProcessing}
                  >
                    Bắt đầu xử lý phiếu
                  </button>
                )}

                {ticket.status === 'Pending' && (
                  <>
                    <button 
                      type="button" 
                      className="btn-action-secondary"
                      onClick={handleQuickUpdate}
                    >
                      Cập nhật kết quả
                    </button>
                    <button 
                      type="button" 
                      className="btn-action-success"
                      onClick={handleMarkResolved}
                    >
                      Đánh dấu Đã giải quyết
                    </button>
                    <button 
                      type="button" 
                      className="btn-action-warning"
                      onClick={handleOpenEscalateModal}
                    >
                      Chuyển cấp L2
                    </button>
                  </>
                )}

                {(ticket.status === 'Resolved' || ticket.status === 'Closed') && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '12px', 
                    backgroundColor: '#F8FAFC', 
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#64748B'
                  }}>
                    Phiếu ở trạng thái chỉ xem ({ticket.status === 'Resolved' ? 'Đã giải quyết' : 'Đã đóng'})
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL CHUYỂN CẤP L2 */}
      {showEscalateModal && (
        <div className="modal-overlay">
          <form onSubmit={handleConfirmEscalate} className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">Yêu cầu chuyển cấp lên tuyến hỗ trợ L2</h3>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowEscalateModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Lý do chuyển cấp L2 <span style={{ color: '#DC2626' }}>*</span></label>
                <textarea
                  className="modal-textarea"
                  placeholder="Ghi rõ lý do không giải quyết được (Ví dụ: Lỗi liên quan đến quyền truy cập AD Server hoặc lỗi phần cứng cần thay thế linh kiện...)"
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                ></textarea>
              </div>

              <div className="modal-field">
                <label className="modal-label">Các bước L1 đã thử xử lý <span style={{ color: '#DC2626' }}>*</span></label>
                <textarea
                  className="modal-textarea"
                  placeholder="Mô tả cụ thể các giải pháp L1 đã thực hiện (Ví dụ: Đã cài lại phần mềm, đã restart máy nhưng không hết...)"
                  value={escalateStepsTried}
                  onChange={(e) => setEscalateStepsTried(e.target.value)}
                ></textarea>
              </div>

              <div className="modal-field">
                <label className="modal-label">Đính kèm tệp tin tài liệu (nếu có)</label>
                <input 
                  type="text" 
                  className="modal-input" 
                  placeholder="Tên tệp tin đính kèm (Ví dụ: log_chi_tiet.txt)"
                  value={escalateFile}
                  onChange={(e) => setEscalateFile(e.target.value)}
                />
              </div>

              {modalError && (
                <div className="modal-error">
                  ⚠ {modalError}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-modal-cancel"
                onClick={() => setShowEscalateModal(false)}
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                className="btn-modal-submit"
              >
                Xác nhận chuyển cấp
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
