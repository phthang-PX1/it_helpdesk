# BPMN Xử lý Ticket (Incident Management)

## Biểu đồ luồng dạng cây

```text
[Start] → Hệ thống: Xác định mức độ ưu tiên (Priority = Impact + Urgency)
       → Hệ thống: Phân công ticket cho L1
       → Hệ thống: Tính Deadline (Deadline phản hồi & xử lý)
       
       → L1: Tiếp nhận kiểm tra thông tin Ticket
       → L1: Đổi trạng thái = Đang giải quyết
       
       → [Gateway] Đã biết cách xử lý chưa?
           ├─ Rồi → L1: Thực hiện xử lý nhanh (reset password, hướng dẫn user, kiểm tra mạng cơ bản)
           │       → L1: Viết giải pháp vào Ticket
           │       → L1: Đổi trạng thái = Đã giải quyết
           │       → Hệ thống: Gửi email thông báo kết quả kèm Link khảo sát mức độ hài lòng
           │       → Người yêu cầu: Nhận mail và link khảo sát
           │       → Người yêu cầu: Thực hiện khảo sát
           │       → [Gateway] Có hài lòng không?
           │           ├─ Có → Hệ thống: Cập nhật trạng thái Ticket = Đã Đóng
           │           │       → Ghi nhận SLA xử lý, lưu lịch sử báo cáo hiệu suất
           │           │       → [End]
           │           └─ Không → Hệ thống: Cập nhật trạng thái Ticket = Đang giải quyết
           │                     → Hệ thống: Khởi tạo SLA mới
           │                     → [Gateway] Số lần Mở lại Ticket ≤ 2?
           │                         ├─ Có → (quay lại L1: Tiếp nhận kiểm tra thông tin Ticket)
           │                         └─ Không → Hệ thống: Phân công Ticket cho L2
           │                                    → (rẽ nhánh L2 bên dưới)
           └─ Chưa → L1: Tra cứu Cơ sở tri thức
                    → [Gateway] Đã tìm thấy giải pháp chưa?
                        ├─ Rồi → L1: Thực hiện xử lý nhanh (như nhánh "Rồi" ở trên)
                        └─ Chưa → L1: Ghi chú lý do chuyển cấp & Chuyển L2
                                 → Hệ thống: Phân công Ticket cho L2

(=== Nhánh L2 ===)
L2: Tiếp nhận kiểm tra thông tin Ticket & Xác nhận mức độ ưu tiên
→ [Gateway] Sự cố có nghiêm trọng không?
    ├─ Có → L2: Nâng Mức độ ưu tiên lên "Cao"
    │       → L2: Thông báo tới Quản lý IT
    │       → Quản lý IT: Phát tín hiệu khẩn cấp → Huy động nguồn lực khẩn cấp → Ban hành chỉ đạo phương án xử lý
    │       → (tiếp tục xuống dưới)
    └─ Không → L2: Tìm hiểu vấn đề
             → [Gateway] Xác định được nguyên nhân gốc?
                 ├─ Có → L2: Ghi nhận nguyên nhân
                 │       → L2: Giải quyết sự cố (loop cho đến khi thành công hoặc thử 3 lần)
                 │       → [Gateway] Hệ thống đã bình thường?
                 │           ├─ Rồi → L2: Ghi nhận giải pháp xử lý vào Ticket
                 │           │       → [Gateway] Có phải giải pháp mới chưa có trong Cơ sở tri thức?
                 │           │           ├─ Phải → L2: Soạn thảo bài viết tri thức từ giải pháp → [End]
                 │           │           └─ Không → [End]
                 │           └─ Chưa → L2: Tiếp tục giải quyết (quay lại giải quyết sự cố, đếm số lần thử)
                 └─ Không → L2: Gửi yêu cầu hỗ trợ nội bộ (phối hợp L2 chuyên môn Infrastructure/Application)
                           → Nhận phản hồi từ nhóm chuyên môn
                           → [Gateway] Đã thử quá 3 lần?
                               ├─ Không → quay lại "Tìm hiểu vấn đề"
                               └─ Có → Quản lý IT: Quyết định phương án cuối
                                      → L2: Ghi nhận giải pháp xử lý vào Ticket
                                      → (kiểm tra giải pháp mới như trên)


# BPMN Theo dõi SLA (SLA Monitoring)

## Biểu đồ luồng dạng cây

```text
[Start] Ticket được tạo
       → Hệ thống: Xác định Priority (Urgency + Impact)
       → Hệ thống: Áp dụng SLA tương ứng
       → Hệ thống: Tính Deadline (Deadline phản hồi & Deadline xử lý)
       → Hệ thống: Khởi tạo bộ đếm (SLA phản hồi & SLA xử lý)
       
       → [Gateway Parallel] Hai luồng theo dõi song song:
       
           ═══ Luồng 1: Theo dõi SLA phản hồi ═══
           Hệ thống: Theo dõi SLA phản hồi
           → [Gateway Exclusive] Sự kiện nào xảy ra trước?
               ├─ Cảnh báo sắp hết hạn (còn 20% thời gian)
               │   → Hệ thống: Gửi thông báo nhắc nhở đến người xử lý hiện tại và Quản lý
               │   → (quay lại tiếp tục theo dõi)
               ├─ Phản hồi đúng hạn
               │   → Hệ thống: Ghi nhận SLA phản hồi đạt
               │   → [End] (kết thúc luồng phản hồi)
               └─ Quá hạn SLA phản hồi
                   → Hệ thống: Đánh dấu SLA phản hồi = Thất bại
                   → Hệ thống: Gửi thông báo vi phạm SLA đến người xử lý và Manager
                   → [End]
           
           ═══ Luồng 2: Theo dõi SLA xử lý ═══
           Hệ thống: Theo dõi SLA xử lý
           → [Gateway Exclusive] Sự kiện nào xảy ra trước?
               ├─ Cảnh báo sắp hết hạn (còn 20% thời gian)
               │   → Hệ thống: Gửi thông báo nhắc nhở đến người xử lý hiện tại và Quản lý
               │   → (quay lại tiếp tục theo dõi)
               ├─ Xử lý trong hạn (Ticket chuyển trạng thái Đã giải quyết)
               │   → Hệ thống: Ghi nhận SLA xử lý đạt
               │   → [End]
               └─ Quá hạn SLA xử lý
                   → Hệ thống: Đánh dấu SLA xử lý = Thất bại
                   → Hệ thống: Gửi thông báo vi phạm SLA đến người xử lý và Manager
                   → [End]