import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateTicket.css';
import { ticketService } from '../../services/ticket.service';
import { kbService } from '../../services/kb.service';
import { useAuth } from '../../context/AuthContext';

interface KnowledgeArticle {
  id: string;
  category: string;
  title: string;
  content: string;
}

// Mock Câu hỏi thường gặp
const MOCK_FAQS = [
  {
    question: 'Thời gian xử lý phiếu cam kết SLA là bao lâu?',
    answer: 'IT Helpdesk phân loại xử lý dựa trên Mức độ ảnh hưởng: Sự cố Cao sẽ được xử lý trong vòng 4 giờ làm việc. Sự cố Trung bình được xử lý trong vòng 12 giờ làm việc. Sự cố Thấp sẽ được giải quyết trong vòng 24 giờ làm việc.'
  },
  {
    question: 'Tôi có thể upload nhiều file ảnh hoặc tài liệu có dung lượng lớn không?',
    answer: 'Hệ thống hỗ trợ đính kèm nhiều tệp tin định dạng PNG, JPG, PDF, DOCX, XLSX với dung lượng tối đa 20MB cho mỗi tệp. Nếu tệp tin của bạn lớn hơn 20MB, vui lòng tải lên Google Drive của công ty và dán liên kết chia sẻ vào nội dung mô tả sự cố.'
  },
  {
    question: 'Làm sao để biết phiếu hỗ trợ của tôi đang ở bước xử lý nào?',
    answer: 'Sau khi gửi phiếu thành công, bạn có thể truy cập vào mục "Phiếu hỗ trợ" trên Sidebar. Tại đây hiển thị danh sách toàn bộ phiếu bạn đã gửi kèm theo trạng thái thời gian thực (Mới tạo, Đang giải quyết, Đã giải quyết, Đã đóng).'
  }
];

export const CreateTicket: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  // Form states
  const [requesterName, setRequesterName] = useState(session?.ho_ten || '');
  const [requesterEmail, setRequesterEmail] = useState(session?.email || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState('Medium');
  const [incidentTime, setIncidentTime] = useState('');
  const [deviceSoftware, setDeviceSoftware] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  // UX & Async states
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState('');

  // Pre-fill user session details
  useEffect(() => {
    if (session) {
      if (!requesterName) setRequesterName(session.ho_ten);
      if (!requesterEmail) setRequesterEmail(session.email);
    }
  }, [session]);

  // Right column state (FAQ accordion)
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<KnowledgeArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);

  // File Dropzone ref & drag state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Real-time suggestions filtering based on Title text via Backend API search
  useEffect(() => {
    if (!title.trim()) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const data = await kbService.search(title);
        if (Array.isArray(data)) {
          setSuggestions(data.map((art: any) => {
            let cat = 'Mạng & Kết nối';
            if (art.loai_su_co === 'security') cat = 'Tài khoản & Bảo mật';
            else if (art.loai_su_co === 'hardware') cat = 'Thiết bị & Phần cứng';
            else if (art.loai_su_co === 'software') cat = 'Phần mềm & Dịch vụ';

            return {
              id: String(art.tri_thuc_id),
              category: cat,
              title: art.tieu_de,
              content: art.noi_dung,
            };
          }));
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [title]);

  // Handle Mock Rich Text Editor Formatting Buttons
  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById('mo_ta_chi_tiet') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + selected + after;

    setDescription(text.substring(0, start) + replacement + text.substring(end));

    // Focus back to editor and restore selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 10);
  };

  // Drag and Drop File Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const validateAndAddFiles = (filesList: FileList) => {
    setFileError(null);
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'docx', 'xlsx'];
    const maxSizeBytes = 20 * 1024 * 1024; // 20MB
    const validFiles: File[] = [];

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (!ext || !allowedExtensions.includes(ext)) {
        setFileError('File không đúng định dạng. Chỉ cho phép các định dạng: JPG, PNG, PDF, DOCX, XLSX.');
        return;
      }

      if (file.size > maxSizeBytes) {
        setFileError('Dung lượng tệp tin vượt quá giới hạn cho phép (Tối đa 20MB).');
        return;
      }

      // Check if file is already attached
      const isAlreadyAttached = attachedFiles.some(f => f.name === file.name && f.size === file.size);
      if (!isAlreadyAttached) {
        validFiles.push(file);
      }
    }

    setAttachedFiles([...attachedFiles, ...validFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    const updated = [...attachedFiles];
    updated.splice(index, 1);
    setAttachedFiles(updated);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      return;
    }

    let finalDescription = description;
    if (requesterName !== session?.ho_ten || requesterEmail !== session?.email) {
      finalDescription = `[Người yêu cầu: ${requesterName} - Email: ${requesterEmail}]\n\n${description}`;
    }

    setIsLoading(true);
    try {
      const response = await ticketService.createTicket(title, finalDescription, attachedFiles);
      if (response.success && response.data) {
        setCreatedTicketId(response.data.ma_phieu);
        setShowSuccessModal(true);
      } else {
        alert(response.message || 'Tạo phiếu thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu hỗ trợ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForm = () => {
    setRequesterName(session?.ho_ten || '');
    setRequesterEmail(session?.email || '');
    setTitle('');
    setDescription('');
    setImpact('Medium');
    setIncidentTime('');
    setDeviceSoftware('');
    setAttachedFiles([]);
    setFileError(null);
    setShowSuccessModal(false);
  };

  // FAQ Accordion Toggle
  const toggleFaq = (index: number) => {
    if (activeFaqIndex === index) {
      setActiveFaqIndex(null);
    } else {
      setActiveFaqIndex(index);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="create-ticket-container">
      <div className="create-ticket-content">
        
        {/* Tiêu đề trang */}
        <div className="create-ticket-header">
          <h1 className="create-ticket-title">Tạo phiếu hỗ trợ mới</h1>
          <p className="create-ticket-subtitle">
            Vui lòng điền thông tin mô tả chi tiết sự cố kỹ thuật hoặc yêu cầu dịch vụ của bạn dưới đây.
          </p>
        </div>

        {/* Layout 2 cột */}
        <div className="create-ticket-layout">
          
          {/* Cột trái: Form tạo phiếu (65%) */}
          <div className="form-column">
            <form onSubmit={handleSubmit}>
              
              {/* Họ tên & Email người yêu cầu */}
              <div className="form-grid-2" style={{ marginBottom: '20px' }}>
                <div>
                  <label htmlFor="requester_name" className="field-label">
                    Họ và tên người yêu cầu <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    id="requester_name"
                    className="text-input"
                    placeholder="Họ và tên..."
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="requester_email" className="field-label">
                    Email công ty <span className="required-star">*</span>
                  </label>
                  <input
                    type="email"
                    id="requester_email"
                    className="text-input"
                    placeholder="Email công ty..."
                    value={requesterEmail}
                    onChange={(e) => setRequesterEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Tiêu đề phiếu */}
              <div className="form-group-full">
                <label htmlFor="tieu_de" className="field-label">
                  Tiêu đề yêu cầu <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  id="tieu_de"
                  className="text-input"
                  placeholder="Ví dụ: Lỗi không kết nối được mạng VPN, Hỏng chuột máy tính..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Grid 2 cột cho các trường thông tin bổ sung */}
              <div className="form-grid-2">
                {/* Mức độ ảnh hưởng */}
                <div>
                  <label htmlFor="muc_do_uu_tien" className="field-label">
                    Mức độ ảnh hưởng <span className="required-star">*</span>
                  </label>
                  <select
                    id="muc_do_uu_tien"
                    className="select-input"
                    value={impact}
                    onChange={(e) => setImpact(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="Low">Thấp (Chỉ cá nhân bị ảnh hưởng, không gián đoạn công việc)</option>
                    <option value="Medium">Trung bình (Ảnh hưởng một nhóm hoặc gây chậm công việc)</option>
                    <option value="High">Cao (Gián đoạn hoàn toàn hệ thống hoặc công việc quan trọng)</option>
                  </select>
                </div>

                {/* Thời điểm phát sinh */}
                <div>
                  <label htmlFor="ngay_tao" className="field-label">
                    Thời điểm phát sinh lỗi
                  </label>
                  <input
                    type="datetime-local"
                    id="ngay_tao"
                    className="text-input"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Thiết bị / phần mềm liên quan */}
              <div className="form-group-full">
                <label htmlFor="thiet_bi" className="field-label">
                  Thiết bị / Phần mềm liên quan
                </label>
                <input
                  type="text"
                  id="thiet_bi"
                  className="text-input"
                  placeholder="Ví dụ: Macbook Pro 2022, Microsoft Teams, Máy in HP khay 2..."
                  value={deviceSoftware}
                  onChange={(e) => setDeviceSoftware(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Mô tả chi tiết vấn đề (Giả lập Rich Text Editor) */}
              <div className="form-group-full">
                <label htmlFor="mo_ta_chi_tiet" className="field-label">
                  Mô tả chi tiết sự cố <span className="required-star">*</span>
                </label>
                
                <div className="rich-editor-container">
                  {/* Editor Toolbars */}
                  <div className="rich-editor-toolbar">
                    <button
                      type="button"
                      className="editor-btn"
                      onClick={() => insertText('**', '**')}
                      disabled={isLoading}
                      title="Chữ đậm"
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      type="button"
                      className="editor-btn"
                      onClick={() => insertText('*', '*')}
                      disabled={isLoading}
                      title="Chữ nghiêng"
                    >
                      <em>I</em>
                    </button>
                    <button
                      type="button"
                      className="editor-btn"
                      onClick={() => insertText('- ')}
                      disabled={isLoading}
                      title="Danh sách gạch đầu dòng"
                    >
                      • Danh sách
                    </button>
                    <button
                      type="button"
                      className="editor-btn"
                      onClick={() => insertText('> ')}
                      disabled={isLoading}
                      title="Trích dẫn"
                    >
                      ” Trích dẫn
                    </button>
                    <div className="editor-divider"></div>
                    <button
                      type="button"
                      className="editor-btn"
                      onClick={() => insertText('`', '`')}
                      disabled={isLoading}
                      title="Mã nguồn (Code inline)"
                    >
                      {'</>'} Code
                    </button>
                  </div>

                  {/* Textarea nhập liệu */}
                  <textarea
                    id="mo_ta_chi_tiet"
                    className="rich-editor-textarea"
                    placeholder="Mô tả cụ thể hiện tượng lỗi, các bước dẫn đến lỗi và các thông điệp báo lỗi xuất hiện trên màn hình..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isLoading}
                    required
                  ></textarea>
                </div>
              </div>

              {/* Tải lên tệp đính kèm */}
              <div className="form-group-full">
                <label className="field-label">Tệp đính kèm minh chứng (Ảnh, PDF, Word, Excel)</label>
                
                {/* Dropzone Area */}
                <div
                  className={`dropzone-container ${isDragOver ? 'dragover' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isLoading && fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    multiple
                    disabled={isLoading}
                  />
                  <div className="dropzone-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="dropzone-text">
                    Kéo thả các tệp tin vào đây hoặc <span>chọn từ máy tính</span> của bạn
                  </p>
                  <p className="dropzone-hint">
                    Hỗ trợ định dạng hình ảnh (PNG, JPG), PDF, DOCX, XLSX. Dung lượng tối đa: 20MB/file.
                  </p>
                </div>

                {/* Hiển thị lỗi file */}
                {fileError && (
                  <span className="password-strength-hint" style={{ color: 'var(--color-error, #DC2626)', marginTop: '8px', display: 'block' }}>
                    ⚠ {fileError}
                  </span>
                )}

                {/* Danh sách file đính kèm đã chọn */}
                {attachedFiles.length > 0 && (
                  <div className="attached-files-list">
                    {attachedFiles.map((file, idx) => (
                      <div key={idx} className="attached-file-item">
                        <div className="file-info-group">
                          <span className="file-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                              <polyline points="13 2 13 9 20 9"></polyline>
                            </svg>
                          </span>
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">({formatFileSize(file.size)})</span>
                        </div>
                        <button
                          type="button"
                          className="btn-remove-file"
                          onClick={() => removeFile(idx)}
                          disabled={isLoading}
                          title="Xóa tệp"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nút gửi hoặc hủy */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-form-cancel"
                  onClick={() => navigate('/dashboard')}
                  disabled={isLoading}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-form-submit"
                  disabled={isLoading || !title.trim() || !description.trim()}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-inline"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    'Gửi yêu cầu'
                  )}
                </button>
              </div>

              {/* Dòng chữ thông báo phân tích Priority động khi gửi */}
              {isLoading && (
                <div className="loading-notice">
                  <span className="spinner-inline" style={{ borderColor: 'rgba(37,99,235,0.2)', borderTopColor: '#2563EB', width: '12px', height: '12px' }}></span>
                  Đang tải dữ liệu... Hệ thống đang phân tích mức độ ưu tiên...
                </div>
              )}

            </form>
          </div>

          {/* Cột phải: Hỗ trợ tạo phiếu (35%) */}
          <div className="support-column">
            
            {/* 1. Widget Gợi ý bài viết tri thức tự động */}
            <div className="support-card">
              <h3 className="support-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
                Gợi ý bài viết liên quan
              </h3>
              
              {suggestions.length > 0 ? (
                <div className="suggestions-list">
                  {suggestions.map((article) => (
                    <div
                      key={article.id}
                      className="suggestion-item"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <h4 className="suggestion-item-title">{article.title}</h4>
                      <div className="suggestion-item-meta">
                        <span>Danh mục: {article.category}</span>
                        <span className="suggestion-view-link">Đọc bài viết →</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="suggestions-empty">
                  {title.trim() ? (
                    'Không tìm thấy bài viết liên quan trong Cơ sở tri thức.'
                  ) : (
                    'Nhập tiêu đề yêu cầu để hệ thống tự động quét và gợi ý bài viết giải quyết nhanh...'
                  )}
                </div>
              )}
            </div>

            {/* 2. Widget Câu hỏi thường gặp (Accordion) */}
            <div className="support-card">
              <h3 className="support-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Câu hỏi thường gặp (FAQ)
              </h3>
              
              <div className="faq-list">
                {MOCK_FAQS.map((faq, idx) => (
                  <div key={idx} className="faq-item">
                    <button
                      type="button"
                      className={`faq-header ${activeFaqIndex === idx ? 'active' : ''}`}
                      onClick={() => toggleFaq(idx)}
                    >
                      <span>{faq.question}</span>
                      <span className="faq-arrow">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </span>
                    </button>
                    {activeFaqIndex === idx && (
                      <div className="faq-body">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Widget Mẹo viết phiếu hiệu quả */}
            <div className="support-card">
              <h3 className="support-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
                  <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"></path>
                </svg>
                Mẹo gửi yêu cầu hiệu quả
              </h3>
              <ul className="tips-list">
                <li>
                  <strong>Cung cấp hình ảnh lỗi:</strong> Chụp lại ảnh màn hình thông báo lỗi và kéo thả vào ô đính kèm giúp IT chẩn đoán lỗi nhanh hơn 80%.
                </li>
                <li>
                  <strong>Ghi rõ thông tin phần mềm:</strong> Nêu rõ phiên bản phần mềm (ví dụ: Chrome v114, Figma desktop) hoặc tên thiết bị trong ô liên quan.
                </li>
                <li>
                  <strong>Mô tả chi tiết bước lỗi:</strong> Liệt kê tuần tự các thao tác trước khi xảy ra sự cố để kỹ thuật viên tái lập lỗi chính xác.
                </li>
              </ul>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL CHI TIẾT BÀI VIẾT TRI THỨC (Khi người dùng click xem bài gợi ý) */}
      {selectedArticle && (
        <div className="modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cơ sở tri thức IT Helpdesk</h3>
              <button
                type="button"
                className="modal-btn-close"
                onClick={() => setSelectedArticle(null)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <span className="article-view-category">{selectedArticle.category}</span>
              <h2 className="article-view-title">{selectedArticle.title}</h2>
              <div className="article-view-content">
                {selectedArticle.content}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-primary"
                onClick={() => setSelectedArticle(null)}
              >
                Đã hiểu, đóng tài liệu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POPUP THÔNG BÁO TẠO PHIẾU THÀNH CÔNG (Sau khi Gửi thành công) */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-body" style={{ padding: '32px' }}>
              
              {/* Checkmark Illustration */}
              <div className="success-illustration">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>

              <h2 className="success-title">Gửi yêu cầu thành công</h2>
              <p className="success-message">
                Yêu cầu của bạn đã được ghi nhận vào hàng đợi xử lý sự cố của bộ phận kỹ thuật L1. Hệ thống đã thiết lập cam kết SLA tự động.
              </p>

              {/* Ticket ID Box */}
              <div className="success-ticket-id-box">
                <span className="success-ticket-label">Mã phiếu hỗ trợ</span>
                <span className="success-ticket-id">{createdTicketId}</span>
              </div>

              {/* Button Close & Reset */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn-modal-primary"
                  onClick={handleResetForm}
                  style={{ width: '100%', padding: '12px' }}
                >
                  Xác nhận và Quay lại
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
