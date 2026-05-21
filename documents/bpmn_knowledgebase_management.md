# BPMN Tạo bài viết Cơ sở tri thức 

## Biểu đồ luồng dạng cây

```text
[Start] Cần tạo bài viết tri thức
       → [Gateway] Tạo bài viết bằng cách nào?
           ├─ Tạo ở trang Cơ sở tri thức
           │   → L2: Click chọn mục Cơ sở tri thức trên thanh menu
           │   → Hệ thống: Mở giao diện trang Cơ sở tri thức
           │   → L2: Bấm nút Tạo bài viết tri thức
           │   → Hệ thống: Mở trang soạn thảo bài viết tri thức
           │   → L2: Nhập tiêu đề, nội dung giải pháp tri thức theo từng bước
           │   → L2: Chọn loại sự cố
           │   → L2: Click vào Tags chọn các từ khóa liên quan tới sự cố để tìm kiếm dễ hơn
           │   → L2: Thiết lập quyền xem, quyền chỉnh sửa
           │   → [Gateway] Bấm nút nào?
           │       ├─ Xuất bản
           │       │   → Hệ thống: Lưu bài viết với trạng thái Đã xuất bản & đẩy bài viết ra trang Bài viết tri thức trong mục Cơ sở tri thức
           │       │   → [End] Bài viết được xuất bản
           │       └─ Lưu nháp
           │           → Hệ thống: Lưu bài viết trạng thái Nháp vào trang Bản nháp trong mục Cơ sở tri thức
           │           → [End] Bài viết được lưu nháp
           └─ Tạo ngay trong Ticket
               → L2: Bấm vào Các bài viết liên quan ở phần Chi tiết
               → (rẽ nhánh nhập nội dung) → L2: Nhập tiêu đề, nội dung giải pháp... (tiếp tục từ bước nhập tiêu đề)


# BPMN Tìm kiếm bài viết tri thức

## Biểu đồ luồng dạng cây

```text
[Start] Muốn tìm bài viết tri thức
       → Người yêu cầu: Chọn mục Cơ sở tri thức trên thanh menu
       → Hệ thống: Hiển thị trang Cơ sở tri thức
       → Người yêu cầu: Gõ vào thanh Tìm kiếm đầu trang
       → Hệ thống: Hiển thị bài viết dựa trên từ khóa tìm kiếm
       → Người yêu cầu: Chọn và đọc bài viết muốn xem
       → Hệ thống: +1 Lượt xem
       → [Gateway] Đánh giá bài viết?
           ├─ Hữu ích
           │   → Hệ thống: +1 Lượt đánh giá hữu ích
           │   → [End]
           ├─ Không hữu ích
           │   → Hệ thống: +1 Lượt đánh giá không hữu ích
           │   → [End]
           └─ Không đánh giá
               → [End]