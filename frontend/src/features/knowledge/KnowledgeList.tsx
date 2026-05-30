import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './KnowledgeList.css';
import { kbService, type KBArticle } from '../../services/kb.service';

export const KnowledgeList: React.FC = () => {
  const navigate = useNavigate();

  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // Xác định vai trò của người dùng
  const [userRole, setUserRole] = useState<string>('Người yêu cầu');
  useEffect(() => {
    const savedSession = localStorage.getItem('it_helpdesk_session');
    if (savedSession) {
      try {
        setUserRole(JSON.parse(savedSession).role);
      } catch (e) {}
    }
  }, []);

  // States tìm kiếm và bộ lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'DA_XUAT_BAN' | 'NHAP'>('DA_XUAT_BAN');

  useEffect(() => {
    fetchArticles();
  }, [activeTab, selectedCategory]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const filters: any = { limit: 100, trang_thai: activeTab };
      if (selectedCategory !== 'All') {
        filters.loai_su_co = selectedCategory;
      }
      const res = await kbService.getAll(filters);
      setArticles(res.data || []);
    } catch (error) {
      console.error('Failed to fetch KB articles', error);
    } finally {
      setLoading(false);
    }
  };

  // Gom tất cả các thẻ tag độc nhất trong danh sách bài viết
  const allTags = Array.from(
    new Set(articles.flatMap(article => {
      if (!article.the_tags) return [];
      try {
        return JSON.parse(article.the_tags) as string[];
      } catch {
        return [article.the_tags];
      }
    }))
  );

  // Bộ lọc tìm kiếm
  const filteredArticles = articles.filter(article => {
    // Tìm kiếm theo tiêu đề hoặc nội dung
    const matchSearch = 
      article.tieu_de.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.noi_dung.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    // Lọc theo thẻ tag
    if (selectedTag !== 'All') {
      const tags = article.the_tags ? (article.the_tags.includes('[') ? JSON.parse(article.the_tags) : [article.the_tags]) : [];
      if (!tags.includes(selectedTag)) return false;
    }

    return true;
  });

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Phần cứng': return 'kb-category-badge hardware';
      case 'Mạng': return 'kb-category-badge network';
      case 'Hệ thống': return 'kb-category-badge system';
      default: return 'kb-category-badge';
    }
  };

  return (
    <div className="kb-container">
      <div className="kb-content">
        
        {/* 1. Thanh tìm kiếm lớn đầu trang */}
        <div className="kb-header-card">
          <div className="kb-title-area">
            <h1 className="kb-main-title">Cơ sở tri thức IT Helpdesk nội bộ</h1>
            <p className="kb-main-subtitle">
              Tìm kiếm các bài viết hướng dẫn xử lý sự cố, tài liệu hướng dẫn kỹ thuật công ty giúp tự sửa lỗi nhanh chóng.
            </p>
          </div>
          
          <div className="kb-search-container">
            <span className="kb-search-icon-large">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              className="kb-search-input"
              placeholder="Nhập từ khóa tìm kiếm hướng dẫn (Ví dụ: VPN, Kẹt giấy, Zoom...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* 2. Thanh bộ lọc */}
        <div className="kb-filters-card">
          <div className="kb-filters-row">
            <div className="kb-filters-left">
              <select
                className="kb-select-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">Tất cả chuyên mục</option>
                <option value="Phần cứng">Hỗ trợ Phần cứng</option>
                <option value="Phần mềm">Hỗ trợ Phần mềm</option>
                <option value="Mạng">Hỗ trợ Mạng</option>
                <option value="Hệ thống">Hỗ trợ Hệ thống</option>
              </select>

              <select
                className="kb-select-filter"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
              >
                <option value="All">Tất cả Thẻ tag</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            {/* Chỉ L2 mới được hiển thị nút Tạo bài viết mới */}
            {(userRole === 'L2' || userRole === 'Quản lý IT') && (
              <button
                type="button"
                className="btn-create-kb"
                onClick={() => navigate('/knowledge/create')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Tạo bài viết tri thức
              </button>
            )}
          </div>
        </div>

        {/* 3. Thanh chuyển đổi Tab ngang */}
        {(userRole === 'L2' || userRole === 'Quản lý IT') && (
          <div className="kb-tabs-container">
            <button
              type="button"
              className={`kb-tab-item ${activeTab === 'DA_XUAT_BAN' ? 'active' : ''}`}
              onClick={() => setActiveTab('DA_XUAT_BAN')}
            >
              Đã xuất bản
            </button>
            <button
              type="button"
              className={`kb-tab-item ${activeTab === 'NHAP' ? 'active' : ''}`}
              onClick={() => setActiveTab('NHAP')}
            >
              Bản nháp
            </button>
          </div>
        )}

        {/* 4. Lưới card bài viết */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>Đang tải bài viết...</div>
        ) : filteredArticles.length > 0 ? (
          <div className="kb-cards-grid">
            {filteredArticles.map((article) => {
              const tags = article.the_tags ? (article.the_tags.includes('[') ? JSON.parse(article.the_tags) : [article.the_tags]) : [];
              return (
                <div 
                  key={article.tri_thuc_id} 
                  className="kb-card"
                  onClick={() => navigate(`/knowledge/detail/${article.tri_thuc_id}`)}
                >
                  <div className="kb-card-meta">
                    <span className={getCategoryBadgeClass(article.loai_su_co)}>{article.loai_su_co}</span>
                    {article.trang_thai === 'NHAP' && (
                      <span className="kb-draft-badge">Bản nháp</span>
                    )}
                  </div>

                  <h3 className="kb-card-title">{article.tieu_de}</h3>
                  
                  <p className="kb-card-desc">
                    {article.noi_dung.substring(0, 150)}...
                  </p>

                  <div className="kb-card-tags">
                    {tags.map((t: string, idx: number) => (
                      <span key={idx} className="kb-tag">#{t}</span>
                    ))}
                  </div>

                  <div className="kb-card-footer">
                    <span>Bởi: {article.tac_gia?.ho_ten || 'Unknown'}</span>
                    <div className="kb-footer-stats">
                      <div className="kb-stat-item" title="Lượt xem">
                        <span>👁</span> {article.luot_xem}
                      </div>
                      <div className="kb-stat-item" title="Đánh giá hữu ích" style={{ color: '#16A34A' }}>
                        <span>👍</span> {article.luot_huu_ich}
                      </div>
                      <div className="kb-stat-item" title="Đánh giá không hữu ích" style={{ color: '#DC2626' }}>
                        <span>👎</span> {article.luot_khong_huu_ich}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="kb-filters-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#475569', margin: '0 0 6px 0' }}>
              Không tìm thấy kết quả phù hợp
            </h3>
            <p style={{ fontSize: '13.5px', color: '#94A3B8', margin: 0 }}>
              Thử nhập từ khóa khác hoặc điều chỉnh các lựa chọn bộ lọc phía trên.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
