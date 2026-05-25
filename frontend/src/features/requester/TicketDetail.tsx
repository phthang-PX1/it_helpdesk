import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TicketDetail.css';

interface Comment {
  id: string;
  author: string;
  role: string;
  text: string;
  date: string;
  isItSupport: boolean;
  attachments?: { name: string; size: string }[];
}

interface TimelineEvent {
  status: string;
  date: string;
  executor: string;
  note: string;
  isCurrent: boolean;
}

interface TicketData {
  id: string;
  title: string;
  description: string;
  status: 'New' | 'Pending' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  assignee: string;
  createdAt: string;
  requesterName: string;
  requesterEmail: string;
  deviceSoftware: string;
  slaDeadline: number; // timestamp
  tags: string[];
}

// Danh sách các phiếu mẫu tương ứng với ID để hiển thị thực tế
const MOCK_TICKETS: Record<string, TicketData> = {
  'HW-2026-0042': {
    id: 'HW-2026-0042',
    title: 'Hỗ trợ lỗi màn hình xanh (BSOD) khi đang họp Zoom',
    description: 'Tôi đang sử dụng ứng dụng Zoom để họp với đối tác thì máy tính bỗng nhiên hiển thị màn hình xanh chết chóc (BSOD) với mã lỗi WHEA_UNCORRECTABLE_ERROR. Hiện tại máy khởi động lại rất chậm và thường xuyên bị treo sau 5-10 phút sử dụng.',
    status: 'Pending',
    priority: 'High',
    assignee: 'Nguyễn Văn Hỗ Trợ (IT Support L1)',
    createdAt: '25/05/2026 10:30:00',
    requesterName: 'Nguyễn Văn A',
    requesterEmail: 'user@company.com',
    deviceSoftware: 'Laptop Dell Latitude 7420 / Windows 11 Pro',
    slaDeadline: Date.now() + 2 * 3600 * 1000 + 14 * 60 * 1000, // 2 giờ 14 phút
    tags: ['Phần cứng', 'Zoom', 'Màn hình xanh']
  },
  'SW-2026-0045': {
    id: 'SW-2026-0045',
    title: 'Yêu cầu cấp phát bản quyền phần mềm Figma Design Pro',
    description: 'Để phục vụ dự án thiết kế giao diện cổng thông tin Helpdesk mới cho công ty, bộ phận UI/UX của chúng tôi cần được cấp phát thêm 1 bản quyền phần mềm Figma Design Pro hoạt động trên tài khoản email công ty.',
    status: 'New',
    priority: 'Medium',
    assignee: 'Chưa phân công (L1 tiếp nhận)',
    createdAt: '25/05/2026 10:15:00',
    requesterName: 'Nguyễn Văn A',
    requesterEmail: 'user@company.com',
    deviceSoftware: 'Figma Desktop App',
    slaDeadline: Date.now() + 15 * 3600 * 1000,
    tags: ['Cấp phát', 'Phần mềm', 'Figma']
  },
  'NW-2026-0041': {
    id: 'NW-2026-0041',
    title: 'Không kết nối được vào mạng Wifi Office_HCM_5G',
    description: 'Từ sáng nay tôi không thể kết nối vào mạng Wifi Office_HCM_5G của văn phòng HCM. Máy báo lỗi "Incorrect Password" mặc dù tôi đã nhập đúng mật khẩu nội bộ mới nhất. Hiện tại tôi đang phải sử dụng mạng dây tạm thời.',
    status: 'Pending',
    priority: 'High',
    assignee: 'Phạm Văn Mạng (IT Support L2)',
    createdAt: '25/05/2026 09:30:00',
    requesterName: 'Nguyễn Văn A',
    requesterEmail: 'user@company.com',
    deviceSoftware: 'Mạng Wifi văn phòng HCM',
    slaDeadline: Date.now() + 4 * 60 * 1000 + 12 * 1000, // 4 phút
    tags: ['Mạng Wifi', 'Kết nối', 'Văn phòng HCM']
  },
  'HW-2026-0038': {
    id: 'HW-2026-0038',
    title: 'Thay pin máy tính xách tay Dell Latitude 7420 bị chai',
    description: 'Pin máy tính Dell Latitude của tôi hiện tại bị chai nghiêm trọng, chỉ sử dụng được khoảng 15-20 phút sau khi rút sạc. Màn hình Windows cũng hiện cảnh báo "Consider replacing your battery". Đề xuất IT hỗ trợ thay pin mới.',
    status: 'Resolved',
    priority: 'Low',
    assignee: 'Nguyễn Văn Hỗ Trợ (IT Support L1)',
    createdAt: '24/05/2026 08:00:00',
    requesterName: 'Nguyễn Văn A',
    requesterEmail: 'user@company.com',
    deviceSoftware: 'Dell Latitude 7420 / Linh kiện Pin',
    slaDeadline: Date.now() - 2 * 3600 * 1000, // đã hoàn thành
    tags: ['Phần cứng', 'Thay pin', 'Dell']
  }
};

const DEFAULT_TICKET: TicketData = {
  id: 'SW-2026-0001',
  title: 'Lỗi không đăng nhập được hệ thống quản lý CRM nội bộ',
  description: 'Tôi nhập đúng tài khoản và mật khẩu LDAP nhưng hệ thống CRM liên tục hiển thị lỗi "500 Internal Server Error". Nhờ IT kiểm tra giúp xem tài khoản của tôi có bị khóa trên hệ thống CRM hay không.',
  status: 'New',
  priority: 'Medium',
  assignee: 'Chưa phân công (L1 tiếp nhận)',
  createdAt: '25/05/2026 11:00:00',
  requesterName: 'Nguyễn Văn A',
  requesterEmail: 'user@company.com',
  deviceSoftware: 'Hệ thống CRM / Web Browser',
  slaDeadline: Date.now() + 11 * 3600 * 1000,
  tags: ['Tài khoản', 'Phần mềm', 'CRM']
};

export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Khởi tạo thông tin Ticket dựa trên ID từ URL hoặc fallback về mặc định
  const initialTicket = id && MOCK_TICKETS[id] ? MOCK_TICKETS[id] : { ...DEFAULT_TICKET, id: id || DEFAULT_TICKET.id };

  const [ticket, setTicket] = useState<TicketData>(initialTicket);

  // Danh sách bình luận giả lập
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'C-001',
      author: 'Nguyễn Văn A',
      role: 'Người yêu cầu',
      text: 'Mô tả thêm: Tôi đã thử khởi động lại máy 3 lần nhưng tình trạng màn hình xanh vẫn xuất hiện ngay sau khi Zoom kết nối video.',
      date: '25/05/2026 10:35:00',
      isItSupport: false
    },
    {
      id: 'C-002',
      author: 'Nguyễn Văn Hỗ Trợ',
      role: 'IT Support L1',
      text: 'Chào anh A, em đã nhận được thông tin sự cố. Em đang kiểm tra lại log hệ thống xem có xung đột driver card màn hình với Zoom không nhé.',
      date: '25/05/2026 10:45:00',
      isItSupport: true
    }
  ]);

  // Tiến trình dòng thời gian (Timeline Events)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([
    {
      status: 'Mới tạo',
      date: '25/05/2026 10:30:00',
      executor: 'Nguyễn Văn A (Người tạo)',
      note: 'Tạo phiếu yêu cầu hỗ trợ thành công qua Cổng Portal.',
      isCurrent: false
    },
    {
      status: 'Đang giải quyết',
      date: '25/05/2026 10:42:00',
      executor: 'Hệ thống tự động',
      note: 'Phân công phiếu cho kỹ thuật viên Nguyễn Văn Hỗ Trợ (L1) và bắt đầu tính SLA.',
      isCurrent: true
    }
  ]);

  // States nhập bình luận mới
  const [newComment, setNewComment] = useState('');
  const [commentFiles, setCommentFiles] = useState<{ name: string; size: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Khảo sát độ hài lòng (UC-04)
  const [isSatisfied, setIsSatisfied] = useState<boolean | null>(null);
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [surveyComment, setSurveyComment] = useState('');
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [surveyError, setSurveyError] = useState<string | null>(null);

  // Đồng hồ đếm ngược SLA
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Cập nhật đồng hồ đếm ngược SLA
  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = ticket.slaDeadline - Date.now();
      setTimeLeft(diff > 0 ? diff : 0);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [ticket.slaDeadline]);

  // Cập nhật dòng thời gian tương ứng khi trạng thái ticket thay đổi
  useEffect(() => {
    let newEvents: TimelineEvent[] = [];
    const nowStr = new Date().toLocaleString('vi-VN');

    if (ticket.status === 'New') {
      newEvents = [
        {
          status: 'Mới tạo',
          date: ticket.createdAt,
          executor: `${ticket.requesterName} (Người tạo)`,
          note: 'Tạo phiếu yêu cầu hỗ trợ thành công qua Cổng Portal.',
          isCurrent: true
        }
      ];
    } else if (ticket.status === 'Pending') {
      newEvents = [
        {
          status: 'Mới tạo',
          date: ticket.createdAt,
          executor: `${ticket.requesterName} (Người tạo)`,
          note: 'Tạo phiếu yêu cầu hỗ trợ thành công qua Cổng Portal.',
          isCurrent: false
        },
        {
          status: 'Đang giải quyết',
          date: nowStr,
          executor: ticket.assignee,
          note: 'Kỹ thuật viên tiếp nhận sự cố và tiến hành xử lý.',
          isCurrent: true
        }
      ];
    } else if (ticket.status === 'Resolved') {
      newEvents = [
        {
          status: 'Mới tạo',
          date: ticket.createdAt,
          executor: `${ticket.requesterName} (Người tạo)`,
          note: 'Tạo phiếu yêu cầu hỗ trợ thành công qua Cổng Portal.',
          isCurrent: false
        },
        {
          status: 'Đang giải quyết',
          date: '25/05/2026 10:42:00',
          executor: ticket.assignee,
          note: 'Kỹ thuật viên tiếp nhận sự cố và tiến hành xử lý.',
          isCurrent: false
        },
        {
          status: 'Đã giải quyết',
          date: nowStr,
          executor: ticket.assignee,
          note: 'Đã xử lý xong lỗi. Trạng thái hệ thống đã bình thường. Chờ người dùng xác nhận và đánh giá.',
          isCurrent: true
        }
      ];
    } else if (ticket.status === 'Closed') {
      newEvents = [
        {
          status: 'Mới tạo',
          date: ticket.createdAt,
          executor: `${ticket.requesterName} (Người tạo)`,
          note: 'Tạo phiếu yêu cầu hỗ trợ thành công qua Cổng Portal.',
          isCurrent: false
        },
        {
          status: 'Đang giải quyết',
          date: '25/05/2026 10:42:00',
          executor: ticket.assignee,
          note: 'Kỹ thuật viên tiếp nhận sự cố và tiến hành xử lý.',
          isCurrent: false
        },
        {
          status: 'Đã giải quyết',
          date: '25/05/2026 11:20:00',
          executor: ticket.assignee,
          note: 'Đã xử lý xong lỗi.',
          isCurrent: false
        },
        {
          status: 'Đã đóng',
          date: nowStr,
          executor: 'Hệ thống tự động',
          note: 'Phiếu đã đóng hoàn toàn. Không cho phép bình luận hoặc chỉnh sửa.',
          isCurrent: true
        }
      ];
    }

    setTimeline(newEvents);
  }, [ticket.status, ticket.createdAt, ticket.assignee, ticket.requesterName]);

  // Handler gửi bình luận mới
  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && commentFiles.length === 0) return;

    setIsLoading(true);
    setTimeout(() => {
      const commentObj: Comment = {
        id: `C-${Math.floor(100 + Math.random() * 900)}`,
        author: ticket.requesterName,
        role: 'Người yêu cầu',
        text: newComment,
        date: new Date().toLocaleString('vi-VN'),
        isItSupport: false,
        attachments: commentFiles.length > 0 ? commentFiles : undefined
      };

      setComments(prev => [...prev, commentObj]);
      setNewComment('');
      setCommentFiles([]);
      setIsLoading(false);
    }, 600);
  };

  // Giả lập tải tệp đính kèm bình luận
  const handleAttachFileComment = () => {
    const fileNames = ['screen_error_2.png', 'log_error_microsoft.txt', 'document_api.pdf'];
    const randomFile = fileNames[Math.floor(Math.random() * fileNames.length)];
    const randomSize = `${Math.floor(100 + Math.random() * 800)} KB`;
    
    setCommentFiles([...commentFiles, { name: randomFile, size: randomSize }]);
  };

  // Handler gửi đánh giá hài lòng (UC-04)
  const handleSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSurveyError(null);

    if (isSatisfied === null) {
      setSurveyError('Vui lòng chọn mức độ hài lòng (Có hoặc Không).');
      return;
    }

    // Nếu chọn KHÔNG hài lòng, bắt buộc nhập lý do vào ô nhận xét
    if (isSatisfied === false && !surveyComment.trim()) {
      setSurveyError('Vui lòng nhập lý do không hài lòng vào ô nhận xét bên dưới.');
      return;
    }

    setSurveySubmitted(true);

    setTimeout(() => {
      if (isSatisfied === true) {
        // Hài lòng -> Đổi trạng thái sang Đã đóng (Closed)
        setTicket(prev => ({
          ...prev,
          status: 'Closed'
        }));
      } else {
        // Không hài lòng -> Mở lại ticket, chuyển về Đang giải quyết (Pending)
        setTicket(prev => ({
          ...prev,
          status: 'Pending',
          slaDeadline: Date.now() + 12 * 3600 * 1000 // Khởi tạo lại SLA mới (12 tiếng)
        }));

        // Bổ sung bình luận hệ thống ghi nhận mở lại phiếu
        const reopenComment: Comment = {
          id: `C-${Math.floor(100 + Math.random() * 900)}`,
          author: 'Hệ thống tự động',
          role: 'System',
          text: `[Mở lại phiếu] Người dùng đánh giá không hài lòng. Lý do phản hồi: "${surveyComment}". Phiếu hỗ trợ đã được mở lại và chuyển về hàng đợi L1 xử lý gấp.`,
          date: new Date().toLocaleString('vi-VN'),
          isItSupport: true
        };
        setComments(prev => [...prev, reopenComment]);
      }

      // Reset survey states
      setIsSatisfied(null);
      setSurveyComment('');
      setSurveySubmitted(false);
    }, 1000);
  };

  // Định dạng đồng hồ đếm ngược SLA
  const formatSLA = (ms: number) => {
    if (ms <= 0) {
      return <span className="sla-countdown-time danger">Quá hạn! (Vi phạm)</span>;
    }

    const hours = Math.floor(ms / (3600 * 1000));
    const mins = Math.floor((ms % (3600 * 1000)) / (60 * 1000));
    const secs = Math.floor((ms % (60 * 1000)) / 1000);

    const pad = (num: number) => String(num).padStart(2, '0');
    const displayStr = `${pad(hours)}g ${pad(mins)}p ${pad(secs)}s`;

    if (ms < 15 * 60 * 1000) {
      // Dưới 15 phút
      return <span className="sla-countdown-time danger">{displayStr} ⚠</span>;
    } else if (ms < 120 * 60 * 1000) {
      // Dưới 2 tiếng
      return <span className="sla-countdown-time warning">{displayStr}</span>;
    }
    return <span className="sla-countdown-time">{displayStr}</span>;
  };

  // Chuyển đổi trạng thái nhanh để Tester kiểm tra (Testing Panel)
  const changeStatusForTesting = (status: TicketData['status']) => {
    setTicket(prev => ({
      ...prev,
      status: status,
      // Nếu đổi sang trạng thái mới thì reset hạn SLA đếm ngược cho đẹp
      slaDeadline: Date.now() + (status === 'Pending' ? 2.2 * 3600 * 1000 : 12 * 3600 * 1000)
    }));
  };

  return (
    <div className="ticket-detail-container">
      <div className="ticket-detail-content">

        {/* 1. THANH CHUYỂN TRẠNG THÁI NHANH (TESTING PANEL) */}
        <div className="test-panel-card">
          <h4 className="test-panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
            Bảng điều khiển thử nghiệm nhanh (Tester Controls)
          </h4>
          <div className="test-panel-buttons">
            <button
              type="button"
              className={`btn-test-state ${ticket.status === 'New' ? 'active' : ''}`}
              onClick={() => changeStatusForTesting('New')}
            >
              Mới tạo (New)
            </button>
            <button
              type="button"
              className={`btn-test-state ${ticket.status === 'Pending' ? 'active' : ''}`}
              onClick={() => changeStatusForTesting('Pending')}
            >
              Đang giải quyết (Pending)
            </button>
            <button
              type="button"
              className={`btn-test-state ${ticket.status === 'Resolved' ? 'active' : ''}`}
              onClick={() => changeStatusForTesting('Resolved')}
            >
              Đã giải quyết (Resolved)
            </button>
            <button
              type="button"
              className={`btn-test-state ${ticket.status === 'Closed' ? 'active' : ''}`}
              onClick={() => changeStatusForTesting('Closed')}
            >
              Đã đóng (Closed)
            </button>
          </div>
        </div>

        {/* 2. LOGIC TRƯỜNG HỢP ĐẶC BIỆT 1: HIỂN THỊ KHẢO SÁT HÀI LÒNG KHI PHIẾU ĐÃ GIẢI QUYẾT */}
        {ticket.status === 'Resolved' && (
          <div className="survey-banner">
            <h3 className="survey-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Khảo sát mức độ hài lòng về chất lượng hỗ trợ (UC-04)
            </h3>
            
            <form onSubmit={handleSurveySubmit} className="survey-body">
              {/* Câu hỏi hài lòng */}
              <div className="survey-question-group">
                <span className="survey-question-text">Bạn có hài lòng với kết quả xử lý sự cố này không? <span style={{ color: '#DC2626' }}>*</span></span>
                <div className="survey-toggle-buttons">
                  <button
                    type="button"
                    className={`btn-survey-toggle ${isSatisfied === true ? 'active-yes' : ''}`}
                    onClick={() => setIsSatisfied(true)}
                  >
                    Có, tôi hài lòng
                  </button>
                  <button
                    type="button"
                    className={`btn-survey-toggle ${isSatisfied === false ? 'active-no' : ''}`}
                    onClick={() => setIsSatisfied(false)}
                  >
                    Không, tôi chưa hài lòng
                  </button>
                </div>
              </div>

              {/* Đánh giá sao */}
              <div className="survey-question-group">
                <span className="survey-question-text">Đánh giá độ hài lòng của bạn (1 - 5 sao):</span>
                <div className="survey-rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${star <= ratingStars ? 'active' : ''}`}
                      onClick={() => setRatingStars(star)}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nhận xét / Lý do bắt buộc */}
              <div className="survey-question-group">
                <span className="survey-question-text">
                  Ý kiến đóng góp {isSatisfied === false && <span style={{ color: '#DC2626' }}>(Bắt buộc nhập lý do chưa hài lòng) *</span>}:
                </span>
                <textarea
                  className="survey-textarea"
                  placeholder={isSatisfied === false ? "Vui lòng ghi rõ lý do sự cố chưa được giải quyết triệt để hoặc các điểm IT cần cải thiện..." : "Nhập nhận xét hoặc lời nhắn gửi bộ phận hỗ trợ IT (tùy chọn)..."}
                  value={surveyComment}
                  onChange={(e) => setSurveyComment(e.target.value)}
                ></textarea>
              </div>

              {surveyError && (
                <div style={{ color: '#DC2626', fontSize: '13.5px', fontWeight: 600 }}>
                  ⚠ {surveyError}
                </div>
              )}

              <button type="submit" className="btn-survey-submit" disabled={surveySubmitted}>
                {surveySubmitted ? 'Đang gửi đánh giá...' : 'Gửi đánh giá & Hoàn tất'}
              </button>
            </form>
          </div>
        )}

        {/* 3. LOGIC TRƯỜNG HỢP ĐẶC BIỆT 2: BANNER THÔNG BÁO KHI PHIẾU ĐÃ ĐÓNG */}
        {ticket.status === 'Closed' && (
          <div className="closed-banner">
            <span className="closed-banner-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
            <span>Không có dữ liệu chỉnh sửa - Phiếu đã đóng</span>
          </div>
        )}

        {/* 4. ĐẦU TRANG CHI TIẾT PHIẾU (TICKET SUMMARY HEADER) */}
        <div className="detail-header-card">
          <div className="header-meta-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              className="btn-back"
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: '6px',
                marginRight: '8px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#F1F5F9';
                e.currentTarget.style.color = '#0F172A';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#64748B';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Quay lại
            </button>
            <span className="ticket-id-tag">{ticket.id}</span>
            
            {/* Status Badges */}
            {ticket.status === 'New' && <span className="badge-status-detail" style={{ backgroundColor: '#EFF6FF', color: '#1E40AF' }}>Mới tạo</span>}
            {ticket.status === 'Pending' && <span className="badge-status-detail" style={{ backgroundColor: '#FFFBEB', color: '#92400E' }}>Đang giải quyết</span>}
            {ticket.status === 'Resolved' && <span className="badge-status-detail" style={{ backgroundColor: '#ECFDF5', color: '#065F46' }}>Đã giải quyết</span>}
            {ticket.status === 'Closed' && <span className="badge-status-detail" style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>Đã đóng</span>}

            {/* Priority Badges */}
            {ticket.priority === 'High' && <span className="badge-priority-detail" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>Mức độ ưu tiên: Cao</span>}
            {ticket.priority === 'Medium' && <span className="badge-priority-detail" style={{ backgroundColor: '#FFFBEB', color: '#F59E0B' }}>Mức độ ưu tiên: Trung bình</span>}
            {ticket.priority === 'Low' && <span className="badge-priority-detail" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>Mức độ ưu tiên: Thấp</span>}
          </div>
          <h1 className="detail-ticket-title">{ticket.title}</h1>
        </div>

        {/* 5. LAYOUT 2 CỘT CHÍNH */}
        <div className="detail-main-layout">
          
          {/* Cột trái (65%): Chi tiết, Timeline, Bình luận */}
          <div className="left-column-detail">
            
            {/* Chi tiết nội dung phiếu */}
            <div className="detail-card">
              <h3 className="detail-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Nội dung yêu cầu hỗ trợ
              </h3>
              
              <div className="ticket-info-grid">
                <div className="info-item">
                  <span className="info-label">Người gửi yêu cầu</span>
                  <span className="info-value">{ticket.requesterName} ({ticket.requesterEmail})</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Ngày tạo phiếu</span>
                  <span className="info-value">{ticket.createdAt}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Thiết bị / Phần mềm liên quan</span>
                  <span className="info-value">{ticket.deviceSoftware || 'Không khai báo'}</span>
                </div>
              </div>

              <div className="info-item" style={{ marginTop: '16px' }}>
                <span className="info-label" style={{ marginBottom: '8px' }}>Mô tả chi tiết sự cố</span>
                <div className="ticket-description-box">
                  {ticket.description}
                </div>
              </div>
            </div>

            {/* Sơ đồ tiến trình xử lý (Workflow timeline) */}
            <div className="detail-card">
              <h3 className="detail-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                Lịch sử tiến trình xử lý sự cố (BPMN Workflow)
              </h3>
              
              <div className="timeline-list">
                {timeline.map((event, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className={`timeline-badge ${event.isCurrent ? 'current' : 'completed'}`}>
                      {event.isCurrent ? <span className="timeline-dot"></span> : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header-row">
                        <span className="timeline-status" style={{ color: event.isCurrent ? '#2563EB' : '#0F172A' }}>{event.status}</span>
                        <span className="timeline-date">{event.date}</span>
                      </div>
                      <div className="timeline-executor">Thực hiện bởi: <strong>{event.executor}</strong></div>
                      <div className="timeline-note">{event.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bình luận & Cập nhật */}
            <div className="detail-card">
              <h3 className="detail-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Trao đổi cập nhật tình hình xử lý
              </h3>

              {/* Danh sách bình luận */}
              <div className="comments-list">
                {comments.map((comment) => (
                  <div key={comment.id} className="comment-card">
                    <img
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(comment.author)}&backgroundColor=${comment.isItSupport ? '2563EB' : '64748B'}&textColor=ffffff`}
                      alt="Avatar"
                      className="comment-avatar"
                    />
                    <div className={`comment-bubble ${comment.isItSupport ? 'is-it-support' : ''}`}>
                      <div className="comment-meta-row">
                        <div>
                          <span className="comment-author">{comment.author}</span>
                          <span className="comment-role-tag" style={{ backgroundColor: comment.isItSupport ? '#EFF6FF' : '#F1F5F9', color: comment.isItSupport ? '#2563EB' : '#475569' }}>{comment.role}</span>
                        </div>
                        <span className="comment-date">{comment.date}</span>
                      </div>
                      <p className="comment-text">{comment.text}</p>
                      
                      {/* Tệp đính kèm bình luận */}
                      {comment.attachments && (
                        <div className="comment-attachments">
                          {comment.attachments.map((file, fileIdx) => (
                            <span key={fileIdx} className="comment-attachment-file">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                              </svg>
                              {file.name} ({file.size})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Form gửi bình luận (Ẩn/khóa nếu phiếu đã đóng) */}
              <form onSubmit={handleSendComment} className="comment-input-area">
                <textarea
                  className="comment-textarea"
                  placeholder={ticket.status === 'Closed' ? "Không thể gửi bình luận - Phiếu đã đóng hoàn toàn." : "Viết nội dung phản hồi, thắc mắc hoặc cập nhật sự cố của bạn tại đây..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={ticket.status === 'Closed' || isLoading}
                ></textarea>

                {/* Danh sách tệp đính kèm bình luận đang soạn */}
                {commentFiles.length > 0 && (
                  <div className="comment-attachments" style={{ padding: '0 8px' }}>
                    {commentFiles.map((file, idx) => (
                      <span key={idx} className="comment-attachment-file" style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                        </svg>
                        {file.name} ({file.size})
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '0 2px', marginLeft: '4px' }}
                          onClick={() => {
                            const updated = [...commentFiles];
                            updated.splice(idx, 1);
                            setCommentFiles(updated);
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="comment-actions-bar">
                  <button
                    type="button"
                    className="btn-comment-attach"
                    onClick={handleAttachFileComment}
                    disabled={ticket.status === 'Closed' || isLoading}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                    </svg>
                    Đính kèm tệp tin
                  </button>
                  
                  {ticket.status !== 'Closed' && (
                    <button
                      type="submit"
                      className="btn-comment-submit"
                      disabled={isLoading || (!newComment.trim() && commentFiles.length === 0)}
                    >
                      Gửi bình luận
                    </button>
                  )}
                </div>
              </form>
            </div>

          </div>

          {/* Cột phải (35%): Hạn SLA, Người xử lý, Thẻ liên quan */}
          <div className="right-column-detail">
            
            {/* 1. Hạn cam kết xử lý SLA (Đếm ngược) */}
            <div className="sla-countdown-card">
              <div className="sla-countdown-label">Hạn hoàn thành xử lý (SLA)</div>
              {ticket.status === 'Resolved' || ticket.status === 'Closed' ? (
                <div>
                  <span className="sla-countdown-time" style={{ color: '#16A34A' }}>Đạt SLA ✓</span>
                  <div className="sla-countdown-desc">Phiếu hỗ trợ đã được kỹ thuật viên xử lý đúng hạn cam kết dịch vụ (SLA).</div>
                </div>
              ) : (
                <div>
                  {formatSLA(timeLeft)}
                  <div className="sla-countdown-desc">
                    Thời gian còn lại để IT Support L1/L2 xử lý và phản hồi sự cố theo đúng quy trình vận hành.
                  </div>
                </div>
              )}
            </div>

            {/* 2. Kỹ thuật viên phụ trách */}
            <div className="sla-countdown-card">
              <div className="sla-countdown-label" style={{ marginBottom: '16px' }}>Kỹ thuật viên phụ trách</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(ticket.assignee)}&backgroundColor=2563EB&textColor=ffffff`}
                  alt="Assignee Avatar"
                  className="comment-avatar"
                  style={{ width: '42px', height: '42px' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#0F172A' }}>{ticket.assignee}</span>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Bộ phận Hỗ trợ Kỹ thuật IT</span>
                </div>
              </div>
            </div>

            {/* 3. Tệp đính kèm gốc của phiếu */}
            <div className="sla-countdown-card">
              <div className="sla-countdown-label" style={{ marginBottom: '16px' }}>Tệp đính kèm phiếu</div>
              <div className="ticket-attachments-list">
                {ticket.id === 'HW-2026-0042' ? (
                  <div className="ticket-attachment-item">
                    <span className="ticket-attachment-name">anh_man_hinh_xanh.png</span>
                    <span className="ticket-attachment-size">842 KB</span>
                    <button
                      type="button"
                      className="btn-download-attachment"
                      onClick={() => alert('Tải xuống tệp tin: anh_man_hinh_xanh.png')}
                      title="Tải xuống tệp"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <span className="attachments-empty">Không có tệp đính kèm nào khi tạo phiếu.</span>
                )}
              </div>
            </div>

            {/* 4. Thẻ tag liên quan */}
            <div className="sla-countdown-card">
              <div className="sla-countdown-label" style={{ marginBottom: '12px' }}>Thẻ liên quan (Tags)</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {ticket.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: '#F1F5F9',
                      color: '#475569',
                      padding: '4px 10px',
                      borderRadius: '6px'
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 5. Tài liệu tri thức gợi ý liên quan */}
            <div className="sla-countdown-card">
              <div className="sla-countdown-label" style={{ marginBottom: '12px' }}>Bài viết tri thức gợi ý</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a
                  href="#vpn"
                  onClick={(e) => { e.preventDefault(); alert('Đọc tài liệu về sự cố: Hướng dẫn cấu hình mạng VPN'); }}
                  style={{ fontSize: '13px', color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}
                >
                  📖 Hướng dẫn tự sửa lỗi kết nối mạng VPN công ty
                </a>
                <a
                  href="#hardware"
                  onClick={(e) => { e.preventDefault(); alert('Đọc tài liệu về sự cố: Xử lý phần cứng Dell'); }}
                  style={{ fontSize: '13px', color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}
                >
                  📖 Danh sách các lỗi phần cứng thường gặp ở Dell Latitude
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
