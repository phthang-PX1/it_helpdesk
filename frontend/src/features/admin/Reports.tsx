/**
 * Reports.tsx  –  UC-15: Giám sát hiệu suất vận hành IT qua báo cáo
 * Phân hệ Báo cáo thống kê – chỉ dành cho Quản lý IT.
 *
 * ⚠️  STUB – Đang chờ tích hợp dữ liệu API và bộ lọc nâng cao.
 */
import React, { useState } from 'react';
import './Reports.css';

// ─── Mock report templates ────────────────────────────────────────────────────
const REPORT_TEMPLATES = [
  { id: 'kpi-staff',    icon: '👥', name: 'KPI Nhân viên',          desc: 'Điểm đánh giá sao trung bình và số phiếu hoàn thành theo từng kỹ thuật viên trong kỳ.' },
  { id: 'sla-breach',   icon: '⚠️', name: 'Vi phạm SLA',           desc: 'Danh sách và thống kê chi tiết các phiếu đã vượt thời gian cam kết SLA.' },
  { id: 'ticket-trend', icon: '📈', name: 'Xu hướng Ticket',        desc: 'Biểu đồ lượng phiếu tạo mới, giải quyết và tồn đọng theo tuần / tháng / quý.' },
  { id: 'category',     icon: '🗂️', name: 'Phân loại sự cố',       desc: 'Phân bố ticket theo danh mục (Phần cứng, Phần mềm, Mạng, Khác) và mức độ ưu tiên.' },
];

export const Reports: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>('kpi-staff');
  const [dateFrom, setDateFrom] = useState('2026-05-01');
  const [dateTo,   setDateTo]   = useState('2026-05-31');
  const [team,     setTeam]     = useState('all');
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    if (!selectedTemplate) { alert('Vui lòng chọn mẫu báo cáo!'); return; }
    setGenerated(true);
  };

  const handleExport = (fmt: 'excel' | 'pdf') => {
    alert(`Đang xuất báo cáo định dạng ${fmt.toUpperCase()}...`);
  };

  const selected = REPORT_TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <div className="reports-container">

      {/* ── Header ── */}
      <div className="reports-header">
        <div>
          <h1 className="reports-title">📊 Báo cáo & Thống kê</h1>
          <p className="reports-subtitle">Tra cứu dữ liệu lịch sử, phân tích KPI và xuất báo cáo hiệu suất vận hành IT.</p>
        </div>
      </div>

      <div className="reports-layout">

        {/* ── Left: Template picker ── */}
        <aside className="reports-sidebar">
          <p className="reports-sidebar-title">📋 Chọn mẫu báo cáo</p>
          <div className="template-list">
            {REPORT_TEMPLATES.map(tmpl => (
              <button
                key={tmpl.id}
                id={`report-tmpl-${tmpl.id}`}
                className={`template-item ${selectedTemplate === tmpl.id ? 'active' : ''}`}
                onClick={() => { setSelectedTemplate(tmpl.id); setGenerated(false); }}
              >
                <span className="template-icon">{tmpl.icon}</span>
                <div>
                  <div className="template-name">{tmpl.name}</div>
                  <div className="template-desc">{tmpl.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* ── Right: Filter + Preview ── */}
        <main className="reports-main">

          {/* Filter row */}
          <div className="reports-filter-card">
            <p className="filter-card-title">🔍 Bộ lọc dữ liệu</p>
            <div className="filter-grid">
              <div className="filter-group">
                <label className="filter-label">Từ ngày</label>
                <input id="report-date-from" className="filter-input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div className="filter-group">
                <label className="filter-label">Đến ngày</label>
                <input id="report-date-to" className="filter-input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
              <div className="filter-group">
                <label className="filter-label">Nhóm kỹ thuật</label>
                <select id="report-team" className="filter-input" value={team} onChange={e => setTeam(e.target.value)}>
                  <option value="all">Tất cả nhóm</option>
                  <option value="l1">Nhóm L1</option>
                  <option value="l2">Nhóm L2</option>
                </select>
              </div>
              <div className="filter-group filter-action">
                <button id="btn-generate-report" className="btn-generate" onClick={handleGenerate}>
                  ▶ Tạo báo cáo
                </button>
              </div>
            </div>
          </div>

          {/* Preview area */}
          <div className="reports-preview-card">
            {!selectedTemplate ? (
              <div className="reports-empty">
                <div style={{ fontSize: 52, marginBottom: 16 }}>📋</div>
                <p style={{ fontWeight: 700, color: '#475569', marginBottom: 6 }}>Chưa chọn mẫu báo cáo</p>
                <p style={{ color: '#94A3B8', fontSize: 13.5 }}>Hãy chọn một mẫu báo cáo từ danh sách bên trái để bắt đầu.</p>
              </div>
            ) : !generated ? (
              <div className="reports-empty">
                <div style={{ fontSize: 52, marginBottom: 16 }}>{selected?.icon}</div>
                <p style={{ fontWeight: 700, color: '#475569', marginBottom: 6 }}>{selected?.name}</p>
                <p style={{ color: '#94A3B8', fontSize: 13.5, maxWidth: 400, textAlign: 'center' }}>{selected?.desc}</p>
                <p style={{ color: '#94A3B8', fontSize: 13, marginTop: 12 }}>Nhấn <strong>"Tạo báo cáo"</strong> để tổng hợp và hiển thị kết quả.</p>
              </div>
            ) : (
              <div>
                <div className="preview-header">
                  <div>
                    <h3 className="preview-title">{selected?.icon} {selected?.name}</h3>
                    <p className="preview-period">Kỳ báo cáo: {dateFrom} → {dateTo} · Nhóm: {team === 'all' ? 'Tất cả' : team.toUpperCase()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button id="btn-export-excel" className="btn-export excel" onClick={() => handleExport('excel')}>📥 Excel</button>
                    <button id="btn-export-pdf"   className="btn-export pdf"   onClick={() => handleExport('pdf')}>📄 PDF</button>
                  </div>
                </div>

                {/* Stub mock table */}
                <div className="preview-table-wrapper">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Nhân viên</th><th>Số phiếu</th><th>Giải quyết đúng hạn</th><th>Vi phạm SLA</th><th>Điểm KPI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['1', 'Trần Văn Bình (L1)', '42', '40', '2', '4.7 ⭐'],
                        ['2', 'Lê Thị Cẩm (L1)',   '37', '33', '4', '4.4 ⭐'],
                        ['3', 'Phạm Đình Dũng (L2)','29', '29', '0', '4.9 ⭐'],
                        ['4', 'Nguyễn Thị Hoa (L1)','33', '27', '6', '4.1 ⭐'],
                        ['5', 'Hoàng Văn Phúc (L2)','25', '25', '0', '5.0 ⭐'],
                      ].map(row => (
                        <tr key={row[0]}>
                          {row.map((cell, i) => <td key={i}>{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="preview-note">
                  📌 Dữ liệu được chốt tại thời điểm tạo báo cáo. Nhấn "Tạo báo cáo" để làm mới số liệu.
                </p>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
};
