SELECT COUNT(id_khach_hang) as Count FROM KhachHang kh 
WHERE (kh.da_xoa = 0 OR kh.da_xoa IS NULL) 
AND NOT EXISTS (SELECT 1 FROM TaiKhoan tk WHERE tk.id_khach_hang = kh.id_khach_hang AND tk.id_vai_tro NOT IN ('VT-KH', 'VT-5'));
