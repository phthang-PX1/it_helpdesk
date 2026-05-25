import React, { useState } from 'react';
import './AdminDashboard.css';

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────
interface SLAPolicy {
  id: number;
  name: string;
  schedule: 'business' | '24x7';
  low_response: number;
  low_resolve: number;
  medium_response: number;
  medium_resolve: number;
  high_response: number;
  high_resolve: number;
  remind_before: number;
  active: boolean;
}

interface UrgentTicket {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: 'overdue' | 'near_due' | 'critical';
  assignee: string;
  sla_deadline: string;
  remaining: string;
}

// ─────────────────────────────────────────────
//  Mock Data
// ─────────────────────────────────────────────
const INITIAL_SLA_POLICIES: SLAPolicy[] = [
  {
    id: 1,
    name: 'Chính sách SLA Chuẩn',
    schedule: 'business',
    low_response: 8,
    low_resolve: 72,
    medium_response: 4,
    medium_resolve: 24,
    high_response: 1,
    high_resolve: 8,
    remind_before: 60,
    active: true,
  },
  {
    id: 2,
    name: 'Chính sách SLA Khẩn 24/7',
    schedule: '24x7',
    low_response: 4,
    low_resolve: 48,
    medium_response: 2,
    medium_resolve: 12,
    high_response: 0.5,
    high_resolve: 4,
    remind_before: 30,
    active: false,
  },
];

const URGENT_TICKETS: UrgentTicket[] = [
  {
    id: 'HW-2026-0041',
    title: 'Máy chủ Production ngừng hoạt động đột ngột',
    priority: 'high',
    status: 'overdue',
    assignee: 'Trần Văn B',
    sla_deadline: '2026-05-25 08:00',
    remaining: 'Quá hạn 4h 20m',
  },
  {
    id: 'SW-2026-0078',
    title: 'Lỗi xác thực người dùng trên hệ thống CRM',
    priority: 'high',
    status: 'critical',
    assignee: 'Lê Thị C',
    sla_deadline: '2026-05-25 13:00',
    remaining: 'Còn 0h 25m',
  },
  {
    id: 'NW-2026-0055',
    title: 'Đứt kết nối mạng nội bộ tầng 3',
    priority: 'high',
    status: 'near_due',
    assignee: 'Phạm Đình D',
    sla_deadline: '2026-05-25 14:30',
    remaining: 'Còn 2h 05m',
  },
  {
    id: 'SW-2026-0089',
    title: 'Không in được tài liệu từ phần mềm kế toán',
    priority: 'medium',
    status: 'near_due',
    assignee: 'Nguyễn Thị E',
    sla_deadline: '2026-05-25 16:00',
    remaining: 'Còn 3h 35m',
  },
  {
    id: 'HW-2026-0062',
    title: 'Máy tính giám đốc không khởi động được',
    priority: 'high',
    status: 'critical',
    assignee: 'Hoàng Văn F',
    sla_deadline: '2026-05-25 13:30',
    remaining: 'Còn 0h 55m',
  },
];

// ─────────────────────────────────────────────
//  Line Chart (SVG – Ticket Trend)
// ─────────────────────────────────────────────
const LineChart: React.FC = () => {
  const data = [42, 55, 38, 67, 80, 72, 58, 91, 76, 84, 63, 95];
  const labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
  const W = 440, H = 160, PAD = 20;
  const maxVal = Math.max(...data);
  const xs = data.map((_, i) => PAD + (i / (data.length - 1)) * (W - PAD * 2));
  const ys = data.map(v => H - PAD - ((v / maxVal) * (H - PAD * 2)));

  const pathD = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
  const fillD = `${pathD} L${xs[xs.length - 1]},${H - PAD} L${xs[0]},${H - PAD} Z`;

  return (
    <div className="chart-wrapper" style={{ height: 220 }}>
      <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <line
            key={i}
            x1={PAD} y1={PAD + t * (H - PAD * 2)}
            x2={W - PAD} y2={PAD + t * (H - PAD * 2)}
            stroke="#E2E8F0" strokeWidth="1"
          />
        ))}
        {/* Fill area */}
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <path d={fillD} fill="url(#lineGrad)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys[i]} r="4" fill="#2563EB" stroke="#fff" strokeWidth="2">
            <title>{`Tháng ${labels[i]}: ${data[i]} phiếu`}</title>
          </circle>
        ))}
        {/* X Labels */}
        {xs.map((x, i) => (
          <text key={i} x={x} y={H + 16} textAnchor="middle" fontSize="9" fill="#94A3B8" fontWeight="600">
            {labels[i]}
          </text>
        ))}
      </svg>
    </div>
  );
};

// ─────────────────────────────────────────────
//  Donut Chart (SVG – Priority Breakdown)
// ─────────────────────────────────────────────
const DonutChart: React.FC = () => {
  const segments = [
    { label: 'Cao', value: 38, color: '#EF4444' },
    { label: 'Trung bình', value: 45, color: '#F59E0B' },
    { label: 'Thấp', value: 30, color: '#10B981' },
  ];
  const total = segments.reduce((s, x) => s + x.value, 0);
  const R = 60, cx = 80, cy = 80, stroke = 28;
  let cumAngle = -Math.PI / 2;

  const arcs = segments.map(seg => {
    const angle = (seg.value / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(cumAngle);
    const y1 = cy + R * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + R * Math.cos(cumAngle);
    const y2 = cy + R * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { path: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`, color: seg.color, label: seg.label, value: seg.value };
  });

  return (
    <div className="chart-wrapper" style={{ height: 220, flexDirection: 'column', gap: 0 }}>
      <svg viewBox="0 0 160 160" style={{ width: 160, height: 160, flexShrink: 0 }}>
        {arcs.map((arc, i) => (
          <path key={i} d={arc.path} fill="none" stroke={arc.color} strokeWidth={stroke} strokeLinecap="butt">
            <title>{`${arc.label}: ${arc.value} phiếu`}</title>
          </path>
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="800" fill="#0F172A">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fontWeight="600" fill="#64748B">tổng phiếu</text>
      </svg>
      <div className="donut-legend">
        {segments.map((s, i) => (
          <div key={i} className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: s.color }} />
            <span>{s.label} ({s.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  Bar Chart (SLA Met vs Breach)
// ─────────────────────────────────────────────
const SLABarChart: React.FC = () => {
  const rows = [
    { label: 'Ưu tiên Cao', met: 72, breach: 28 },
    { label: 'Trung bình', met: 88, breach: 12 },
    { label: 'Thấp', met: 94, breach: 6 },
  ];

  return (
    <div className="bar-chart-container">
      {rows.map((r, i) => (
        <div key={i} className="bar-row">
          <div className="bar-label">{r.label}</div>
          <div className="bar-track">
            <div className="bar-fill-met" style={{ width: `${r.met}%` }} title={`Đạt SLA: ${r.met}%`} />
            <div className="bar-fill-breached" style={{ width: `${r.breach}%` }} title={`Vi phạm: ${r.breach}%`} />
          </div>
          <div className="bar-value">
            <span style={{ color: '#10B981' }}>{r.met}%</span>
            <span style={{ color: '#94A3B8', fontSize: 11 }}> / </span>
            <span style={{ color: '#EF4444' }}>{r.breach}%</span>
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
        <div className="legend-item"><div className="legend-dot dot-sla-met" /><span>Đạt SLA</span></div>
        <div className="legend-item"><div className="legend-dot dot-sla-breach" /><span>Vi phạm SLA</span></div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  Efficiency Chart
// ─────────────────────────────────────────────
const EfficiencyChart: React.FC = () => {
  const staff = [
    { name: 'Trần Văn Bình (L1)', resolved: 42, score: 94 },
    { name: 'Lê Thị Cẩm (L1)', resolved: 37, score: 88 },
    { name: 'Phạm Đình Dũng (L2)', resolved: 29, score: 96 },
    { name: 'Nguyễn Thị Hoa (L1)', resolved: 33, score: 82 },
    { name: 'Hoàng Văn Phúc (L2)', resolved: 25, score: 90 },
  ];

  return (
    <div className="efficiency-list" style={{ paddingTop: 4 }}>
      {staff.map((s, i) => (
        <div key={i} className="efficiency-item">
          <div className="efficiency-info">
            <span className="efficiency-name">{s.name}</span>
            <span className="efficiency-score">{s.score}% · {s.resolved} phiếu</span>
          </div>
          <div className="efficiency-progress-bg">
            <div className="efficiency-progress-fill" style={{
              width: `${s.score}%`,
              backgroundColor: s.score >= 90 ? '#10B981' : s.score >= 80 ? '#2563EB' : '#F59E0B'
            }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
//  SLA Modal
// ─────────────────────────────────────────────
interface SLAModalProps {
  onClose: () => void;
  onSave: (p: Omit<SLAPolicy, 'id' | 'active'>) => void;
}

const SLAModal: React.FC<SLAModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState<'business' | '24x7'>('business');
  const [remindBefore, setRemindBefore] = useState(60);
  const [matrix, setMatrix] = useState({
    low_response: 8, low_resolve: 72,
    medium_response: 4, medium_resolve: 24,
    high_response: 1, high_resolve: 8,
  });

  const handleChange = (field: keyof typeof matrix, val: string) => {
    setMatrix(prev => ({ ...prev, [field]: parseFloat(val) || 0 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { alert('Vui lòng nhập tên chính sách SLA!'); return; }
    onSave({ name, schedule, remind_before: remindBefore, ...matrix });
    onClose();
  };

  const matrixRows: Array<{ label: string; responseKey: keyof typeof matrix; resolveKey: keyof typeof matrix; color: string }> = [
    { label: '🔴 Cao', responseKey: 'high_response', resolveKey: 'high_resolve', color: '#EF4444' },
    { label: '🟡 Trung bình', responseKey: 'medium_response', resolveKey: 'medium_resolve', color: '#F59E0B' },
    { label: '🟢 Thấp', responseKey: 'low_response', resolveKey: 'low_resolve', color: '#10B981' },
  ];

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container" style={{ maxWidth: 660 }}>
        <div className="modal-header">
          <h3 className="modal-title">✨ Tạo chính sách SLA mới</h3>
          <button className="btn-close-modal" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Name + Schedule */}
            <div className="form-grid-2" style={{ marginBottom: 20 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Tên chính sách SLA <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  className="form-input"
                  placeholder="VD: Chính sách SLA Tiêu chuẩn 2026"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label">Chế độ tính giờ</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  {(['business', '24x7'] as const).map(opt => (
                    <label key={opt} className={`schedule-option ${schedule === opt ? 'selected' : ''}`}>
                      <input type="radio" name="schedule" value={opt} checked={schedule === opt} onChange={() => setSchedule(opt)} style={{ display: 'none' }} />
                      {opt === 'business' ? '🏢 Giờ hành chính' : '🌐 24x7'}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Nhắc nhở trước hạn (phút)</label>
                <div className="matrix-input-wrapper" style={{ marginTop: 6 }}>
                  <input
                    className="form-input"
                    type="number"
                    min={5}
                    max={1440}
                    value={remindBefore}
                    onChange={e => setRemindBefore(parseInt(e.target.value) || 30)}
                    style={{ paddingRight: 60 }}
                  />
                  <span className="input-unit">phút</span>
                </div>
              </div>
            </div>

            {/* SLA Matrix */}
            <div className="sla-matrix-section">
              <p className="matrix-title">📊 Ma trận thời gian cam kết dịch vụ</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Mức độ</th>
                      <th style={thStyle}>⚡ Thời gian phản hồi</th>
                      <th style={thStyle}>✅ Thời gian xử lý</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixRows.map(row => (
                      <tr key={row.label}>
                        <td style={{ ...tdStyle, fontWeight: 700, color: row.color }}>{row.label}</td>
                        <td style={tdStyle}>
                          <div className="matrix-input-wrapper">
                            <input
                              className="form-input"
                              type="number"
                              min={0.5}
                              step={0.5}
                              value={matrix[row.responseKey]}
                              onChange={e => handleChange(row.responseKey, e.target.value)}
                              style={{ paddingRight: 44 }}
                            />
                            <span className="input-unit">giờ</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div className="matrix-input-wrapper">
                            <input
                              className="form-input"
                              type="number"
                              min={1}
                              step={1}
                              value={matrix[row.resolveKey]}
                              onChange={e => handleChange(row.resolveKey, e.target.value)}
                              style={{ paddingRight: 44 }}
                            />
                            <span className="input-unit">giờ</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '10px 0 0 0' }}>
                {schedule === 'business'
                  ? '⚠️ Chế độ Giờ hành chính sẽ tự động loại trừ Thứ Bảy, Chủ Nhật và ngày lễ quốc gia khi tính đếm ngược SLA.'
                  : '🌐 Chế độ 24x7 tính toán liên tục 24 giờ mỗi ngày, kể cả cuối tuần và ngày lễ.'}
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Hủy bỏ</button>
            <button type="submit" className="btn-primary">💾 Lưu chính sách</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 12,
  fontWeight: 700,
  color: '#475569',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  borderBottom: '1px solid #E2E8F0',
  textAlign: 'left',
  backgroundColor: '#F8FAFC',
};
const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'middle',
  borderBottom: '1px solid #F1F5F9',
};

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────
export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sla'>('overview');
  const [slaModalOpen, setSlaModalOpen] = useState(false);
  const [slaFilter, setSlaFilter] = useState('month');
  const [policies, setPolicies] = useState<SLAPolicy[]>(INITIAL_SLA_POLICIES);

  const handleTogglePolicy = (id: number) => {
    setPolicies(prev => prev.map(p => (p.id === id ? { ...p, active: !p.active } : p)));
  };

  const handleAddPolicy = (data: Omit<SLAPolicy, 'id' | 'active'>) => {
    setPolicies(prev => [...prev, { ...data, id: Date.now(), active: true }]);
  };

  // ── Metric Cards ──────────────────────────
  const metrics = [
    { label: 'Tổng số phiếu', value: '1,247', change: '+12%', changeType: 'blue' as const, icon: '🎫', iconClass: 'total' },
    { label: 'Đang mở', value: '183', change: '+5 hôm nay', changeType: 'red' as const, icon: '🔓', iconClass: 'open' },
    { label: 'Đã giải quyết', value: '1,031', change: '+8%', changeType: 'green' as const, icon: '✅', iconClass: 'resolved' },
    { label: 'Vi phạm SLA (%)', value: '14.2%', change: '-2.1%', changeType: 'green' as const, icon: '⚠️', iconClass: 'breach' },
  ];

  const getStatusLabel = (s: UrgentTicket['status']) => {
    if (s === 'overdue') return { text: 'Quá hạn', cls: 'escaped' };
    if (s === 'critical') return { text: 'Nguy cấp', cls: 'escaped' };
    return { text: 'Gần hạn', cls: 'processing' };
  };

  const getPriorityLabel = (p: UrgentTicket['priority']) => {
    if (p === 'high') return { text: 'Cao', cls: 'high' };
    if (p === 'medium') return { text: 'TB', cls: 'medium' };
    return { text: 'Thấp', cls: 'low' };
  };

  const scheduleLabel = (s: 'business' | '24x7') =>
    s === 'business' ? '🏢 Hành chính' : '🌐 24x7';

  return (
    <div className="admin-container">
      <div className="admin-content">

        {/* ── Header Card ── */}
        <div className="admin-header-card">
          <div className="admin-title-area">
            <h1 className="admin-title">📊 Bảng điều khiển & Quản lý SLA</h1>
            <p className="admin-subtitle">Theo dõi hiệu suất vận hành IT và cấu hình chính sách SLA · Tháng 5/2026</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Filter selector */}
            <select
              className="filter-select"
              value={slaFilter}
              onChange={e => setSlaFilter(e.target.value)}
              aria-label="Bộ lọc thời gian"
            >
              <option value="week">7 ngày qua</option>
              <option value="month">Tháng này</option>
              <option value="quarter">Quý này</option>
              <option value="year">Năm nay</option>
            </select>
            {/* Tab Buttons */}
            <div className="admin-tabs-row">
              <button
                id="tab-overview"
                className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                📈 Tổng quan
              </button>
              <button
                id="tab-sla"
                className={`admin-tab-btn ${activeTab === 'sla' ? 'active' : ''}`}
                onClick={() => setActiveTab('sla')}
              >
                ⏱️ Quản lý SLA
              </button>
            </div>
          </div>
        </div>

        {/* ── Metric Cards (4 boxes) ── */}
        <div className="metrics-grid">
          {metrics.map((m, i) => (
            <div key={i} className="metric-card">
              <div className="metric-info">
                <span className="metric-label">{m.label}</span>
                <p className="metric-value">{m.value}</p>
                <span className={`metric-badge ${m.changeType}`}>{m.change}</span>
              </div>
              <div className={`metric-icon-box ${m.iconClass}`}>{m.icon}</div>
            </div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════
            TAB: TỔNG QUAN
        ═══════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <>
            {/* ── Charts 2×2 Grid ── */}
            <div className="charts-grid">

              {/* Chart 1: Line – Trend */}
              <div className="chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">📈 Xu hướng phiếu theo thời gian</h3>
                  <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Năm 2026</span>
                </div>
                <LineChart />
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ backgroundColor: '#2563EB', borderRadius: 2 }} />
                    <span>Số phiếu tạo mới</span>
                  </div>
                </div>
              </div>

              {/* Chart 2: Donut – Priority */}
              <div className="chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">🎯 Phiếu theo mức độ ưu tiên</h3>
                  <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Tháng 5/2026</span>
                </div>
                <DonutChart />
              </div>

              {/* Chart 3: Bar – SLA */}
              <div className="chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">⚡ Tỷ lệ đạt / vi phạm SLA</h3>
                  <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Tháng 5/2026</span>
                </div>
                <div className="chart-wrapper" style={{ height: 220, alignItems: 'stretch' }}>
                  <SLABarChart />
                </div>
              </div>

              {/* Chart 4: Staff Efficiency */}
              <div className="chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">👥 Hiệu suất xử lý nhân viên</h3>
                  <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Tháng 5/2026</span>
                </div>
                <EfficiencyChart />
              </div>

            </div>

            {/* ── Priority Tickets Table ── */}
            <div className="table-card">
              <div className="table-card-header">
                <h3 className="table-card-title">
                  🚨 Danh sách ưu tiên xử lý
                  <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, backgroundColor: '#FEF2F2', padding: '2px 8px', borderRadius: 6 }}>
                    {URGENT_TICKETS.filter(t => t.status === 'overdue' || t.status === 'critical').length} cần xử lý ngay
                  </span>
                </h3>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, alignSelf: 'center' }}>
                    Quá hạn · Gần hạn · Nghiêm trọng
                  </span>
                  <button className="btn-outline" onClick={() => alert('Xuất danh sách ưu tiên ra Excel...')}>
                    📥 Xuất báo cáo
                  </button>
                </div>
              </div>
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mã phiếu</th>
                      <th>Tiêu đề</th>
                      <th>Ưu tiên</th>
                      <th>Trạng thái</th>
                      <th>Kỹ thuật viên</th>
                      <th>SLA Deadline</th>
                      <th>Thời gian còn lại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {URGENT_TICKETS.map(ticket => {
                      const s = getStatusLabel(ticket.status);
                      const p = getPriorityLabel(ticket.priority);
                      return (
                        <tr key={ticket.id} className="ticket-row-clickable">
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563EB', fontSize: 13 }}>
                              {ticket.id}
                            </span>
                          </td>
                          <td style={{ maxWidth: 280 }}>
                            <span style={{ fontWeight: 600, color: '#0F172A', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {ticket.title}
                            </span>
                          </td>
                          <td><span className={`priority-badge ${p.cls}`}>{p.text}</span></td>
                          <td><span className={`status-badge ${s.cls}`}>{s.text}</span></td>
                          <td style={{ fontWeight: 600, color: '#334155' }}>{ticket.assignee}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 13, color: '#475569' }}>{ticket.sla_deadline}</td>
                          <td>
                            <span style={{
                              fontWeight: 700,
                              fontSize: 13,
                              color: ticket.status === 'overdue' ? '#DC2626'
                                : ticket.status === 'critical' ? '#D97706'
                                : '#16A34A'
                            }}>
                              {ticket.remaining}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════
            TAB: QUẢN LÝ SLA
        ═══════════════════════════════════════════ */}
        {activeTab === 'sla' && (
          <>
            {/* SLA Policy Table */}
            <div className="table-card">
              <div className="table-card-header">
                <h3 className="table-card-title">
                  ⏱️ Chính sách SLA hiện tại
                  <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, backgroundColor: '#F0FDF4', padding: '2px 8px', borderRadius: 6 }}>
                    {policies.filter(p => p.active).length} đang áp dụng
                  </span>
                </h3>
                <button
                  id="btn-create-sla"
                  className="btn-primary"
                  onClick={() => setSlaModalOpen(true)}
                >
                  ＋ Tạo chính sách SLA mới
                </button>
              </div>

              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Tên chính sách</th>
                      <th>Chế độ</th>
                      <th style={{ textAlign: 'center' }}>Cao (Phản hồi / Xử lý)</th>
                      <th style={{ textAlign: 'center' }}>Trung bình (Phản hồi / Xử lý)</th>
                      <th style={{ textAlign: 'center' }}>Thấp (Phản hồi / Xử lý)</th>
                      <th>Nhắc trước</th>
                      <th style={{ textAlign: 'center' }}>Áp dụng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{p.name}</div>
                          {p.active && <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600, marginTop: 2 }}>● Đang áp dụng</div>}
                        </td>
                        <td>
                          <span style={{
                            fontSize: 12,
                            fontWeight: 700,
                            backgroundColor: p.schedule === 'business' ? '#EFF6FF' : '#FAF5FF',
                            color: p.schedule === 'business' ? '#2563EB' : '#7C3AED',
                            padding: '3px 8px',
                            borderRadius: 6,
                          }}>
                            {scheduleLabel(p.schedule)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#EF4444' }}>{p.high_response}h</span>
                          <span style={{ color: '#94A3B8' }}> / </span>
                          <span style={{ fontWeight: 700, color: '#EF4444' }}>{p.high_resolve}h</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#D97706' }}>{p.medium_response}h</span>
                          <span style={{ color: '#94A3B8' }}> / </span>
                          <span style={{ fontWeight: 700, color: '#D97706' }}>{p.medium_resolve}h</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#16A34A' }}>{p.low_response}h</span>
                          <span style={{ color: '#94A3B8' }}> / </span>
                          <span style={{ fontWeight: 700, color: '#16A34A' }}>{p.low_resolve}h</span>
                        </td>
                        <td>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{p.remind_before} phút</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <label className="switch" title={p.active ? 'Đang bật – Nhấn để tắt' : 'Đang tắt – Nhấn để bật'}>
                            <input
                              type="checkbox"
                              checked={p.active}
                              onChange={() => handleTogglePolicy(p.id)}
                              aria-label={`Bật/tắt chính sách ${p.name}`}
                            />
                            <span className="slider" />
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SLA Info Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
              <div className="sla-info-card" style={{ borderLeft: '4px solid #2563EB' }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>🏢</div>
                <h4 className="sla-info-title">Giờ hành chính</h4>
                <p className="sla-info-desc">Đếm ngược SLA trong khung giờ 08:00–17:30 (Thứ 2 – Thứ 6). Tự động bỏ qua Thứ 7, Chủ nhật và các ngày lễ quốc gia Việt Nam.</p>
              </div>
              <div className="sla-info-card" style={{ borderLeft: '4px solid #7C3AED' }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>🌐</div>
                <h4 className="sla-info-title">Chế độ 24x7</h4>
                <p className="sla-info-desc">Tính liên tục 24 giờ mỗi ngày, 7 ngày mỗi tuần, kể cả cuối tuần và ngày lễ. Phù hợp với các sự cố nghiêm trọng cấp cao.</p>
              </div>
              <div className="sla-info-card" style={{ borderLeft: '4px solid #F59E0B' }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>🔔</div>
                <h4 className="sla-info-title">Ngưỡng nhắc nhở</h4>
                <p className="sla-info-desc">Hệ thống tự động gửi cảnh báo đến kỹ thuật viên và Quản lý IT khi phiếu sắp đến hạn SLA theo ngưỡng đã cài đặt (phút).</p>
              </div>
              <div className="sla-info-card" style={{ borderLeft: '4px solid #10B981' }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>📊</div>
                <h4 className="sla-info-title">Áp dụng tức thì</h4>
                <p className="sla-info-desc">Chính sách SLA được kích hoạt sẽ áp dụng cho toàn bộ phiếu mới tạo. Phiếu cũ vẫn giữ cấu hình SLA tại thời điểm tạo.</p>
              </div>
            </div>

            {/* Priority Tickets at Bottom */}
            <div className="table-card">
              <div className="table-card-header">
                <h3 className="table-card-title">
                  🚨 Phiếu vi phạm & gần vi phạm SLA
                </h3>
                <button className="btn-outline" onClick={() => alert('Xuất danh sách vi phạm SLA...')}>
                  📥 Xuất báo cáo
                </button>
              </div>
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mã phiếu</th>
                      <th>Tiêu đề</th>
                      <th>Ưu tiên</th>
                      <th>Trạng thái SLA</th>
                      <th>Kỹ thuật viên</th>
                      <th>SLA Deadline</th>
                      <th>Thời gian còn lại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {URGENT_TICKETS.map(ticket => {
                      const s = getStatusLabel(ticket.status);
                      const p = getPriorityLabel(ticket.priority);
                      return (
                        <tr key={ticket.id} className="ticket-row-clickable">
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563EB', fontSize: 13 }}>
                              {ticket.id}
                            </span>
                          </td>
                          <td style={{ maxWidth: 280 }}>
                            <span style={{ fontWeight: 600, color: '#0F172A' }}>{ticket.title}</span>
                          </td>
                          <td><span className={`priority-badge ${p.cls}`}>{p.text}</span></td>
                          <td><span className={`status-badge ${s.cls}`}>{s.text}</span></td>
                          <td style={{ fontWeight: 600 }}>{ticket.assignee}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 13, color: '#475569' }}>{ticket.sla_deadline}</td>
                          <td>
                            <span style={{
                              fontWeight: 700,
                              fontSize: 13,
                              color: ticket.status === 'overdue' ? '#DC2626'
                                : ticket.status === 'critical' ? '#D97706'
                                : '#16A34A'
                            }}>
                              {ticket.remaining}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>

      {/* ── SLA Modal ── */}
      {slaModalOpen && (
        <SLAModal
          onClose={() => setSlaModalOpen(false)}
          onSave={handleAddPolicy}
        />
      )}
    </div>
  );
};
