/**
 * MyTickets.tsx  –  UC-03: Theo dõi trạng thái Ticket
 * Màn hình danh sách phiếu hỗ trợ dành cho "Người yêu cầu".
 * Hiển thị thẻ trạng thái tổng hợp + bảng phiếu cá nhân.
 *
 * ⚠️  STUB – Đang chờ tích hợp dữ liệu API thực tế.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MyTickets.css';

// ─── Mock data ────────────────────────────────────────────────────────────────
interface Ticket {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: 'new' | 'processing' | 'resolved' | 'closed' | 'reopened';
  created: string;
  sla: string;
}

const MOCK_TICKETS: Ticket[] = [
  { id: 'SW-2026-0142', title: 'Không mở được phần mềm kế toán MISA sau khi cập nhật', priority: 'high', status: 'processing', created: '24/05/2026 09:15', sla: '25/05/2026 13:00' },
  { id: 'HW-2026-0110', title: 'Màn hình máy tính bị sọc ngang, không sử dụng được', priority: 'medium', status: 'new', created: '24/05/2026 14:32', sla: '26/05/2026 08:00' },
  { id: 'NW-2026-0088', title: 'Wifi văn phòng tầng 2 kết nối chập chờn', priority: 'low', status: 'resolved', created: '22/05/2026 10:00', sla: '23/05/2026 10:00' },
  { id: 'SW-2026-0097', title: 'Lỗi không gửi được email qua Outlook', priority: 'medium', status: 'closed', created: '20/05/2026 16:05', sla: '21/05/2026 16:00' },
  { id: 'HW-2026-0055', title: 'Bàn phím laptop không nhận một số phím', priority: 'low', status: 'new', created: '25/05/2026 08:00', sla: '27/05/2026 08:00' },
];

const STATUS_META: Record<Ticket['status'], { label: string; cls: string; icon: string }> = {
  new:        { label: 'Mới tạo',        cls: 'new',        icon: '🆕' },
  processing: { label: 'Đang xử lý',     cls: 'processing', icon: '⚙️' },
  resolved:   { label: 'Đã giải quyết', cls: 'resolved',   icon: '✅' },
  closed:     { label: 'Đã đóng',        cls: 'closed',     icon: '🔒' },
  reopened:   { label: 'Mở lại',         cls: 'reopened',   icon: '🔄' },
};

const PRIORITY_META: Record<Ticket['priority'], { label: string; cls: string }> = {
  high:   { label: 'Cao',       cls: 'high'   },
  medium: { label: 'Trung bình', cls: 'medium' },
  low:    { label: 'Thấp',      cls: 'low'    },
};

// ─── Summary card count ──────────────────────────────────────────────────────
const countByStatus = (s: Ticket['status']) => MOCK_TICKETS.filter(t => t.status === s).length;

// ─── Component ───────────────────────────────────────────────────────────────
export const MyTickets: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = React.useState<Ticket['status'] | 'all'>('all');

  const visible = filter === 'all'
    ? MOCK_TICKETS
    : MOCK_TICKETS.filter(t => t.status === filter);

  const summaryCards: Array<{ status: Ticket['status'] | 'all'; label: string; count: number; color: string; bg: string }> = [
    { status: 'all',        label: 'Tất cả',         count: MOCK_TICKETS.length, color: '#2563EB', bg: '#EFF6FF' },
    { status: 'new',        label: 'Mới tạo',        count: countByStatus('new'),        color: '#2563EB', bg: '#EFF6FF' },
    { status: 'processing', label: 'Đang xử lý',     count: countByStatus('processing'), color: '#D97706', bg: '#FFFBEB' },
    { status: 'resolved',   label: 'Đã giải quyết', count: countByStatus('resolved'),   color: '#16A34A', bg: '#F0FDF4' },
    { status: 'closed',     label: 'Đã đóng',        count: countByStatus('closed'),     color: '#64748B', bg: '#F1F5F9' },
  ];

  return (
    <div className="mytickets-container">

      {/* ── Page Header ── */}
      <div className="mytickets-header">
        <div>
          <h1 className="mytickets-title">🎫 Phiếu hỗ trợ của tôi</h1>
          <p className="mytickets-subtitle">Theo dõi tiến trình xử lý tất cả yêu cầu bạn đã gửi đến bộ phận IT.</p>
        </div>
        <button
          id="btn-create-ticket"
          className="btn-create-ticket"
          onClick={() => navigate('/tickets/create')}
        >
          ＋ Tạo phiếu mới
        </button>
      </div>

      {/* ── Status Summary Cards ── */}
      <div className="mytickets-summary-grid">
        {summaryCards.map(card => (
          <button
            key={card.status}
            className={`summary-card ${filter === card.status ? 'active' : ''}`}
            style={filter === card.status ? { borderColor: card.color, backgroundColor: card.bg } : {}}
            onClick={() => setFilter(card.status as Ticket['status'] | 'all')}
          >
            <span className="summary-count" style={{ color: filter === card.status ? card.color : '#0F172A' }}>
              {card.count}
            </span>
            <span className="summary-label" style={{ color: filter === card.status ? card.color : '#64748B' }}>
              {card.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tickets Table ── */}
      <div className="mytickets-table-card">
        <div className="mytickets-table-header">
          <span className="mytickets-table-title">
            Danh sách phiếu
            <span className="mytickets-count-badge">{visible.length} phiếu</span>
          </span>
        </div>

        {visible.length === 0 ? (
          <div className="mytickets-empty">
            <div className="empty-icon">📭</div>
            <p className="empty-title">Không có phiếu nào trong danh mục này</p>
            <p className="empty-sub">Thử chọn bộ lọc khác hoặc tạo phiếu hỗ trợ mới.</p>
          </div>
        ) : (
          <div className="mytickets-table-wrapper">
            <table className="mytickets-table">
              <thead>
                <tr>
                  <th>Mã phiếu</th>
                  <th>Tiêu đề</th>
                  <th>Ưu tiên</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>SLA Deadline</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map(ticket => {
                  const sm = STATUS_META[ticket.status];
                  const pm = PRIORITY_META[ticket.priority];
                  return (
                    <tr key={ticket.id} className="mytickets-row">
                      <td>
                        <span className="ticket-id-badge">{ticket.id}</span>
                      </td>
                      <td className="ticket-title-cell">{ticket.title}</td>
                      <td><span className={`priority-badge ${pm.cls}`}>{pm.label}</span></td>
                      <td>
                        <span className={`status-badge ${sm.cls}`}>
                          {sm.icon} {sm.label}
                        </span>
                      </td>
                      <td className="ticket-date-cell">{ticket.created}</td>
                      <td className="ticket-date-cell">{ticket.sla}</td>
                      <td>
                        <button
                          className="btn-view-detail"
                          onClick={() => navigate(`/tickets/detail/${ticket.id}`)}
                        >
                          Xem chi tiết →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
