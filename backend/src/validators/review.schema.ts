// src/validators/review.schema.ts
import { z } from 'zod';

export const validateTokenSchema = z.object({
  token: z.string({
    message: "Token xác thực không được để trống"
  })
});

export const submitReviewSchema = z.object({
  token: z.string({ message: "Thiếu token xác thực" }),
  hai_long: z.boolean({ message: "Vui lòng chọn mức độ hài lòng (true/false)" }),
  so_sao: z.number({ message: "Số sao phải là định dạng số" })
    .min(1, "Số sao tối thiểu là 1")
    .max(5, "Số sao tối đa là 5"),
  nhan_xet: z.string().optional(),
  ly_do_khong_hai_long: z.string().optional()
}).refine(data => {
  // Bẫy lỗi: Nếu không hài lòng (hai_long = false) thì bắt buộc phải có nhan_xet hoặc ly_do
  if (!data.hai_long && !data.ly_do_khong_hai_long && !data.nhan_xet) {
    return false;
  }
  return true;
}, {
  message: "Vui lòng cung cấp lý do khi bạn đánh giá không hài lòng",
  path: ["ly_do_khong_hai_long"]
});