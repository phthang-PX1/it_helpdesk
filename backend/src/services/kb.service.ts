// src/services/kb.service.ts
import { kbRepository } from '../repositories/kb.repository';
import { AppError } from '../middlewares/errorHandler';
import { TrangThaiBaiViet } from '@prisma/client';
import { redis } from '../libs/redis'; 
import { saveMemoryFileToDisk } from '../libs/multer';

export const kbService = {
  // API-20
  searchQuick: async (keyword: string, limit: number) => {
    const rawData = await kbRepository.searchPublishedArticles(keyword, limit);
    // Format lại dữ liệu: Cắt lấy 150 ký tự đầu của nội dung làm mô tả ngắn (mo_dau)
    return rawData.map(item => {
      const mo_dau = item.noi_dung.substring(0, 150) + (item.noi_dung.length > 150 ? '...' : '');
      const { noi_dung, ...rest } = item;
      return { ...rest, mo_dau };
    });
  },

  // API-21
  getArticles: async (query: any, userRole: string) => {
    const { page, limit, loai_su_co, the, trang_thai, sort } = query;
    let whereClause: any = {};

    // Logic Phân quyền xem mềm:
    // Requester / L1 chỉ được xem bài đã xuất bản
    if (['NGUOI_YEU_CAU', 'IT_L1'].includes(userRole)) {
      whereClause.trang_thai = TrangThaiBaiViet.DA_XUAT_BAN;
    } else if (trang_thai) {
      // L2 / Manager có thể lọc xem cả bài nháp
      whereClause.trang_thai = trang_thai;
    }

    if (loai_su_co) whereClause.loai_su_co = loai_su_co;
    if (the) whereClause.the_tags = { contains: the, mode: 'insensitive' };

    let orderBy = {};
    if (sort === 'luot_xem') orderBy = { luot_xem: 'desc' };
    else if (sort === 'luot_huu_ich') orderBy = { luot_huu_ich: 'desc' };
    else orderBy = { ngay_tao: 'desc' };

    return await kbRepository.findArticles(whereClause, orderBy, (page - 1) * limit, limit);
  },

  // API-22 (Có tích hợp Redis chống đếm view lặp)
  getArticleDetail: async (id: number, userId: number, userRole: string) => {
    const article = await kbRepository.findById(id);
    if (!article) throw new AppError('Bài viết tri thức không tồn tại', 404);

    if (article.trang_thai === TrangThaiBaiViet.NHAP && !['IT_L2', 'QUAN_LY'].includes(userRole)) {
      if (article.tac_gia_id !== userId) {
        throw new AppError('Bạn không có quyền xem bài viết đang nháp này', 403);
      }
    }

    // 🔴 Dùng Redis để chặn đếm view trùng trong 1 giờ cho cùng 1 user trên 1 bài
    const redisKey = `kb_view:${id}:${userId}`;
    const hasViewed = await redis.get(redisKey);
    
    if (!hasViewed) {
      await kbRepository.incrementView(id);
      await redis.setex(redisKey, 3600, 'viewed'); // Set TTL = 1h (3600s)
      article.luot_xem += 1; // Update tạm vào object trả về
    }

    return article;
  },

  // API-23
  createArticle: async (data: any, userId: number, expressFiles: any[]) => {
    // 🔥 MAP VÀ GHI FILE TRI THỨC TỪ BUFFER RAM XUỐNG THƯ MỤC /kb BẰNG HELPER UUID MỚI
    const filesPayload = expressFiles.map((f: any) => saveMemoryFileToDisk(f, 'kb'));

    const payload = { ...data, tac_gia_id: userId };
    return await kbRepository.createArticle(payload, filesPayload);
  },

  
  // API-24
  updateArticle: async (id: number, userId: number, userRole: string, data: any) => {
    const article = await kbRepository.findById(id);
    if (!article) throw new AppError('Bài viết không tồn tại', 404);

    // checkKbOwner: Chỉ tác giả bài hoặc Manager mới được sửa bài
    if (article.tac_gia_id !== userId && userRole !== 'QUAN_LY') {
      throw new AppError('Bạn không có quyền chỉnh sửa bài viết của người khác', 403);
    }

    return await kbRepository.updateArticle(id, data);
  },

  // API-25 (Có tích hợp Redis chặn Spam Feedback 24h)
  submitFeedback: async (id: number, userId: number, huuIch: boolean) => {
    const article = await kbRepository.findById(id);
    if (!article) throw new AppError('Bài viết không tồn tại', 404);

    // 🔴 Dùng Redis chặn spam vote (TTL 24h)
    const redisKey = `kb_feedback:${id}:${userId}`;
    const hasVoted = await redis.get(redisKey);
    
    if (hasVoted) {
      throw new AppError('Bạn đã đánh giá bài viết này trong 24 giờ qua. Vui lòng thử lại sau.', 429);
    }

    const result = await kbRepository.updateFeedback(id, huuIch);
    await redis.setex(redisKey, 86400, 'voted'); // Set TTL = 24h (86400s)

    return result;
  }
};