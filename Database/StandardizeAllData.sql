-- =====================================================================
-- SCRIPT NẠP DỮ LIỆU KIỂM THỬ TOÀN DIỆN CHO KHÁCH HÀNG TRẦN MINH
-- =====================================================================

BEGIN TRANSACTION;

-- 1. XÓA BẢN GHI CŨ NẾU ĐÃ TỒN TẠI (ĐỂ CHẠY LẠI ĐƯỢC NHIỀU LẦN AN TOÀN)
DELETE FROM HoaDonChiTiet WHERE id_hoa_don IN ('HD-TRANMINH-PAID-01', 'HD-TRANMINH-UNPAID-01');
DELETE FROM HoaDon WHERE id_hoa_don IN ('HD-TRANMINH-PAID-01', 'HD-TRANMINH-UNPAID-01');
DELETE FROM DonThuocChiTiet WHERE id_don_thuoc IN ('DT-TRANMINH-PAST-01');
DELETE FROM DonThuoc WHERE id_don_thuoc IN ('DT-TRANMINH-PAST-01');
DELETE FROM TiemChung WHERE id_tiem_chung IN ('TC-TRANMINH-VACC-01', 'TC-TRANMINH-VACC-02');
DELETE FROM HoSoBenhAn WHERE id_ho_so_benh_an IN ('HS-TRANMINH-PAST-01', 'HS-TRANMINH-PAST-02');
DELETE FROM LichHen WHERE id_lich_hen IN ('LH-TRANMINH-PAST-01', 'LH-TRANMINH-PAST-02', 'LH-TRANMINH-FUTURE-01');

-- 2. NẠP LỊCH HẸN (APPOINTMENTS)
-- Lịch hẹn khám cũ ngày 15/06/2026
INSERT INTO LichHen (id_lich_hen, ngay_kham, gio_kham, ly_do, trang_thai, id_khach_hang, id_thu_cung, id_bac_si, id_nguoi_dat, phong_kham, ngay_tao, id_dich_vu)
VALUES ('LH-TRANMINH-PAST-01', '2026-06-15', '10:00:00', N'Khám tổng quát định kỳ cho cún', N'Đã khám', 'KH-00CD9818', 'TC-3C286EE2', 'BS-TM', 'KH-00CD9818', N'Phòng 101', '2026-06-14 09:00:00', 'DV-A4A59ED9');

-- Lịch hẹn tiêm phòng ngày 02/07/2026
INSERT INTO LichHen (id_lich_hen, ngay_kham, gio_kham, ly_do, trang_thai, id_khach_hang, id_thu_cung, id_bac_si, id_nguoi_dat, phong_kham, ngay_tao, id_dich_vu)
VALUES ('LH-TRANMINH-PAST-02', '2026-07-02', '15:30:00', N'Tiêm phòng dại định kỳ cho mèo', N'Đã khám', 'KH-00CD9818', 'TC-271B975F', 'BS-TM', 'KH-00CD9818', N'Phòng Tiêm chủng', '2026-07-01 14:00:00', 'DV-E634E0E0');

-- Lịch hẹn trong tương lai ngày 20/07/2026
INSERT INTO LichHen (id_lich_hen, ngay_kham, gio_kham, ly_do, trang_thai, id_khach_hang, id_thu_cung, id_bac_si, id_nguoi_dat, phong_kham, ngay_tao, id_dich_vu)
VALUES ('LH-TRANMINH-FUTURE-01', '2026-07-20', '09:00:00', N'Theo dõi và tư vấn dinh dưỡng lông da', N'Đã xác nhận', 'KH-00CD9818', 'TC-3C286EE2', 'BS-TM', 'KH-00CD9818', N'Phòng 102', '2026-07-05 10:00:00', 'DV-KDK');


-- 3. NẠP HỒ SƠ BỆNH ÁN (MEDICAL RECORDS)
-- Hồ sơ bệnh án khám tổng quát ngày 15/06/2026
INSERT INTO HoSoBenhAn (id_ho_so_benh_an, id_lich_hen, ngay_kham, id_bac_si, can_nang, nhiet_do, huyet_ap, trieu_chung, ket_qua_tham_kham, chan_doan, phac_do_dieu_tri, huong_dan_cham_soc, ngay_tai_kham_de_xuat, trang_thai_ho_so, id_nguoi_tao, ngay_tao, id_thu_cung)
VALUES ('HS-TRANMINH-PAST-01', 'LH-TRANMINH-PAST-01', '2026-06-15', 'BS-TM', 5.30, 38.50, N'Bình thường', N'Khám định kỳ, kiểm tra sức khỏe tổng quát.', N'Cơ xương khớp bình thường, tim phổi nghe rõ, lông bóng mượt.', N'Cún khỏe mạnh bình thường, hơi thiếu nhẹ vitamin chăm sóc lông.', N'Bổ sung gel dinh dưỡng và các vitamin thiết yếu nuôi dưỡng lông da.', N'Cho ăn thức ăn hạt chất lượng cao, uống đủ nước, chải lông mỗi ngày.', '2026-07-20', N'Hoàn thành', 'NV-ADMIN-CHINH', '2026-06-15 11:00:00', 'TC-3C286EE2');

-- Hồ sơ bệnh án khám tiêm phòng ngày 02/07/2026
INSERT INTO HoSoBenhAn (id_ho_so_benh_an, id_lich_hen, ngay_kham, id_bac_si, can_nang, nhiet_do, huyet_ap, trieu_chung, ket_qua_tham_kham, chan_doan, phac_do_dieu_tri, huong_dan_cham_soc, ngay_tai_kham_de_xuat, trang_thai_ho_so, id_nguoi_tao, ngay_tao, id_thu_cung)
VALUES ('HS-TRANMINH-PAST-02', 'LH-TRANMINH-PAST-02', '2026-07-02', 'BS-TM', 3.10, 39.00, N'Bình thường', N'Khách hàng mang đến tiêm phòng định kỳ.', N'Nhiệt độ bình thường, sức khỏe tốt, đủ điều kiện tiêm phòng vaccine.', N'Đủ điều kiện tiêm phòng vaccine dại.', N'Tiêm 1 mũi vaccine dại Rabisin.', N'Theo dõi phản ứng sốc phản vệ sau tiêm trong 24h, tránh tắm trong vòng 7 ngày.', NULL, N'Hoàn thành', 'NV-ADMIN-CHINH', '2026-07-02 16:00:00', 'TC-271B975F');


-- 4. NẠP DỮ LIỆU TIÊM CHỦNG (VACCINATIONS)
-- Lịch sử tiêm phòng dại của Miu
INSERT INTO TiemChung (id_tiem_chung, id_thu_cung, ten_vaccine, ngay_tiem, ngay_tiem_lai, id_bac_si, ghi_chu, loai_vaccine)
VALUES ('TC-TRANMINH-VACC-01', 'TC-271B975F', N'Rabisin (Vaccine phòng bệnh dại)', '2026-07-02', '2027-07-02', 'BS-TM', N'Đã tiêm phòng dại định kỳ hàng năm.', N'Phòng bệnh dại');

-- Lịch sử tiêm phòng 5 bệnh của Lucky
INSERT INTO TiemChung (id_tiem_chung, id_thu_cung, ten_vaccine, ngay_tiem, ngay_tiem_lai, id_bac_si, ghi_chu, loai_vaccine)
VALUES ('TC-TRANMINH-VACC-02', 'TC-3C286EE2', N'Vanguard Plus 5/L (Vaccine 5 bệnh ở chó)', '2026-05-10', '2027-05-10', 'BS-TM', N'Đã tiêm phòng 5 bệnh.', N'Phòng 5 bệnh');


-- 5. NẠP ĐƠN THUỐC (PRESCRIPTIONS)
-- Đơn thuốc bổ sung dinh dưỡng đi kèm hồ sơ ngày 15/06/2026
INSERT INTO DonThuoc (id_don_thuoc, id_ho_so_benh_an, id_bac_si, ngay_ke_don, ghi_chu)
VALUES ('DT-TRANMINH-PAST-01', 'HS-TRANMINH-PAST-01', 'BS-TM', '2026-06-15 11:15:00', N'Đơn thuốc bổ dưỡng bổ sung vitamin.');

INSERT INTO DonThuocChiTiet (id_chi_tiet_don_thuoc, id_don_thuoc, id_thuoc, so_luong, lieu_dung)
VALUES ('DTCT-TM-01', 'DT-TRANMINH-PAST-01', 'TH-00000016', 1, N'Ăn trực tiếp hoặc trộn thức ăn, 1 tuýp dùng trong 1 tháng.');

INSERT INTO DonThuocChiTiet (id_chi_tiet_don_thuoc, id_don_thuoc, id_thuoc, so_luong, lieu_dung)
VALUES ('DTCT-TM-02', 'DT-TRANMINH-PAST-01', 'TH-00000017', 5, N'Trộn trực tiếp vào thức ăn hạt, 1 gói/ngày.');


-- 6. NẠP HÓA ĐƠN (INVOICES)
-- Hóa đơn khám tổng quát ngày 15/06/2026 -> ĐÃ THANH TOÁN (PAID)
INSERT INTO HoaDon (id_hoa_don, id_lich_hen, id_khach_hang, tong_tien_truoc_giam_gia, tong_tien_giam_gia, tong_tien_sau_giam_gia, thue_suat, thue_phai_nop, tong_tien_cuoi, ngay_lap, id_nhan_vien, trang_thai, ghi_chu, trang_thai_thanh_toan, ngay_lap_hoa_don, tong_tien_ban_dau, tong_giam_gia)
VALUES ('HD-TRANMINH-PAID-01', 'LH-TRANMINH-PAST-01', 'KH-00CD9818', 150000.00, 0.00, 150000.00, 0.00, 0.00, 150000.00, '2026-06-15 11:30:00', 'NV-ADMIN-CHINH', N'Hoàn thành', N'Hóa đơn thanh toán khám tổng quát định kỳ.', N'DA_THANH_TOAN', '2026-06-15 11:30:00', 150000.00, 0.00);

INSERT INTO HoaDonChiTiet (id_chi_tiet_hoa_don, id_hoa_don, ten_muc, loai_muc, so_luong, don_gia)
VALUES ('HDCT-TM-PAID-01', 'HD-TRANMINH-PAID-01', N'Dịch vụ khám tổng quát', N'DICH_VU', 1, 150000.00);


-- Hóa đơn dịch vụ tiêm phòng và mua thuốc ngày 02/07/2026 -> CHƯA THANH TOÁN (UNPAID) để test cổng thanh toán
-- Tổng tiền: Dịch vụ tiêm phòng (200,000) + Sữa tắm Dermcare (15,000) + Revolution cho mèo (210,000) = 425,000 VNĐ
INSERT INTO HoaDon (id_hoa_don, id_lich_hen, id_khach_hang, tong_tien_truoc_giam_gia, tong_tien_giam_gia, tong_tien_sau_giam_gia, thue_suat, thue_phai_nop, tong_tien_cuoi, ngay_lap, id_nhan_vien, trang_thai, ghi_chu, trang_thai_thanh_toan, ngay_lap_hoa_don, tong_tien_ban_dau, tong_giam_gia)
VALUES ('HD-TRANMINH-UNPAID-01', 'LH-TRANMINH-PAST-02', 'KH-00CD9818', 425000.00, 0.00, 425000.00, 0.00, 0.00, 425000.00, '2026-07-02 16:30:00', 'NV-ADMIN-CHINH', N'Chờ thanh toán', N'Hóa đơn tiêm phòng vaccine và mua phụ kiện.', N'CHUA_THANH_TOAN', '2026-07-02 16:30:00', 425000.00, 0.00);

INSERT INTO HoaDonChiTiet (id_chi_tiet_hoa_don, id_hoa_don, ten_muc, loai_muc, so_luong, don_gia)
VALUES ('HDCT-TM-UNPAID-01', 'HD-TRANMINH-UNPAID-01', N'Dịch vụ tiêm phòng', N'DICH_VU', 1, 200000.00);

INSERT INTO HoaDonChiTiet (id_chi_tiet_hoa_don, id_hoa_don, ten_muc, loai_muc, so_luong, don_gia)
VALUES ('HDCT-TM-UNPAID-02', 'HD-TRANMINH-UNPAID-01', N'Dermcare sữa tắm dịu nhẹ', N'THUOC', 1, 15000.00);

INSERT INTO HoaDonChiTiet (id_chi_tiet_hoa_don, id_hoa_don, ten_muc, loai_muc, so_luong, don_gia)
VALUES ('HDCT-TM-UNPAID-03', 'HD-TRANMINH-UNPAID-01', N'Revolution for Cats (Nhỏ giọt trị ký sinh trùng)', N'THUOC', 1, 210000.00);

COMMIT TRANSACTION;
