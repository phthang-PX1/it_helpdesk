# Đặc tả Use Case - Hệ thống IT Helpdesk

## UC-01: Đăng nhập

| **Thuộc tính** | **Giá trị** |
|---|---|
| Use Case ID | UC-01 |
| Use Case Name | Đăng nhập |
| Mô tả | Xác thực danh tính của nhân viên trong công ty dựa trên tài khoản được cấp và tự động chuyển hướng người dùng đến giao diện tương ứng với vị trí/vai trò của họ. |
| Tác nhân | Người yêu cầu, IT Support L1/L2, Quản lý IT |
| Ưu tiên | Cao |
| Điều kiện kích hoạt | Người dùng truy cập vào trang chủ của hệ thống IT Helpdesk. |
| Tiền đề | Tài khoản của nhân viên đã được đồng bộ hoặc khởi tạo sẵn trên cơ sở dữ liệu hệ thống kèm theo thông tin vai trò (Role). |
| Hậu đề | Người dùng đăng nhập thành công và được chuyển hướng chính xác đến không gian của mình. |

### Luồng chính

1.  Hệ thống hiển thị form đăng nhập chuẩn hóa (gồm trường Nhập Tài khoản và Mật khẩu).
2.  Người dùng nhập Email công ty và Mật khẩu, sau đó nhấn nút "Đăng nhập".
3.  Hệ thống thực hiện kiểm tra, đối chiếu thông tin với cơ sở dữ liệu.
4.  Hệ thống kiểm tra trường dữ liệu Vai trò của tài khoản để tự động phân luồng giao diện:
    - **Luồng 1 (Role = Người yêu cầu):** Hệ thống chuyển hướng người dùng đến màn hình Cổng yêu cầu để tạo và theo dõi ticket.
    - **Luồng 2 (Role = IT Support L1/L2):** Hệ thống chuyển hướng đến màn hình làm việc của L1/L2.
    - **Luồng 3 (Role = Quản lý IT):** Hệ thống chuyển hướng đến màn hình làm việc của quản lý IT.

### Luồng thay thế

*   **2.1 Đăng nhập qua tài khoản Google**
    Người dùng click chọn "Đăng nhập với Email công ty" → Hệ thống tự động xác thực danh tính qua tài khoản Windows/Google đang đăng nhập trên máy tính → Bỏ qua bước nhập mật khẩu và thực hiện ngay bước 4.

### Luồng ngoại lệ

*   **3a. Sai thông tin đăng nhập**
    Người dùng nhập sai Tài khoản hoặc sai Mật khẩu. Hệ thống báo lỗi: *"Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại!"*.
*   **3b. Tài khoản chưa được phân quyền**
    Tài khoản nhập đúng mật khẩu nhưng trường Vai trò trong database bị trống. Hệ thống báo lỗi: *"Tài khoản của bạn chưa được cấp quyền truy cập hệ thống. Vui lòng liên hệ Quản lý IT!"*.

### Quy tắc nghiệp vụ

-   **Phân luồng ngầm (Role-based Routing):** Giao diện đăng nhập là duy nhất. Việc phân chia màn hình hoàn toàn do hệ thống tự động xử lý dựa trên thuộc tính tài khoản, loại bỏ thao tác chọn vai trò từ phía người dùng để tối ưu trải nghiệm và tăng tính bảo mật.
-   Phiên đăng nhập (Session) sẽ tự động hết hạn sau 8 tiếng làm việc liên tục nếu không có tương tác.
-   Mật khẩu phải có độ dài tối thiểu 8 ký tự; ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt.
-   Email phải đúng định dạng tiêu chuẩn (ví dụ: `abc@gmail.com`).

### Yêu cầu phi chức năng

-   Thời gian từ lúc nhấn "Đăng nhập" đến khi màn hình phân luồng hiển thị hoàn chỉnh không quá 5 giây.

---

## UC-02: Gửi yêu cầu tạo Ticket

| **Thuộc tính** | **Giá trị** |
|---|---|
| Use Case ID | UC-02 |
| Use Case Name | Gửi yêu cầu tạo Ticket |
| Mô tả | Cho phép người yêu cầu tạo ticket yêu cầu hỗ trợ kỹ thuật hoặc báo lỗi đến hệ thống Helpdesk. Hệ thống tiếp nhận yêu cầu, kiểm tra dữ liệu, gợi ý bài viết tri thức liên quan, tạo ticket và khởi tạo quy trình xử lý phù hợp. |
| Tác nhân | Người yêu cầu |
| Ưu tiên | Cao |
| Điều kiện kích hoạt | Người dùng chọn chức năng “Tạo Ticket” tại trang Ticket của tôi. |
| Tiền đề | Người yêu cầu đăng nhập vào hệ thống thành công. |
| Hậu đề | Ticket được tạo thành công và lưu trong hệ thống với mã ticket duy nhất. Ticket được phân loại và chuyển vào trạng thái **Mới tạo**. |

### Luồng chính

1.  Người yêu cầu truy cập menu “Ticket của tôi” từ giao diện chính của hệ thống.
2.  Người yêu cầu bấm chọn chức năng **Tạo Ticket** ở cổng yêu cầu.
3.  Hệ thống hiển thị màn hình tạo yêu cầu gồm các trường thông tin:
    - Tên, email người tạo ticket (*)
    - Tiêu đề (*)
    - Mô tả chi tiết vấn đề (*)
    - File đính kèm
4.  Người yêu cầu nhập tiêu đề yêu cầu.
5.  Hệ thống tự động tìm kiếm trong Cơ sở tri thức các bài viết liên quan dựa trên tiêu đề và từ khóa.
6.  Hệ thống hiển thị danh sách bài viết gợi ý (nếu có).
7.  Người yêu cầu tiếp tục nhập mô tả chi tiết sự cố, bao gồm:
    - Hiện tượng lỗi
    - Thời điểm phát sinh lỗi
    - Thiết bị/phần mềm liên quan
    - Mức độ ảnh hưởng
8.  Người dùng tải lên file minh chứng (ảnh lỗi, log, video hoặc tài liệu liên quan) nếu cần.
9.  Người yêu cầu nhấn nút “Gửi yêu cầu”.
10. Hệ thống thực hiện kiểm tra dữ liệu:
    - Các trường bắt buộc không được để trống
    - File upload đúng định dạng và dung lượng
    - Nội dung ticket không chứa ký tự nguy hiểm hoặc mã độc
11. Hệ thống tự động phân tích nội dung để xác định mức độ ưu tiên gồm: **Cao, Trung bình, Thấp**.
12. Hệ thống tạo mã `Ticket ID` duy nhất theo format quy định (VD: `SW-2026-0142`).
13. Hệ thống lưu ticket vào cơ sở dữ liệu với các thông tin: `Ticket ID`, Người gửi, Thời gian tạo, Priority, File đính kèm, Trạng thái = “Mới tạo”.
14. Hệ thống đưa ticket vào danh sách xử lý của L1.
15. Hệ thống tự động khởi tạo SLA xử lý dựa trên Mức độ ưu tiên của ticket.
16. Hệ thống đưa ticket vào quy trình xử lý tương ứng.
17. Hệ thống gửi thông báo tạo ticket thành công cho người yêu cầu qua:
    - Giao diện hệ thống
    - Email công ty
18. Hệ thống ghi log toàn bộ quá trình tạo ticket phục vụ audit và theo dõi lịch sử hoạt động.

### Luồng thay thế

*   **5.1 Người dùng tìm được giải pháp từ Cơ sở tri thức**
    Người yêu cầu chọn bài viết gợi ý. Sau khi xem hướng dẫn, vấn đề được giải quyết thì người yêu cầu không tiếp tục tạo ticket.
*   **13.1 Trưởng nhóm hỗ trợ có thể thay đổi kỹ thuật viên phụ trách ticket** thay vì dùng cơ chế auto-assignment.

### Luồng ngoại lệ

*   **9a. Thiếu dữ liệu bắt buộc:** Hệ thống chặn không cho gửi, báo lỗi: *"Vui lòng điền đầy đủ các trường bắt buộc"*.
*   **9b. Sai định dạng Email:** Báo lỗi: *"Email không đúng định dạng. Vui lòng nhập lại"*.
*   **9c. File đính kèm không hợp lệ:** Báo lỗi: *"File vượt quá dung lượng hoặc không đúng định dạng cho phép"*.
*   **9d. Phát hiện ký tự nguy hiểm:** Hệ thống tự động chặn hành động gửi và báo lỗi: *"Nội dung chứa ký tự không hợp lệ"*.

### Quy tắc nghiệp vụ

-   Mỗi ticket bắt buộc phải có: tên, email người tạo, tiêu đề và mô tả.
-   `Ticket ID` là duy nhất trong toàn hệ thống.
-   Người dùng chỉ được tạo ticket bằng tài khoản email công ty hợp lệ.
-   Email phải đúng định dạng.
-   File đính kèm hỗ trợ định dạng: `jpg, png, pdf, docx, xlsx`. Dung lượng tối đa: **20MB**.

### Yêu cầu phi chức năng

-   Thời gian tạo ticket không vượt quá 15 giây.
-   Hệ thống hỗ trợ tối thiểu 50 người dùng đồng thời.

---

## UC-03: Theo dõi trạng thái Ticket

| **Thuộc tính** | **Giá trị** |
|---|---|
| Use Case ID | UC-03 |
| Use Case Name | Theo dõi trạng thái Ticket |
| Mô tả | Cho phép người yêu cầu theo dõi tiến trình xử lý các ticket đã gửi, xem trạng thái hiện tại, lịch sử cập nhật. |
| Tác nhân | Người yêu cầu |
| Ưu tiên | Cao |
| Điều kiện kích hoạt | Người yêu cầu truy cập chức năng “Ticket của tôi” để chọn xem chi tiết một ticket đã tạo. |
| Tiền đề | - Người yêu cầu đã đăng nhập hệ thống <br>- Người yêu cầu đã từng tạo ít nhất một ticket |
| Hậu đề | - Xem được trạng thái hiện tại và lịch sử xử lý của ticket <br>- Không làm thay đổi dữ liệu hệ thống |

### Luồng chính

1.  Người yêu cầu truy cập menu “Ticket của tôi” ở Cổng yêu cầu.
2.  Hệ thống hiển thị danh sách các ticket của người yêu cầu gồm: `Ticket ID`, Tiêu đề, Người tạo, Người giải quyết, Ngày tạo, Trạng thái, SLA xử lý.
3.  Người yêu cầu chọn một ticket cần xem chi tiết.
4.  Hệ thống hiển thị thông tin chi tiết ticket gồm: Tiêu đề, Nội dung, Mức độ ưu tiên, Người xử lý hiện tại, Trạng thái, Ngày tạo, SLA deadline, thẻ Tags.
5.  Hệ thống hiển thị Sơ đồ tiến trình ghi rõ lịch sử các bước xử lý: Thời gian cập nhật, Trạng thái mới, Người thực hiện, Ghi chú (nếu có).

### Luồng thay thế

*   **5.1 Hệ thống tự động Đóng ticket:** Nếu ticket ở trạng thái "Đã giải quyết" sau khi hệ thống gửi email kèm link khảo sát mà đã qua 48 giờ → Hệ thống tự đổi trạng thái thành "Đã đóng" và khóa ô chat.
*   **5.2 Hệ thống tự động Mở lại ticket:** Nếu ticket ở trạng thái “Đã giải quyết” mà người yêu cầu đánh giá không hài lòng → Hệ thống tự đổi trạng thái thành “Đang giải quyết”.

### Luồng ngoại lệ

*   **3a. Không tìm thấy ticket:** Ticket không tồn tại hoặc đã bị đóng. Hệ thống hiển thị thông báo lỗi.
*   **3b. Lỗi phân quyền:** Người yêu cầu cố tình can thiệp để tự ý đổi trạng thái ticket thì Hệ thống chặn lại và báo lỗi: *"Bạn không có quyền thực hiện thao tác này!"*.

### Quy tắc nghiệp vụ

-   Người yêu cầu chỉ được xem ticket do chính mình tạo.
-   Trạng thái ticket phải tuân theo workflow hệ thống.
-   Ticket chỉ được mở lại khi trạng thái hiện tại là “Đã giải quyết”.
-   Ticket ở trạng thái “Đã đóng” không được mở lại.
-   Mọi thay đổi trạng thái phải được lưu vào lịch sử ticket.

### Yêu cầu phi chức năng

-   Thời gian tải danh sách ticket ≤ 5 giây.
-   Hệ thống phải hỗ trợ real-time refresh trạng thái ticket.
-   Dữ liệu lịch sử ticket phải được lưu trữ đầy đủ cho audit.
-   Hệ thống đảm bảo phân quyền truy cập dữ liệu chính xác.

---

## UC-04: Gửi đánh giá phản hồi

| **Thuộc tính** | **Giá trị** |
|---|---|
| Use Case ID | UC-04 |
| Use Case Name | Gửi đánh giá phản hồi |
| Mô tả | Cho phép người yêu cầu đánh giá chất lượng hỗ trợ của IT sau khi ticket được giải quyết để phục vụ tính KPI. |
| Tác nhân | Người yêu cầu |
| Ưu tiên | Trung bình |
| Điều kiện kích hoạt | Người dùng nhấn vào link "Khảo sát mức độ hài lòng" trong email thông báo kết quả xử lý ticket. |
| Tiền đề | - Người yêu cầu đã đăng nhập <br>- Ticket thuộc sở hữu, ở trạng thái “Đã giải quyết” và chưa đánh giá <br>- Hệ thống đã gửi email kèm token xác thực |
| Hậu đề | - Đánh giá được lưu <br>- Điểm đánh giá cập nhật vào KPI của IT Support <br>- Ticket chuyển sang “Đã đóng” hoặc “Đang giải quyết” |

### Luồng chính

1.  Hệ thống điều hướng người yêu cầu đến trang khảo sát và hiển thị form đánh giá cho `Ticket ID` tương ứng gồm:
    - Câu hỏi: Bạn có hài lòng với kết quả xử lý không? (Có/Không)
    - Điểm đánh giá (1–5 sao)
    - Nhận xét chi tiết
    - Nút xác nhận vấn đề đã được xử lý
    - Đề xuất cải thiện (optional)
2.  Người yêu cầu chọn số sao và chọn "Có" (Hài lòng).
3.  Người yêu cầu nhập nội dung nhận xét (nếu có) và nhấn "Gửi đánh giá".
4.  Hệ thống kiểm tra dữ liệu hợp lệ.
5.  Hệ thống lưu thông tin đánh giá vào CSDL: `Ticket ID`, Người đánh giá, Điểm, Nội dung, Thời gian.
6.  Hệ thống cập nhật trạng thái ticket thành **“Đã đóng”**.
7.  Hệ thống ghi nhận SLA và cập nhật dữ liệu vào Dashboard thống kê KPI.
8.  Hệ thống hiển thị thông báo “Gửi đánh giá thành công”.

### Luồng thay thế

*   **2.1 Đánh giá tiêu cực:** Nếu điểm < 3 sao, hệ thống gửi cảnh báo đến quản lý để xem xét chất lượng xử lý.
*   **2.2 Người dùng chọn "Không" (Không hài lòng):**
    - Hệ thống yêu cầu nhập lý do (bắt buộc).
    - Lưu kết quả phản hồi tiêu cực.
    - Chuyển trạng thái ticket ngược về **"Đang giải quyết"** (kích hoạt luồng Reopen).
*   **3.1 Người yêu cầu chỉ đánh giá sao, không nhập nhận xét:** Hệ thống vẫn cho phép gửi đánh giá.

### Luồng ngoại lệ

*   **1a. Link khảo sát hết hạn (Quá 48h):** Hệ thống báo lỗi: *"Đường dẫn đã hết hạn do quá 48 giờ quy định"*.
*   **1b. Ticket đã đánh giá rồi:** Hệ thống báo lỗi: *"Ticket này đã được đánh giá trước đó"*.
*   **4a. Thiếu điểm đánh giá:** Báo lỗi: *"Vui lòng chọn số sao đánh giá!"*.

### Quy tắc nghiệp vụ

-   Mỗi ticket chỉ được đánh giá 1 lần.
-   Chỉ ticket ở trạng thái “Đã giải quyết” mới được đánh giá.
-   Điểm đánh giá từ 1 đến 5 sao.
-   Đánh giá phải thực hiện trong vòng 48 giờ kể từ khi ticket được đánh dấu “Đã giải quyết”. Sau thời gian này, ticket tự động chuyển “Đã đóng”.
-   Nội dung phản hồi không chứa nội dung vi phạm chính sách công ty.

### Yêu cầu phi chức năng

-   Dữ liệu điểm đánh giá phải cập nhật lên Dashboard theo thời gian thực (Real-time).

---

## UC-05: Tự động mở lại Ticket

| **Thuộc tính** | **Giá trị** |
|---|---|
| Use Case ID | UC-05 |
| Use Case Name | Tự động mở lại Ticket |
| Mô tả | Hệ thống tự động kích hoạt lại quy trình xử lý ticket khi nhận được phản hồi "Không hài lòng" và chuyển cấp nếu lỗi bị lặp lại nhiều lần. |
| Tác nhân | Hệ thống |
| Ưu tiên | Trung bình |
| Điều kiện kích hoạt | Hệ thống nhận kết quả "Không hài lòng" kèm lý do từ UC-04. |
| Tiền đề | Ticket đang ở "Đã giải quyết", thời gian nhận phản hồi chưa quá 48 giờ và được phân quyền đúng cấp độ. |
| Hậu đề | - Ticket được đưa trở lại hàng đợi xử lý <br>- Nhóm hỗ trợ liên quan nhận thông báo |

### Luồng chính

1.  Hệ thống nhận tín hiệu "Không hài lòng" và lý do từ UC-04.
2.  Hệ thống cập nhật trạng thái `Ticket = "Đang giải quyết"`.
3.  Hệ thống ghi nhận lý do vào lịch sử xử lý.
4.  Hệ thống truy xuất “Số lần mở lại”:
    - Nếu ≤ 2 lần: Giữ nguyên nhóm xử lý cũ (L1) và gửi thông báo yêu cầu xử lý lại.
5.  Hệ thống tăng số lần đếm mở lại lên +1.
6.  Hệ thống cập nhật lại deadline SLA mới.
7.  Hệ thống gửi email thông báo kèm lý do cho kỹ thuật viên và ghi nhận Audit Log.

### Luồng thay thế

*   **4.1 Ticket được mở lại > 2 lần**
    Hệ thống tự động chuyển ticket sang nhóm L2.

### Quy tắc nghiệp vụ

-   Chỉ hệ thống mới có quyền tự động chuyển trạng thái thành “Đang giải quyết” để mở lại.
-   Thời gian cho phép mở lại tối đa là 48 giờ. Quá thời gian này, ticket bị khóa cứng.
-   Quy tắc gán việc: Mở lại ≤ 2 lần giữ L1, > 2 lần chuyển lên L2.

### Yêu cầu phi chức năng

-   Thời gian cập nhật và chuyển ticket về đúng nhóm ≤ 3 giây.
-   Lưu đầy đủ audit log cho mọi thao tác reopen.
-   Thông báo mở lại ticket gửi realtime đến nhóm hỗ trợ.

---

## UC-06: Tra cứu bài viết tri thức tại Cơ sở tri thức

| **Thuộc tính** | **Giá trị** |
|---|---|
| Use Case ID | UC-06 |
| Use Case Name | Tra cứu bài viết tri thức tại Cơ sở tri thức |
| Mô tả | Cho phép người yêu cầu và L1 tìm kiếm và xem các bài viết hướng dẫn nhằm tự giải quyết vấn đề trước khi tạo ticket. |
| Tác nhân | Người yêu cầu, L1 |
| Ưu tiên | Trung bình |
| Điều kiện kích hoạt | Nhấn chọn "Cơ sở tri thức" trên menu hoặc khi hệ thống tự động gợi ý bài viết lúc tạo Ticket. |
| Tiền đề | Người yêu cầu đã đăng nhập thành công. |
| Hậu đề | Hệ thống hiển thị nội dung bài viết hướng dẫn tương ứng. |

### Luồng chính

1.  Tại Cổng yêu cầu, người dùng bấm "Cơ sở tri thức" hoặc thanh tìm kiếm nhanh.
2.  Hệ thống hiển thị giao diện trang Cơ sở tri thức gồm danh mục chủ đề và thanh tìm kiếm.
3.  Người dùng nhập từ khóa tìm kiếm và nhấn Enter.
4.  Hệ thống truy vấn và hiển thị danh sách bài viết liên quan.
5.  Người dùng click chọn một tiêu đề bài viết.
6.  Hệ thống tải và hiển thị toàn bộ nội dung bài viết.

### Luồng thay thế

*   **1.1 Hệ thống tự động gợi ý bài viết khi tạo ticket**
    Khi đang gõ tiêu đề yêu cầu → Hệ thống phân tích từ khóa và hiển thị Pop-up gợi ý danh sách bài viết. Người dùng click vào bài viết để xem nhanh.

### Luồng ngoại lệ

*   **4a. Không tìm thấy kết quả:** Hệ thống hiển thị thông báo: *"Không tìm thấy kết quả phù hợp với từ khóa của bạn."*

### Quy tắc nghiệp vụ

-   Hệ thống ưu tiên hiển thị và gợi ý bài viết tri thức trước khi người dùng gửi ticket để giảm tải ticket lặp lại.
-   Hệ thống phải có câu hỏi: *"Bài viết này có hữu ích với bạn không?"* kèm 2 nút (Có/Không) để thu thập phản hồi.

### Yêu cầu phi chức năng

-   Tốc độ tìm kiếm và trả về kết quả ≤ 3 giây.

---

## UC-07: Xử lý nhanh Ticket

| **Thuộc tính** | **Giá trị** |
|---|---|
| Use Case ID | UC-07 |
| Use Case Name | Xử lý nhanh Ticket |
| Mô tả | Cho phép L1 tiếp nhận và xử lý các ticket đơn giản trong phạm vi hỗ trợ cấp 1 mà không cần chuyển lên L2. |
| Tác nhân | Bộ phận hỗ trợ tuyến đầu L1 |
| Ưu tiên | Cao |
| Điều kiện kích hoạt | L1 chọn một ticket trong hàng đợi xử lý |
| Tiền đề | - L1 đã đăng nhập <br>- Ticket ở trạng thái “Mới tạo” và đã được phân công cho L1 |
| Hậu đề | Ticket chuyển sang "Đã giải quyết" (hoặc chuyển cấp sang L2), lưu lịch sử xử lý. |

### Luồng chính

1.  L1 truy cập màn hình “Bộ phận hỗ trợ tuyến đầu L1”.
2.  Hệ thống hiển thị danh sách ticket được phân công.
3.  L1 chọn một ticket “Mới tạo”.
4.  Hệ thống hiển thị chi tiết ticket: nội dung, bình luận, thanh trạng thái, deadline SLA, gợi ý bài viết liên quan.
5.  L1 xem hướng dẫn và thực hiện xử lý sự cố.
6.  Xử lý xong, L1 nhập nội dung kết quả vào phần bình luận.
7.  L1 nhấn nút chuyển trạng thái thành **"Đã giải quyết"**.
8.  Hệ thống lưu lịch sử, dừng SLA và tự động kích hoạt UC-04 (Gửi đánh giá).

### Luồng thay thế

*   **6.1 Không giải quyết được (Chuyển cấp lên L2):**
    L1 nhập lý do → Nhấn "Chuyển cấp" → Hệ thống chuyển ticket sang hàng đợi L2 và gửi thông báo.

### Luồng ngoại lệ

*   **3a. Ticket đã bị người khác nhận trước:** Hệ thống chặn lại và báo lỗi: *"Ticket này đã được tiếp nhận bởi kỹ thuật viên khác!"*.

### Quy tắc nghiệp vụ

-   Khi L1 nhấn "Bắt đầu xử lý", hệ thống ghi nhận mốc thời gian để tính SLA phản hồi.
-   Ticket phải có ghi kết quả xử lý trước khi chuyển sang “Đã giải quyết”.
-   Sau khi xử lý nhanh thành công, hệ thống gửi email kèm link khảo sát.

### Yêu cầu phi chức năng

-   Thời gian tải gợi ý Knowledge Base ≤ 5 giây.
-   Email khảo sát gửi trong vòng ≤ 1 phút sau khi ticket chuyển sang “Đã giải quyết”.

---

## UC-08: Chuyển cấp Ticket

| **Thuộc tính** | **Giá trị** |
|---|---|
| Use Case ID | UC-08 |
| Use Case Name | Chuyển cấp Ticket |
| Mô tả | Cho phép L1 chuyển ticket sang nhóm L2 khi không thể xử lý. |
| Tác nhân | Nhân viên L1 |
| Ưu tiên | Cao |
| Điều kiện kích hoạt | L1 chọn “Chuyển cấp” khi không thể xử lý |
| Tiền đề | - Ticket ở trạng thái “Đang giải quyết” <br>- Ticket đang được xử lý bởi L1 |
| Hậu đề | - Ticket chuyển sang nhóm L2 <br>- Lưu lịch sử chuyển cấp <br>- L2 nhận thông báo |

### Luồng chính

1.  Hệ thống hiển thị pop-up yêu cầu nhập: Lý do chuyển cấp, các bước đã thử xử lý, file đính kèm.
2.  L1 nhập đầy đủ lý do và nhấn "Xác nhận chuyển cấp".
3.  Hệ thống kiểm tra dữ liệu, đổi nhóm phụ trách từ L1 sang L2 (trạng thái vẫn là “Đang giải quyết”).
4.  Hệ thống lưu lịch sử: người chuyển, lý do, thời gian.
5.  Hệ thống gửi thông báo cho đội L2 và đóng pop-up.

### Luồng thay thế

*   **Ticket được reopen quá 2 lần:** Hệ thống tự động đề xuất escalate sang L2.

### Quy tắc nghiệp vụ

-   Chỉ L1 mới được phép chuyển cấp ticket sang L2.
-   Ticket phải có ghi kết quả xử lý và lý do trước khi chuyển cấp.
-   Ticket chuyển cấp vẫn giữ trạng thái “Đang giải quyết”.

### Yêu cầu phi chức năng

-   Thời gian cập nhật chuyển cấp ≤ 5 giây.
-   Hệ thống gửi thông báo realtime đến nhóm L2.

---

## UC-09: Xử lý nâng cao

| **Thuộc tính** | **Giá trị** |
|---|---|
| Use Case ID | UC-09 |
| Use Case Name | Xử lý nâng cao |
| Mô tả | Cho phép L2 tiếp nhận và xử lý các ticket đã được chuyển cấp từ L1, yêu cầu chuyên môn kỹ thuật chuyên sâu. |
| Tác nhân | Nhân viên L2, Quản lý IT |
| Ưu tiên | Cao |
| Điều kiện kích hoạt | L2 nhận được ticket đã được chuyển cấp từ L1 |
| Tiền đề | - L2 đã đăng nhập <br>- Ticket đã chuyển cấp sang L2 <br>- Ticket ở trạng thái “Đang giải quyết” |
| Hậu đề | Ticket được xử lý và chuyển sang "Đã giải quyết" hoặc tiếp tục xử lý. Lưu đầy đủ lịch sử. |

### Luồng chính (tóm tắt)

1.  L2 truy cập danh sách ticket chuyển từ L1.
2.  Chọn ticket, xem chi tiết: thông tin user, nội dung, file, lịch sử L1, lý do escalate, deadline.
3.  L2 phân tích, xác định nguyên nhân, thực hiện xử lý chuyên sâu (log, server, DB, network, config…).
4.  Cập nhật nội dung xử lý (các bước, kết quả, nguyên nhân).
5.  Đánh giá mức độ ảnh hưởng:
    - Nếu nghiêm trọng → gửi thông báo đến Quản lý IT, Quản lý theo dõi.
    - Nếu bình thường → tiếp tục.
6.  Kiểm tra kết quả:
    - Thành công → chuyển sang bước 17.
    - Chưa thành công và số lần thử < 3 → quay lại xử lý.
    - Chưa thành công và số lần thử ≥ 3 → gửi thông báo khẩn cấp đến Quản lý IT.
7.  Quản lý IT xem xét và quyết định phương án cuối cùng (tiếp tục, workaround, chuyển đặc biệt, đóng ticket).
8.  L2 thực hiện theo quyết định, cập nhật nội dung cuối cùng (nguyên nhân gốc, phương án, kết quả, ghi chú).
9.  L2 chọn trạng thái “Đã giải quyết”.
10. Hệ thống cập nhật: trạng thái = “Đã giải quyết”, người xử lý cuối, SLA, nội dung.
11. Gửi email khảo sát đến người dùng, ghi audit log.

### Quy tắc nghiệp vụ

-   Chỉ L2 mới được xử lý ticket đã chuyển cấp.
-   Sự cố nghiêm trọng phải thông báo đến Quản lý IT.
-   Hệ thống ghi nhận số lần xử lý sự cố.
-   Sau 3 lần xử lý thất bại, Quản lý IT quyết định phương án cuối cùng.
-   Mọi thao tác xử lý phải được ghi vào Nội dung xử lý.

### Yêu cầu phi chức năng

-   Thời gian cập nhật ticket ≤ 3 giây.
-   Hỗ trợ cập nhật nội dung realtime.
-   Thông báo đến Manager trong vòng ≤ 1 phút.
-   Lưu đầy đủ audit log.

---

## UC-10: Soạn thảo bài viết tri thức

| **Thuộc tính** | **Giá trị** |
|---|---|
| Use Case ID | UC-10 |
| Use Case Name | Soạn thảo bài viết tri thức |
| Mô tả | Cho phép L2 tạo và lưu bài viết tri thức dựa trên sự cố đã xử lý thành công. |
| Tác nhân | Đội chuyên gia kỹ thuật L2 |
| Ưu tiên | Trung bình |
| Điều kiện kích hoạt | Sau khi xử lý thành công sự cố hoặc khi chủ động tạo bài viết mới. |
| Tiền đề | - L2 đã đăng nhập <br>- Có quyền tạo Bài viết tri thức |
| Hậu đề | Bài viết được lưu vào CSDL, có thể tìm kiếm và sử dụng. |

### Luồng chính

1.  L2 xác định cần tạo bài viết.
2.  Chọn một trong hai cách: tạo trực tiếp từ ticket hoặc từ trang “Cơ sở tri thức”.
3.  Hệ thống mở giao diện, chọn “Tạo bài viết tri thức”.
4.  Form soạn thảo gồm: Tiêu đề, Nội dung giải pháp, Loại sự cố, Tag, Quyền xem/sửa.
5.  Nhập tiêu đề, nội dung, chọn loại, thêm tag, thiết lập quyền.
6.  Bấm “Xuất bản” → Hệ thống lưu ở trạng thái “Đã xuất bản”, hiển thị trong CS tri thức.
7.  Hệ thống hiển thị thông báo thành công và ghi audit log.

### Luồng thay thế

*   **2.1 Tạo bài viết từ ticket sự cố:** Chọn “Các bài viết liên quan” → bấm “Tạo bài viết tri thức”. Hệ thống tự động liên kết với ticket.
*   **10.1 Nếu chọn “Lưu nháp”:** Lưu bài viết trạng thái “Nháp”, chưa công khai.

### Quy tắc nghiệp vụ

-   Chỉ L2 mới được tạo bài viết tri thức.
-   Bài viết phải có tiêu đề và nội dung xử lý.
-   Hỗ trợ trạng thái “Nháp” và “Đã xuất bản”.

### Yêu cầu phi chức năng

-   Thời gian mở giao diện soạn thảo ≤ 3 giây.
-   Thời gian lưu bài viết ≤ 3 giây.
-   Hỗ trợ tìm kiếm theo tag và từ khóa.

---

## UC-11: Cập nhật kết quả xử lý

| **Thuộc tính** | **Giá trị** |
|---|---|
| Use Case ID | UC-11 |
| Use Case Name | Cập nhật kết quả xử lý |
| Mô tả | Cập nhật kết quả xử lý vào ticket: nguyên nhân, giải pháp, trạng thái, ghi chú. |
| Tác nhân | L1, L2 |
| Ưu tiên | Cao |
| Điều kiện kích hoạt | Kỹ thuật viên muốn cập nhật thông tin xử lý. |
| Tiền đề | Đã đăng nhập và đang mở chi tiết ticket được phân công. |
| Hậu đề | Thông tin lưu vào lịch sử, cập nhật trạng thái, dừng SLA (nếu giải quyết xong). |

### Luồng chính

1.  Tại giao diện chi tiết, L1/L2 nhập kết quả xử lý vào bình luận.
2.  Chọn chuyển trạng thái ticket thành "Đã giải quyết".
3.  Hệ thống kiểm tra, ghi nhận thời gian hoàn thành để chốt SLA.
4.  Hệ thống lưu lịch sử, gửi email thông báo kết quả cho người yêu cầu.

### Luồng thay thế

-   **2.1 Nếu sự cố chưa giải quyết dứt điểm:** L1/L2 giữ nguyên trạng thái “Đang giải quyết”.

### Quy tắc nghiệp vụ

-   Chỉ nhân viên được phân công mới được cập nhật ticket.
-   Ticket “Đã đóng” không được chỉnh sửa.
-   Mọi cập nhật phải được lưu Audit Log.

### Yêu cầu phi chức năng

-   Hỗ trợ lưu lịch sử đầy đủ.
-   Hỗ trợ đồng thời nhiều cập nhật ticket.

---

## UC-12: Xem Dashboard

| **Thuộc tính** | **Giá trị** |
|---|---|
| Use Case ID | UC-12 |
| Use Case Name | Xem Dashboard |
| Mô tả | Cho phép Quản lý IT, L1, L2 theo dõi tình trạng hệ thống qua dashboard trực quan. |
| Tác nhân | Quản lý IT, L1, L2 |
| Ưu tiên | Trung bình |
| Điều kiện kích hoạt | Truy cập “Dashboard” từ menu. |
| Tiền đề | Đã đăng nhập và có quyền truy cập dữ liệu báo cáo. |
| Hậu đề | Dashboard hiển thị thành công, có thể theo dõi số liệu và hiệu suất. |

### Luồng chính

1.  Chọn "Dashboard" trên menu.
2.  Hệ thống hiển thị Dashboard tổng quan:
    - Số lượng ticket theo trạng thái (Mới tạo, Đang giải quyết, Đã giải quyết, Đã đóng)
    - Biểu đồ xu hướng (lượng ticket theo thời gian)
    - Tỷ lệ vi phạm SLA
    - Danh sách sự cố khẩn cấp (nghiêm trọng hoặc sắp/đã quá hạn SLA)
    - Hiệu suất xử lý từng nhân viên
3.  Chọn bộ lọc (thời gian / mức độ ưu tiên).
4.  Hệ thống cập nhật số liệu theo bộ lọc.

### Luồng thay thế

-   **3.1 Xuất file báo cáo:** Chọn “Xuất báo cáo” → chọn định dạng PDF/Excel → tải file xuống.

### Quy tắc nghiệp vụ

-   Dữ liệu mặc định hiển thị theo chu kỳ **Tháng hiện tại** nếu chưa chọn bộ lọc khác.

### Yêu cầu phi chức năng

-   Tốc độ tải dữ liệu và kết xuất biểu đồ ≤ 5 giây.

---

## UC-13: Quản lý SLA

| **Thuộc tính** | **Giá trị** |
|---|---|
| Use Case ID | UC-13 |
| Use Case Name | Quản lý SLA |
| Mô tả | Cho phép IT Manager cấu hình thời gian phản hồi và xử lý dựa trên mức độ ưu tiên. |
| Tác nhân | Quản lý IT |
| Ưu tiên | Cao |
| Điều kiện kích hoạt | Truy cập "Cài đặt SLA" trong Settings. |
| Tiền đề | - Đã đăng nhập <br>- Hệ thống có sẵn danh mục Ma trận mức độ ưu tiên |
| Hậu đề | Quy định SLA mới được lưu và áp dụng cho ticket mới tạo. |

### Luồng chính

1.  Hệ thống hiển thị danh sách chính sách SLA hiện tại.
2.  Quản lý IT chọn chính sách sửa hoặc nhấn "Tạo chính sách SLA mới".
3.  Form SLA gồm: Tên, Khung thời gian áp dụng (Giờ hành chính / 24/7), Ma trận thời gian mục tiêu (phản hồi, xử lý theo mức độ: Thấp, Trung bình, Cao).
4.  Nhập/sửa thông số, nhấn "Lưu".
5.  Hệ thống kiểm tra, lưu cấu hình, thông báo thành công.

### Luồng thay thế

-   **2.1 Thay đổi trạng thái áp dụng SLA:** Gạt thanh trạng thái (Kích hoạt/Hủy) trên danh sách.

### Quy tắc nghiệp vụ

-   Khi tính theo Giờ hành chính, thuật toán tự động trừ Thứ Bảy, Chủ Nhật và ngày lễ quốc gia.

### Yêu cầu phi chức năng

-   Cơ chế đếm ngược SLA chạy realtime, độ chính xác cao.

---

## UC-14: Phân quyền & Cấu hình hệ thống

| **Thuộc tính** | **Giá trị** |
|---|---|
| Use Case ID | UC-14 |
| Use Case Name | Phân quyền & Cấu hình hệ thống |
| Mô tả | Cho phép Quản lý IT thiết lập cơ cấu tổ chức, quyền hạn vai trò và cấu hình thông số vận hành. |
| Tác nhân | Quản lý IT |
| Ưu tiên | Trung bình |
| Điều kiện kích hoạt | Truy cập "Settings" trên menu. |
| Tiền đề | - Tài khoản có quyền quản trị <br>- Đăng nhập thành công |
| Hậu đề | Các thay đổi được cập nhật và áp dụng tức thì. |

### Luồng chính

1.  Hệ thống hiển thị các tab cấu hình: Quản lý Nhóm hỗ trợ, Phân quyền vai trò, Cấu hình Kênh tiếp nhận.
2.  Chọn tab "Phân quyền vai trò" → chọn vai trò cần tinh chỉnh (VD: IT Support L1).
3.  Hệ thống hiển thị danh sách quyền (Đọc ticket, Nhận ticket, Đóng, Điều phối, Chuyển cấp, Xem báo cáo...).
4.  Quản lý IT tích/bỏ chọn các quyền và nhấn "Cập nhật".
5.  Hệ thống ghi nhận, lưu lịch sử thay đổi, thông báo hoàn tất.

### Luồng thay thế

-   **3.1 Thêm nhân sự vào Nhóm xử lý:** Chọn tab "Quản lý Nhóm hỗ trợ" → chọn nhóm → "Thêm thành viên" → chọn nhân viên → Lưu.

### Quy tắc nghiệp vụ

-   Khi nhân viên mới đăng nhập lần đầu, hệ thống kiểm tra trường `Vai trò` để điều hướng đến màn hình phù hợp.

### Yêu cầu phi chức năng

-   Thay đổi phân quyền có hiệu lực ngay lập tức (chỉ cần tải lại trang, không cần đăng xuất).

---

## UC-15: Giám sát hiệu suất vận hành IT qua báo cáo

| **Thuộc tính** | **Giá trị** |
|---|---|
| Use Case ID | UC-15 |
| Use Case Name | Giám sát hiệu suất vận hành IT qua báo cáo |
| Mô tả | Cho phép Quản lý IT tra cứu dữ liệu lịch sử, phân tích KPI, SLA theo mốc thời gian và xuất file báo cáo. |
| Tác nhân | Quản lý IT |
| Ưu tiên | Trung bình |
| Điều kiện kích hoạt | Truy cập “Báo cáo” trên menu. |
| Tiền đề | Đã đăng nhập và có vai trò = Quản lý IT. |
| Hậu đề | Báo cáo kết xuất chính xác, file tải xuống thành công. |

### Luồng chính

1.  Hệ thống hiển thị danh sách mẫu báo cáo tĩnh (KPI nhân viên, vi phạm SLA, phân loại sự cố…).
2.  Quản lý IT chọn mẫu và thiết lập bộ lọc: Khoảng thời gian, Nhóm kỹ thuật.
3.  Nhấn "Tạo báo cáo".
4.  Hệ thống truy vấn, tổng hợp hiển thị bảng số liệu.
5.  Nhấn "Xuất file" → chọn Excel hoặc PDF.
6.  Hệ thống kết xuất file, tự động tải xuống.

### Luồng thay thế

-   **3.1 Không có dữ liệu:** Hệ thống hiển thị bảng trống kèm thông báo: "Không có dữ liệu trong khoảng thời gian này".

### Quy tắc nghiệp vụ

-   Dữ liệu báo cáo là dữ liệu tĩnh (đóng băng tại thời điểm chốt số liệu), không tự động nhảy số.
-   Điểm KPI nhân viên tính dựa trên đánh giá sao thực tế từ UC-04.

### Yêu cầu phi chức năng

-   Thời gian xử lý truy vấn và xuất file ≤ 8 giây.
-   File Excel đúng định dạng, không lỗi font tiếng Việt, hiển thị rõ bộ lọc đã chọn.