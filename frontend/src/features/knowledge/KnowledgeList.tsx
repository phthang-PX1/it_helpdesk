import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './KnowledgeList.css';

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

const INITIAL_ARTICLES: Article[] = [
  {
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
  },
  {
    id: 'KB-0002',
    title: 'Khắc phục lỗi kẹt giấy liên tục trên máy in văn phòng Dell',
    category: 'Phần cứng',
    tags: ['Máy in', 'Kẹt giấy', 'Dell'],
    content: 'Bước 1: Tắt nguồn máy in để đảm bảo an toàn lao động.\n\nBước 2: Mở nắp khay chứa drum máy in Dell phía trước.\n\nBước 3: Rút cartridge mực nhẹ nhàng theo hướng thẳng ra ngoài.\n\nBước 4: Phát hiện và lôi giấy kẹt ra ngoài theo đúng chiều cuốn, tránh giật mạnh làm rách giấy lưu lại mẩu giấy bên trong.\n\nBước 5: Lắp lại cartridge mực, đóng nắp và khởi động lại máy in.',
    author: 'Nguyễn Văn Hỗ Trợ (IT L1)',
    status: 'Published',
    views: 95,
    helpful: 24,
    unhelpful: 1,
    createdAt: '2026-05-22',
    viewPermission: 'Tất cả nhân viên',
    editPermission: 'Tất cả đội L2'
  },
  {
    id: 'KB-0003',
    title: 'Xử lý xung đột card đồ họa Dell Latitude gây màn hình xanh BSOD khi chạy Zoom',
    category: 'Phần mềm',
    tags: ['Zoom', 'BSOD', 'Dell', 'VGA'],
    content: 'Bước 1: Mở Device Manager trên Windows 11.\n\nBước 2: Tìm mục Display adapters, nhấp chuột phải vào Intel HD Graphics và chọn Uninstall device (tích chọn gỡ hoàn toàn driver cũ).\n\nBước 3: Truy cập trang Dell Support, nhập Service Tag máy và tải driver đồ họa mới nhất tương thích.\n\nBước 4: Chạy file cài đặt driver và restart lại máy tính.',
    author: 'Phạm Văn Mạng (IT L2)',
    status: 'Published',
    views: 54,
    helpful: 15,
    unhelpful: 0,
    createdAt: '2026-05-25',
    viewPermission: 'Tất cả nhân viên',
    editPermission: 'Tất cả đội L2'
  },
  {
    id: 'KB-0004',
    title: '[Bản thảo] Hướng dẫn sao lưu khôi phục cơ sở dữ liệu Postgres nội bộ',
    category: 'Hệ thống',
    tags: ['PostgreSQL', 'Database', 'Sao lưu'],
    content: 'Bước 1: Truy cập Server master PostgreSQL qua SSH.\n\nBước 2: Sử dụng lệnh pg_dump để kết xuất file backup *.sql.\n\nBước 3: Di chuyển file backup sang server lưu trữ dự phòng S3.',
    author: 'Phạm Văn Mạng (IT L2)',
    status: 'Draft',
    views: 12,
    helpful: 2,
    unhelpful: 0,
    createdAt: '2026-05-25',
    viewPermission: 'Chỉ kỹ thuật viên IT',
    editPermission: 'Chỉ tác giả'
  }
];

export const KnowledgeList: React.FC = () => {
  const navigate = useNavigate();

  // Khởi tạo mock database tri thức
  const [articles] = useState<Article[]>(() => {
    const saved = localStorage.getItem('kb_articles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    localStorage.setItem('kb_articles', JSON.stringify(INITIAL_ARTICLES));
    return INITIAL_ARTICLES;
  });

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
  const [activeTab, setActiveTab] = useState<'Published' | 'Draft'>('Published');

  // Gom tất cả các thẻ tag độc nhất trong danh sách bài viết
  const allTags = Array.from(
    new Set(articles.flatMap(article => article.tags))
  );

  // Bộ lọc tìm kiếm
  const filteredArticles = articles.filter(article => {
    // 1. Phân quyền xem bản nháp (Draft): Chỉ L2 và IT Manager mới được xem Bản nháp
    if (article.status === 'Draft') {
      if (userRole !== 'L2' && userRole !== 'Quản lý IT') return false;
    }

    // 2. Tìm kiếm theo tiêu đề hoặc nội dung
    const matchSearch = 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    // 3. Lọc theo chuyên mục
    if (selectedCategory !== 'All' && article.category !== selectedCategory) return false;

    // 4. Lọc theo thẻ tag
    if (selectedTag !== 'All' && !article.tags.includes(selectedTag)) return false;

    // 5. Lọc theo trạng thái bài viết (Lưu nháp / Đã xuất bản) thông qua activeTab
    if (article.status !== activeTab) return false;

    return true;
  });

  const getCategoryBadgeClass = (category: Article['category']) => {
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
            {userRole === 'L2' && (
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
        <div className="kb-tabs-container">
          <button
            type="button"
            className={`kb-tab-item ${activeTab === 'Published' ? 'active' : ''}`}
            onClick={() => setActiveTab('Published')}
          >
            Đã xuất bản
          </button>
          <button
            type="button"
            className={`kb-tab-item ${activeTab === 'Draft' ? 'active' : ''}`}
            onClick={() => setActiveTab('Draft')}
          >
            Bản nháp
          </button>
        </div>

        {/* 4. Lưới card bài viết */}
        {filteredArticles.length > 0 ? (
          <div className="kb-cards-grid">
            {filteredArticles.map((article) => (
              <div 
                key={article.id} 
                className="kb-card"
                onClick={() => navigate(`/knowledge/detail/${article.id}`)}
              >
                <div className="kb-card-meta">
                  <span className={getCategoryBadgeClass(article.category)}>{article.category}</span>
                  {article.status === 'Draft' && (
                    <span className="kb-draft-badge">Bản nháp</span>
                  )}
                </div>

                <h3 className="kb-card-title">{article.title}</h3>
                
                <p className="kb-card-desc">
                  {article.content.substring(0, 150)}...
                </p>

                <div className="kb-card-tags">
                  {article.tags.map((t, idx) => (
                    <span key={idx} className="kb-tag">#{t}</span>
                  ))}
                </div>

                <div className="kb-card-footer">
                  <span>Bởi: {article.author}</span>
                  <div className="kb-footer-stats">
                    <div className="kb-stat-item" title="Lượt xem">
                      <span>👁</span> {article.views}
                    </div>
                    <div className="kb-stat-item" title="Đánh giá hữu ích" style={{ color: '#16A34A' }}>
                      <span>👍</span> {article.helpful}
                    </div>
                    <div className="kb-stat-item" title="Đánh giá không hữu ích" style={{ color: '#DC2626' }}>
                      <span>👎</span> {article.unhelpful}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
