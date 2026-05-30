import { GoogleGenerativeAI } from '@google/generative-ai';
import { MucDoAnhHuong, MucDoKhanCap } from '@prisma/client';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const analyzeTicketPriority = async (title: string, description: string): Promise<{ muc_do_anh_huong: MucDoAnhHuong, muc_do_khan_cap: MucDoKhanCap }> => {
  try {
    // Sử dụng model gemini-1.5-flash để phản hồi nhanh và chính xác
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
Bạn là một chuyên gia quản trị dịch vụ IT (ITIL) tại Map Pacific Singapore. Nhiệm vụ của bạn là phân tích sự cố IT dựa trên "Tiêu đề" và "Mô tả chi tiết" do người dùng cung cấp để xác định:
1. Mức độ ảnh hưởng (muc_do_anh_huong): Phạm vi ảnh hưởng của sự cố đối với doanh nghiệp (VD: Toàn công ty, một phòng ban, hay một cá nhân).
2. Mức độ khẩn cấp (muc_do_khan_cap): Mức độ áp lực về thời gian cần thiết để giải quyết sự cố (VD: Ngừng trệ sản xuất, không thể làm việc, hay chỉ là lỗi nhỏ).

Quy tắc ép kiểu đầu ra:
- muc_do_anh_huong phải là một trong các giá trị (chính xác): "THAP", "TRUNG_BINH", "CAO".
- muc_do_khan_cap phải là một trong các giá trị (chính xác): "THAP", "TRUNG_BINH", "CAO".

Đầu vào:
Tiêu đề: ${title}
Mô tả chi tiết: ${description}

Yêu cầu: Chỉ trả về duy nhất một chuỗi JSON hợp lệ với cấu trúc sau, không kèm bất kỳ thẻ markdown hay giải thích nào khác:
{
  "muc_do_anh_huong": "...",
  "muc_do_khan_cap": "..."
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    
    const isValidAnhHuong = Object.values(MucDoAnhHuong).includes(parsed.muc_do_anh_huong as MucDoAnhHuong);
    const isValidKhanCap = Object.values(MucDoKhanCap).includes(parsed.muc_do_khan_cap as MucDoKhanCap);

    return {
      muc_do_anh_huong: isValidAnhHuong ? parsed.muc_do_anh_huong as MucDoAnhHuong : MucDoAnhHuong.TRUNG_BINH,
      muc_do_khan_cap: isValidKhanCap ? parsed.muc_do_khan_cap as MucDoKhanCap : MucDoKhanCap.TRUNG_BINH
    };
  } catch (error) {
    console.error('Lỗi khi gọi LLM Gemini để đánh giá ticket:', error);
    // Fallback an toàn nếu LLM gặp sự cố
    return {
      muc_do_anh_huong: MucDoAnhHuong.TRUNG_BINH,
      muc_do_khan_cap: MucDoKhanCap.TRUNG_BINH
    };
  }
};
