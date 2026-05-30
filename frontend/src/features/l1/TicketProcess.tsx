import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TicketProcess.css';
import { ticketService } from '../../services/ticket.service';
import axiosInstance from '../../libs/axios';

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
  attachments?: any[];
}

export const TicketProcess: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [timeTicker, setTimeTicker] = useState(Date.now());
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form Escalate L2
  const [escalateReason, setEscalateReason] = useState('');
  const [escalateStepsTried, setEscalateStepsTried] = useState('');
  const [escalateFile, setEscalateFile] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);

  const loadTicketData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await ticketService.getTicketDetail(Number(id));
      if (response.success && response.data) {
        const data = response.data;
        
        let priorityMapped: 'Low' | 'Medium' | 'High' = 'Medium';
        if (data.muc_do_uu_tien === 'CAO') priorityMapped = 'High';
        else if (data.muc_do_uu_tien === 'THAP') priorityMapped = 'Low';

        let statusMapped: 'New' | 'Pending' | 'Resolved' | 'Closed' = 'New';
        if (data.trang_thai === 'DANG_GIAI_QUYET') statusMapped = 'Pending';
        else if (data.trang_thai === 'DA_GIAI_QUYET') statusMapped = 'Resolved';
        else if (data.trang_thai === 'DA_DONG') statusMapped = 'Closed';

        const slaXuLy = data.danh_sach_sla?.find((s: any) => s.loai_sla === 'XU_LY');
        const slaDeadline = slaXuLy ? new Date(slaXuLy.han_chot).getTime() : Date.now();

        setTicket({
          id: String(data.phieu_ho_tro_id),
          title: data.tieu_de,
          requesterName: data.nguoi_tao?.ho_ten || '',
          requesterEmail: data.nguoi_tao?.email || '',
          department: (data.nguoi_tao as any)?.phong_ban?.ten_phong_ban || 'Bộ phận Kỹ thuật',
          deviceSoftware: '', 
          status: statusMapped,
          priority: priorityMapped,
          slaDeadline,
          assignee: data.nguoi_ho_tro?.ho_ten || 'Chưa phân công',
          group: data.nhom_xu_ly?.ten_nhom?.includes('L2') ? 'IT L2' : 'IT L1',
          createdAt: new Date(data.ngay_tao).toLocaleString('vi-VN'),
          description: data.mo_ta_chi_tiet,
          isReopened: data.so_lan_mo_lai > 0,
          attachments: data.danh_sach_file?.map((f: any) => ({
            name: f.ten_tep,
            size: `${f.dung_luong_kb} KB`,
            duong_dan_file: f.duong_dan_file
          }))
        });

        // comments
        const commentsMapped = (data.danh_sach_bl || []).map((c: any) => ({
          id: String(c.binh_luan_id),
          author: c.nguoi_gui?.ho_ten || 'Unknown',
          role: c.nguoi_gui?.vai_tro?.ma_vai_tro === 'NGUOI_YEU_CAU' ? 'Người yêu cầu' : 'IT Support',
          text: c.noi_dung,
          date: new Date(c.ngay_tao).toLocaleString('vi-VN'),
          isSystem: c.loai_binh_luan === 'CHUYEN_CAP'
        }));
        setComments(commentsMapped);

        // timeline (audit logs)
        const logsMapped = (data.danh_sach_log || []).map((l: any, idx: number) => ({
          id: String(l.lich_su_id),
          action: l.hanh_dong,
          time: new Date(l.ngay_thuc_hien).toLocaleString('vi-VN'),
          user: l.nguoi_thuc_hien?.ho_ten || 'Hệ thống',
          message: l.ghi_chu || `${l.hanh_dong} (Từ: "${l.gia_tri_cu || ''}" Sang: "${l.gia_tri_moi || ''}")`,
          active: idx === ((data.danh_sach_log || []).length - 1)
        }));
        setAuditLogs(logsMapped.reverse()); // Show latest first
      }
    } catch (err) {
      console.error('Failed to load ticket process detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTicketData();
  }, [id]);

  // Đồng hồ đếm ngược SLA
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTicker(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Nút "Bắt đầu xử lý"
  const handleStartProcessing = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await ticketService.updateStatus(Number(id), 'DANG_GIAI_QUYET', 'Kỹ thuật viên tiếp nhận sự cố và bắt đầu giải quyết.');
      if (response.success) {
        alert('Đã tiếp nhận và bắt đầu xử lý ticket thành công!');
        await loadTicketData();
      } else {
        alert(response.message || 'Tiếp nhận ticket thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Không thể tiếp nhận ticket.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Nút "Gửi phản hồi" (Viết bình luận mang tính kỹ thuật / public)
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;

    setIsLoading(true);
    try {
      const response = await ticketService.addComment(Number(id), newComment, 'public');
      if (response.success) {
        await loadTicketData();
        setNewComment('');
      } else {
        alert(response.message || 'Gửi phản hồi thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Không thể gửi phản hồi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cập nhật kết quả nhanh (Simulation / Internal Comment)
  const handleQuickUpdate = async () => {
    const updateText = prompt('Nhập nội dung cập nhật tiến độ xử lý kỹ thuật:', 'Đã gỡ driver card đồ họa cũ và tiến hành cài đặt bản Driver ổn định nhất từ nhà sản xuất Dell.');
    if (updateText === null || !updateText.trim() || !id) return;

    setIsLoading(true);
    try {
      const response = await ticketService.addComment(Number(id), `[Cập nhật kỹ thuật]: ${updateText}`, 'internal');
      if (response.success) {
        alert('Đã cập nhật tiến độ kỹ thuật!');
        await loadTicketData();
      } else {
        alert(response.message || 'Cập nhật tiến độ thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Không thể cập nhật tiến độ.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Nút "Đánh dấu đã giải quyết" (Resolved)
  const handleMarkResolved = async () => {
    if (!id) return;
    const notes = prompt('Nhập ghi chú kết quả giải quyết:', 'Đã xử lý xong lỗi.');
    if (notes === null) return; // Cancel

    setIsLoading(true);
    try {
      const response = await ticketService.updateStatus(Number(id), 'DA_GIAI_QUYET', notes || 'IT Support đã giải quyết sự cố.');
      if (response.success) {
        alert('Đã cập nhật trạng thái: Đã giải quyết!');
        await loadTicketData();
      } else {
        alert(response.message || 'Cập nhật trạng thái thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Không thể đánh dấu giải quyết.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Modal Chuyển cấp L2 (Escalate L2)
  const handleOpenEscalateModal = () => {
    setModalError(null);
    setShowEscalateModal(true);
  };

  const handleConfirmEscalate = async (e: React.FormEvent) => {
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

    setIsLoading(true);
    try {
      const response = await ticketService.escalateTicket(Number(id), escalateReason, escalateStepsTried);
      if (response.success) {
        alert('Đã chuyển cấp lên tuyến hỗ trợ L2 thành công!');
        setShowEscalateModal(false);
        setEscalateReason('');
        setEscalateStepsTried('');
        setEscalateFile('');
        await loadTicketData();
      } else {
        setModalError(response.message || 'Chuyển cấp thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Không thể chuyển cấp ticket.');
    } finally {
      setIsLoading(false);
    }
  };

  // SLA Time Countdown Renderer
  const renderSLACountdown = () => {
    if (!ticket) return null;
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

  if (!ticket) {
    return (
      <div className="ticket-process-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="spinner-inline" style={{ width: '32px', height: '32px', borderWidth: '3px' }}></span>
          <p style={{ marginTop: '12px', color: '#64748B', fontWeight: 500 }}>Đang tải thông tin xử lý sự cố...</p>
        </div>
      </div>
    );
  }

  const getFileUrl = (filePath: string) => {
    const base = axiosInstance.defaults.baseURL || 'http://localhost:3000/api/v1';
    const origin = base.replace('/api/v1', '');
    return `${origin}${filePath}`;
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
                {ticket.attachments && ticket.attachments.length > 0 ? (
                  ticket.attachments.map((file: any, fileIdx: number) => (
                    <div key={fileIdx} className="ticket-attachment-item">
                      <span className="ticket-attachment-name">{file.name}</span>
                      <span className="ticket-attachment-size">{file.size}</span>
                      <a
                        href={getFileUrl(file.duong_dan_file || file.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-download-attachment"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                        title="Tải xuống tệp"
                      >
                        ⬇
                      </a>
                    </div>
                  ))
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
                    disabled={!newComment.trim() || ticket.status === 'Closed' || isLoading}
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
                    disabled={isLoading}
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
                      disabled={isLoading}
                    >
                      Cập nhật kết quả
                    </button>
                    <button 
                      type="button" 
                      className="btn-action-success"
                      onClick={handleMarkResolved}
                      disabled={isLoading}
                    >
                      Đánh dấu Đã giải quyết
                    </button>
                    <button 
                      type="button" 
                      className="btn-action-warning"
                      onClick={handleOpenEscalateModal}
                      disabled={isLoading}
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
                disabled={isLoading}
              >
                {isLoading ? 'Đang chuyển cấp...' : 'Xác nhận chuyển cấp'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
