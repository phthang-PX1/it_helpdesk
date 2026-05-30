import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './KnowledgeDetail.css';

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

const DEFAULT_ARTICLE: Article = {
  id: 'KB-0001',
  title: 'Hướng dẫn cấu hình mạng VPN để kết nối làm việc từ xa',
  category: 'Mạng',
  tags: ['VPN', 'Remote Work', 'Kết nối'],
  content: 'Bước 1: Tải file cấu hình OpenVPN từ Portal công ty.\n\nBước 2: Cài đặt phần mềm OpenVPN Connect client phù hợp với hệ điều hành (Windows/macOS).\n\nBước 3: Import file cấu hình đã tải vào phần mềm OpenVPN Connect.\n\nBước 4: Nhập tài khoản và mật khẩu LDAP Email công ty để đăng nhập kết nối mạng nội bộ.',
  author: 'Phạm Văn Mạng (IT L2)',
  status: 'Published',
  views: 128,
  helpful: 42,
  unhelpful: 3,
  createdAt: '2026-05-20',
  viewPermission: 'Tất cả nhân viên',
  editPermission: 'Tất cả đội L2'
};

export const KnowledgeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Load articles from localStorage
  const [articles, setArticles] = useState<Article[]>([]);
  const [article, setArticle] = useState<Article | null>(null);

  // States bình chọn
  const [voteState, setVoteState] = useState<'helpful' | 'unhelpful' | null>(null);

  // Xác định vai trò của người dùng
  const [userRole, setUserRole] = useState<string>('Người yêu cầu');

  useEffect(() => {
    // 1. Lấy vai trò người dùng
    const savedSession = localStorage.getItem('it_helpdesk_session');
    if (savedSession) {
      try {
        setUserRole(JSON.parse(savedSession).role);
      } catch (e) {}
    }

    // 2. Load articles
    const saved = localStorage.getItem('kb_articles');
    let articleList: Article[] = [];
    if (saved) {
      try {
        articleList = JSON.parse(saved);
      } catch (e) {}
    }

    if (articleList.length === 0) {
      // Fallback
      articleList = [DEFAULT_ARTICLE];
    }
    setArticles(articleList);

    // 3. Tìm bài viết hiện tại
    const found = articleList.find(a => a.id === id) || articleList[0];
    
    // Tự động tăng +1 lượt xem khi load trang (Premium UX)
    const updatedArticle = {
      ...found,
      views: found.views + 1
    };

    setArticle(updatedArticle);

    // Lưu lại view count mới vào localStorage
    const updatedList = articleList.map(a => a.id === found.id ? updatedArticle : a);
    localStorage.setItem('kb_articles', JSON.stringify(updatedList));

    // Reset trạng thái bình chọn của bài viết mới
    setVoteState(null);
  }, [id]);

  if (!article) {
    return (
      <div className="kb-detail-container">
        <div className="kb-detail-content">Đang tải thông tin bài viết...</div>
      </div>
    );
  }

  // Lấy các bài viết liên quan (Cùng chuyên mục hoặc chứa tag giống nhau, loại bỏ bài hiện tại)
  const relatedArticles = articles
    .filter(a => a.id !== article.id && a.status === 'Published' && a.category === article.category)
    .slice(0, 2);

  // Xử lý vote "Hữu ích"
  const handleVoteHelpful = () => {
    if (voteState === 'helpful') return; // đã vote rồi thì không vote lại

    const updated = {
      ...article,
      helpful: article.helpful + 1,
      // Nếu trước đó vote unhelpful thì trừ đi 1
      unhelpful: voteState === 'unhelpful' ? Math.max(0, article.unhelpful - 1) : article.unhelpful
    };

    setArticle(updated);
    setVoteState('helpful');

    // Lưu vào database local
    const updatedList = articles.map(a => a.id === article.id ? updated : a);
    setArticles(updatedList);
    localStorage.setItem('kb_articles', JSON.stringify(updatedList));
  };

  // Xử lý vote "Không hữu ích"
  const handleVoteUnhelpful = () => {
    if (voteState === 'unhelpful') return;

    const updated = {
      ...article,
      unhelpful: article.unhelpful + 1,
      helpful: voteState === 'helpful' ? Math.max(0, article.helpful - 1) : article.helpful
    };

    setArticle(updated);
    setVoteState('unhelpful');

    // Lưu vào database local
    const updatedList = articles.map(a => a.id === article.id ? updated : a);
    setArticles(updatedList);
    localStorage.setItem('kb_articles', JSON.stringify(updatedList));
  };

  return (
    <div className="kb-detail-container">
      <div className="kb-detail-content">
        
        {/* Nút quay lại và nút sửa bài viết (L2) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            type="button" 
            className="btn-feedback-action"
            onClick={() => navigate('/knowledge')}
            style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            ⬅ Quay lại danh mục
          </button>

          {/* Nút chỉnh sửa bài viết dành cho L2 */}
          {userRole === 'L2' && (
            <button
              type="button"
              className="btn-feedback-action active-helpful"
              onClick={() => navigate(`/knowledge/edit/${article.id}`)}
              style={{ padding: '6px 16px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
            >
              📝 Chỉnh sửa hướng dẫn
            </button>
          )}
        </div>

        {/* Khối Chi tiết bài viết */}
        <div className="kb-detail-card">
          <div className="kb-detail-header">
            <div className="kb-meta-row">
              <span className="kb-category-badge">{article.category}</span>
              <span>•</span>
              <span>Bởi: <strong>{article.author}</strong></span>
              <span>•</span>
              <span>Cập nhật: {article.createdAt}</span>
              <span>•</span>
              <span>Lượt xem: {article.views}</span>
            </div>
            <h1 className="kb-detail-title">{article.title}</h1>
            {article.tags && article.tags.length > 0 && (
              <div className="kb-detail-tags">
                {article.tags.map((tag, index) => (
                  <span key={index} className="kb-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="kb-detail-body">
            {article.content}
          </div>

          {/* Khối tệp đính kèm tri thức */}
          <div className="kb-attachments-section">
            <h3 className="kb-section-title">
              📁 Tệp đính kèm hướng dẫn
            </h3>
            <div className="ticket-attachments-list" style={{ maxWidth: '400px' }}>
              {article.id === 'KB-0001' ? (
                <div className="ticket-attachment-item">
                  <span className="ticket-attachment-name">vpn_profile_company.ovpn</span>
                  <span className="ticket-attachment-size">14 KB</span>
                  <button 
                    type="button" 
                    className="btn-download-attachment"
                    onClick={() => alert('Đang tải file cấu hình: vpn_profile_company.ovpn')}
                  >
                    ⬇
                  </button>
                </div>
              ) : article.id === 'KB-0002' ? (
                <div className="ticket-attachment-item">
                  <span className="ticket-attachment-name">dell_printer_jam_guide.pdf</span>
                  <span className="ticket-attachment-size">1.8 MB</span>
                  <button 
                    type="button" 
                    className="btn-download-attachment"
                    onClick={() => alert('Đang tải cẩm nang: dell_printer_jam_guide.pdf')}
                  >
                    ⬇
                  </button>
                </div>
              ) : (
                <span className="attachments-empty" style={{ fontSize: '13px' }}>Không có tài liệu đính kèm kèm theo bài viết này.</span>
              )}
            </div>
          </div>

          {/* Đánh giá tính hữu ích (UC-06 quy định) */}
          <div className="kb-feedback-section">
            <div className="kb-feedback-text">
              Thông tin hướng dẫn trên có hữu ích với bạn để khắc phục sự cố không?
            </div>
            <div className="kb-feedback-buttons">
              <button
                type="button"
                className={`btn-feedback-action ${voteState === 'helpful' ? 'active-helpful' : ''}`}
                onClick={handleVoteHelpful}
                disabled={voteState !== null}
              >
                👍 Hữu ích (+{article.helpful})
              </button>
              
              <button
                type="button"
                className={`btn-feedback-action ${voteState === 'unhelpful' ? 'active-unhelpful' : ''}`}
                onClick={handleVoteUnhelpful}
                disabled={voteState !== null}
              >
                👎 Không hữu ích (+{article.unhelpful})
              </button>
            </div>
          </div>
        </div>

        {/* Khối bài viết liên quan */}
        <div>
          <h3 className="kb-section-title" style={{ fontSize: '16px', margin: '24px 0 16px 0' }}>
            📖 Bài viết liên quan gợi ý
          </h3>
          {relatedArticles.length > 0 ? (
            <div className="kb-related-grid">
              {relatedArticles.map((rel) => (
                <div 
                  key={rel.id} 
                  className="kb-related-card"
                  onClick={() => navigate(`/knowledge/detail/${rel.id}`)}
                >
                  <h4 className="kb-related-title">{rel.title}</h4>
                  <div className="kb-related-meta">
                    <span>Chuyên mục: {rel.category}</span>
                    <span>Lượt xem: {rel.views}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' }}>Không có bài viết liên quan nào khác trong cùng danh mục.</span>
          )}
        </div>

      </div>
    </div>
  );
};
