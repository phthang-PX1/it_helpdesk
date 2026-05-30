# --- Stage 1: Build React App ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ mã nguồn
COPY . .

# Xây dựng (Build) project thành các file tĩnh HTML/CSS/JS (thư mục dist)
# Chèn biến môi trường VITE_API_URL trỏ về backend proxy.
# Trên production thông thường Backend và Frontend gọi nhau qua proxy hoặc cấu hình domain.
# Ở đây ta set mặc định, có thể ghi đè lúc runtime nếu cần.
ENV VITE_API_URL="/api/v1"
RUN npm run build

# --- Stage 2: Serve bằng Nginx ---
FROM nginx:alpine

# Xóa cấu hình mặc định của Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copy file cấu hình Nginx tùy chỉnh vào container
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy thư mục dist từ Stage 1 sang thư mục html của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 cho web server
EXPOSE 80

# Chạy Nginx ở background
CMD ["nginx", "-g", "daemon off;"]
