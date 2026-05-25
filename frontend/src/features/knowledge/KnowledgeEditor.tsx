import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './KnowledgeEditor.css';

interface Article {
  id: string;
  title: string;
  category: 'Phần cứng' | 'Phần mềm' | 'Mạng' | 'Hệ thống';
  tags: string[];
  content: string;
  author: string;
  status: 'Draft' | 'Published';
  views: number;
  helpful: number;
  unhelpful: number;
  createdAt: string;
  viewPermission: 'Tất cả nhân viên' | 'Chỉ kỹ thuật viên IT';
  editPermission: 'Chỉ tác giả' | 'Tất cả đội L2';
}

export const KnowledgeEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Role check
  const [userRole, setUserRole] = useState<string>('');
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Phần cứng' | 'Phần mềm' | 'Mạng' | 'Hệ thống'>('Phần mềm');
  const [tagsInput, setTagsInput] = useState('');
  const [content, setContent] = useState('');
  const [viewPermission, setViewPermission] = useState<'Tất cả nhân viên' | 'Chỉ kỹ thuật viên IT'>('Tất cả nhân viên');
  const [editPermission, setEditPermission] = useState<'Chỉ tác giả' | 'Tất cả đội L2'>('Tất cả đội L2');
  
  const [formError, setFormError] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);

  // 1. Phân quyền truy cập
  useEffect(() => {
    const savedSession = localStorage.getItem('it_helpdesk_session');
    let role = 'Người yêu cầu';
    if (savedSession) {
      try {
        role = JSON.parse(savedSession).role;
      } catch (e) {}
    }
    setUserRole(role);

    // Chỉ L2 (hoặc Quản lý IT) mới được quyền soạn thảo
    if (role === 'L2' || role === 'Quản lý IT') {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      // Hướng nghiệp về trang danh sách sau 2.5 giây
      const timer = setTimeout(() => {
        navigate('/knowledge');
      }, 2500);
      return () => clearTimeout(timer);
    }

    // Load articles database
    const savedArticles = localStorage.getItem('kb_articles');
    let articleList: Article[] = [];
    if (savedArticles) {
      try {
        articleList = JSON.parse(savedArticles);
      } catch (e) {}
    }
    setArticles(articleList);

    // 2. Nếu ở chế độ Chỉnh sửa (edit), điền thông tin cũ vào form
    if (id && articleList.length > 0) {
      const found = articleList.find(a => a.id === id);
      if (found) {
        setTitle(found.title);
        setCategory(found.category);
        setTagsInput(found.tags.join(', '));
        setContent(found.content);
        setViewPermission(found.viewPermission);
        setEditPermission(found.editPermission);
      }
    }
  }, [id, navigate]);

  if (isAuthorized === false) {
    return (
      <div className="kb-editor-container">
        <div className="kb-editor-card" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ color: '#DC2626', margin: '0 0 10px 0' }}>Từ chối quyền truy cập</h2>
          <p style={{ color: '#64748B', fontSize: '15px' }}>
            Chỉ vai trò **Kỹ thuật viên L2** mới có quyền soạn thảo hoặc chỉnh sửa tài liệu tri thức trên hệ thống.
          </p>
          <p style={{ color: '#94A3B8', fontSize: '13.5px', marginTop: '20px' }}>
            Tự động chuyển hướng bạn quay lại trang Cơ sở tri thức trong giây lát...
          </p>
        </div>
      </div>
    );
  }

  // Submit handler (Save Draft / Publish)
  const handleSave = (status: 'Draft' | 'Published') => {
    setFormError(null);

    // Validate fields
    if (!title.trim()) {
      setFormError('Vui lòng nhập tiêu đề bài viết tri thức.');
      return;
    }
    if (!content.trim()) {
      setFormError('Vui lòng nhập nội dung cẩm nang hướng dẫn.');
      return;
    }

    // Xử lý tags
    const processedTags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const nowStr = new Date().toISOString().split('T')[0];

    let updatedArticlesList: Article[] = [];

    if (id) {
      // Chỉnh sửa bài viết cũ
      updatedArticlesList = articles.map(a => {
        if (a.id === id) {
          return {
            ...a,
            title,
            category,
            tags: processedTags,
            content,
            status,
            viewPermission,
            editPermission,
            createdAt: nowStr // ngày cập nhật
          };
        }
        return a;
      });
      alert(status === 'Published' ? 'Đã cập nhật & xuất bản bài viết tri thức thành công!' : 'Đã lưu cẩm nang vào bản nháp!');
    } else {
      // Tạo bài viết mới
      const newArticle: Article = {
        id: `KB-${Math.floor(1000 + Math.random() * 9000)}`,
        title,
        category,
        tags: processedTags,
        content,
        author: userRole === 'L2' ? 'Phạm Văn Mạng (IT L2)' : 'Hệ thống IT',
        status,
        views: 0,
        helpful: 0,
        unhelpful: 0,
        createdAt: nowStr,
        viewPermission,
        editPermission
      };
      updatedArticlesList = [newArticle, ...articles];
      alert(status === 'Published' ? 'Xuất bản bài viết tri thức thành công!' : 'Đã lưu bài viết nháp thành công!');
    }

    // Save database & redirect
    localStorage.setItem('kb_articles', JSON.stringify(updatedArticlesList));
    navigate('/knowledge');
  };

  // Mock click toolbar formatting functions
  const handleMockFormat = (formatType: string) => {
    alert(`[Trình soạn thảo] Đã áp dụng định dạng: ${formatType}`);
  };

  return (
    <div className="kb-editor-container">
      <div className="kb-editor-content">
        
        {/* Header Editor */}
        <div className="l2-header-card">
          <h1 className="l2-title">{id ? 'Chỉnh sửa bài viết cẩm nang tri thức' : 'Soạn thảo bài viết tri thức mới (UC-10)'}</h1>
          <p className="l2-subtitle">
            Cung cấp hướng dẫn, giải pháp khắc phục sự cố chi tiết giúp nhân viên nội bộ tự sửa lỗi mạng, máy in, card đồ họa và phần mềm.
          </p>
        </div>

        {/* Form Editor Card */}
        <div className="kb-editor-card">
          
          <div className="kb-editor-grid">
            <div className="business-field">
              <label className="business-label">Tiêu đề bài viết tri thức <span style={{ color: '#DC2626' }}>*</span></label>
              <input 
                type="text"
                className="modal-input"
                placeholder="Ví dụ: Hướng dẫn sửa nhanh sự cố kẹt giấy máy in Dell C2660dn"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="business-field">
              <label className="business-label">Chuyên mục bài viết</label>
              <select
                className="filter-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                style={{ padding: '10px 12px' }}
              >
                <option value="Phần cứng">Hỗ trợ Phần cứng</option>
                <option value="Phần mềm">Hỗ trợ Phần mềm</option>
                <option value="Mạng">Hỗ trợ Mạng</option>
                <option value="Hệ thống">Hệ thống Cloud/Postgres</option>
              </select>
            </div>

            <div className="business-field">
              <label className="business-label">Quyền xem tài liệu</label>
              <select
                className="filter-select"
                value={viewPermission}
                onChange={(e) => setViewPermission(e.target.value as any)}
                style={{ padding: '10px 12px' }}
              >
                <option value="Tất cả nhân viên">Tất cả nhân viên (Công khai)</option>
                <option value="Chỉ kỹ thuật viên IT">Chỉ kỹ thuật viên IT (Nội bộ)</option>
              </select>
            </div>

            <div className="business-field">
              <label className="business-label">Quyền chỉnh sửa</label>
              <select
                className="filter-select"
                value={editPermission}
                onChange={(e) => setEditPermission(e.target.value as any)}
                style={{ padding: '10px 12px' }}
              >
                <option value="Tất cả đội L2">Tất cả đội L2</option>
                <option value="Chỉ tác giả">Chỉ tác giả bài viết</option>
              </select>
            </div>
          </div>

          <div className="business-field" style={{ marginBottom: '20px' }}>
            <label className="business-label">Thẻ phân loại (Tags) - Ngăn cách bằng dấu phẩy</label>
            <input 
              type="text"
              className="modal-input"
              placeholder="Ví dụ: dell, may in, ket giay, printer"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          {/* MOCK RICH TEXT EDITOR */}
          <div className="business-field">
            <label className="business-label">Nội dung hướng dẫn chi tiết các bước <span style={{ color: '#DC2626' }}>*</span></label>
            <div className="rich-editor-wrapper">
              <div className="rich-editor-toolbar">
                <button type="button" className="btn-toolbar-mock" onClick={() => handleMockFormat('In đậm')}>B</button>
                <button type="button" className="btn-toolbar-mock" onClick={() => handleMockFormat('In nghiêng')}>I</button>
                <button type="button" className="btn-toolbar-mock" onClick={() => handleMockFormat('Gạch chân')}>U</button>
                <button type="button" className="btn-toolbar-mock" onClick={() => handleMockFormat('Danh sách số')}>1.</button>
                <button type="button" className="btn-toolbar-mock" onClick={() => handleMockFormat('Danh sách tròn')}>•</button>
                <button type="button" className="btn-toolbar-mock" onClick={() => handleMockFormat('Chèn link')}>Link</button>
              </div>
              <textarea
                className="rich-editor-textarea"
                placeholder="Soạn thảo giải pháp chi tiết tại đây. Gợi ý: Hãy viết theo các bước: Bước 1, Bước 2, Bước 3... để người dùng dễ theo dõi tự khắc phục."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              ></textarea>
            </div>
          </div>

          {formError && (
            <div style={{ color: '#DC2626', fontSize: '13.5px', fontWeight: 600, marginTop: '12px' }}>
              ⚠ {formError}
            </div>
          )}

          {/* Actions Footer */}
          <div className="editor-actions-row">
            <button
              type="button"
              className="btn-editor-draft"
              onClick={() => navigate('/knowledge')}
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              className="btn-editor-draft"
              onClick={() => handleSave('Draft')}
              style={{ backgroundColor: '#F59E0B', color: '#FFFFFF', borderColor: '#F59E0B' }}
            >
              Lưu bản nháp
            </button>
            <button
              type="button"
              className="btn-editor-publish"
              onClick={() => handleSave('Published')}
            >
              Xuất bản bài viết
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
