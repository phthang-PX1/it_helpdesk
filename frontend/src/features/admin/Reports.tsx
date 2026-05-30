/**
 * Reports.tsx  –  UC-15: Giám sát hiệu suất vận hành IT qua báo cáo
 * Phân hệ Báo cáo thống kê – chỉ dành cho Quản lý IT.
 */
import React, { useState } from 'react';
import './Reports.css';
import { ticketService, type Ticket } from '../../services/ticket.service';

// ─── Mock report templates ────────────────────────────────────────────────────
const REPORT_TEMPLATES = [
  { id: 'kpi-staff',    icon: '👥', name: 'KPI Nhân viên',          desc: 'Điểm đánh giá sao trung bình và số phiếu hoàn thành theo từng kỹ thuật viên trong kỳ.' },
  { id: 'sla-breach',   icon: '⚠️', name: 'Vi phạm SLA',           desc: 'Danh sách và thống kê chi tiết các phiếu đã vượt thời gian cam kết SLA.' },
  { id: 'ticket-trend', icon: '📈', name: 'Xu hướng Ticket',        desc: 'Biểu đồ lượng phiếu tạo mới, giải quyết và tồn đọng theo trạng thái.' },
  { id: 'category',     icon: '🗂️', name: 'Phân loại sự cố',       desc: 'Phân bố ticket theo mức độ ưu tiên.' },
];

export const Reports: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>('kpi-staff');
  const [dateFrom, setDateFrom] = useState('2026-05-01');
  const [dateTo,   setDateTo]   = useState('2026-05-31');
  const [team,     setTeam]     = useState('all');
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [staffKPI, setStaffKPI] = useState<any[]>([]);

  const handleGenerate = async () => {
    if (!selectedTemplate) { alert('Vui lòng chọn mẫu báo cáo!'); return; }
    
    setLoading(true);
    setGenerated(false);
    try {
      const res = await ticketService.getTickets({ limit: 1000 });
      let data = res.data || [];
      
      // Lọc theo ngày
      const from = new Date(dateFrom).getTime();
      const to = new Date(dateTo).getTime() + 86400000; // end of day
      
      data = data.filter(t => {
        const time = new Date(t.ngay_tao).getTime();
        return time >= from && time <= to;
      });

      // Lọc theo nhóm
      if (team !== 'all') {
        const teamNameFilter = team === 'l1' ? 'L1' : 'L2';
        data = data.filter(t => t.nhom_xu_ly?.ten_nhom?.includes(teamNameFilter));
      }

      setTickets(data);

      if (selectedTemplate === 'kpi-staff') {
        // Gom nhóm theo nhân viên hỗ trợ
        const staffMap: Record<number, any> = {};
        data.forEach(t => {
          if (t.nguoi_ho_tro_id && t.nguoi_ho_tro) {
            if (!staffMap[t.nguoi_ho_tro_id]) {
              staffMap[t.nguoi_ho_tro_id] = {
                name: t.nguoi_ho_tro.ho_ten,
                total: 0,
                completed: 0,
                slaViolations: 0
              };
            }
            staffMap[t.nguoi_ho_tro_id].total++;
            if (t.trang_thai === 'DA_GIAI_QUYET' || t.trang_thai === 'DA_DONG') {
              staffMap[t.nguoi_ho_tro_id].completed++;
            }
            const hasViolated = t.danh_sach_sla?.some(s => s.da_vi_pham);
            if (hasViolated) {
              staffMap[t.nguoi_ho_tro_id].slaViolations++;
            }
          }
        });
        setStaffKPI(Object.values(staffMap));
      }

      setGenerated(true);
    } catch (error) {
      console.error('Failed to generate report', error);
      alert('Lỗi khi lấy dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
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
                <button id="btn-generate-report" className="btn-generate" onClick={handleGenerate} disabled={loading}>
                  {loading ? 'Đang tạo...' : '▶ Tạo báo cáo'}
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

                {selectedTemplate === 'kpi-staff' && (
                  <div className="preview-table-wrapper">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          <th>#</th><th>Nhân viên</th><th>Tổng số phiếu phụ trách</th><th>Đã hoàn thành</th><th>Vi phạm SLA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffKPI.map((kpi, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td style={{ fontWeight: 600 }}>{kpi.name}</td>
                            <td>{kpi.total}</td>
                            <td>{kpi.completed}</td>
                            <td style={{ color: kpi.slaViolations > 0 ? '#DC2626' : '#16A34A', fontWeight: 600 }}>
                              {kpi.slaViolations}
                            </td>
                          </tr>
                        ))}
                        {staffKPI.length === 0 && (
                          <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>Không có dữ liệu trong khoảng thời gian này.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedTemplate === 'sla-breach' && (
                  <div className="preview-table-wrapper">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          <th>Mã phiếu</th><th>Tiêu đề</th><th>Người hỗ trợ</th><th>Trạng thái SLA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.filter(t => t.danh_sach_sla?.some(s => s.da_vi_pham)).map(t => (
                          <tr key={t.phieu_ho_tro_id}>
                            <td style={{ fontWeight: 600, color: '#2563EB' }}>{t.ma_phieu}</td>
                            <td>{t.tieu_de}</td>
                            <td>{t.nguoi_ho_tro?.ho_ten || 'Chưa phân công'}</td>
                            <td><span style={{ color: '#DC2626', fontWeight: 600, background: '#FEE2E2', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Vi phạm SLA</span></td>
                          </tr>
                        ))}
                        {tickets.filter(t => t.danh_sach_sla?.some(s => s.da_vi_pham)).length === 0 && (
                          <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>Tuyệt vời! Không có phiếu nào vi phạm SLA trong kỳ.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedTemplate === 'category' && (
                  <div className="preview-table-wrapper">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          <th>Mức độ ưu tiên</th><th>Số lượng phiếu</th><th>Tỷ lệ phần trăm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {['THAP', 'TRUNG_BINH', 'CAO'].map(prio => {
                          const count = tickets.filter(t => t.muc_do_uu_tien === prio).length;
                          const percent = tickets.length > 0 ? ((count / tickets.length) * 100).toFixed(1) : 0;
                          return (
                            <tr key={prio}>
                              <td style={{ fontWeight: 600 }}>{prio === 'THAP' ? 'Thấp' : prio === 'TRUNG_BINH' ? 'Trung bình' : 'Cao'}</td>
                              <td>{count} phiếu</td>
                              <td>{percent}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedTemplate === 'ticket-trend' && (
                  <div className="preview-table-wrapper">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          <th>Trạng thái phiếu</th><th>Số lượng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {['MOI_TAO', 'DANG_GIAI_QUYET', 'DA_GIAI_QUYET', 'DA_DONG'].map(status => {
                          const count = tickets.filter(t => t.trang_thai === status).length;
                          const lbl = status === 'MOI_TAO' ? 'Mới tạo' : status === 'DANG_GIAI_QUYET' ? 'Đang giải quyết' : status === 'DA_GIAI_QUYET' ? 'Đã giải quyết' : 'Đã đóng';
                          return (
                            <tr key={status}>
                              <td style={{ fontWeight: 600 }}>{lbl}</td>
                              <td>{count} phiếu</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="preview-note">
                  📌 Dữ liệu được tính toán trực tiếp từ {tickets.length} phiếu trong khoảng thời gian đã chọn.
                </p>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
};
