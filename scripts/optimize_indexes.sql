-- ============================================================
--  Tối ưu hóa Index còn thiếu — SQL Server
--  Chạy script này 1 lần sau khi deploy. An toàn hoàn toàn:
--  IF NOT EXISTS đảm bảo không tạo trùng.
-- ============================================================

-- [1] LichHen.id_bac_si
--     Tool thong_ke_ca_kham_bac_si GROUP BY bác sĩ — chưa có index này
IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE name = 'IX_LichHen_BacSi'
      AND object_id = OBJECT_ID('LichHen')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_LichHen_BacSi
        ON LichHen (id_bac_si ASC)
        INCLUDE (ngay_kham, trang_thai);
    PRINT 'INDEX IX_LichHen_BacSi created successfully.';
END
ELSE
BEGIN
    PRINT 'INDEX IX_LichHen_BacSi already exists, skipped.';
END

GO

-- [2] NhatKyChat.id_tai_khoan
--     Đọc lịch sử chat theo tài khoản — chưa có index này
IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE name = 'IX_NhatKyChat_TaiKhoan'
      AND object_id = OBJECT_ID('NhatKyChat')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_NhatKyChat_TaiKhoan
        ON NhatKyChat (id_tai_khoan ASC)
        INCLUDE (thoi_gian, noi_dung, vai_tro);
    PRINT 'INDEX IX_NhatKyChat_TaiKhoan created successfully.';
END
ELSE
BEGIN
    PRINT 'INDEX IX_NhatKyChat_TaiKhoan already exists, skipped.';
END

GO

PRINT 'Done. All optimization indexes are in place.';
