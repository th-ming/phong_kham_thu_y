-- =====================================================================
-- SCRIPT CHUẨN HÓA DỮ LIỆU THUỐC, LÔ HÀNG & TÀI KHOẢN HỆ THỐNG REXI
-- =====================================================================

BEGIN TRANSACTION;

-- 1. XÓA BỎ BẢN GHI THUỐC RÁC
DELETE FROM Thuoc WHERE id_thuoc = 'abcd';

-- 2. THÊM MỚI 20 LOẠI THUỐC THÚ Y CHUẨN (NẾU CHƯA TỒN TẠI)
IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000001')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000001', N'Bio-Tylosin 200', N'Tylosin', N'Dung dịch tiêm', N'chai', N'Đặc trị hen suyễn, viêm phổi ở lợn và gia súc.', 95000.00, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000002')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000002', N'NexGard 11.3mg', N'Afoxolaner', N'Viên nhai', N'viên', N'Phòng và trị ve, rận, ghẻ, giun tim cho chó từ 2-4kg.', 140000.00, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000003')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000003', N'Bravecto 250mg', N'Fluralaner', N'Viên nhai', N'viên', N'Trị ve và ghẻ hiệu quả kéo dài 12 tuần cho chó.', 320000.00, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000004')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000004', N'Frontline Plus for Cats', N'Fipronil, S-methoprene', N'Nhỏ giọt', N'ống', N'Trị ve rận bọ chét cho mèo mọi lứa tuổi.', 160000.00, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000005')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000005', N'Catozal 10%', N'Butaphosphan, Vitamin B12', N'Dung dịch tiêm', N'chai', N'Kích thích trao đổi chất, phục hồi sức khỏe cho thú cưng.', 180000.00, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000006')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000006', N'Frantrel', N'Pyrantel, Praziquantel', N'Viên nén', N'viên', N'Tẩy giun sán nội ký sinh cho mèo.', 45000.00, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000007')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000007', N'Drontal Plus for Dogs', N'Febantel, Pyrantel, Praziquantel', N'Viên nén', N'viên', N'Tẩy giun sán phổ rộng cho chó.', 60000.00, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000008')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000008', N'Bio-Anigen Rapid CPV Ag', N'Kháng nguyên Parvo', N'Que thử', N'bộ', N'Test nhanh phát hiện virus Parvo gây viêm ruột ở chó.', 90000.00, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000009')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000009', N'Bio-Anigen Rapid CDV Ag', N'Kháng nguyên Care', N'Que thử', N'bộ', N'Test nhanh phát hiện virus Care (sài sốt) ở chó.', 90000.00, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000010')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000010', N'Revolution for Cats', N'Selamectin', N'Nhỏ giọt', N'ống', N'Phòng và trị ký sinh trùng nội ngoại sinh cho mèo.', 210000.00, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000011')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000011', N'Prednisolone 5mg', N'Prednisolone', N'Viên nén', N'viên', N'Kháng viêm mạnh, giảm ngứa và dị ứng cho chó mèo.', 5000.00, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000012')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000012', N'Baytril Flavour 50mg', N'Enrofloxacin', N'Viên nén', N'viên', N'Kháng sinh phổ rộng trị nhiễm trùng da, hô hấp, tiết niệu.', 35000.00, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000013')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000013', N'Clavamox 125mg', N'Amoxicillin, Axit Clavulanic', N'Viên nén', N'viên', N'Kháng sinh phổ rộng cao cấp trị viêm da, vết thương.', 25000.00, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000014')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000014', N'Terramycin', N'Oxytetracycline', N'Thuốc mỡ', N'tuýp', N'Thuốc mỡ tra mắt trị viêm kết mạc và nhiễm trùng mắt thú cưng.', 75000.00, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000015')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000015', N'Ketoconazole 200mg', N'Ketoconazole', N'Viên nén', N'viên', N'Kháng nấm hệ thống trị nấm da, nấm móng cho chó mèo.', 12000.00, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000016')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000016', N'Nutri-Plus Gel', N'Gel dinh dưỡng', N'Dạng gel', N'tuýp', N'Bổ sung năng lượng, vitamin và khoáng chất cho chó mèo suy nhược.', 155000.00, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000017')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000017', N'Megaderm 4ml', N'Omega 3 & 6, Vitamin A, E', N'Dạng gel', N'gói', N'Cung cấp chất béo thiết yếu giúp lông mượt, hỗ trợ trị viêm da.', 18000.00, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000018')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000018', N'Primalac', N'Men vi sinh Lactobacillus', N'Dạng bột', N'gói', N'Cân bằng hệ vi sinh đường ruột, hỗ trợ tiêu hóa khi tiêu chảy.', 8000.00, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000019')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000019', N'Vibrac Synulox 250mg', N'Amoxicillin, Clavulanate', N'Viên nén', N'viên', N'Kháng sinh phổ rộng dùng trong điều trị bệnh nhiễm trùng.', 42000.00, 1, 0);

IF NOT EXISTS (SELECT 1 FROM Thuoc WHERE id_thuoc = 'TH-00000020')
    INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
    VALUES ('TH-00000020', N'Canlox', N'Meloxicam', N'Dung dịch uống', N'chai', N'Giảm đau, kháng viêm khớp cấp và mãn tính cho chó mèo.', 130000.00, 1, 0);


-- 3. CHUẨN HÓA MẬT KHẨU CÁC TÀI KHOẢN TEST
-- Cập nhật mật khẩu thô và xóa hash để hệ thống tự băm lại khi đăng nhập lần đầu tiên

-- Admin
UPDATE TaiKhoan 
SET mat_khau = 'admin@rexi.com', mat_khau_hash = NULL 
WHERE ten_dang_nhap = 'admin';

-- Bác sĩ
UPDATE TaiKhoan 
SET mat_khau = 'bacsi@rexi.com', mat_khau_hash = NULL 
WHERE ten_dang_nhap = 'bacsi';

-- Kế toán
UPDATE TaiKhoan 
SET mat_khau = 'ketoan@rexi.com', mat_khau_hash = NULL 
WHERE ten_dang_nhap = 'ketoan';

-- Tiếp tân / Staff
UPDATE TaiKhoan 
SET mat_khau = 'staff@rexi.com', mat_khau_hash = NULL 
WHERE ten_dang_nhap = 'staff';

UPDATE TaiKhoan 
SET mat_khau = 'tieptan@rexi.com', mat_khau_hash = NULL 
WHERE ten_dang_nhap = 'tieptan';

-- Y tá
UPDATE TaiKhoan 
SET mat_khau = 'yta@rexi.com', mat_khau_hash = NULL 
WHERE ten_dang_nhap = 'yta';

-- Khách hàng Trần Minh (Tên đăng nhập: tranminh09818@gmail.com)
-- Cập nhật mật khẩu chuẩn: tranminh@rexi.com
UPDATE TaiKhoan 
SET mat_khau = 'tranminh@rexi.com', mat_khau_hash = NULL 
WHERE ten_dang_nhap = 'tranminh09818@gmail.com';


-- 4. THÊM CÁC LÔ THUỐC KIỂM THỬ (LÔ ĐÃ HẾT HẠN, LÔ CÒN HẠN & LÔ HẾT HÀNG)
-- Nhà cung cấp mặc định: NCC-MAC-DINH

-- Lô 1: Bio-Tylosin 200 -> LÔ HẾT HẠN (Số lượng tồn > 0 nhưng Hạn sử dụng trong quá khứ)
IF NOT EXISTS (SELECT 1 FROM LoThuoc WHERE id_lo = 'LO-00000001')
    INSERT INTO LoThuoc (id_lo, id_thuoc, id_ncc, so_lo, ngay_nhap, han_su_dung, gia_nhap, so_luong_nhap, so_luong_ton, ngay_cap_nhat_ton_kho)
    VALUES ('LO-00000001', 'TH-00000001', 'NCC-MAC-DINH', 'LOT-TYL-001', '2026-01-10', '2026-05-15', 65000.00, 50, 15, CURRENT_TIMESTAMP);

-- Lô 2: NexGard 11.3mg -> LÔ BÌNH THƯỜNG (Còn hạn, còn tồn kho lớn)
IF NOT EXISTS (SELECT 1 FROM LoThuoc WHERE id_lo = 'LO-00000002')
    INSERT INTO LoThuoc (id_lo, id_thuoc, id_ncc, so_lo, ngay_nhap, han_su_dung, gia_nhap, so_luong_nhap, so_luong_ton, ngay_cap_nhat_ton_kho)
    VALUES ('LO-00000002', 'TH-00000002', 'NCC-MAC-DINH', 'LOT-NEX-001', '2026-04-01', '2027-10-01', 95000.00, 100, 45, CURRENT_TIMESTAMP);

-- Lô 3: Bravecto 250mg -> LÔ HẾT HẠN (Số lượng tồn > 0 nhưng Hạn sử dụng trong quá khứ)
IF NOT EXISTS (SELECT 1 FROM LoThuoc WHERE id_lo = 'LO-00000003')
    INSERT INTO LoThuoc (id_lo, id_thuoc, id_ncc, so_lo, ngay_nhap, han_su_dung, gia_nhap, so_luong_nhap, so_luong_ton, ngay_cap_nhat_ton_kho)
    VALUES ('LO-00000003', 'TH-00000003', 'NCC-MAC-DINH', 'LOT-BRA-001', '2025-05-01', '2026-04-30', 220000.00, 20, 8, CURRENT_TIMESTAMP);

-- Lô 4: Frontline Plus for Cats -> LÔ HẾT HÀNG (Số lượng tồn = 0)
IF NOT EXISTS (SELECT 1 FROM LoThuoc WHERE id_lo = 'LO-00000004')
    INSERT INTO LoThuoc (id_lo, id_thuoc, id_ncc, so_lo, ngay_nhap, han_su_dung, gia_nhap, so_luong_nhap, so_luong_ton, ngay_cap_nhat_ton_kho)
    VALUES ('LO-00000004', 'TH-00000004', 'NCC-MAC-DINH', 'LOT-FRO-001', '2026-02-01', '2027-02-01', 110000.00, 80, 0, CURRENT_TIMESTAMP);

-- Lô 5: Catozal 10% -> LÔ BÌNH THƯỜNG (Còn hạn, còn tồn kho)
IF NOT EXISTS (SELECT 1 FROM LoThuoc WHERE id_lo = 'LO-00000005')
    INSERT INTO LoThuoc (id_lo, id_thuoc, id_ncc, so_lo, ngay_nhap, han_su_dung, gia_nhap, so_luong_nhap, so_luong_ton, ngay_cap_nhat_ton_kho)
    VALUES ('LO-00000005', 'TH-00000005', 'NCC-MAC-DINH', 'LOT-CAT-001', '2026-05-01', '2028-05-01', 120000.00, 30, 22, CURRENT_TIMESTAMP);

-- Lô 6: Otodine -> LÔ HẾT HẠN (Hạn sử dụng trong quá khứ)
IF NOT EXISTS (SELECT 1 FROM LoThuoc WHERE id_lo = 'LO-00000006')
    INSERT INTO LoThuoc (id_lo, id_thuoc, id_ncc, so_lo, ngay_nhap, han_su_dung, gia_nhap, so_luong_nhap, so_luong_ton, ngay_cap_nhat_ton_kho)
    VALUES ('LO-00000006', 'TH-57647749', 'NCC-MAC-DINH', 'LOT-OTO-001', '2026-03-01', '2026-06-30', 10000.00, 15, 4, CURRENT_TIMESTAMP);

COMMIT TRANSACTION;
