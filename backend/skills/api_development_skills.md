# CẨM NANG KỸ NĂNG XÂY DỰNG & KHỞI CHẠY API BACKEND (TYPESCRIPT + EXPRESS)
*Tài liệu tổng hợp từ quá trình triển khai thực tế hệ thống IT Helpdesk - Map Pacific Singapore*

---

## 📌 PHẦN 1: KHỞI TẠO & CẤU HÌNH MÔI TRƯỜNG DỰ ÁN (ENVIRONMENT SETUP)

### 1. Quản lý Lệnh thực thi qua `package.json`
* **Bản chất:** Mục `"scripts"` trong `package.json` đóng vai trò là danh mục các "phím tắt" giúp lập trình viên tự động hóa các câu lệnh dài dòng trong Terminal.
* **Kỹ thuật cấu hình nhiều lệnh:** Các lệnh được viết dưới dạng cặp `Key: Value`, ngăn cách nhau bởi **dấu phẩy (`,`)**. Việc thiếu dấu phẩy khi thêm lệnh mới (như lệnh `dev`) là nguyên nhân phổ biến khiến file JSON bị lỗi cú pháp (`JSON chứa gạch đỏ`).
* **Môi trường Development (`npm run dev`):** Sử dụng công cụ `ts-node-dev` thay vì `node` thuần. Thư viện này giúp:
    * Biên dịch trực tiếp file TypeScript (`.ts`) sang JavaScript trong bộ nhớ đệm (RAM) mà không cần xuất ra file vật lý.
    * Tự động theo dõi sự thay đổi của mã nguồn (`--respawn`) để khởi động lại (Hot Reload) server ngay khi nhấn Lưu file (Ctrl + S).
    * Bỏ qua việc kiểm tra kiểu dữ liệu quá khắt khe khi đang dev (`--transpile-only`) để tăng tốc độ phản hồi.

### 2. Thiết lập File Chỉ đường `tsconfig.json`
* **Tầm quan trọng:** Dự án TypeScript bắt buộc phải có file `tsconfig.json` ở thư mục gốc của Backend. Thiếu file này, trình biên dịch (Compiler) sẽ tự động áp dụng các quy chuẩn mặc định cũ kỹ (như `node10`), dẫn đến xung đột nghiêm trọng với các thư viện hiện đại.
* **Cấu hình chuẩn hóa cho TypeScript v6.x+:**
    ```json
    {
      "compilerOptions": {
        "target": "ES2022",
        "module": "NodeNext",
        "moduleResolution": "NodeNext",
        "ignoreDeprecations": "6.0",
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "strict": true,
        "skipLibCheck": true,
        "outDir": "./dist",
        "rootDir": "./src",
        "types": ["node"]
      },
      "include": ["src/**/*"]
    }
    ```

### 3. Đồng bộ Môi trường Chạy (Node.js & TypeScript)
* **Định nghĩa kiểu dữ liệu `@types/node`:** TypeScript thuần túy là một ngôn ngữ siêu tập (Superset) của JavaScript, nó không tự nhận biết được các biến toàn cục của môi trường Node.js. Do đó, khi gọi biến hệ thống như `process.env.PORT`, TypeScript sẽ báo lỗi `Cannot find name 'process'`.
* **Giải pháp xử lý triệt để:**
    1.  Cài đặt thư viện định nghĩa kiểu: `npm i --save-dev @types/node`.
    2.  Khai báo tường minh trong `tsconfig.json` tại mục `"types": ["node"]`.
    3.  *Tuyệt chiêu xử lý bộ nhớ đệm VS Code:* Nếu đã cài đúng nhưng VS Code vẫn báo đỏ, sử dụng tổ hợp phím `Ctrl + Shift + P` -> Chọn `Developer: Reload Window` để ép công cụ quét lại toàn bộ cấu trúc định nghĩa.

---

## 📌 PHẦN 2: THIẾT KẾ TÀI LIỆU API CHUẨN ĐẾT (SWAGGER JSDOC & YAML)

### 1. Kiến trúc Tài liệu: JSDoc vs Object JSON
* **Phương pháp tối ưu (JSDoc ngay tại Route):** Viết tài liệu đặc tả API bằng comment `/** @openapi ... */` ngay trên đầu các hàm định tuyến (Routes).
    * *Ưu điểm:* Code đi liền với tài liệu (High Cohesion), giúp bảo trì cực nhàn. Khi một API thay đổi cấu trúc dữ liệu, lập trình viên sửa ngay tại file đó mà không làm phình to file cấu hình chính `server.ts` hay `app.ts`.
* **Bản chất JSDoc:** Sử dụng ký tự mở đầu bằng `/**` (chính thống của chuẩn JSDoc quốc tế). Thư viện `swagger-jsdoc` sẽ quét qua toàn bộ file, bóc tách lớp vỏ comment và dấu hoa thị `*` ở đầu dòng để gom phần chữ bên trong thành một tài liệu YAML hoàn chỉnh.

### 2. Quy tắc Thụt Lề YAML (The Gold Rules)
YAML không sử dụng dấu ngoặc nhọn `{}` hay dấu chấm phẩy `;` để phân tách khối dữ liệu, nó hoàn toàn dựa vào **khoảng trắng thụt lề (Space)** để nhận diện quan hệ Cha - Con.

* **Quy tắc "1 Space sinh tồn":** Ngay sau dấu hoa thị trang trí `*`, bắt buộc phải có **đúng 1 dấu cách** rồi mới viết mã YAML (Ví dụ: `* @openapi` hoặc `* /api/v1/auth/login:`). Nếu viết dính liền `*@openapi`, bộ quét dữ liệu sẽ bị lỗi ngay lập tức.
* **Quy tắc Cấp độ (Mỗi cấp lùi 2 Space):** Khi chuyển từ thực thể cha xuống thực thể con, ta sử dụng phím Space (tuyệt đối không dùng phím Tab).
    * *Lỗi `YAMLSemanticError: Map keys must be unique`:* Xuất hiện khi các thuộc tính con bị đẩy ra thẳng hàng với thuộc tính cha (lùi 0 space), khiến hệ thống hiểu lầm bạn đang khai báo lặp đi lặp lại một biến ở cùng một cấp độ.
    * *Lỗi `YAMLSyntaxError: All collection items must start at the same column`:* Xuất hiện khi các thuộc tính "anh em" cùng cấp (như `summary`, `tags`, `requestBody`, `responses`) đứng lệch cột dọc với nhau, dù chỉ lệch 1 dấu cách.

---

## 📌 PHẦN 3: KIỂM SOÁT VÒNG ĐỜI KHỞI CHẠY SERVER (SERVER LIFECYCLE)

### 1. Cơ chế Mở cổng Lắng nghe (`app.listen`)
* Một file cấu hình Express dù viết hoàn chỉnh đến đâu, nếu thiếu hàm `app.listen(PORT)`, nó mới chỉ dừng lại ở mức "định hình khung sườn" chứ chưa thực sự mở cửa để nhận các yêu cầu (Request) từ mạng Internet hoặc Giao diện (Frontend).
* Khi thiếu lệnh này, trình duyệt sẽ báo lỗi hạ tầng mạng: `ERR_CONNECTION_REFUSED` (Localhost từ chối kết nối), trong khi Terminal lại im lìm không báo lỗi gì vì cú pháp hoàn toàn hợp lệ.

### 2. Quản lý Độc lập Cổng (Port) trên một Thiết bị
* Một máy tính có thể chạy đồng thời hàng trăm dự án Frontend và Backend song song. Điều kiện duy nhất là chúng phải chạy trên các mã số cổng (Port) khác nhau.
* Backend chiếm cổng `3000`, Frontend (React/Vite) có thể chiếm cổng `5173`. Việc chạy giao diện không hề làm ảnh hưởng hay xung đột với server API ngầm bên dưới. Lập trình viên chỉ cần mở nhiều tab Terminal riêng biệt trong VS Code để điều khiển song song.

---

## 📌 PHẦN 4: CHIẾN LƯỢC TEST LUỒNG & PHỐI HỢP DỰ ÁN (AGILE WORKFLOW)

### 1. Xử lý Trạng thái Bảo mật (Mật khẩu đã băm - Hashed Password)
* **Nguyên tắc cốt lõi:** Mật khẩu lưu trong Database luôn được mã hóa một chiều (Bcrypt/Argon2). Khi thực hiện test API đăng nhập thành công (`Code 200`), không thể nhập chuỗi text thuần thô thiển vào Swagger nếu trong DB đang lưu chuỗi băm.
* **Giải pháp Test nhanh không phá vỡ cấu trúc:**
    * *Giải pháp 1 (Bypass tạm thời):* Bổ sung điều kiện "cửa sau" bằng mã cứng trong file Controller: `if (mat_khau === '123456' || logic_compare_thật)`.
    * *Giải pháp 2 (Đồng bộ chuỗi Hash mẫu):* Dùng `npx prisma studio` để mở giao diện quản lý data trực quan, ghi đè cột mật khẩu của một tài khoản mẫu bằng chuỗi mã hóa cố định của ký tự `123456` (`$2b$10$EPf9jVQC9qn6v6CZZI2Sfe8bZ...`).

### 2. Nhận diện Lỗi Nghiệp vụ tiêu chuẩn (`Code 400 Bad Request`)
* Lỗi `400` không phải lỗi hệ thống (Crash code), mà là **bộ lọc bảo vệ Backend hoạt động tốt**.
* Nó kích hoạt khi dữ liệu đầu vào không thỏa mãn định dạng (Validate lỗi thông qua Zod Schema):
    * Gửi thiếu trường bắt buộc (ví dụ: chỉ gửi `tai_khoan`, quên gửi `mat_khau`).
    * Sai kiểu dữ liệu nghiêm trọng (ví dụ: truyền `mat_khau: 123456` định dạng Số, trong khi hệ thống yêu cầu định dạng Chuỗi `"123456"`).
    * Sai tên biến (Typo Key) do không đồng bộ chuẩn đặt tên (Snake Case `tai_khoan` vs Camel Case `taiKhoan`).

### 3. Mô hình Phát triển API Cuốn chiếu (Agile/Scrum với 44 API)
Khi đối mặt với số lượng API khổng lồ (44 API), quy trình làm việc tối ưu của một kỹ sư phần mềm chuyên nghiệp là:

1.  **Giai đoạn 1 - Đặc tả giao tiếp (Swagger Mock):** Định nghĩa toàn bộ comment `@openapi` cho các đầu việc lớn, ghi sẵn cấu trúc dữ liệu trả về giả định (Mock Data). Đẩy link này cho Frontend (qua mạng LAN Wifi chung hoặc thông qua công cụ mở cổng nhanh **Ngrok**).
2.  **Giai đoạn 2 - Frontend độc lập phát triển:** Đội ngũ làm giao diện ôm link Swagger, tự code giao diện kết nối dựa trên Mock Data mà không cần đợi Backend hoàn thiện logic thật.
3.  **Giai đoạn 3 - Backend cuốn chiếu logic:** Người làm Backend bám sát `checklist_backend.md`, lật từng file Controller ra viết logic thật (kết nối Prisma, truy vấn DB, xử lý nghiệp vụ) theo từng nhóm tính năng (Authentication -> Ticket Management -> Report).

---
*Tài liệu này là kim chỉ nam cho toàn bộ quá trình thực tập và triển khai đồ án kỹ nghệ phần mềm chất lượng cao.*
