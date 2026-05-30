# Mô tả sơ đồ quan hệ thực thể (ERD) - Hệ thống IT Helpdesk (Phiên bản mới nhất)

## Phần 1: Chi tiết các bảng

### Bảng `phong_ban` (Phòng ban)

| Tên trường | Ràng buộc |
|-----------|-----------|
| phong_ban_id | PK |
| ten_phong_ban | |
| truong_phong_id | FK → nhan_vien(nhan_vien_id) |

### Bảng `vai_tro` (Vai trò)

| Tên trường | Ràng buộc |
|-----------|-----------|
| vai_tro_id | PK |
| ma_vai_tro | |
| ten_vai_tro | |
| quyen_han | |

### Bảng `nhom_ho_tro` (Nhóm hỗ trợ)

| Tên trường | Ràng buộc |
|-----------|-----------|
| nhom_ho_tro_id | PK |
| ten_nhom | |
| mo_ta | |

### Bảng `nhan_vien` (Nhân viên)

| Tên trường | Ràng buộc |
|-----------|-----------|
| nhan_vien_id | PK |
| phong_ban_id | FK → phong_ban(phong_ban_id) |
| vai_tro_id | FK → vai_tro(vai_tro_id) |
| nhom_ho_tro_id | FK → nhom_ho_tro(nhom_ho_tro_id) |
| email | |
| tai_khoan | |
| mat_khau | |
| ho_ten | |
| trang_thai | |
| ngay_tao | |

### Bảng `phieu_ho_tro` (Phiếu hỗ trợ - Ticket)

| Tên trường | Ràng buộc |
|-----------|-----------|
| phieu_ho_tro_id | PK |
| ma_phieu | |
| tieu_de | |
| mo_ta_chi_tiet | |
| muc_do_uu_tien | |
| trang_thai | |
| nguoi_tao_id | FK → nhan_vien(nhan_vien_id) |
| nguoi_ho_tro_id | FK → nhan_vien(nhan_vien_id) |
| nhom_ho_tro_id | FK → nhom_ho_tro(nhom_ho_tro_id) |
| phieu_lien_quan_id | FK → phieu_ho_tro(phieu_ho_tro_id) |
| so_lan_mo_lai | |
| so_lan_thu_lai_L1 | |
| so_lan_thu_lai_L2 | |
| ngay_tao | |
| ngay_cap_nhat | |

### Bảng `binh_luan` (Bình luận)

| Tên trường | Ràng buộc |
|-----------|-----------|
| binh_luan_id | PK |
| phieu_ho_tro_id | FK → phieu_ho_tro(phieu_ho_tro_id) |
| nguoi_gui_id | FK → nhan_vien(nhan_vien_id) |
| noi_dung | |
| loai_binh_luan | |
| quyen_xem | |
| ngay_tao | |

### Bảng `tep_dinh_kem` (Tệp đính kèm)

| Tên trường | Ràng buộc |
|-----------|-----------|
| tep_dinh_kem_id | PK |
| ten_tep | |
| duong_dan_file | |
| dinh_dang | |
| dung_luong_kb | |
| phieu_ho_tro_id | FK → phieu_ho_tro(phieu_ho_tro_id) |
| binh_luan_id | FK → binh_luan(binh_luan_id) |
| tri_thuc_id | FK → co_so_tri_thuc(tri_thuc_id) |
| ngay_tao | |

### Bảng `lich_su_phieu` (Lịch sử phiếu)

| Tên trường | Ràng buộc |
|-----------|-----------|
| lich_su_id | PK |
| phieu_ho_tro_id | FK → phieu_ho_tro(phieu_ho_tro_id) |
| nguoi_thuc_hien_id | FK → nhan_vien(nhan_vien_id) |
| hanh_dong | |
| gia_tri_cu | |
| gia_tri_moi | |
| ngay_thuc_hien | |
| ghi_chu | |

### Bảng `phieu_danh_gia` (Đánh giá phiếu)

| Tên trường | Ràng buộc |
|-----------|-----------|
| phieu_danh_gia_id | PK |
| phieu_ho_tro_id | FK → phieu_ho_tro(phieu_ho_tro_id) |
| nguoi_danh_gia_id | FK → nhan_vien(nhan_vien_id) |
| token_xac_thuc | |
| hai_long | |
| so_sao | |
| nhan_xet | |
| ngay_danh_gia | |

### Bảng `co_so_tri_thuc` (Cơ sở tri thức)

| Tên trường | Ràng buộc |
|-----------|-----------|
| tri_thuc_id | PK |
| tieu_de | |
| noi_dung | |
| loai_su_co | |
| the | |
| tac_gia_id | FK → nhan_vien(nhan_vien_id) |
| phieu_ho_tro_id | FK → phieu_ho_tro(phieu_ho_tro_id) |
| trang_thai | |
| luot_huu_ich | |
| luot_khong_huu_ich | |
| ngay_tao | |
| ngay_cap_nhat | |
| quyen_xem | |
| luot_xem | |

### Bảng `chinh_sach_sla` (Chính sách SLA)

| Tên trường | Ràng buộc |
|-----------|-----------|
| chinh_sach_sla_id | PK |
| ten_chinh_sach | |
| loai_thoi_gian | |
| muc_do_uu_tien | |
| tg_phan_hoi | |
| tg_xu_ly | |
| trang_thai | |

### Bảng `sla_theo_doi` (Theo dõi SLA)

| Tên trường | Ràng buộc |
|-----------|-----------|
| sla_id | PK |
| phieu_ho_tro_id | FK → phieu_ho_tro(phieu_ho_tro_id) |
| chinh_sach_sla_id | FK → chinh_sach_sla(chinh_sach_sla_id) |
| loai_sla | |
| han_chot | |
| thoi_diem_dat | |
| da_vi_pham | |
| duoc_mien_tru | |
| ly_do_mien_tru | |
| da_gui_nhac_nho | |

---

## Phần 2: Mô tả quan hệ giữa các bảng

### `phong_ban` → `nhan_vien` (qua `truong_phong_id`)
**Cardinality:** `1..1 → 0..1`  
**Mô tả:** Một phòng ban có thể có một trưởng phòng hoặc chưa có; một nhân viên có thể là trưởng phòng của nhiều nhất một phòng ban.

### `phong_ban` → `nhan_vien` (qua `phong_ban_id`)
**Cardinality:** `1..1 → 0..N`  
**Mô tả:** Một phòng ban có thể có nhiều nhân viên; mỗi nhân viên bắt buộc thuộc về đúng một phòng ban.

### `vai_tro` → `nhan_vien`
**Cardinality:** `1..1 → 0..N`  
**Mô tả:** Một vai trò có thể được gán cho nhiều nhân viên; mỗi nhân viên bắt buộc có đúng một vai trò.

### `nhom_ho_tro` → `nhan_vien`
**Cardinality:** `1..1 → 0..N`  
**Mô tả:** Một nhóm hỗ trợ có thể có nhiều nhân viên; một nhân viên (thuộc IT) có thể thuộc một nhóm hoặc không (nếu là người yêu cầu).

### `nhom_ho_tro` → `phieu_ho_tro`
**Cardinality:** `1..1 → 0..N`  
**Mô tả:** Một nhóm hỗ trợ có thể được gán để xử lý nhiều ticket; mỗi ticket bắt buộc có một nhóm xử lý (L1 hoặc L2).

### `nhan_vien` → `phieu_ho_tro` (vai trò người tạo)
**Cardinality:** `1..1 → 0..N`  
**Mô tả:** Một nhân viên có thể tạo nhiều ticket; mỗi ticket bắt buộc có một người tạo.

### `nhan_vien` → `phieu_ho_tro` (vai trò người hỗ trợ)
**Cardinality:** `0..1 → 0..N`  
**Mô tả:** Một nhân viên có thể được phân công hỗ trợ nhiều ticket; mỗi ticket có thể chưa có người hỗ trợ hoặc có một người hỗ trợ.

### `phieu_ho_tro` → `phieu_ho_tro` (phieu_lien_quan_id)
**Cardinality:** `0..1 → 0..N`  
**Mô tả:** Một ticket có thể liên quan đến một ticket khác (ticket cha); nhiều ticket có thể liên quan đến cùng một ticket.

### `phieu_ho_tro` → `binh_luan`
**Cardinality:** `1..1 → 0..N`  
**Mô tả:** Một ticket có thể có nhiều bình luận; mỗi bình luận bắt buộc thuộc về một ticket.

### `nhan_vien` → `binh_luan`
**Cardinality:** `1..1 → 0..N`  
**Mô tả:** Một nhân viên có thể viết nhiều bình luận; mỗi bình luận bắt buộc có một người gửi.

### `phieu_ho_tro` → `tep_dinh_kem`
**Cardinality:** `1..1 → 0..N`  
**Mô tả:** Một ticket có thể có nhiều tệp đính kèm; mỗi tệp đính kèm bắt buộc thuộc về một ticket (hoặc bình luận, bài viết – thực tế chỉ một trong ba có giá trị).

### `binh_luan` → `tep_dinh_kem`
**Cardinality:** `1..1 → 0..N`  
**Mô tả:** Một bình luận có thể có nhiều tệp đính kèm; mỗi tệp đính kèm có thể thuộc về một bình luận.

### `co_so_tri_thuc` → `tep_dinh_kem`
**Cardinality:** `1..1 → 0..N`  
**Mô tả:** Một bài viết tri thức có thể có nhiều tệp đính kèm; mỗi tệp đính kèm có thể thuộc về một bài viết.

### `phieu_ho_tro` → `lich_su_phieu`
**Cardinality:** `1..1 → 0..N`  
**Mô tả:** Một ticket có thể có nhiều bản ghi lịch sử; mỗi bản ghi lịch sử bắt buộc thuộc về một ticket.

### `nhan_vien` → `lich_su_phieu`
**Cardinality:** `1..1 → 0..N`  
**Mô tả:** Một nhân viên có thể thực hiện nhiều thao tác lịch sử; mỗi bản ghi lịch sử bắt buộc có một người thực hiện.

### `phieu_ho_tro` → `phieu_danh_gia`
**Cardinality:** `1..1 → 0..1`  
**Mô tả:** Một ticket có thể được đánh giá tối đa một lần; mỗi đánh giá bắt buộc thuộc về một ticket.

### `nhan_vien` → `phieu_danh_gia`
**Cardinality:** `1..1 → 0..N`  
**Mô tả:** Một nhân viên có thể đánh giá nhiều ticket; mỗi đánh giá bắt buộc có một người đánh giá.

### `nhan_vien` → `co_so_tri_thuc`
**Cardinality:** `1..1 → 0..N`  
**Mô tả:** Một nhân viên có thể là tác giả của nhiều bài viết tri thức; mỗi bài viết bắt buộc có một tác giả.

### `phieu_ho_tro` → `co_so_tri_thuc`
**Cardinality:** `0..1 → 0..N`  
**Mô tả:** Một ticket có thể là nguồn cảm hứng cho nhiều bài viết tri thức; mỗi bài viết có thể được tạo từ một ticket hoặc không.

### `chinh_sach_sla` → `sla_theo_doi`
**Cardinality:** `1..1 → 0..N`  
**Mô tả:** Một chính sách SLA có thể được áp dụng cho nhiều bản ghi theo dõi SLA; mỗi bản ghi SLA bắt buộc thuộc về một chính sách.

### `phieu_ho_tro` → `sla_theo_doi`
**Cardinality:** `1..1 → 0..N`  
**Mô tả:** Một ticket có thể có hai bản ghi SLA (phản hồi và xử lý); mỗi bản ghi SLA bắt buộc thuộc về một ticket.