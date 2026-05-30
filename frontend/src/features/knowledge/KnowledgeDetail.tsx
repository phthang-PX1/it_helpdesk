import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './KnowledgeDetail.css';
import { kbService, type KBArticle } from '../../services/kb.service';

export const KnowledgeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<KBArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<KBArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // States bình chọn
  const [voteState, setVoteState] = useState<'helpful' | 'unhelpful' | null>(null);

  // Xác định vai trò của người dùng
  const [userRole, setUserRole] = useState<string>('Người yêu cầu');

  useEffect(() => {
    const savedSession = localStorage.getItem('it_helpdesk_session');
    if (savedSession) {
      try {
        setUserRole(JSON.parse(savedSession).role);
      } catch (e) {}
    }

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await kbService.getDetail(Number(id));
        setArticle(data);
        
        // Fetch related articles by category
        if (data && data.loai_su_co) {
          const relatedRes = await kbService.getAll({ loai_su_co: data.loai_su_co, limit: 4, trang_thai: 'DA_XUAT_BAN' });
          const filtered = relatedRes.data.filter(a => a.tri_thuc_id !== data.tri_thuc_id).slice(0, 3);
          setRelatedArticles(filtered);
        }
      } catch (error) {
        console.error('Failed to fetch article detail', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
    setVoteState(null);
  }, [id]);

  if (loading) {
    return (
      <div className="kb-detail-container">
        <div className="kb-detail-content">Đang tải thông tin bài viết...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="kb-detail-container">
        <div className="kb-detail-content">Bài viết không tồn tại hoặc đã bị xóa.</div>
      </div>
    );
  }

  // Xử lý vote "Hữu ích"
  const handleVoteHelpful = async () => {
    if (voteState === 'helpful') return;
    try {
      await kbService.feedback(article.tri_thuc_id, true);
      setArticle(prev => prev ? {
        ...prev,
        luot_huu_ich: prev.luot_huu_ich + 1,
        luot_khong_huu_ich: voteState === 'unhelpful' ? Math.max(0, prev.luot_khong_huu_ich - 1) : prev.luot_khong_huu_ich
      } : null);
      setVoteState('helpful');
    } catch (error) {
      alert('Lỗi khi gửi đánh giá');
    }
  };

  // Xử lý vote "Không hữu ích"
  const handleVoteUnhelpful = async () => {
    if (voteState === 'unhelpful') return;
    try {
      await kbService.feedback(article.tri_thuc_id, false);
      setArticle(prev => prev ? {
        ...prev,
        luot_khong_huu_ich: prev.luot_khong_huu_ich + 1,
        luot_huu_ich: voteState === 'helpful' ? Math.max(0, prev.luot_huu_ich - 1) : prev.luot_huu_ich
      } : null);
      setVoteState('unhelpful');
    } catch (error) {
      alert('Lỗi khi gửi đánh giá');
    }
  };

  let parsedTags: string[] = [];
  try {
    parsedTags = article.the_tags ? JSON.parse(article.the_tags) : [];
  } catch (e) {
    parsedTags = article.the_tags ? [article.the_tags] : [];
  }

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
          {(userRole === 'L2' || userRole === 'Quản lý IT') && (
            <button
              type="button"
              className="btn-feedback-action active-helpful"
              onClick={() => navigate(`/knowledge/edit/${article.tri_thuc_id}`)}
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
              <span className="kb-category-badge">{article.loai_su_co}</span>
              <span>•</span>
              <span>Bởi: <strong>{article.tac_gia?.ho_ten || 'Hệ thống'}</strong></span>
              <span>•</span>
              <span>Cập nhật: {new Date(article.ngay_cap_nhat).toLocaleDateString('vi-VN')}</span>
              <span>•</span>
              <span>Lượt xem: {article.luot_xem}</span>
            </div>
            <h1 className="kb-detail-title">{article.tieu_de}</h1>
            {parsedTags.length > 0 && (
              <div className="kb-detail-tags">
                {parsedTags.map((tag, index) => (
                  <span key={index} className="kb-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="kb-detail-body" style={{ whiteSpace: 'pre-wrap' }}>
            {article.noi_dung}
          </div>

          {/* Khối tệp đính kèm tri thức */}
          <div className="kb-attachments-section">
            <h3 className="kb-section-title">
              📁 Tệp đính kèm hướng dẫn
            </h3>
            <div className="ticket-attachments-list" style={{ maxWidth: '400px' }}>
              <span className="attachments-empty" style={{ fontSize: '13px' }}>Không có tài liệu đính kèm kèm theo bài viết này.</span>
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
                👍 Hữu ích (+{article.luot_huu_ich})
              </button>
              
              <button
                type="button"
                className={`btn-feedback-action ${voteState === 'unhelpful' ? 'active-unhelpful' : ''}`}
                onClick={handleVoteUnhelpful}
                disabled={voteState !== null}
              >
                👎 Không hữu ích (+{article.luot_khong_huu_ich})
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
                  key={rel.tri_thuc_id} 
                  className="kb-related-card"
                  onClick={() => navigate(`/knowledge/detail/${rel.tri_thuc_id}`)}
                >
                  <h4 className="kb-related-title">{rel.tieu_de}</h4>
                  <div className="kb-related-meta">
                    <span>Chuyên mục: {rel.loai_su_co}</span>
                    <span>Lượt xem: {rel.luot_xem}</span>
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
