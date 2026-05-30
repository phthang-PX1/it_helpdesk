```Text
[Start] Ticket được tạo
       → Hệ thống: Xác định Priority = Urgency + Impact
       → Hệ thống: Áp dụng SLA tương ứng
       → Hệ thống: Tính Deadline
           • Deadline phản hồi = thời gian bắt đầu SLA + Response SLA
           • Deadline xử lý = thời gian bắt đầu SLA + Resolution SLA
       → Hệ thống: Khởi tạo bộ đếm (SLA phản hồi, SLA xử lý)

       → [Gateway: Parallel] ─┬─ Luồng A: Theo dõi SLA phản hồi
                               │
                               └─ Luồng B: Theo dõi SLA xử lý

═══════════════════════════════════════════════════════════════════
Luồng A: Theo dõi SLA phản hồi
═══════════════════════════════════════════════════════════════════

[Luồng A] Hệ thống: Theo dõi SLA phản hồi
         → [Gateway: Event-based] Sự kiện nào xảy ra trước?
             ├─ Quá hạn SLA
             │   → Hệ thống: Đánh dấu SLA phản hồi = Thất bại
             │   → Hệ thống: Gửi thông báo vi phạm SLA đến người xử lý hiện tại và Manager
             │   → [End] SLA phản hồi thất bại
             │
             ├─ Phản hồi đúng hạn
             │   → (Xảy ra khi Ticket chuyển trạng thái "Đang giải quyết" trong thời hạn)
             │   → Hệ thống: Đánh dấu SLA phản hồi = Thành công
             │   → [End] SLA phản hồi đạt
             │
             └─ Cảnh báo sắp hết hạn (còn 20% thời gian)
                 → Hệ thống: Gửi thông báo nhắc nhở sắp hết hạn đến người xử lý hiện tại và Manager
                 → (Quay lại gateway Event-based để chờ sự kiện tiếp theo)

═══════════════════════════════════════════════════════════════════
Luồng B: Theo dõi SLA xử lý
═══════════════════════════════════════════════════════════════════

[Luồng B] Hệ thống: Theo dõi SLA xử lý
         → [Gateway: Event-based] Sự kiện nào xảy ra trước?
             ├─ Quá hạn SLA
             │   → Hệ thống: Đánh dấu SLA xử lý = Thất bại
             │   → Hệ thống: Gửi thông báo vi phạm SLA đến người xử lý hiện tại và Manager
             │   → [End] SLA xử lý thất bại
             │
             ├─ Xử lý trong hạn (Ticket chuyển trạng thái "Đã giải quyết")
             │   → Hệ thống: Đánh dấu SLA xử lý = Thành công
             │   → [End] SLA xử lý đạt
             │
             ├─ Cảnh báo sắp hết hạn (còn 20% thời gian)
             │   → Hệ thống: Gửi thông báo nhắc nhở sắp hết hạn đến người xử lý hiện tại và Manager
             │   → (Quay lại gateway Event-based để chờ sự kiện tiếp theo)
             │
             └─ Có cần thêm thông tin từ người yêu cầu?
                 → (Xảy ra khi người xử lý yêu cầu bổ sung thông tin)
                 → Hệ thống: Tạm dừng SLA xử lý
                 → Ticket chuyển trạng thái = "Chờ phản hồi"
                 → [Chờ người dùng bổ sung thông tin]
                 → Ticket chuyển trạng thái = "Đang giải quyết" (sau khi có bổ sung)
                 → Hệ thống: Kích hoạt lại SLA xử lý
                 → (Quay lại đầu luồng B: Theo dõi SLA xử lý)
```