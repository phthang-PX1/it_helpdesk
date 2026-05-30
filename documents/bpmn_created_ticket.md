# BPMN tạo ticket

## Biểu đồ luồng dạng cây

```text
[Start] → Người dùng nhập tiêu đề
       → Hệ thống tìm kiếm KB
       → [Gateway] Có phải yêu cầu quen thuộc?
           ├─ KHÔNG → Người dùng nhập chi tiết → Gửi yêu cầu → Tạo Ticket ID → Cập nhật trạng thái "Mới tạo" → Gửi thông báo → [End]
           └─ CÓ → Hệ thống hiển thị bài viết gợi ý
                   → Người dùng xem bài viết (+1 view)
                   → [Gateway] Có giải quyết được?
                       ├─ CÓ → Hệ thống +1 hữu ích → [End] (không tạo ticket)
                       └─ KHÔNG → Hệ thống +1 không hữu ích
                                 → Người dùng nhập chi tiết → Gửi yêu cầu → Tạo Ticket ID → Cập nhật trạng thái → Gửi thông báo → [End]