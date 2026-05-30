# 🚀 CHECKLIST TRIỂN KHAI BACKEND HELPDESK (DÀNH CHO NGƯỜI MỚI)

## 📌 QUY TẮC VÀNG (LUÔN GHI NHỚ TRƯỚC KHI CODE)
- [ ] **Zod First:** Luôn viết Schema kiểm tra dữ liệu đầu vào (Zod) trước khi viết logic.
- [ ] **Layer Isolation:** Tuyệt đối tuân thủ luồng: `Route` -> `Controller` -> `Service` -> `Repository`.
- [ ] **No Raw Prisma:** Không viết lệnh gọi database (`prisma.create`, `prisma.findMany`) trực tiếp trong file Service.
- [ ] **AppError Center:** Mọi lỗi nghiệp vụ phải được ném ra qua custom class `AppError` để Middleware tổng xử lý. 

- Chạy prisma: npx prisma studio
- Chạy backend: vào trong đường dẫn folder backend, chạy npm run dev
- mở lại docker: wsl --shutdown trong terminal laptop
---
