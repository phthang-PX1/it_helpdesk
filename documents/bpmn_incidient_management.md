# BPMN Xử lý Ticket (Incident Management)

## Biểu đồ luồng dạng cây

```text
[Start] Người dùng tạo Ticket mới
       → Hệ thống: Xác định mức độ ưu tiên (Priority = Impact × Urgency)
       → Hệ thống: Tính Deadline (Response SLA, Resolution SLA)
       → Hệ thống: Phân công Ticket cho L1
       → L1: Tiếp nhận, kiểm tra thông tin Ticket
       → L1: Bấm nút "Bắt đầu xử lý"
       → Hệ thống: Đổi trạng thái thành "Đang giải quyết"
       → L1: Phân tích sự cố
       → [Gateway] Đã biết cách xử lý chưa?
           ├─ Rồi
           │   → L1: Thực hiện xử lý nhanh (reset password, hướng dẫn user, kiểm tra mạng cơ bản)
           │   → L1: Viết giải pháp vào Ticket
           │   → L1: Đổi trạng thái thành "Đã giải quyết"
           │   → Hệ thống: Gửi email thông báo kết quả kèm link khảo sát
           │   → Người dùng: Thực hiện khảo sát
           │   → [Gateway] Có hài lòng không?
           │       ├─ Có
           │       │   → Hệ thống: Cập nhật trạng thái Ticket = "Đã đóng"
           │       │   → Hệ thống: Ghi nhận SLA, lưu lịch sử báo cáo hiệu suất
           │       │   → [End] Ticket đóng
           │       └─ Không
           │           → Người dùng: Ghi lý do không hài lòng trong link khảo sát
           │           → Hệ thống: Tự động mở lại Ticket (reopen)
           │           → [Gateway] Số lần mở lại Ticket?
           │               ├─ = 1 lần
           │               │   → Hệ thống: Khởi tạo SLA xử lý mới cho L1
           │               │   → (quay lại bước L1 tiếp nhận kiểm tra)
           │               └─ ≥ 2 lần
           │                   → Hệ thống: Khóa nút "Mở lại"
           │                   → [End] Không thể mở lại, phải tạo Ticket mới
           └─ Chưa
               → L1: Tra cứu Cơ sở tri thức
               → [Gateway] Đã tìm thấy giải pháp chưa?
                   ├─ Rồi
                   │   → L1: Áp dụng giải pháp → Viết giải pháp vào Ticket
                   │   → L1: Đổi trạng thái thành "Đã giải quyết"
                   │   → (tiếp tục luồng gửi khảo sát như nhánh "Rồi" bên trên)
                   └─ Chưa
                       → L1: Ghi chú lý do chuyển cấp
                       → L1: Chuyển Ticket lên L2
                       → L2: Tiếp nhận, kiểm tra thông tin, xác nhận mức độ ưu tiên
                       → [Gateway] Sự cố có nghiêm trọng không?
                           ├─ Có
                           │   → L2: Nâng mức độ ưu tiên lên "Cao"
                           │   → L2: Thông báo tới Quản lý IT
                           │   → Quản lý IT: Huy động nguồn lực khẩn cấp
                           │   → Quản lý IT: Ban hành chỉ đạo phương án xử lý
                           │   → Quản lý IT: Quyết định phương án cuối cùng
                           │   → L2: Ghi nhận giải pháp xử lý vào Ticket
                           │   → (tiếp tục luồng giải quyết chung)
                           └─ Không
                               → L2: Tìm hiểu vấn đề
                               → [Gateway] Xác định được nguyên nhân gốc chưa?
                                   ├─ Có
                                   │   → L2: Ghi nhận nguyên nhân
                                   │   → L2: Giải quyết sự cố
                                   │   → (tiếp tục luồng ghi nhận giải pháp)
                                   └─ Chưa
                                       → L2: Phối hợp với L2 chuyên môn (Infrastructure/Application)
                                       → L2: Gửi yêu cầu hỗ trợ nội bộ
                                       → L2: Nhận phản hồi
                                       → (quay lại bước "Tìm hiểu vấn đề")
                       → (sau khi có giải pháp)
                           → L2: Ghi nhận giải pháp xử lý vào Ticket
                           → L2: Soạn bài viết tri thức từ giải pháp
                           → L2: Thông báo giải pháp mới cho L1
                           → L2: Đổi trạng thái thành "Đã giải quyết"
                           → (tiếp tục luồng gửi khảo sát và đóng ticket như trên)

[Subflow: Yêu cầu bổ sung thông tin (có thể xảy ra ở L1 hoặc L2)]
       → Trong quá trình xử lý, tại gateway "Có cần thêm thông tin không?"
           ├─ Có
           │   → L1/L2: Viết thông tin cần bổ sung
           │   → L1/L2: Cập nhật trạng thái Ticket = "Chờ phản hồi"
           │   → Hệ thống: Tạm dừng SLA
           │   → Hệ thống: Gửi email/thông báo yêu cầu bổ sung thông tin
           │   → Người dùng: Bổ sung thông tin vào ticket
           │   → Hệ thống: Tiếp tục SLA
           │   → (quay lại bước phân tích của L1 hoặc L2 tương ứng)
           └─ Không
               → (tiếp tục xử lý bình thường theo luồng chính)