import React, { useState, useEffect } from 'react';
import './L2Workplace.css';

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
  slaDeadline: number;
  assignee: string;
  group: 'IT L1' | 'IT L2';
  createdAt: string;
  description: string;
  isReopened?: boolean;
  // L2 fields
  escalateReason?: string;
  escalateStepsTried?: string;
  escalateFile?: string;
  attempts?: number;
  rootCause?: string;
  techNotes?: string;
  managerEscalated?: boolean;
}

const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'HW-2026-0042',
    title: 'Hỗ trợ lỗi màn hình xanh (BSOD) khi đang họp Zoom',
    requesterName: 'Nguyễn Văn A',
    requesterEmail: 'user@company.com',
    department: 'Bộ phận Thiết kế (Văn phòng HCM)',
    deviceSoftware: 'Laptop Dell Latitude 7420 / Windows 11 Pro',
    priority: 'High',
    status: 'Pending',
    slaDeadline: Date.now() + 2 * 3600 * 1000 + 14 * 60 * 1000,
    assignee: 'Phạm Văn Mạng (IT L2)',
    group: 'IT L2',
    createdAt: '2026-05-25',
    description: 'Tôi đang sử dụng ứng dụng Zoom để họp với đối tác thì máy tính bỗng nhiên hiển thị màn hình xanh chết chóc (BSOD) với mã lỗi WHEA_UNCORRECTABLE_ERROR. Hiện tại máy khởi động lại rất chậm và thường xuyên bị treo sau 5-10 phút sử dụng.',
    escalateReason: 'Lỗi liên quan đến xung đột driver đồ họa cấp thấp khi Zoom gọi camera. Đã thử cập nhật driver đồ họa cơ bản nhưng vẫn crash.',
    escalateStepsTried: 'Cài lại Zoom, cài driver Intel HD Graphics, kiểm tra RAM bằng MemTest86.',
    escalateFile: 'zoom_crash_dump.log',
    attempts: 1
  },
  {
    id: 'NW-2026-0041',
    title: 'Không kết nối được vào mạng Wifi Office_HCM_5G',
    requesterName: 'Lê Văn Mạng',
    requesterEmail: 'mangled@company.com',
    department: 'Phòng ban Kinh doanh (Văn phòng HCM)',
    deviceSoftware: 'Mạng Wifi văn phòng HCM',
    priority: 'High',
    status: 'Pending',
    slaDeadline: Date.now() + 4 * 60 * 1000 + 12 * 1000,
    assignee: 'Phạm Văn Mạng (IT L2)',
    group: 'IT L2',
    createdAt: '2026-05-25',
    description: 'Từ sáng nay tôi không thể kết nối vào mạng Wifi Office_HCM_5G của văn phòng HCM. Máy báo lỗi "Incorrect Password" mặc dù tôi đã nhập đúng mật khẩu nội bộ mới nhất.',
    escalateReason: 'Có dấu hiệu nhiễu sóng hoặc lỗi xác thực RADIUS cấp độ sâu hơn trên Controller mạng văn phòng HCM.',
    escalateStepsTried: 'Khởi động lại Access Point cục bộ, kiểm tra kết nối DHCP cho laptop.',
    escalateFile: 'radius_auth_failure.txt',
    attempts: 2
  },
  {
    id: 'SW-2026-0050',
    title: 'Hệ thống CRM mất kết nối Cơ sở dữ liệu Postgres khẩn cấp',
    requesterName: 'Trần Văn Database',
    requesterEmail: 'db_admin@company.com',
    department: 'Bộ phận Hệ thống Cloud (Văn phòng HN)',
    deviceSoftware: 'Server PostgreSQL / CRM',
    priority: 'High',
    status: 'Pending',
    slaDeadline: Date.now() + 10 * 3600 * 1000,
    assignee: 'Chưa phân công L2',
    group: 'IT L2',
    createdAt: '2026-05-25',
    description: 'Hệ thống CRM báo lỗi Connection Timeout liên tục khi truy vấn cơ sở dữ liệu PostgreSQL. Cần L2 kiểm tra xem DB Master có bị quá tải hoặc lỗi replication không.',
    escalateReason: 'L1 không có quyền truy cập vào Server Database Master để restart service hoặc kiểm tra dung lượng ổ đĩa.',
    escalateStepsTried: 'Ping server database, kiểm tra telnet port 5432.',
    attempts: 3
  }
];

export const L2Workplace: React.FC = () => {
  // Đồng bộ với localStorage mock database chung
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('l1_mock_tickets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    // Nếu chưa có database chung, lưu INITIAL_TICKETS của L2 vào
    localStorage.setItem('l1_mock_tickets', JSON.stringify(INITIAL_TICKETS));
    return INITIAL_TICKETS;
  });

  // State điều hướng nội bộ
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // States Hàng đợi L2
  const [activeTab, setActiveTab] = useState<'new_escalated' | 'processing' | 'critical' | 'manager_review'>('new_escalated');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [filterTime, setFilterTime] = useState<string>('All');

  // Time Ticker
  const [timeTicker, setTimeTicker] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTicker(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Chi tiết ticket được chọn xử lý
  const activeTicket = tickets.find(t => t.id === selectedTicketId);

  // States Nghiệp vụ L2 (Khi ở chế độ xem chi tiết)
  const [rootCause, setRootCause] = useState('');
  const [techNotes, setTechNotes] = useState('');
  const [attempts, setAttempts] = useState(1);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // States Modal Tạo bài viết tri thức (UC-10)
  const [showKbModal, setShowKbModal] = useState(false);
  const [kbTitle, setKbTitle] = useState('');
  const [kbCategory, setKbCategory] = useState('Phần mềm');
  const [kbContent, setKbContent] = useState('');
  const [kbError, setKbError] = useState<string | null>(null);

  // Mỗi khi chọn ticket chi tiết, đồng bộ các trường nghiệp vụ
  useEffect(() => {
    if (activeTicket) {
      setRootCause(activeTicket.rootCause || '');
      setTechNotes(activeTicket.techNotes || '');
      setAttempts(activeTicket.attempts || 1);

      // Cấu hình log & bình luận giả lập cho ticket đó
      setComments([
        {
          id: 'C-L1-1',
          author: activeTicket.requesterName,
          role: 'Người yêu cầu',
          text: activeTicket.description,
          date: activeTicket.createdAt + ' 10:30:00'
        },
        {
          id: 'C-L2-1',
          author: 'Hệ thống',
          role: 'System',
          text: `[Chuyển cấp L2] Yêu cầu được bàn giao từ L1 lên tuyến L2.\n- Lý do: ${activeTicket.escalateReason || 'Chuyển xử lý nâng cao.'}\n- Các bước đã thử: ${activeTicket.escalateStepsTried || 'Chưa thực hiện.'}`,
          date: activeTicket.createdAt + ' 10:45:00',
          isSystem: true
        }
      ]);

      setAuditLogs([
        {
          id: 'L-L2-1',
          action: 'Tiếp nhận L2',
          time: activeTicket.createdAt + ' 10:45:00',
          user: activeTicket.assignee || 'Đội L2 Support',
          message: 'Hồ sơ đã được cập nhật sang nhóm L2.',
          active: true
        },
        {
          id: 'L-L1-1',
          action: 'Tạo phiếu',
          time: activeTicket.createdAt + ' 10:30:00',
          user: activeTicket.requesterName,
          message: 'CBNV gửi phiếu hỗ trợ.'
        }
      ]);
    }
  }, [selectedTicketId]);

  // Bộ lọc danh sách L2
  const getFilteredTickets = () => {
    return tickets.filter(t => {
      // Chỉ hiện các ticket thuộc nhóm IT L2
      if (t.group !== 'IT L2') return false;

      // 1. Phân loại theo Tabs L2
      if (activeTab === 'new_escalated') {
        // Mới chuyển cấp: chưa phân công cụ thể L2 hoặc assignee = 'Chưa phân công L2'
        if (t.status !== 'Pending' && t.status !== 'New') return false;
        if (t.assignee !== 'Chưa phân công L2' && t.assignee === '') return false;
      } else if (activeTab === 'processing') {
        // Đang xử lý: L2 đã nhận việc (assignee !== 'Chưa phân công L2')
        if (t.status !== 'Pending') return false;
        if (t.assignee === 'Chưa phân công L2') return false;
      } else if (activeTab === 'critical') {
        // Sự cố nghiêm trọng: Priority High & chưa giải quyết
        if (t.priority !== 'High') return false;
        if (t.status === 'Resolved' || t.status === 'Closed') return false;
      } else if (activeTab === 'manager_review') {
        // Chờ quản lý xem xét: attempts >= 3 hoặc managerEscalated = true
        const att = t.attempts || 1;
        if (att < 3 && !t.managerEscalated) return false;
        if (t.status === 'Resolved' || t.status === 'Closed') return false;
      }

      // 2. Bộ lọc Priority
      if (filterPriority !== 'All' && t.priority !== filterPriority) return false;

      // 3. Bộ lọc Time
      if (filterTime !== 'All') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (filterTime === 'Today' && t.createdAt !== todayStr) return false;
      }

      return true;
    });
  };

  const filteredTickets = getFilteredTickets();

  // Đếm số lượng ticket trên mỗi tab
  const getTabCounts = (tabName: typeof activeTab) => {
    return tickets.filter(t => {
      if (t.group !== 'IT L2') return false;
      if (tabName === 'new_escalated') {
        return (t.status === 'Pending' || t.status === 'New') && (t.assignee === 'Chưa phân công L2' || t.assignee === '');
      }
      if (tabName === 'processing') {
        return t.status === 'Pending' && t.assignee !== 'Chưa phân công L2' && t.assignee !== '';
      }
      if (tabName === 'critical') {
        return t.priority === 'High' && t.status !== 'Resolved' && t.status !== 'Closed';
      }
      if (tabName === 'manager_review') {
        const att = t.attempts || 1;
        return (att >= 3 || !!t.managerEscalated) && t.status !== 'Resolved' && t.status !== 'Closed';
      }
      return false;
    }).length;
  };

  // Cập nhật ticket trong database
  const saveTicketChanges = (updated: Ticket, log?: AuditLog, comment?: Comment) => {
    const list = tickets.map(t => t.id === updated.id ? updated : t);
    setTickets(list);
    localStorage.setItem('l1_mock_tickets', JSON.stringify(list));

    if (log) setAuditLogs(prev => [log, ...prev]);
    if (comment) setComments(prev => [...prev, comment]);
  };

  // Nghiệp vụ L2: Bấm nút "Cập nhật kết quả"
  const handleUpdateResults = () => {
    if (!activeTicket) return;
    const nowStr = new Date().toLocaleString('vi-VN');

    const updated: Ticket = {
      ...activeTicket,
      rootCause,
      techNotes,
      attempts
    };

    const log: AuditLog = {
      id: `L-${Date.now()}`,
      action: 'Cập nhật nghiệp vụ L2',
      time: nowStr,
      user: 'Phạm Văn Mạng (IT L2)',
      message: `Cập nhật Nguyên nhân gốc: "${rootCause || 'Chưa rõ'}". Số lần thử giải quyết: ${attempts}.`
    };

    const comment: Comment = {
      id: `C-${Date.now()}`,
      author: 'Phạm Văn Mạng',
      role: 'IT Support L2',
      text: `[IT L2 Cập nhật]: Đã tiến hành thử giải quyết lần thứ ${attempts}. Ghi nhận tiến độ xử lý kỹ thuật mới.`,
      date: nowStr
    };

    saveTicketChanges(updated, log, comment);
    alert('Đã cập nhật tiến độ xử lý và số lần thử của L2 thành công!');
  };

  // Nghiệp vụ L2: "Đánh dấu đã giải quyết" (Resolved)
  const handleMarkResolved = () => {
    if (!activeTicket) return;

    // Bắt buộc nhập nguyên nhân gốc
    if (!rootCause.trim()) {
      alert('Lỗi: Yêu cầu nhập "Nguyên nhân gốc" trước khi đánh dấu giải quyết phiếu!');
      return;
    }

    const nowStr = new Date().toLocaleString('vi-VN');
    const updated: Ticket = {
      ...activeTicket,
      status: 'Resolved',
      rootCause,
      techNotes,
      attempts
    };

    const log: AuditLog = {
      id: `L-${Date.now()}`,
      action: 'Đã giải quyết (L2)',
      time: nowStr,
      user: 'Phạm Văn Mạng (IT L2)',
      message: `Đã khắc phục xong sự cố. Nguyên nhân gốc: ${rootCause}.`,
      active: true
    };

    const comment: Comment = {
      id: `C-${Date.now()}`,
      author: 'Phạm Văn Mạng',
      role: 'IT Support L2',
      text: `[Xác nhận khắc phục] Sự cố đã được xử lý thành công ở tuyến L2.\n- Nguyên nhân gốc: ${rootCause}\n- Giải pháp: ${techNotes || 'Đã cấu hình lại thông số hệ thống.'}`,
      date: nowStr
    };

    saveTicketChanges(updated, log, comment);
    alert('Đã giải quyết thành công sự cố nâng cao!');
  };

  // Nghiệp vụ L2: "Báo quản lý IT" (Khẩn cấp)
  const handleEscalateToManager = () => {
    if (!activeTicket) return;
    const nowStr = new Date().toLocaleString('vi-VN');

    const updated: Ticket = {
      ...activeTicket,
      managerEscalated: true
    };

    const log: AuditLog = {
      id: `L-${Date.now()}`,
      action: 'Báo cáo Quản lý IT',
      time: nowStr,
      user: 'Phạm Văn Mạng (IT L2)',
      message: 'Gửi cảnh báo khẩn cấp lên Quản lý IT do sự cố nghiêm trọng hoặc đã thử quá 3 lần.',
      active: true
    };

    const comment: Comment = {
      id: `C-${Date.now()}`,
      author: 'Hệ thống',
      role: 'System',
      text: `[Cảnh báo Khẩn] Sự cố đã được chuyển tiếp báo cáo trực tiếp đến Quản lý IT xem xét duyệt phương án xử lý cuối cùng.`,
      date: nowStr,
      isSystem: true
    };

    saveTicketChanges(updated, log, comment);
    alert('Đã phát đi cảnh báo khẩn cấp tới Quản lý IT!');
  };

  // Gửi bình luận thủ công ở hộp thảo luận
  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const nowStr = new Date().toLocaleString('vi-VN');
    const commentObj: Comment = {
      id: `C-${Date.now()}`,
      author: 'Phạm Văn Mạng',
      role: 'IT Support L2',
      text: newComment,
      date: nowStr
    };

    setComments(prev => [...prev, commentObj]);
    setNewComment('');
  };

  // Mở modal tạo KB
  const handleOpenKbModal = () => {
    if (!activeTicket) return;
    setKbError(null);
    setKbTitle(`Hướng dẫn xử lý: ${activeTicket.title}`);
    setKbContent(`Mã sự cố liên quan: ${activeTicket.id}\n\n1. TRIỆU CHỨNG LỖI:\n- ${activeTicket.description}\n\n2. NGUYÊN NHÂN GỐC:\n- ${rootCause}\n\n3. HƯỚNG DẪN KHẮC PHỤC CHI TIẾT:\n- ${techNotes || 'Cấu hình lại các tham số liên quan trên hệ thống.'}`);
    setShowKbModal(true);
  };

  // Xác nhận tạo KB
  const handleConfirmKbPublish = (e: React.FormEvent) => {
    e.preventDefault();
    setKbError(null);

    if (!kbTitle.trim()) {
      setKbError('Vui lòng nhập tiêu đề bài viết tri thức.');
      return;
    }
    if (!kbContent.trim()) {
      setKbError('Vui lòng nhập nội dung giải pháp tri thức.');
      return;
    }

    const nowStr = new Date().toLocaleString('vi-VN');

    // Thêm log vào hệ thống
    const log: AuditLog = {
      id: `L-${Date.now()}`,
      action: 'Soạn thảo tri thức (UC-10)',
      time: nowStr,
      user: 'Phạm Văn Mạng (IT L2)',
      message: `Đã xuất bản bài viết tri thức mới: "${kbTitle}" dựa trên kết quả xử lý của ticket.`
    };

    if (activeTicket) {
      saveTicketChanges(activeTicket, log);
    }

    setShowKbModal(false);
    alert('Đã xuất bản bài viết tri thức mới thành công lên Cơ sở tri thức (Knowledge Base)!');
  };

  // Hạn SLA đếm ngược
  const renderSLACountdown = (ticketObj: Ticket) => {
    if (ticketObj.status === 'Resolved' || ticketObj.status === 'Closed') {
      return <span className="sla-countdown-time" style={{ color: '#16A34A' }}>Đạt SLA ✓</span>;
    }
    const diff = ticketObj.slaDeadline - timeTicker;
    if (diff <= 0) {
      return <span className="sla-countdown-time danger" style={{ fontSize: '24px' }}>Quá hạn (Vi phạm)</span>;
    }
    const hours = Math.floor(diff / (3600 * 1000));
    const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
    const secs = Math.floor((diff % (60 * 1000)) / 1000);
    const pad = (num: number) => String(num).padStart(2, '0');
    return (
      <span className="sla-countdown-time" style={{ color: diff < 15 * 60 * 1000 ? '#DC2626' : '#D97706', fontSize: '24px' }}>
        {pad(hours)}g {pad(mins)}p {pad(secs)}s
      </span>
    );
  };

  return (
    <div className="l2-container">
      <div className="l2-content">
        
        {/* CHẾ ĐỘ 1: HÀNG ĐỢI L2 (Nếu chưa chọn ticket) */}
        {!selectedTicketId ? (
          <>
            <div className="l2-header-card">
              <h1 className="l2-title">Không gian làm việc nâng cao L2 Support</h1>
              <p className="l2-subtitle">
                Tiếp nhận các yêu cầu chuyển cấp từ L1, giải quyết các sự cố nghiêm trọng và đóng góp tài liệu tri thức.
              </p>
            </div>

            {/* Bộ lọc Hàng đợi */}
            <div className="queue-filters-card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div className="filter-group" style={{ flex: 1, minWidth: '200px' }}>
                  <label className="filter-label">Mức độ ưu tiên</label>
                  <select 
                    className="filter-select"
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                  >
                    <option value="All">Tất cả độ ưu tiên</option>
                    <option value="High">Cao</option>
                    <option value="Medium">Trung bình</option>
                    <option value="Low">Thấp</option>
                  </select>
                </div>
                <div className="filter-group" style={{ flex: 1, minWidth: '200px' }}>
                  <label className="filter-label">Thời gian phát sinh</label>
                  <select 
                    className="filter-select"
                    value={filterTime}
                    onChange={(e) => setFilterTime(e.target.value)}
                  >
                    <option value="All">Tất cả thời gian</option>
                    <option value="Today">Hôm nay</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabs Hàng đợi L2 */}
            <div className="l2-tabs">
              <button
                type="button"
                className={`l2-tab-btn tab-escalated ${activeTab === 'new_escalated' ? 'active' : ''}`}
                onClick={() => setActiveTab('new_escalated')}
              >
                Phiếu chuyển cấp mới
                <span className="l2-tab-badge">{getTabCounts('new_escalated')}</span>
              </button>

              <button
                type="button"
                className={`l2-tab-btn tab-processing ${activeTab === 'processing' ? 'active' : ''}`}
                onClick={() => setActiveTab('processing')}
              >
                Đang xử lý
                <span className="l2-tab-badge">{getTabCounts('processing')}</span>
              </button>

              <button
                type="button"
                className={`l2-tab-btn tab-critical ${activeTab === 'critical' ? 'active' : ''}`}
                onClick={() => setActiveTab('critical')}
              >
                🚨 Sự cố nghiêm trọng
                <span className="l2-tab-badge" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>{getTabCounts('critical')}</span>
              </button>

              <button
                type="button"
                className={`l2-tab-btn tab-manager ${activeTab === 'manager_review' ? 'active' : ''}`}
                onClick={() => setActiveTab('manager_review')}
              >
                Chờ quản lý xem xét
                <span className="l2-tab-badge" style={{ backgroundColor: '#FFFBEB', color: '#D97706' }}>{getTabCounts('manager_review')}</span>
              </button>
            </div>

            {/* Bảng Hàng đợi L2 */}
            <div className="queue-table-card">
              {filteredTickets.length > 0 ? (
                <table className="queue-table">
                  <thead>
                    <tr>
                      <th>Mã Ticket</th>
                      <th>Tiêu đề phiếu yêu cầu</th>
                      <th>Người tạo</th>
                      <th>Mức độ ưu tiên</th>
                      <th>Trạng thái</th>
                      <th>Hạn xử lý SLA</th>
                      <th>Số lần thử</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((t) => {
                      const att = t.attempts || 1;
                      return (
                        <tr key={t.id}>
                          <td>
                            <button
                              type="button"
                              className="queue-ticket-id"
                              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                              onClick={() => setSelectedTicketId(t.id)}
                            >
                              {t.id}
                            </button>
                          </td>
                          <td>
                            <div className="queue-ticket-title" style={{ maxWidth: '300px' }} title={t.title}>
                              {t.title}
                            </div>
                          </td>
                          <td>{t.requesterName}</td>
                          <td>
                            {t.priority === 'High' && (
                              <span className="badge-priority" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>Cao</span>
                            )}
                            {t.priority === 'Medium' && (
                              <span className="badge-priority" style={{ backgroundColor: '#FFFBEB', color: '#F59E0B' }}>Trung bình</span>
                            )}
                            {t.priority === 'Low' && (
                              <span className="badge-priority" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>Thấp</span>
                            )}
                          </td>
                          <td>
                            {t.status === 'New' && <span className="badge-status" style={{ backgroundColor: '#EFF6FF', color: '#1E40AF' }}>Mới tạo</span>}
                            {t.status === 'Pending' && <span className="badge-status" style={{ backgroundColor: '#FFFBEB', color: '#92400E' }}>Đang giải quyết</span>}
                            {t.status === 'Resolved' && <span className="badge-status" style={{ backgroundColor: '#ECFDF5', color: '#065F46' }}>Đã giải quyết</span>}
                            {t.status === 'Closed' && <span className="badge-status" style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>Đã đóng</span>}
                          </td>
                          <td>{renderSLACountdown(t)}</td>
                          <td>
                            <span style={{ 
                              fontWeight: 700, 
                              color: att >= 3 ? '#DC2626' : '#475569', 
                              backgroundColor: att >= 3 ? '#FEF2F2' : '#F1F5F9', 
                              padding: '2px 8px', 
                              borderRadius: '4px' 
                            }}>
                              Lần thử: {att}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <h3 className="empty-state-title">Không tìm thấy kết quả phù hợp</h3>
                  <p className="empty-state-desc">
                    Không có phiếu hỗ trợ chuyển cấp nào khớp với bộ lọc L2.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* CHẾ ĐỘ 2: CHI TIẾT XỬ LÝ NÂNG CAO L2 */
          activeTicket && (
            <>
              <div className="l2-header-card">
                <div className="l2-header-row">
                  <button 
                    type="button" 
                    className="btn-action-secondary"
                    onClick={() => setSelectedTicketId(null)}
                    style={{
                      width: 'auto',
                      padding: '6px 12px',
                      marginRight: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    ⬅ Quay lại Hàng đợi L2
                  </button>
                  <span className="ticket-id-tag">{activeTicket.id}</span>
                  
                  {activeTicket.status === 'New' && <span className="badge-status-detail" style={{ backgroundColor: '#EFF6FF', color: '#1E40AF' }}>Mới tạo</span>}
                  {activeTicket.status === 'Pending' && <span className="badge-status-detail" style={{ backgroundColor: '#FFFBEB', color: '#92400E' }}>Đang giải quyết</span>}
                  {activeTicket.status === 'Resolved' && <span className="badge-status-detail" style={{ backgroundColor: '#ECFDF5', color: '#065F46' }}>Đã giải quyết</span>}
                  {activeTicket.status === 'Closed' && <span className="badge-status-detail" style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>Đã đóng</span>}

                  {activeTicket.priority === 'High' && <span className="badge-priority-detail" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>Ưu tiên: Cao</span>}
                  {activeTicket.priority === 'Medium' && <span className="badge-priority-detail" style={{ backgroundColor: '#FFFBEB', color: '#F59E0B' }}>Ưu tiên: Trung bình</span>}
                  {activeTicket.priority === 'Low' && <span className="badge-priority-detail" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>Ưu tiên: Thấp</span>}

                  {activeTicket.managerEscalated && (
                    <span className="badge-status-detail" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
                      🚨 Đang báo cáo Quản lý IT
                    </span>
                  )}
                </div>
                <h1 className="process-ticket-title">{activeTicket.title}</h1>
              </div>

              {/* Layout 3 cột */}
              <div className="l2-layout">
                
                {/* CỘT TRÁI: THÔNG TIN CHI TIẾT & LỊCH SỬ L1 */}
                <div className="left-column">
                  
                  {/* Chi tiết sự cố */}
                  <div className="l2-card">
                    <h3 className="l2-card-title">
                      🔍 Nội dung yêu cầu gốc
                    </h3>
                    <div className="left-info-group">
                      <div className="left-info-item">
                        <span className="left-info-label">Thiết bị / Phần mềm</span>
                        <span className="left-info-value">{activeTicket.deviceSoftware}</span>
                      </div>
                      <div className="left-info-item">
                        <span className="left-info-label">Chi tiết sự cố</span>
                        <div className="process-description-box" style={{ fontSize: '13px' }}>
                          {activeTicket.description}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lịch sử từ L1 (Bắt buộc hiển thị lý do chuyển cấp và các bước đã thử) */}
                  <div className="l2-card">
                    <h3 className="l2-card-title">
                      ⏳ Nhật ký bàn giao từ tuyến L1
                    </h3>
                    <div className="l1-history-box">
                      <h4 className="l1-history-title">
                        <span>ℹ</span> Thông tin chuyển cấp kỹ thuật L1
                      </h4>
                      <div className="l1-history-item">
                        <span className="l1-history-label">Lý do chuyển cấp L2:</span>
                        <div className="l1-history-value">
                          {activeTicket.escalateReason || 'Chuyển xử lý do quá thẩm quyền hỗ trợ L1.'}
                        </div>
                      </div>
                      <div className="l1-history-item">
                        <span className="l1-history-label">Các bước L1 đã thử xử lý:</span>
                        <div className="l1-history-value">
                          {activeTicket.escalateStepsTried || 'Đã kiểm tra sơ bộ phần mềm, reset thiết bị nhưng không khắc phục thành công.'}
                        </div>
                      </div>
                      {activeTicket.escalateFile && (
                        <div className="l1-history-item" style={{ marginTop: '8px', borderTop: '1px dashed #BFDBFE', paddingTop: '8px' }}>
                          <span className="l1-history-label">Tệp log đi kèm L1:</span>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1E40AF' }}>
                            📁 {activeTicket.escalateFile}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Thông tin người dùng */}
                  <div className="l2-card">
                    <h3 className="l2-card-title">
                      👤 Người tạo phiếu
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="user-avatar-placeholder" style={{ width: '36px', height: '36px', fontSize: '15px' }}>
                        {activeTicket.requesterName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700 }}>{activeTicket.requesterName}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748B' }}>{activeTicket.requesterEmail}</div>
                      </div>
                    </div>
                    <div className="left-info-group" style={{ marginTop: '12px' }}>
                      <div className="left-info-item">
                        <span className="left-info-label">Phòng ban</span>
                        <span className="left-info-value">{activeTicket.department || 'Bộ phận Kỹ thuật / Thiết kế'}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* CỘT GIỮA: Ô NHẬP LIỆU NGHIỆP VỤ & NHẬT KÝ CHI TIẾT */}
                <div className="center-column">
                  
                  {/* Nhập liệu nghiệp vụ */}
                  <div className="l2-card" style={{ borderLeft: '4px solid #2563EB' }}>
                    <h3 className="l2-card-title">
                      🛠 Nghiệp vụ phân tích L2
                    </h3>
                    
                    <div className="business-field">
                      <label className="business-label">Nguyên nhân gốc (Root Cause) <span style={{ color: '#DC2626' }}>*</span></label>
                      <textarea
                        className="business-textarea"
                        placeholder="Phân tích và ghi lại nguyên nhân cốt lõi gây ra lỗi (Ví dụ: RAM bị lỏng pin, xung đột driver VGA với API Zoom, RADIUS Server cấu hình sai Certificate...)"
                        value={rootCause}
                        onChange={(e) => setRootCause(e.target.value)}
                        disabled={activeTicket.status === 'Resolved' || activeTicket.status === 'Closed'}
                      ></textarea>
                    </div>

                    <div className="business-field">
                      <label className="business-label">
                        Ghi chú kỹ thuật nội bộ (Chỉ đội IT nhìn thấy)
                      </label>
                      <textarea
                        className="business-textarea tech-notes"
                        placeholder="Nội dung chuyên môn, cấu hình chi tiết phục vụ lưu trữ nội bộ giữa L2 và Quản lý IT (Ẩn đối với Người yêu cầu)..."
                        value={techNotes}
                        onChange={(e) => setTechNotes(e.target.value)}
                        disabled={activeTicket.status === 'Resolved' || activeTicket.status === 'Closed'}
                      ></textarea>
                    </div>

                    {/* Bộ đếm số lần thử giải quyết */}
                    <div className="attempts-counter-group">
                      <div className="attempts-counter-label">
                        Số lần L2 thử giải quyết sự cố:
                        {attempts >= 3 && (
                          <div className="attempts-warning-text">
                            ⚠ Sự cố phức tạp! Đã thử quá 3 lần. Đề xuất bấm "Báo quản lý IT" bên cột phải.
                          </div>
                        )}
                      </div>
                      <div className="attempts-controller">
                        <button
                          type="button"
                          className="btn-counter"
                          onClick={() => setAttempts(prev => Math.max(1, prev - 1))}
                          disabled={attempts <= 1 || activeTicket.status === 'Resolved' || activeTicket.status === 'Closed'}
                        >
                          -
                        </button>
                        <div className={`attempts-number-box ${attempts >= 3 ? 'critical-warning' : ''}`}>
                          {attempts}
                        </div>
                        <button
                          type="button"
                          className="btn-counter"
                          onClick={() => setAttempts(prev => Math.min(5, prev + 1))}
                          disabled={attempts >= 5 || activeTicket.status === 'Resolved' || activeTicket.status === 'Closed'}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hộp thảo luận & logs */}
                  <div className="l2-card">
                    <h3 className="l2-card-title">
                      💬 Trao đổi kỹ thuật & Lịch sử log
                    </h3>

                    <div className="comments-list" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px', paddingRight: '8px' }}>
                      {comments.map((comment) => (
                        <div key={comment.id} style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                          <div className="comment-bubble" style={{ 
                            flex: 1, 
                            backgroundColor: comment.isSystem ? '#FAFAF9' : '#EFF6FF',
                            border: comment.isSystem ? '1px dashed #D6D3D1' : '1px solid #BFDBFE',
                            borderRadius: '8px',
                            padding: '8px 12px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <div>
                                <span style={{ fontSize: '12.5px', fontWeight: 700 }}>{comment.author}</span>
                                <span className="comment-role-tag">{comment.role}</span>
                              </div>
                              <span style={{ fontSize: '10.5px', color: '#64748B' }}>{comment.date}</span>
                            </div>
                            <p style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', color: '#334155' }}>{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendComment} className="comment-input-area" style={{ border: 'none', paddingTop: 0 }}>
                      <textarea
                        className="comment-textarea"
                        style={{ minHeight: '60px', fontSize: '13.5px' }}
                        placeholder="Nhập nội dung trả lời người dùng..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={activeTicket.status === 'Closed'}
                      ></textarea>
                      <div className="comment-actions-bar" style={{ marginTop: '8px' }}>
                        <button type="submit" className="btn-comment-submit" disabled={!newComment.trim() || activeTicket.status === 'Closed'}>
                          Gửi phản hồi
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Nhật ký hệ thống */}
                  <div className="l2-card">
                    <h3 className="l2-card-title">
                      ⚙ Nhật ký log hệ thống
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

                {/* CỘT PHẢI: SLA & PANEL HÀNH ĐỘNG IT L2 */}
                <div className="right-column">
                  
                  {/* Countdown SLA */}
                  <div className="sla-countdown-card">
                    <div className="sla-countdown-label">Hạn SLA cam kết</div>
                    {renderSLACountdown(activeTicket)}
                    <div className="sla-countdown-desc">
                      Thời gian cam kết L2 xử lý và giải quyết dứt điểm sự cố khẩn cấp.
                    </div>
                  </div>

                  {/* Panel hành động */}
                  <div className="l2-card">
                    <h3 className="l2-card-title">
                      🎯 Thao tác L2
                    </h3>
                    <div className="actions-vertical-group">
                      {activeTicket.status === 'Pending' && (
                        <>
                          <button
                            type="button"
                            className="btn-action-secondary"
                            onClick={handleUpdateResults}
                          >
                            Cập nhật kết quả L2
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
                            className="btn-action-danger"
                            onClick={handleEscalateToManager}
                          >
                            🚨 Báo Quản lý IT (Khẩn)
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        className="btn-action-kb"
                        onClick={handleOpenKbModal}
                        disabled={activeTicket.status !== 'Resolved' && activeTicket.status !== 'Closed'}
                      >
                        📚 Tạo bài viết tri thức
                      </button>

                      {(activeTicket.status === 'Resolved' || activeTicket.status === 'Closed') && (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '12px', 
                          backgroundColor: '#F8FAFC', 
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#64748B',
                          marginTop: '8px'
                        }}>
                          Phiếu đã kết thúc xử lý ({activeTicket.status === 'Resolved' ? 'Đã giải quyết' : 'Đã đóng'})
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </>
          )
        )}

      </div>

      {/* MODAL TẠO BÀI VIẾT TRI THỨC (UC-10) */}
      {showKbModal && (
        <div className="modal-overlay">
          <form onSubmit={handleConfirmKbPublish} className="modal-container" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Xuất bản bài viết tri thức mới (UC-10)</h3>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowKbModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Tiêu đề bài viết tri thức <span style={{ color: '#DC2626' }}>*</span></label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Ví dụ: Hướng dẫn xử lý xung đột Card đồ họa Dell với Zoom"
                  value={kbTitle}
                  onChange={(e) => setKbTitle(e.target.value)}
                />
              </div>

              <div className="modal-field">
                <label className="modal-label">Chuyên mục tri thức</label>
                <select
                  className="filter-select"
                  value={kbCategory}
                  onChange={(e) => setKbCategory(e.target.value)}
                >
                  <option value="Phần cứng">Hỗ trợ Phần cứng</option>
                  <option value="Phần mềm">Hỗ trợ Phần mềm</option>
                  <option value="Mạng">Hỗ trợ mạng máy tính</option>
                  <option value="Hệ thống">Hệ thống CRM / Cloud</option>
                </select>
              </div>

              <div className="modal-field">
                <label className="modal-label">Nội dung giải pháp <span style={{ color: '#DC2626' }}>*</span></label>
                <textarea
                  className="modal-textarea"
                  style={{ minHeight: '180px' }}
                  placeholder="Ghi cụ thể các bước giải pháp kỹ thuật, câu lệnh terminal hoặc các cấu hình đã chỉnh sửa để các kỹ thuật viên L1 hoặc người dùng có thể tự thực hiện trong tương lai..."
                  value={kbContent}
                  onChange={(e) => setKbContent(e.target.value)}
                ></textarea>
              </div>

              {kbError && (
                <div className="modal-error">
                  ⚠ {kbError}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-modal-cancel"
                onClick={() => setShowKbModal(false)}
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                className="btn-modal-submit"
                style={{ backgroundColor: '#3B82F6' }}
              >
                Xuất bản bài viết
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
