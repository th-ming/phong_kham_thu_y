-- =====================================================
-- SEED DATA: 20 thuốc thú y + Cleanup dữ liệu test
-- Chạy trên Supabase SQL Editor
-- =====================================================

-- =============================================
-- PHẦN 1: CLEANUP DỮ LIỆU TEST/FAKE
-- =============================================

-- Xóa khách hàng có tên chứa "Kiểm Thử", "Test", "tester_"
UPDATE KhachHang SET da_xoa = true
WHERE ten_khach_hang ILIKE '%kiểm thử%'
   OR ten_khach_hang ILIKE '%test%'
   OR ten_khach_hang ILIKE '%tester%'
   OR ten_khach_hang ILIKE '%demo%'
   OR ten_khach_hang ILIKE '%fake%'
   OR email ILIKE '%tester_%'
   OR email ILIKE '%test.com%'
   OR email ILIKE '%@rexi.com%';

-- Xóa thú cưng liên kết với khách test
UPDATE ThuCung SET da_xoa = true
WHERE id_khach_hang IN (
    SELECT id_khach_hang FROM KhachHang
    WHERE ten_khach_hang ILIKE '%kiểm thử%'
       OR ten_khach_hang ILIKE '%test%'
       OR ten_khach_hang ILIKE '%tester%'
       OR email ILIKE '%tester_%'
       OR email ILIKE '%test.com%'
);

-- =============================================
-- PHẦN 2: NHÀ CUNG CẤP THUỐC THÚ Y
-- =============================================

INSERT INTO NhaCungCap (id_ncc, ten_ncc, dia_chi, so_dien_thoai, email, ma_so_thue, ghi_chu, ngay_tao)
VALUES
('NCC-001', 'Công ty TNHH Dược phẩm Thú y Việt Nam', '123 Nguyễn Huệ, Quận 1, TP.HCM', '02838221100', 'contact@duocthuy.vn', '0123456789', 'Nhà cung cấp thuốc thú y hàng đầu', NOW()),
('NCC-002', 'Công ty CP Dược liệu Sài Gòn', '456 Lê Lợi, Quận 3, TP.HCM', '02838233200', 'info@duoclieusg.vn', '0987654321', 'Chuyên dược liệu và kháng sinh thú y', NOW()),
('NCC-003', 'Nhập khẩu trực tiếp - Virbac Vietnam', '789 Trường Chinh, Tân Bình, TP.HCM', '02837153300', 'sales@virbac.vn', '0567891234', 'Thuốc thú y nhập khẩu Pháp', NOW())
ON CONFLICT (id_ncc) DO NOTHING;

-- =============================================
-- PHẦN 3: 20 LOẠI THUỐC THÚ Y
-- =============================================

INSERT INTO Thuoc (id_thuoc, ten_thuoc, thanh_phan, dang_bao_che, don_vi, mo_ta, gia_ban, trang_thai, da_xoa)
VALUES
-- 1. Kháng sinh
('THUOC-001', 'Amoxicillin 500mg', 'Amoxicillin trihydrate 500mg', 'Viên nang', 'Viên',
 'Kháng sinh nhóm beta-lactam, điều trị nhiễm khuẩn đường hô hấp, tiêu hóa ở chó mèo', 15000.00, true, false),

('THUOC-002', 'Enrofloxacin 150mg', 'Enrofloxacin 150mg', 'Viên nén', 'Viên',
 'Kháng sinh nhóm fluoroquinolone, điều trị nhiễm khuẩn đường tiết niệu, hô hấp', 25000.00, true, false),

('THUOC-003', 'Doxycycline 100mg', 'Doxycycline hyclate 100mg', 'Viên nang', 'Viên',
 'Kháng sinh nhóm tetracycline, điều trị bệnh tick fever, lepto, hô hấp', 18000.00, true, false),

('THUOC-004', 'Cephalexin 500mg', 'Cephalexin monohydrate 500mg', 'Viên nang', 'Viên',
 'Kháng sinh nhóm cephalosporin, điều trị nhiễm khuẩn da, mô mềm, đường tiết niệu', 22000.00, true, false),

-- 2. Giảm đau - chống viêm
('THUOC-005', 'Meloxicam 7.5mg', 'Meloxicam 7.5mg', 'Viên nén', 'Viên',
 'NSAID chống viêm giảm đau, điều trị viêm khớp, đau cơ ở chó', 20000.00, true, false),

('THUOC-006', 'Carprofen 25mg', 'Carprofen 25mg', 'Viên nén', 'Viên',
 'NSAID chống viêm giảm đau, sử dụng sau phẫu thuật ở chó', 30000.00, true, false),

('THUOC-007', 'Tramadol 50mg', 'Tramadol HCl 50mg', 'Viên nén', 'Viên',
 'Giảm đau trung ương, điều trị đau sau phẫu thuật, đau mãn tính', 25000.00, true, false),

-- 3. Thuốc tiêu hóa
('THUOC-008', 'Smecta cho thú y', 'Diosmectite 3g', 'Gói', 'Gói',
 'Thuốc cầm tiêu chảy, bảo vệ niêm mạc ruột cho chó mèo', 8000.00, true, false),

('THUOC-009', 'Probiotic cho chó mèo', 'Lactobacillus acidophilus, Bifidobacterium', 'Bột', 'Gói',
 'Vi sinh vật có lợi, cân bằng hệ vi sinh đường tiêu hóa', 35000.00, true, false),

('THUOC-010', 'Pepsane cho thú y', 'Pepsin, Acid glutamic', 'Dung dịch', 'Ống',
 'Hỗ trợ tiêu hóa, kích thích ăn ngon ở chó mèo', 45000.00, true, false),

-- 4. Thuốc ký sinh trùng
('THUOC-011', 'Ivermectin 1%', 'Ivermectin 1%', 'Dung dịch tiêm', 'Chai',
 'Điều trị và phòng ngừa ký sinh trùng: giun tim, ve, rận, ghẻ ở chó', 120000.00, true, false),

('THUOC-012', 'Fenbendazole 222mg', 'Fenbendazole 222mg', 'Viên nén', 'Viên',
 'Thuốc tẩy giun sán đường tiêu hóa ở chó mèo', 15000.00, true, false),

('THUOC-013', 'Praziquantel 50mg', 'Praziquantel 50mg', 'Viên nén', 'Viên',
 'Điều trị sán dây, sán phổi ở chó mèo', 20000.00, true, false),

-- 5. Thuốc da liễu
('THUOC-014', 'Ketoconazole 200mg', 'Ketoconazole 200mg', 'Viên nén', 'Viên',
 'Thuốc chống nấm, điều trị nấm da, nấm tai ở chó mèo', 18000.00, true, false),

('THUOC-015', 'Mupirocin 2%', 'Mupirocin 2%', 'Kem bôi', 'Tuýp',
 'Kem bôi kháng sinh tại chỗ, điều trị nhiễm khuẩn da', 65000.00, true, false),

-- 6. Thuốc tim mạch - hô hấp
('THUOC-016', 'Furosemide 40mg', 'Furosemide 40mg', 'Viên nén', 'Viên',
 'Thuốc lợi tiểu, điều trị suy tim, phù phổi ở chó', 12000.00, true, false),

('THUOC-017', 'Salbutamol 2mg', 'Salbutamol sulfate 2mg', 'Viên nén', 'Viên',
 'Giãn phế quản, điều trị hen suyễn ở chó mèo', 15000.00, true, false),

-- 7. Vitamin - bổ sung
('THUOC-018', 'Vitamin B12 cho thú y', 'Cyanocobalamin 1000mcg', 'Dung dịch tiêm', 'Ống',
 'Bổ sung vitamin B12, hỗ trợ tạo máu, phục hồi sức khỏe', 25000.00, true, false),

('THUOC-019', 'Canxi Bona', 'Calcium gluconate, Vitamin D3', 'Bột', 'Gói',
 'Bổ sung canxi, hỗ trợ xương khớp cho chó mèo đang lớn', 40000.00, true, false),

-- 8. Vaccine &血清
('THUOC-020', 'Serum phòng bệnh Care ở chó', 'Serum kháng thể đa价', 'Dung dịch tiêm', 'Ống',
 'Serum phòng và điều trị bệnh Care, Parvo ở chó con', 150000.00, true, false)

ON CONFLICT (id_thuoc) DO UPDATE SET
    ten_thuoc = EXCLUDED.ten_thuoc,
    thanh_phan = EXCLUDED.thanh_phan,
    dang_bao_che = EXCLUDED.dang_bao_che,
    don_vi = EXCLUDED.don_vi,
    mo_ta = EXCLUDED.mo_ta,
    gia_ban = EXCLUDED.gia_ban,
    trang_thai = EXCLUDED.trang_thai;

-- =============================================
-- PHẦN 4: LÔ THUỐC (SAMPLE BATCHES)
-- =============================================

INSERT INTO LoThuoc (id_lo, id_thuoc, id_ncc, so_lo, ngay_nhap, han_su_dung, gia_nhap, so_luong_nhap, so_luong_ton, ngay_cap_nhat_ton_kho)
VALUES
('LOT-001', 'THUOC-001', 'NCC-001', 'AMB-2026-001', '2026-01-15', '2028-01-15', 10000.00, 200, 180, NOW()),
('LOT-002', 'THUOC-002', 'NCC-001', 'ENR-2026-001', '2026-02-10', '2028-02-10', 18000.00, 150, 140, NOW()),
('LOT-003', 'THUOC-003', 'NCC-002', 'DOX-2026-001', '2026-01-20', '2028-01-20', 12000.00, 180, 165, NOW()),
('LOT-004', 'THUOC-004', 'NCC-002', 'CEP-2026-001', '2026-03-05', '2028-03-05', 16000.00, 120, 115, NOW()),
('LOT-005', 'THUOC-005', 'NCC-003', 'MEL-2026-001', '2026-02-20', '2028-02-20', 14000.00, 100, 90, NOW()),
('LOT-006', 'THUOC-006', 'NCC-003', 'CAR-2026-001', '2026-03-01', '2028-03-01', 22000.00, 80, 75, NOW()),
('LOT-007', 'THUOC-007', 'NCC-001', 'TRA-2026-001', '2026-01-25', '2028-01-25', 18000.00, 100, 95, NOW()),
('LOT-008', 'THUOC-008', 'NCC-002', 'SME-2026-001', '2026-03-10', '2027-09-10', 5000.00, 300, 280, NOW()),
('LOT-009', 'THUOC-009', 'NCC-003', 'PRO-2026-001', '2026-02-15', '2027-08-15', 25000.00, 100, 85, NOW()),
('LOT-010', 'THUOC-010', 'NCC-001', 'PEP-2026-001', '2026-03-08', '2027-09-08', 32000.00, 80, 70, NOW()),
('LOT-011', 'THUOC-011', 'NCC-003', 'IVE-2026-001', '2026-01-10', '2028-01-10', 85000.00, 50, 45, NOW()),
('LOT-012', 'THUOC-012', 'NCC-001', 'FEN-2026-001', '2026-02-28', '2028-02-28', 10000.00, 200, 190, NOW()),
('LOT-013', 'THUOC-013', 'NCC-002', 'PRA-2026-001', '2026-03-12', '2028-03-12', 14000.00, 150, 140, NOW()),
('LOT-014', 'THUOC-014', 'NCC-003', 'KET-2026-001', '2026-01-18', '2028-01-18', 12000.00, 100, 95, NOW()),
('LOT-015', 'THUOC-015', 'NCC-001', 'MUP-2026-001', '2026-02-22', '2027-08-22', 45000.00, 60, 55, NOW()),
('LOT-016', 'THUOC-016', 'NCC-002', 'FUR-2026-001', '2026-03-03', '2028-03-03', 8000.00, 120, 110, NOW()),
('LOT-017', 'THUOC-017', 'NCC-003', 'SAL-2026-001', '2026-01-28', '2028-01-28', 10000.00, 100, 95, NOW()),
('LOT-018', 'THUOC-018', 'NCC-001', 'B12-2026-001', '2026-02-05', '2027-08-05', 18000.00, 200, 185, NOW()),
('LOT-019', 'THUOC-019', 'NCC-002', 'CAL-2026-001', '2026-03-15', '2027-09-15', 28000.00, 150, 140, NOW()),
('LOT-020', 'THUOC-020', 'NCC-003', 'SER-2026-001', '2026-01-05', '2026-12-05', 110000.00, 50, 42, NOW())

ON CONFLICT (id_lo) DO NOTHING;
