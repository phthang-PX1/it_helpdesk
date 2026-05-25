import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TicketQueue.css';

interface Ticket {
  id: string;
  title: string;
  requesterName: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'New' | 'Pending' | 'Resolved' | 'Closed';
  slaDeadline: number; // timestamp
  assignee: string;
  group: 'IT L1' | 'IT L2';
  createdAt: string; // 'YYYY-MM-DD'
  isReopened?: boolean;
}

// Mock ticket list for L1 Queue
const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'HW-2026-0042',
    title: 'Hỗ trợ lỗi màn hình xanh (BSOD) khi đang họp Zoom',
    requesterName: 'Nguyễn Văn A',
    priority: 'High',
    status: 'Pending',
    slaDeadline: Date.now() + 2 * 3600 * 1000 + 14 * 60 * 1000, // 2 giờ 14 phút
    assignee: 'Nguyễn Văn Hỗ Trợ (IT L1)',
    group: 'IT L1',
    createdAt: '2026-05-25'
  },
  {
    id: 'SW-2026-0045',
    title: 'Yêu cầu cấp phát bản quyền phần mềm Figma Design Pro',
    requesterName: 'Trần Thị Thiết Kế',
    priority: 'Medium',
    status: 'New',
    slaDeadline: Date.now() + 15 * 3600 * 1000,
    assignee: 'Chưa phân công',
    group: 'IT L1',
    createdAt: '2026-05-25'
  },
  {
    id: 'NW-2026-0041',
    title: 'Không kết nối được vào mạng Wifi Office_HCM_5G',
    requesterName: 'Lê Văn Mạng',
    priority: 'High',
    status: 'Pending',
    slaDeadline: Date.now() + 4 * 60 * 1000 + 12 * 1000, // 4 phút (Sắp quá hạn)
    assignee: 'Phạm Văn Mạng (IT L2)',
    group: 'IT L2',
    createdAt: '2026-05-25'
  },
  {
    id: 'SW-2026-0030',
    title: 'Lỗi không đăng nhập được hệ thống quản lý CRM nội bộ',
    requesterName: 'Hoàng Văn Lập',
    priority: 'High',
    status: 'Pending',
    slaDeadline: Date.now() - 45 * 60 * 1000, // Đã quá hạn 45 phút
    assignee: 'Nguyễn Văn Hỗ Trợ (IT L1)',
    group: 'IT L1',
    createdAt: '2026-05-24'
  },
  {
    id: 'HW-2026-0012',
    title: 'Máy in văn phòng tầng 3 báo lỗi kẹt giấy liên tục',
    requesterName: 'Bùi Thị Kế Toán',
    priority: 'Medium',
    status: 'Pending',
    slaDeadline: Date.now() + 11 * 3600 * 1000,
    assignee: 'Nguyễn Văn Hỗ Trợ (IT L1)',
    group: 'IT L1',
    createdAt: '2026-05-23',
    isReopened: true
  },
  {
    id: 'SW-2026-0046',
    title: 'Cài đặt phần mềm lập trình Docker và VS Code cho máy mới',
    requesterName: 'Vũ Dev Tân Binh',
    priority: 'Low',
    status: 'New',
    slaDeadline: Date.now() + 24 * 3600 * 1000,
    assignee: 'Chưa phân công',
    group: 'IT L1',
    createdAt: '2026-05-25'
  }
];

export const TicketQueue: React.FC = () => {
  const navigate = useNavigate();
  const [tickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('l1_mock_tickets');
    return saved ? JSON.parse(saved) : INITIAL_TICKETS;
  });

  // State Tabs và Bộ lọc
  const [activeTab, setActiveTab] = useState<'new' | 'pending' | 'warning' | 'danger' | 'reopened'>('new');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [filterGroup, setFilterGroup] = useState<string>('All');
  const [filterTime, setFilterTime] = useState<string>('All');
  const [filterSlaStatus, setFilterSlaStatus] = useState<string>('All');

  // Cập nhật đếm ngược SLA mỗi giây để bảng hoạt động real-time
  const [timeTicker, setTimeTicker] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTicker(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Đồng bộ hóa danh sách ticket lên localStorage khi có sự thay đổi
  useEffect(() => {
    localStorage.setItem('l1_mock_tickets', JSON.stringify(tickets));
  }, [tickets]);

  // Bộ lọc dữ liệu logic
  const getFilteredTickets = () => {
    return tickets.filter(t => {
      // 1. Phân loại theo Tabs trạng thái
      const diff = t.slaDeadline - timeTicker;
      if (activeTab === 'new') {
        if (t.status !== 'New') return false;
      } else if (activeTab === 'pending') {
        if (t.status !== 'Pending' || t.isReopened) return false;
      } else if (activeTab === 'warning') {
        // Sắp quá hạn: Đang giải quyết & SLA còn dưới 2 giờ và chưa quá hạn
        if (t.status !== 'Pending') return false;
        if (diff <= 0 || diff > 2 * 3600 * 1000) return false;
      } else if (activeTab === 'danger') {
        // Quá hạn: Đang giải quyết & SLA quá hạn (<=0)
        if (t.status !== 'Pending') return false;
        if (diff > 0) return false;
      } else if (activeTab === 'reopened') {
        if (t.status !== 'Pending' || !t.isReopened) return false;
      }

      // 2. Bộ lọc độ ưu tiên
      if (filterPriority !== 'All' && t.priority !== filterPriority) return false;

      // 3. Bộ lọc nhóm hỗ trợ
      if (filterGroup !== 'All' && t.group !== filterGroup) return false;

      // 4. Bộ lọc thời gian
      if (filterTime !== 'All') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (filterTime === 'Today' && t.createdAt !== todayStr) return false;
        // Giả lập tuần này/tháng này đối với mock data đơn giản
        if (filterTime === 'Week' && t.createdAt < '2026-05-19') return false;
      }

      // 5. Bộ lọc trạng thái SLA
      if (filterSlaStatus !== 'All') {
        if (filterSlaStatus === 'Breached' && diff > 0) return false;
        if (filterSlaStatus === 'Critical' && (diff <= 0 || diff > 2 * 3600 * 1000)) return false;
        if (filterSlaStatus === 'Normal' && diff < 2 * 3600 * 1000) return false;
      }

      return true;
    });
  };

  const filteredTickets = getFilteredTickets();

  // Đếm số lượng ticket tương ứng với mỗi tab
  const getTabCounts = (tabName: typeof activeTab) => {
    return tickets.filter(t => {
      const diff = t.slaDeadline - timeTicker;
      if (tabName === 'new') return t.status === 'New';
      if (tabName === 'pending') return t.status === 'Pending' && !t.isReopened;
      if (tabName === 'warning') return t.status === 'Pending' && diff > 0 && diff <= 2 * 3600 * 1000;
      if (tabName === 'danger') return t.status === 'Pending' && diff <= 0;
      if (tabName === 'reopened') return t.status === 'Pending' && !!t.isReopened;
      return false;
    }).length;
  };

  // Trình hiển thị đếm ngược SLA
  const renderSlaTimer = (deadline: number) => {
    const diff = deadline - timeTicker;
    if (diff <= 0) {
      const overTime = Math.abs(diff);
      const hours = Math.floor(overTime / (3600 * 1000));
      const mins = Math.floor((overTime % (3600 * 1000)) / (60 * 1000));
      return <span className="queue-sla-timer danger">Quá hạn: -{hours}g {mins}p</span>;
    }

    const hours = Math.floor(diff / (3600 * 1000));
    const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
    const secs = Math.floor((diff % (60 * 1000)) / 1000);

    const pad = (num: number) => String(num).padStart(2, '0');

    if (diff < 15 * 60 * 1000) {
      return <span className="queue-sla-timer danger">{pad(hours)}:{pad(mins)}:{pad(secs)} ⚠</span>;
    } else if (diff < 2 * 3600 * 1000) {
      return <span className="queue-sla-timer warning">{pad(hours)}:{pad(mins)}:{pad(secs)}</span>;
    }
    return <span className="queue-sla-timer">{pad(hours)}g {pad(mins)}p</span>;
  };

  return (
    <div className="ticket-queue-container">
      <div className="ticket-queue-content">
        
        {/* 1. Tiêu đề hàng đợi */}
        <div className="queue-header-card">
          <h1 className="queue-title">Hàng đợi Ticket của Đội kỹ thuật L1</h1>
          <p className="queue-subtitle">
            Tiếp nhận, phản hồi và giải quyết nhanh các sự cố kỹ thuật nội bộ của CBNV công ty.
          </p>
        </div>

        {/* 2. Khối bộ lọc phía trên */}
        <div className="queue-filters-card">
          <div className="filters-row">
            <div className="filter-group">
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

            <div className="filter-group">
              <label className="filter-label">Nhóm xử lý</label>
              <select 
                className="filter-select"
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
              >
                <option value="All">Tất cả nhóm</option>
                <option value="IT L1">Đội hỗ trợ L1</option>
                <option value="IT L2">Đội hỗ trợ L2</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Thời gian phát sinh</label>
              <select 
                className="filter-select"
                value={filterTime}
                onChange={(e) => setFilterTime(e.target.value)}
              >
                <option value="All">Tất cả thời gian</option>
                <option value="Today">Hôm nay</option>
                <option value="Week">Trong 7 ngày qua</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Trạng thái SLA</label>
              <select 
                className="filter-select"
                value={filterSlaStatus}
                onChange={(e) => setFilterSlaStatus(e.target.value)}
              >
                <option value="All">Tất cả hạn SLA</option>
                <option value="Normal">Bình thường</option>
                <option value="Critical">Sắp quá hạn (&lt; 2g)</option>
                <option value="Breached">Đã quá hạn</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Thanh điều hướng Tabs */}
        <div className="queue-tabs-container">
          <button
            type="button"
            className={`queue-tab-btn tab-pending ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            Mới tạo
            <span className="tab-badge">{getTabCounts('new')}</span>
          </button>

          <button
            type="button"
            className={`queue-tab-btn tab-pending ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Đang giải quyết
            <span className="tab-badge">{getTabCounts('pending')}</span>
          </button>

          <button
            type="button"
            className={`queue-tab-btn tab-warning ${activeTab === 'warning' ? 'active' : ''}`}
            onClick={() => setActiveTab('warning')}
          >
            Sắp quá hạn
            <span className="tab-badge">{getTabCounts('warning')}</span>
          </button>

          <button
            type="button"
            className={`queue-tab-btn tab-danger ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
          >
            Quá hạn
            <span className="tab-badge">{getTabCounts('danger')}</span>
          </button>

          <button
            type="button"
            className={`queue-tab-btn tab-pending ${activeTab === 'reopened' ? 'active' : ''}`}
            onClick={() => setActiveTab('reopened')}
          >
            Mở lại
            <span className="tab-badge">{getTabCounts('reopened')}</span>
          </button>
        </div>

        {/* 4. Thẻ chứa Bảng Hàng đợi */}
        <div className="queue-table-card">
          {filteredTickets.length > 0 ? (
            <table className="queue-table">
              <thead>
                <tr>
                  <th>Mã Ticket</th>
                  <th>Tiêu đề phiếu yêu cầu</th>
                  <th>Người gửi</th>
                  <th>Mức độ ưu tiên</th>
                  <th>Trạng thái</th>
                  <th>Hạn xử lý SLA</th>
                  <th>Người phụ trách</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <a 
                        href={`/tickets/process/${ticket.id}`}
                        className="queue-ticket-id"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/tickets/process/${ticket.id}`);
                        }}
                      >
                        {ticket.id}
                      </a>
                    </td>
                    <td>
                      <div className="queue-ticket-title" title={ticket.title}>
                        {ticket.title}
                      </div>
                    </td>
                    <td>{ticket.requesterName}</td>
                    <td>
                      {ticket.priority === 'High' && (
                        <span className="badge-priority" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>Cao</span>
                      )}
                      {ticket.priority === 'Medium' && (
                        <span className="badge-priority" style={{ backgroundColor: '#FFFBEB', color: '#F59E0B' }}>Trung bình</span>
                      )}
                      {ticket.priority === 'Low' && (
                        <span className="badge-priority" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>Thấp</span>
                      )}
                    </td>
                    <td>
                      {ticket.status === 'New' && (
                        <span className="badge-status" style={{ backgroundColor: '#EFF6FF', color: '#1E40AF' }}>Mới tạo</span>
                      )}
                      {ticket.status === 'Pending' && (
                        <span className="badge-status" style={{ backgroundColor: '#FFFBEB', color: '#92400E' }}>Đang giải quyết</span>
                      )}
                      {ticket.status === 'Resolved' && (
                        <span className="badge-status" style={{ backgroundColor: '#ECFDF5', color: '#065F46' }}>Đã giải quyết</span>
                      )}
                      {ticket.status === 'Closed' && (
                        <span className="badge-status" style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>Đã đóng</span>
                      )}
                    </td>
                    <td>{renderSlaTimer(ticket.slaDeadline)}</td>
                    <td>{ticket.assignee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3 className="empty-state-title">Không tìm thấy kết quả phù hợp</h3>
              <p className="empty-state-desc">
                Không có phiếu hỗ trợ nào phù hợp với bộ lọc và tab hiện tại của bạn.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
