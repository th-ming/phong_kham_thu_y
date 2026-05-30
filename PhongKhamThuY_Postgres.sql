
;
/****** Object:  Database PhongKhamThuY    Script Date: 27/05/2026 07:14:55 ******/
 CONTAINMENT = NONE
  
( NAME = 'PhongKhamThuY', FILENAME = 'C:\Program Files\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQL\DATA\PhongKhamThuY.mdf' , SIZE = 73728KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = 'PhongKhamThuY_log', FILENAME = 'C:\Program Files\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQL\DATA\PhongKhamThuY_log.ldf' , SIZE = 270336KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT, LEDGER = OFF
;
;
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC PhongKhamThuY.sp_fulltext_database @action = 'enable'
end
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;

;
/****** Object:  User rexi_user    Script Date: 27/05/2026 07:14:55 ******/
CREATE USER rexi_user FOR LOGIN rexi_user WITH DEFAULT_SCHEMA=dbo
;
ALTER ROLE db_owner ADD MEMBER rexi_user
;
/****** Object:  UserDefinedFunction fn_CalculatePetAge    Script Date: 27/05/2026 07:14:55 ******/

;

;
-- 1. TÃ¡i táº¡o cÃ¡c Function
CREATE FUNCTION fn_CalculatePetAge (@NgaySinh DATE)
RETURNS INT
AS
BEGIN
    IF @NgaySinh IS NULL RETURN NULL;
    DECLARE @Today DATE = GETDATE();
    DECLARE @Age INT = DATEDIFF(YEAR, @NgaySinh, @Today);
    IF DATEFROMPARTS(YEAR(@Today), MONTH(@NgaySinh), DAY(@NgaySinh)) > @Today
        SET @Age = @Age - 1;
    RETURN CASE WHEN @Age < 0 THEN 0 ELSE @Age END;
END;

;
/****** Object:  UserDefinedFunction fn_GetInvoiceTotal    Script Date: 27/05/2026 07:14:55 ******/

;

;

CREATE FUNCTION fn_GetInvoiceTotal (@IdHoaDon VARCHAR(20))
RETURNS DECIMAL(12,2)
AS
BEGIN
    DECLARE @Total DECIMAL(12,2);
    SELECT @Total = tong_tien_cuoi FROM dbo.HoaDon WHERE id_hoa_don = @IdHoaDon;
    RETURN ISNULL(@Total, 0);
END;

;
/****** Object:  Table NhanVien    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE NhanVien(
	id_nhan_vien varchar(20) NOT NULL,
	ho_ten VARCHAR(100) NULL,
	ngay_sinh date NULL,
	gioi_tinh VARCHAR(10) NULL,
	dia_chi VARCHAR(255) NULL,
	so_dien_thoai varchar(255) NULL,
	email VARCHAR(100) NULL,
	so_cccd VARCHAR(20) NULL,
	ngay_vao_lam date NOT NULL,
	ngay_nghi_viec date NULL,
	trang_thai VARCHAR(50) NULL,
	da_xoa BOOLEAN NOT NULL,
	chuyen_mon VARCHAR(255) NULL,
	gioi_thieu VARCHAR(max) NULL,
	hinh_anh VARCHAR(max) NULL,
	id_tai_khoan varchar(50) NULL,
	nhan_email BOOLEAN NULL,
	nhan_sms BOOLEAN NULL,
 CONSTRAINT PK_NhanVien PRIMARY KEY  
(
	id_nhan_vien ASC
) 
)  TEXTIMAGE_
;
/****** Object:  Table KhachHang    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE KhachHang(
	id_khach_hang varchar(20) NOT NULL,
	ten_khach_hang VARCHAR(100) NOT NULL,
	email VARCHAR(100) NULL,
	sdt VARCHAR(15) NULL,
	dia_chi VARCHAR(255) NULL,
	ngay_tao TIMESTAMP NOT NULL,
	ngay_cap_nhat TIMESTAMP NULL,
	da_xoa BOOLEAN NOT NULL,
	nhan_email BOOLEAN NULL,
	nhan_sms BOOLEAN NULL,
	hinh_anh VARCHAR(max) NULL,
	nam_sinh int NULL,
 CONSTRAINT PK_KhachHang PRIMARY KEY  
(
	id_khach_hang ASC
) 
)  TEXTIMAGE_
;
/****** Object:  Table ThuCung    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE ThuCung(
	id_thu_cung varchar(20) NOT NULL,
	ten_thu_cung VARCHAR(100) NOT NULL,
	loai VARCHAR(50) NULL,
	giong VARCHAR(100) NULL,
	ngay_sinh date NULL,
	gioi_tinh VARCHAR(10) NULL,
	mau_sac VARCHAR(255) NULL,
	trong_luong numeric(38, 2) NULL,
	id_khach_hang varchar(20) NOT NULL,
	ngay_tao TIMESTAMP NOT NULL,
	da_xoa BOOLEAN NOT NULL,
	url_anh VARCHAR(500) NULL,
	ghi_chu VARCHAR(max) NULL,
	hinh_anh VARCHAR(max) NULL,
	ngay_cap_nhat TIMESTAMP NULL,
 CONSTRAINT PK_ThuCung PRIMARY KEY  
(
	id_thu_cung ASC
) 
)  TEXTIMAGE_
;
/****** Object:  Table LichHen    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE LichHen(
	id_lich_hen varchar(20) NOT NULL,
	ngay_kham date NOT NULL,
	gio_kham time(7) NOT NULL,
	ly_do VARCHAR(255) NULL,
	trang_thai VARCHAR(50) NULL,
	id_khach_hang varchar(20) NOT NULL,
	id_thu_cung varchar(20) NOT NULL,
	id_bac_si varchar(20) NOT NULL,
	id_nguoi_dat varchar(20) NULL,
	phong_kham VARCHAR(100) NULL,
	ghi_chu_noi_bo VARCHAR(500) NULL,
	ngay_tao TIMESTAMP NOT NULL,
	id_dich_vu varchar(20) NULL,
 CONSTRAINT PK_LichHen PRIMARY KEY  
(
	id_lich_hen ASC
) 
) 
;
/****** Object:  View v_LichHenHomNay    Script Date: 27/05/2026 07:14:55 ******/

;

;

-- 2. TÃ¡i táº¡o cÃ¡c View
CREATE VIEW v_LichHenHomNay AS
SELECT 
    lh.id_lich_hen,
    lh.gio_kham,
    tc.ten_thu_cung,
    kh.ten_khach_hang,
    nv.ho_ten AS ten_bac_si,
    lh.trang_thai,
    lh.phong_kham
FROM dbo.LichHen lh
JOIN dbo.ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung
JOIN dbo.KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang
LEFT JOIN dbo.NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien
WHERE lh.ngay_kham = CAST(GETDATE() AS DATE)
  AND lh.trang_thai <> 'da_huy';

;
/****** Object:  Table HoSoBenhAn    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE HoSoBenhAn(
	id_ho_so_benh_an varchar(20) NOT NULL,
	id_lich_hen varchar(20) NOT NULL,
	ngay_kham date NOT NULL,
	id_bac_si varchar(20) NOT NULL,
	can_nang numeric(38, 2) NULL,
	nhiet_do numeric(38, 2) NULL,
	huyet_ap VARCHAR(255) NULL,
	trieu_chung VARCHAR(max) NULL,
	ket_qua_tham_kham VARCHAR(max) NULL,
	chan_doan VARCHAR(max) NULL,
	phac_do_dieu_tri VARCHAR(max) NULL,
	huong_dan_cham_soc VARCHAR(max) NULL,
	ngay_tai_kham_de_xuat date NULL,
	trang_thai_ho_so VARCHAR(50) NULL,
	id_nguoi_tao varchar(20) NOT NULL,
	ngay_tao TIMESTAMP NOT NULL,
	nguoi_cap_nhat_gan_nhat varchar(20) NULL,
	ngay_cap_nhat_gan_nhat TIMESTAMP NULL,
	id_thu_cung varchar(20) NULL,
 CONSTRAINT PK_HoSoBenhAn PRIMARY KEY  
(
	id_ho_so_benh_an ASC
) 
)  TEXTIMAGE_
;
/****** Object:  View v_HoSoBenhAn_GanDay    Script Date: 27/05/2026 07:14:55 ******/

;

;

CREATE VIEW v_HoSoBenhAn_GanDay AS
SELECT 
    h.id_ho_so_benh_an,
    h.ngay_kham,
    nv.ho_ten AS ten_bac_si,
    kh.ten_khach_hang,
    tc.ten_thu_cung,
    h.chan_doan,
    h.trang_thai_ho_so
FROM dbo.HoSoBenhAn h
LEFT JOIN dbo.NhanVien nv ON h.id_bac_si = nv.id_nhan_vien
LEFT JOIN dbo.LichHen lh ON h.id_lich_hen = lh.id_lich_hen
LEFT JOIN dbo.KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang
LEFT JOIN dbo.ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung
WHERE h.ngay_kham >= DATEADD(DAY, -30, GETDATE());

;
/****** Object:  Table HoaDon    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE HoaDon(
	id_hoa_don varchar(20) NOT NULL,
	id_lich_hen varchar(20) NOT NULL,
	id_khach_hang varchar(20) NOT NULL,
	tong_tien_truoc_giam_gia numeric(38, 2) NULL,
	tong_tien_giam_gia numeric(38, 2) NULL,
	tong_tien_sau_giam_gia numeric(38, 2) NULL,
	thue_suat numeric(38, 2) NULL,
	thue_phai_nop numeric(38, 2) NULL,
	tong_tien_cuoi numeric(38, 2) NULL,
	ngay_lap TIMESTAMP NOT NULL,
	id_nhan_vien varchar(20) NOT NULL,
	trang_thai VARCHAR(50) NULL,
	ghi_chu VARCHAR(500) NULL,
	trang_thai_thanh_toan VARCHAR(50) NULL,
	ngay_lap_hoa_don TIMESTAMP NULL,
	tong_tien_ban_dau numeric(38, 2) NULL,
	tong_giam_gia numeric(38, 2) NULL,
 CONSTRAINT PK_HoaD KEY  
(
	id_hoa_don ASC
) 
) 
;
/****** Object:  View v_DoanhThu_TheoThang    Script Date: 27/05/2026 07:14:55 ******/

;

;

CREATE VIEW v_DoanhThu_TheoThang AS
SELECT 
    YEAR(ngay_lap) AS Nam,
    MONTH(ngay_lap) AS Thang,
    COUNT(id_hoa_don) AS SoHoaDon,
    SUM(tong_tien_cuoi) AS TongDoanhThu
FROM dbo.HoaDon
WHERE trang_thai = 'da_thanh_toan'
GROUP BY YEAR(ngay_lap), MONTH(ngay_lap);

;
/****** Object:  View v_ThongKe_BacSi    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE VIEW v_ThongKe_BacSi AS
                        SELECT 
                            nv.ho_ten AS TenBacSi,
                            COUNT(lh.id_lich_hen) AS SoLichHen,
                            COUNT(DISTINCT lh.id_thu_cung) AS SoHoSo,
                            SUM(ISNULL(hd.tong_tien_cuoi, 0)) AS TongDoanhThu
                        FROM NhanVien nv
                        LEFT JOIN LichHen lh ON nv.id_nhan_vien = lh.id_bac_si
                        LEFT JOIN HoaDon hd ON lh.id_lich_hen = hd.id_lich_hen AND hd.trang_thai = 'da_thanh_toan'
                        WHERE nv.chuyen_mon LIKE '%Bác sĩ%' OR nv.id_nhan_vien LIKE 'BS-%'
                        GROUP BY nv.ho_ten
;
/****** Object:  View v_DoanhThuThang    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE VIEW v_DoanhThuThang AS
SELECT 
    MONTH(ngay_lap) AS Thang, 
    YEAR(ngay_lap) AS Nam, 
    SUM(tong_tien_cuoi) AS TongDoanhThu
FROM HoaDon
WHERE trang_thai_thanh_toan = 'Đã thanh toán'
GROUP BY MONTH(ngay_lap), YEAR(ngay_lap);
;
/****** Object:  Table Thuoc    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE Thuoc(
	id_thuoc varchar(20) NOT NULL,
	ten_thuoc VARCHAR(100) NOT NULL,
	thanh_phan VARCHAR(255) NULL,
	dang_bao_che VARCHAR(50) NULL,
	don_vi VARCHAR(20) NULL,
	mo_ta VARCHAR(500) NULL,
	gia_ban decimal(10, 2) NOT NULL,
	trang_thai BOOLEAN NOT NULL,
	da_xoa BOOLEAN NULL,
PRIMARY KEY  
(
	id_thuoc ASC
) 
) 
;
/****** Object:  Table LoThuoc    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE LoThuoc(
	id_lo varchar(20) NOT NULL,
	id_thuoc varchar(20) NOT NULL,
	id_ncc varchar(20) NOT NULL,
	so_lo VARCHAR(100) NOT NULL,
	ngay_nhap date NOT NULL,
	han_su_dung date NOT NULL,
	gia_nhap decimal(18, 2) NOT NULL,
	so_luong_nhap int NOT NULL,
	so_luong_ton int NOT NULL,
	ngay_cap_nhat_ton_kho TIMESTAMP NULL,
PRIMARY KEY  
(
	id_lo ASC
) 
) 
;
/****** Object:  View v_ThuocSapHetHan    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE VIEW v_ThuocSapHetHan AS
                        SELECT 
                            t.ten_thuoc, 
                            lt.so_lo, 
                            lt.so_luong_ton,
                            lt.han_su_dung AS han_dung,
                            DATEDIFF(day, GETDATE(), lt.han_su_dung) AS so_ngay_con_lai
                        FROM LoThuoc lt
                        JOIN Thuoc t ON lt.id_thuoc = t.id_thuoc
                        WHERE lt.han_su_dung <= DATEADD(day, 60, GETDATE()) AND lt.so_luong_ton > 0;
;
/****** Object:  Table BenhAn_XetNghiem    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE BenhAn_XetNghiem(
	id_xet_nghiem_benh_an int SERIAL NOT NULL,
	id_ho_so varchar(20) NULL,
	id_loai_xet_nghiem varchar(20) NULL,
	ngay_lay_mau TIMESTAMP NOT NULL,
	id_bac_si varchar(20) NOT NULL,
	trang_thai VARCHAR(50) NULL,
PRIMARY KEY  
(
	id_xet_nghiem_benh_an ASC
) 
) 
;
/****** Object:  Table CauHinhHeThong    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE CauHinhHeThong(
	id_cau_hinh int SERIAL NOT NULL,
	ten_cau_hinh varchar(100) NULL,
	gia_tri VARCHAR(500) NULL,
	mo_ta VARCHAR(500) NULL,
	id_nhan_vien_cap_nhat varchar(20) NULL,
PRIMARY KEY  
(
	id_cau_hinh ASC
) ,
UNIQUE NON 
(
	ten_cau_hinh ASC
) 
) 
;
/****** Object:  Table ChiSoXetNghiem    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE ChiSoXetNghiem(
	id_chi_so int SERIAL NOT NULL,
	id_loai_xet_nghiem int NOT NULL,
	ten_thong_so VARCHAR(100) NOT NULL,
	don_vi VARCHAR(50) NULL,
PRIMARY KEY  
(
	id_chi_so ASC
) 
) 
;
/****** Object:  Table ChucNang    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE ChucNang(
	id_chuc_nang int SERIAL NOT NULL,
	ma_chuc_nang VARCHAR(100) NOT NULL,
	ten_chuc_nang VARCHAR(100) NOT NULL,
	mo_ta VARCHAR(255) NULL,
PRIMARY KEY  
(
	id_chuc_nang ASC
) ,
UNIQUE NON 
(
	ma_chuc_nang ASC
) 
) 
;
/****** Object:  Table DangKyNhanTin    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE DangKyNhanTin(
	id int SERIAL NOT NULL,
	Email VARCHAR(255) NOT NULL,
	NgayDangKy TIMESTAMP NULL,
PRIMARY KEY  
(
	id ASC
) ,
UNIQUE NON 
(
	Email ASC
) 
) 
;
/****** Object:  Table DanhGiaDichVu    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE DanhGiaDichVu(
	id_danh_gia int SERIAL NOT NULL,
	id_khach_hang varchar(20) NOT NULL,
	id_dich_vu varchar(20) NOT NULL,
	so_sao int NOT NULL,
	noi_dung VARCHAR(max) NULL,
	ngay_danh_gia TIMESTAMP NOT NULL,
PRIMARY KEY  
(
	id_danh_gia ASC
) 
)  TEXTIMAGE_
;
/****** Object:  Table DanhMucXetNghiem    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE DanhMucXetNghiem(
	id_danh_muc int SERIAL NOT NULL,
	ten_danh_muc VARCHAR(100) NOT NULL,
	mo_ta VARCHAR(255) NULL,
PRIMARY KEY  
(
	id_danh_muc ASC
) 
) 
;
/****** Object:  Table DichVu    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE DichVu(
	id_dich_vu varchar(20) NOT NULL,
	ten_dich_vu VARCHAR(200) NOT NULL,
	mo_ta VARCHAR(500) NULL,
	gia numeric(38, 2) NULL,
	thoi_luong_phut int NULL,
	trang_thai BOOLEAN NOT NULL,
	da_xoa BOOLEAN NULL,
	hinh_anh VARCHAR(max) NULL,
	ngay_tao TIMESTAMP NULL,
PRIMARY KEY  
(
	id_dich_vu ASC
) 
)  TEXTIMAGE_
;
/****** Object:  Table DichVuLichHen    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE DichVuLichHen(
	id_lich_hen varchar(20) NOT NULL,
	id_dich_vu varchar(20) NOT NULL,
	so_luong int NULL,
	don_gia decimal(10, 2) NOT NULL,
	ghi_chu VARCHAR(500) NULL,
 CONSTRAINT PK_DichVuLichHen PRIMARY KEY  
(
	id_lich_hen ASC,
	id_dich_vu ASC
) 
) 
;
/****** Object:  Table DonThuoc    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE DonThuoc(
	id_don_thuoc varchar(20) NOT NULL,
	id_ho_so_benh_an varchar(20) NOT NULL,
	id_bac_si varchar(20) NOT NULL,
	ngay_ke_don TIMESTAMP NULL,
	ghi_chu VARCHAR(max) NULL,
PRIMARY KEY  
(
	id_don_thuoc ASC
) 
)  TEXTIMAGE_
;
/****** Object:  Table DonThuocChiTiet    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE DonThuocChiTiet(
	id_chi_tiet_don_thuoc varchar(20) NOT NULL,
	id_don_thuoc varchar(20) NOT NULL,
	id_thuoc varchar(20) NOT NULL,
	so_luong int NOT NULL,
	lieu_dung VARCHAR(255) NULL,
PRIMARY KEY  
(
	id_chi_tiet_don_thuoc ASC
) 
) 
;
/****** Object:  Table EmailMarketing    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE EmailMarketing(
	id_email int SERIAL NOT NULL,
	email VARCHAR(100) NOT NULL,
	ngay_dang_ky TIMESTAMP NOT NULL,
	trang_thai BOOLEAN NOT NULL,
PRIMARY KEY  
(
	id_email ASC
) ,
UNIQUE NON 
(
	email ASC
) 
) 
;
/****** Object:  Table file_dinh_kem    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE file_dinh_kem(
	duong_dan varchar(255) NULL,
	kich_thuoc bigint NULL,
	loai varchar(255) NULL,
	ngay_upload TIMESTAMP(6) NULL,
	ten_file varchar(255) NULL,
	id varchar(20) NOT NULL,
	id_ho_so_benh_an varchar(20) NULL,
 CONSTRAINT PK_file_dinh_kem PRIMARY KEY  
(
	id ASC
) 
) 
;
/****** Object:  Table GiaoDichKho    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE GiaoDichKho(
	id_giao_dich varchar(20) NOT NULL,
	id_thuoc varchar(20) NULL,
	id_lo varchar(20) NULL,
	loai_giao_dich VARCHAR(50) NOT NULL,
	so_luong int NOT NULL,
	gia_tri decimal(18, 2) NULL,
	ngay_giao_dich TIMESTAMP NOT NULL,
	id_nhan_vien varchar(20) NOT NULL,
	ghi_chu VARCHAR(500) NULL,
PRIMARY KEY  
(
	id_giao_dich ASC
) 
) 
;
/****** Object:  Table HoaDonChiTiet    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE HoaDonChiTiet(
	id_chi_tiet_hoa_don varchar(20) NOT NULL,
	id_hoa_don varchar(20) NOT NULL,
	ten_muc VARCHAR(255) NOT NULL,
	loai_muc VARCHAR(50) NULL,
	so_luong int NULL,
	don_gia decimal(18, 2) NOT NULL,
PRIMARY KEY  
(
	id_chi_tiet_hoa_don ASC
) 
) 
;
/****** Object:  Table KetQuaXetNghiem_ChiTiet    Script Date: 27/05/2026 07:14:55 ******/

;

;
CREATE TABLE KetQuaXetNghiem_ChiTiet(
	id_ket_qua_chi_tiet int SERIAL NOT NULL,
	id_xet_nghiem_benh_an int NULL,
	id_chi_so int NOT NULL,
	gia_tri_ket_qua VARCHAR(255) NOT NULL,
PRIMARY KEY  
(
	id_ket_qua_chi_tiet ASC
) 
) 
;
/****** Object:  Table LichLamViecNhanVien    Script Date: 27/05/2026 07:14:56 ******/

;

;
CREATE TABLE LichLamViecNhanVien(
	id_lich_lam_viec bigint SERIAL NOT NULL,
	id_nhan_vien varchar(20) NULL,
	ngay_lam date NOT NULL,
	gio_bat_dau time(7) NOT NULL,
	gio_ket_thuc time(7) NULL,
	ghi_chu VARCHAR(500) NULL,
PRIMARY KEY  
(
	id_lich_lam_viec ASC
) 
) 
;
/****** Object:  Table LichSuTuVan    Script Date: 27/05/2026 07:14:56 ******/

;

;
CREATE TABLE LichSuTuVan(
	id_tu_van varchar(20) NOT NULL,
	id_khach_hang varchar(20) NULL,
	id_thu_cung varchar(20) NULL,
	noi_dung_khach VARCHAR(max) NULL,
	noi_dung_rexi VARCHAR(max) NULL,
	ngay_tu_van TIMESTAMP NULL,
	id_bac_si varchar(20) NULL,
PRIMARY KEY  
(
	id_tu_van ASC
) 
)  TEXTIMAGE_
;
/****** Object:  Table LoaiXetNghiem    Script Date: 27/05/2026 07:14:56 ******/

;

;
CREATE TABLE LoaiXetNghiem(
	id_loai_xet_nghiem int SERIAL NOT NULL,
	id_danh_muc int NOT NULL,
	ten_xet_nghiem VARCHAR(255) NOT NULL,
	mo_ta VARCHAR(500) NULL,
	gia_tien decimal(10, 2) NOT NULL,
PRIMARY KEY  
(
	id_loai_xet_nghiem ASC
) ,
UNIQUE NON 
(
	ten_xet_nghiem ASC
) 
) 
;
/****** Object:  Table NhaCungCap    Script Date: 27/05/2026 07:14:56 ******/

;

;
CREATE TABLE NhaCungCap(
	id_ncc varchar(20) NOT NULL,
	ten_ncc VARCHAR(255) NOT NULL,
	dia_chi VARCHAR(255) NULL,
	so_dien_thoai VARCHAR(15) NULL,
	email VARCHAR(100) NULL,
	ma_so_thue VARCHAR(20) NULL,
	ghi_chu VARCHAR(500) NULL,
	ngay_tao TIMESTAMP NOT NULL,
PRIMARY KEY  
(
	id_ncc ASC
) 
) 
;
/****** Object:  Table NhatKyChat    Script Date: 27/05/2026 07:14:56 ******/

;

;
CREATE TABLE NhatKyChat(
	id_chat bigint SERIAL NOT NULL,
	id_tai_khoan varchar(20) NULL,
	cau_hoi VARCHAR(max) NOT NULL,
	cau_tra_loi VARCHAR(max) NOT NULL,
	thoi_gian TIMESTAMP NOT NULL,
PRIMARY KEY  
(
	id_chat ASC
) 
)  TEXTIMAGE_
;
/****** Object:  Table NhatKyHeThong    Script Date: 27/05/2026 07:14:56 ******/

;

;
CREATE TABLE NhatKyHeThong(
	id int SERIAL NOT NULL,
	nguoi_thao_tac varchar(20) NULL,
	hanh_dong VARCHAR(255) NULL,
	bang_du_lieu varchar(100) NULL,
	chi_tiet VARCHAR(max) NULL,
	ngay_tao TIMESTAMP NULL,
	ten_dang_nhap VARCHAR(100) NULL,
	ip_address VARCHAR(50) NULL,
	device_info VARCHAR(500) NULL,
PRIMARY KEY  
(
	id ASC
) 
)  TEXTIMAGE_
;
/****** Object:  Table PhanCongNhanVien    Script Date: 27/05/2026 07:14:56 ******/

;

;
CREATE TABLE PhanCongNhanVien(
	id_nhan_vien varchar(20) NOT NULL,
	id_vai_tro varchar(20) NOT NULL,
	ngay_bat_dau_phan_cong date NOT NULL,
	ngay_ket_thuc_phan_cong date NULL,
 CONSTRAINT PK_PhanCongNhanVien PRIMARY KEY  
(
	id_nhan_vien ASC,
	id_vai_tro ASC,
	ngay_bat_dau_phan_cong ASC
) 
) 
;
/****** Object:  Table PhanQuyen    Script Date: 27/05/2026 07:14:56 ******/

;

;
CREATE TABLE PhanQuyen(
	id_vai_tro varchar(20) NOT NULL,
	id_chuc_nang int NOT NULL,
 CONSTRAINT PK_PhanQuyen PRIMARY KEY  
(
	id_vai_tro ASC,
	id_chuc_nang ASC
) 
) 
;
/****** Object:  Table TaiKhoan    Script Date: 27/05/2026 07:14:56 ******/

;

;
CREATE TABLE TaiKhoan(
	id_tai_khoan varchar(20) NOT NULL,
	ten_dang_nhap VARCHAR(100) NOT NULL,
	mat_khau VARCHAR(255) NOT NULL,
	id_vai_tro varchar(20) NULL,
	trang_thai VARCHAR(50) NULL,
	ngay_tao TIMESTAMP NOT NULL,
	id_khach_hang varchar(20) NULL,
	mat_khau_hash VARCHAR(255) NULL,
	id_nhan_vien varchar(20) NULL,
	welcome_email_sent BOOLEAN NULL,
 CONSTRAINT PK_TaiKhoan PRIMARY KEY  
(
	id_tai_khoan ASC
) ,
 CONSTRAINT UQ_TaiKhoan_TenDangNhap UNIQUE NON 
(
	ten_dang_nhap ASC
) 
) 
;
/****** Object:  Table ThanhToan    Script Date: 27/05/2026 07:14:56 ******/

;

;
CREATE TABLE ThanhToan(
	id_thanh_toan varchar(20) NOT NULL,
	id_hoa_don varchar(20) NOT NULL,
	so_tien decimal(12, 2) NOT NULL,
	phuong_thuc VARCHAR(50) NULL,
	ngay_tra_tien TIMESTAMP NULL,
	id_nhan_vien varchar(20) NULL,
	ma_giao_dich_ngan_hang VARCHAR(100) NULL,
	ghi_chu VARCHAR(500) NULL,
PRIMARY KEY  
(
	id_thanh_toan ASC
) 
) 
;
/****** Object:  Table ThongBao    Script Date: 27/05/2026 07:14:56 ******/

;

;
CREATE TABLE ThongBao(
	id_thong_bao varchar(20) NOT NULL,
	id_tai_khoan varchar(20) NOT NULL,
	tieu_de VARCHAR(255) NULL,
	noi_dung VARCHAR(max) NULL,
	loai_thong_bao VARCHAR(50) NULL,
	ngay_tao TIMESTAMP NOT NULL,
	da_doc BOOLEAN NULL,
PRIMARY KEY  
(
	id_thong_bao ASC
) 
)  TEXTIMAGE_
;
/****** Object:  Table TiemChung    Script Date: 27/05/2026 07:14:56 ******/

;

;
CREATE TABLE TiemChung(
	id_tiem_chung varchar(20) NOT NULL,
	id_thu_cung varchar(20) NOT NULL,
	ten_vaccine VARCHAR(100) NOT NULL,
	ngay_tiem date NOT NULL,
	ngay_tiem_lai date NULL,
	id_bac_si varchar(20) NULL,
	ghi_chu VARCHAR(500) NULL,
	loai_vaccine VARCHAR(100) NULL,
PRIMARY KEY  
(
	id_tiem_chung ASC
) 
) 
;
/****** Object:  Table VaiTroHeThong    Script Date: 27/05/2026 07:14:56 ******/

;

;
CREATE TABLE VaiTroHeThong(
	id_vai_tro varchar(20) NOT NULL,
	ten_vai_tro VARCHAR(50) NOT NULL,
	mo_ta VARCHAR(255) NULL,
 CONSTRAINT PK_VaiTroHeThong PRIMARY KEY  
(
	id_vai_tro ASC
) 
) 
;
/****** Object:  Index IX_HoaDon_NgayLap    Script Date: 27/05/2026 07:14:56 ******/
CREATE NON INDEX IX_HoaDon_NgayLap ON HoaDon
(
	ngay_lap_hoa_don ASC
) 
;

;
/****** Object:  Index IX_KhachHang_Email    Script Date: 27/05/2026 07:14:56 ******/
CREATE NON INDEX IX_KhachHang_Email ON KhachHang
(
	email ASC
) 
;

;
/****** Object:  Index IX_KhachHang_SDT    Script Date: 27/05/2026 07:14:56 ******/
CREATE NON INDEX IX_KhachHang_SDT ON KhachHang
(
	sdt ASC
) 
;

;
/****** Object:  Index IX_LichHen_KhachHang    Script Date: 27/05/2026 07:14:56 ******/
CREATE NON INDEX IX_LichHen_KhachHang ON LichHen
(
	id_khach_hang ASC
) 
;
/****** Object:  Index IX_LichHen_NgayKham    Script Date: 27/05/2026 07:14:56 ******/
CREATE NON INDEX IX_LichHen_NgayKham ON LichHen
(
	ngay_kham ASC
) 
;

;
/****** Object:  Index IX_NhanVien_Email    Script Date: 27/05/2026 07:14:56 ******/
CREATE NON INDEX IX_NhanVien_Email ON NhanVien
(
	email ASC
) 
;

;
/****** Object:  Index IX_NhatKy_NguoiThaoTac    Script Date: 27/05/2026 07:14:56 ******/
CREATE NON INDEX IX_NhatKy_NguoiThaoTac ON NhatKyHeThong
(
	nguoi_thao_tac ASC
) 
;

;
/****** Object:  Index IX_ThuCung_IdKhachHang    Script Date: 27/05/2026 07:14:56 ******/
CREATE NON INDEX IX_ThuCung_IdKhachHang ON ThuCung
(
	id_khach_hang ASC
) 
;
ALTER TABLE DangKyNhanTin ADD  DEFAULT (getdate()) FOR NgayDangKy
;
ALTER TABLE DanhGiaDichVu ADD  DEFAULT (getdate()) FOR ngay_danh_gia
;
ALTER TABLE EmailMarketing ADD  DEFAULT (getdate()) FOR ngay_dang_ky
;
ALTER TABLE EmailMarketing ADD  DEFAULT ((1)) FOR trang_thai
;
ALTER TABLE HoaDon ADD  DEFAULT (getdate()) FOR ngay_lap
;
ALTER TABLE HoSoBenhAn ADD  DEFAULT (getdate()) FOR ngay_tao
;
ALTER TABLE KhachHang ADD  DEFAULT (getdate()) FOR ngay_tao
;
ALTER TABLE KhachHang ADD  DEFAULT (getdate()) FOR ngay_cap_nhat
;
ALTER TABLE KhachHang ADD  DEFAULT ((0)) FOR da_xoa
;
ALTER TABLE LichHen ADD  DEFAULT (getdate()) FOR ngay_tao
;
ALTER TABLE NhanVien ADD  DEFAULT ((0)) FOR da_xoa
;
ALTER TABLE NhanVien ADD  DEFAULT ((1)) FOR nhan_email
;
ALTER TABLE NhanVien ADD  DEFAULT ((1)) FOR nhan_sms
;
ALTER TABLE NhatKyChat ADD  DEFAULT (getdate()) FOR thoi_gian
;
ALTER TABLE NhatKyHeThong ADD  DEFAULT (getdate()) FOR ngay_tao
;
ALTER TABLE TaiKhoan ADD  DEFAULT (getdate()) FOR ngay_tao
;
ALTER TABLE TaiKhoan ADD  DEFAULT ((0)) FOR welcome_email_sent
;
ALTER TABLE ThongBao ADD  DEFAULT ((0)) FOR da_doc
;
ALTER TABLE ThuCung ADD  DEFAULT (getdate()) FOR ngay_tao
;
ALTER TABLE ThuCung ADD  DEFAULT ((0)) FOR da_xoa
;
ALTER TABLE BenhAn_XetNghiem  WITH CHECK ADD  CONSTRAINT FK_BAXN_BacSi FOREIGN KEY(id_bac_si)
REFERENCES NhanVien (id_nhan_vien)
;
ALTER TABLE BenhAn_XetNghiem CHECK CONSTRAINT FK_BAXN_BacSi
;
ALTER TABLE BenhAn_XetNghiem  WITH CHECK ADD  CONSTRAINT FK_BAXN_HoSo FOREIGN KEY(id_ho_so)
REFERENCES HoSoBenhAn (id_ho_so_benh_an)
;
ALTER TABLE BenhAn_XetNghiem CHECK CONSTRAINT FK_BAXN_HoSo
;
ALTER TABLE BenhAn_XetNghiem  WITH CHECK ADD  CONSTRAINT FK_BenhAnXetNghiem_DichVu FOREIGN KEY(id_loai_xet_nghiem)
REFERENCES DichVu (id_dich_vu)
;
ALTER TABLE BenhAn_XetNghiem CHECK CONSTRAINT FK_BenhAnXetNghiem_DichVu
;
ALTER TABLE BenhAn_XetNghiem  WITH CHECK ADD  CONSTRAINT FK_BenhAnXetNghiem_HoSo FOREIGN KEY(id_ho_so)
REFERENCES HoSoBenhAn (id_ho_so_benh_an)
;
ALTER TABLE BenhAn_XetNghiem CHECK CONSTRAINT FK_BenhAnXetNghiem_HoSo
;
ALTER TABLE CauHinhHeThong  WITH CHECK ADD  CONSTRAINT FK_CauHinh_NhanVien_LienKet FOREIGN KEY(id_nhan_vien_cap_nhat)
REFERENCES NhanVien (id_nhan_vien)
;
ALTER TABLE CauHinhHeThong CHECK CONSTRAINT FK_CauHinh_NhanVien_LienKet
;
ALTER TABLE ChiSoXetNghiem  WITH CHECK ADD  CONSTRAINT FK_ChiSo_LoaiXN FOREIGN KEY(id_loai_xet_nghiem)
REFERENCES LoaiXetNghiem (id_loai_xet_nghiem)
;
ALTER TABLE ChiSoXetNghiem CHECK CONSTRAINT FK_ChiSo_LoaiXN
;
ALTER TABLE ChiSoXetNghiem  WITH CHECK ADD  CONSTRAINT FK_ChiSoXetNghiem_LoaiXN FOREIGN KEY(id_loai_xet_nghiem)
REFERENCES LoaiXetNghiem (id_loai_xet_nghiem)
;
ALTER TABLE ChiSoXetNghiem CHECK CONSTRAINT FK_ChiSoXetNghiem_LoaiXN
;
ALTER TABLE DanhGiaDichVu  WITH CHECK ADD  CONSTRAINT FK_DanhGia_DV_Final FOREIGN KEY(id_dich_vu)
REFERENCES DichVu (id_dich_vu)
ON DELETE CASCADE
;
ALTER TABLE DanhGiaDichVu CHECK CONSTRAINT FK_DanhGia_DV_Final
;
ALTER TABLE DanhGiaDichVu  WITH CHECK ADD  CONSTRAINT FK_DanhGia_KH_Final FOREIGN KEY(id_khach_hang)
REFERENCES KhachHang (id_khach_hang)
ON DELETE CASCADE
;
ALTER TABLE DanhGiaDichVu CHECK CONSTRAINT FK_DanhGia_KH_Final
;
ALTER TABLE DichVuLichHen  WITH CHECK ADD  CONSTRAINT FK_DichVuLichHen_DichVu FOREIGN KEY(id_dich_vu)
REFERENCES DichVu (id_dich_vu)
;
ALTER TABLE DichVuLichHen CHECK CONSTRAINT FK_DichVuLichHen_DichVu
;
ALTER TABLE DichVuLichHen  WITH CHECK ADD  CONSTRAINT FK_DichVuLichHen_LichHen FOREIGN KEY(id_lich_hen)
REFERENCES LichHen (id_lich_hen)
;
ALTER TABLE DichVuLichHen CHECK CONSTRAINT FK_DichVuLichHen_LichHen
;
ALTER TABLE DonThuoc  WITH CHECK ADD  CONSTRAINT FK_DonThuoc_HoSo FOREIGN KEY(id_ho_so_benh_an)
REFERENCES HoSoBenhAn (id_ho_so_benh_an)
;
ALTER TABLE DonThuoc CHECK CONSTRAINT FK_DonThuoc_HoSo
;
ALTER TABLE DonThuocChiTiet  WITH CHECK ADD  CONSTRAINT FK_DonThuocChiTiet_DonThuoc FOREIGN KEY(id_don_thuoc)
REFERENCES DonThuoc (id_don_thuoc)
;
ALTER TABLE DonThuocChiTiet CHECK CONSTRAINT FK_DonThuocChiTiet_DonThuoc
;
ALTER TABLE DonThuocChiTiet  WITH CHECK ADD  CONSTRAINT FK_DonThuocChiTiet_Thuoc FOREIGN KEY(id_thuoc)
REFERENCES Thuoc (id_thuoc)
;
ALTER TABLE DonThuocChiTiet CHECK CONSTRAINT FK_DonThuocChiTiet_Thuoc
;
ALTER TABLE DonThuocChiTiet  WITH CHECK ADD  CONSTRAINT FK_DonThuocCT_DonThuoc FOREIGN KEY(id_don_thuoc)
REFERENCES DonThuoc (id_don_thuoc)
;
ALTER TABLE DonThuocChiTiet CHECK CONSTRAINT FK_DonThuocCT_DonThuoc
;
ALTER TABLE DonThuocChiTiet  WITH CHECK ADD  CONSTRAINT FK_DonThuocCT_Thuoc FOREIGN KEY(id_thuoc)
REFERENCES Thuoc (id_thuoc)
;
ALTER TABLE DonThuocChiTiet CHECK CONSTRAINT FK_DonThuocCT_Thuoc
;
ALTER TABLE file_dinh_kem  WITH CHECK ADD  CONSTRAINT FK_FileDinhKem_HoSo FOREIGN KEY(id_ho_so_benh_an)
REFERENCES HoSoBenhAn (id_ho_so_benh_an)
;
ALTER TABLE file_dinh_kem CHECK CONSTRAINT FK_FileDinhKem_HoSo
;
ALTER TABLE GiaoDichKho  WITH CHECK ADD  CONSTRAINT FK_GDKho_Lo FOREIGN KEY(id_lo)
REFERENCES LoThuoc (id_lo)
;
ALTER TABLE GiaoDichKho CHECK CONSTRAINT FK_GDKho_Lo
;
ALTER TABLE GiaoDichKho  WITH CHECK ADD  CONSTRAINT FK_GDKho_Thuoc FOREIGN KEY(id_thuoc)
REFERENCES Thuoc (id_thuoc)
;
ALTER TABLE GiaoDichKho CHECK CONSTRAINT FK_GDKho_Thuoc
;
ALTER TABLE GiaoDichKho  WITH CHECK ADD  CONSTRAINT FK_GiaoDichKho_LoThuoc FOREIGN KEY(id_lo)
REFERENCES LoThuoc (id_lo)
;
ALTER TABLE GiaoDichKho CHECK CONSTRAINT FK_GiaoDichKho_LoThuoc
;
ALTER TABLE HoaDon  WITH CHECK ADD  CONSTRAINT FK_HoaDon_KhachHang FOREIGN KEY(id_khach_hang)
REFERENCES KhachHang (id_khach_hang)
;
ALTER TABLE HoaDon CHECK CONSTRAINT FK_HoaDon_KhachHang
;
ALTER TABLE HoaDon  WITH CHECK ADD  CONSTRAINT FK_HoaDon_LichHen FOREIGN KEY(id_lich_hen)
REFERENCES LichHen (id_lich_hen)
;
ALTER TABLE HoaDon CHECK CONSTRAINT FK_HoaDon_LichHen
;
ALTER TABLE HoaDon  WITH CHECK ADD  CONSTRAINT FK_HoaDon_NhanVien FOREIGN KEY(id_nhan_vien)
REFERENCES NhanVien (id_nhan_vien)
;
ALTER TABLE HoaDon CHECK CONSTRAINT FK_HoaDon_NhanVien
;
ALTER TABLE HoaDonChiTiet  WITH CHECK ADD  CONSTRAINT FK_HoaDonChiTiet_HoaDon FOREIGN KEY(id_hoa_don)
REFERENCES HoaDon (id_hoa_don)
;
ALTER TABLE HoaDonChiTiet CHECK CONSTRAINT FK_HoaDonChiTiet_HoaDon
;
ALTER TABLE HoSoBenhAn  WITH CHECK ADD  CONSTRAINT FK_HoSo_BacSi FOREIGN KEY(id_bac_si)
REFERENCES NhanVien (id_nhan_vien)
;
ALTER TABLE HoSoBenhAn CHECK CONSTRAINT FK_HoSo_BacSi
;
ALTER TABLE HoSoBenhAn  WITH CHECK ADD  CONSTRAINT FK_HoSo_LichHen FOREIGN KEY(id_lich_hen)
REFERENCES LichHen (id_lich_hen)
;
ALTER TABLE HoSoBenhAn CHECK CONSTRAINT FK_HoSo_LichHen
;
ALTER TABLE HoSoBenhAn  WITH CHECK ADD  CONSTRAINT FK_HoSo_NguoiTao FOREIGN KEY(id_nguoi_tao)
REFERENCES NhanVien (id_nhan_vien)
;
ALTER TABLE HoSoBenhAn CHECK CONSTRAINT FK_HoSo_NguoiTao
;
ALTER TABLE HoSoBenhAn  WITH CHECK ADD  CONSTRAINT FK_HoSo_ThuCung FOREIGN KEY(id_thu_cung)
REFERENCES ThuCung (id_thu_cung)
;
ALTER TABLE HoSoBenhAn CHECK CONSTRAINT FK_HoSo_ThuCung
;
ALTER TABLE HoSoBenhAn  WITH CHECK ADD  CONSTRAINT FK_HoSoBenhAn_ThuCung FOREIGN KEY(id_thu_cung)
REFERENCES ThuCung (id_thu_cung)
;
ALTER TABLE HoSoBenhAn CHECK CONSTRAINT FK_HoSoBenhAn_ThuCung
;
ALTER TABLE KetQuaXetNghiem_ChiTiet  WITH CHECK ADD  CONSTRAINT FK_KetQuaXetNghiem_BAXN FOREIGN KEY(id_xet_nghiem_benh_an)
REFERENCES BenhAn_XetNghiem (id_xet_nghiem_benh_an)
;
ALTER TABLE KetQuaXetNghiem_ChiTiet CHECK CONSTRAINT FK_KetQuaXetNghiem_BAXN
;
ALTER TABLE KetQuaXetNghiem_ChiTiet  WITH CHECK ADD  CONSTRAINT FK_KetQuaXetNghiem_ChiSo FOREIGN KEY(id_chi_so)
REFERENCES ChiSoXetNghiem (id_chi_so)
;
ALTER TABLE KetQuaXetNghiem_ChiTiet CHECK CONSTRAINT FK_KetQuaXetNghiem_ChiSo
;
ALTER TABLE KetQuaXetNghiem_ChiTiet  WITH CHECK ADD  CONSTRAINT FK_KQChiTiet_BAXN FOREIGN KEY(id_xet_nghiem_benh_an)
REFERENCES BenhAn_XetNghiem (id_xet_nghiem_benh_an)
;
ALTER TABLE KetQuaXetNghiem_ChiTiet CHECK CONSTRAINT FK_KQChiTiet_BAXN
;
ALTER TABLE KetQuaXetNghiem_ChiTiet  WITH CHECK ADD  CONSTRAINT FK_KQChiTiet_ChiSo FOREIGN KEY(id_chi_so)
REFERENCES ChiSoXetNghiem (id_chi_so)
;
ALTER TABLE KetQuaXetNghiem_ChiTiet CHECK CONSTRAINT FK_KQChiTiet_ChiSo
;
ALTER TABLE KetQuaXetNghiem_ChiTiet  WITH CHECK ADD  CONSTRAINT FK_KQCT_XetNghiem_Final FOREIGN KEY(id_xet_nghiem_benh_an)
REFERENCES BenhAn_XetNghiem (id_xet_nghiem_benh_an)
;
ALTER TABLE KetQuaXetNghiem_ChiTiet CHECK CONSTRAINT FK_KQCT_XetNghiem_Final
;
ALTER TABLE LichHen  WITH CHECK ADD  CONSTRAINT FK_LichHen_BacSi FOREIGN KEY(id_bac_si)
REFERENCES NhanVien (id_nhan_vien)
;
ALTER TABLE LichHen CHECK CONSTRAINT FK_LichHen_BacSi
;
ALTER TABLE LichHen  WITH CHECK ADD  CONSTRAINT FK_LichHen_KhachHang FOREIGN KEY(id_khach_hang)
REFERENCES KhachHang (id_khach_hang)
;
ALTER TABLE LichHen CHECK CONSTRAINT FK_LichHen_KhachHang
;
ALTER TABLE LichHen  WITH CHECK ADD  CONSTRAINT FK_LichHen_ThuCung FOREIGN KEY(id_thu_cung)
REFERENCES ThuCung (id_thu_cung)
;
ALTER TABLE LichHen CHECK CONSTRAINT FK_LichHen_ThuCung
;
ALTER TABLE LichLamViecNhanVien  WITH CHECK ADD  CONSTRAINT FK_LichLamViec_NhanVien FOREIGN KEY(id_nhan_vien)
REFERENCES NhanVien (id_nhan_vien)
;
ALTER TABLE LichLamViecNhanVien CHECK CONSTRAINT FK_LichLamViec_NhanVien
;
ALTER TABLE LichSuTuVan  WITH CHECK ADD  CONSTRAINT FK_LichSuTuVan_KhachHang FOREIGN KEY(id_khach_hang)
REFERENCES KhachHang (id_khach_hang)
;
ALTER TABLE LichSuTuVan CHECK CONSTRAINT FK_LichSuTuVan_KhachHang
;
ALTER TABLE LichSuTuVan  WITH CHECK ADD  CONSTRAINT FK_LichSuTuVan_ThuCung FOREIGN KEY(id_thu_cung)
REFERENCES ThuCung (id_thu_cung)
;
ALTER TABLE LichSuTuVan CHECK CONSTRAINT FK_LichSuTuVan_ThuCung
;
ALTER TABLE LoaiXetNghiem  WITH CHECK ADD  CONSTRAINT FK_LoaiXetNghiem_DanhMuc FOREIGN KEY(id_danh_muc)
REFERENCES DanhMucXetNghiem (id_danh_muc)
;
ALTER TABLE LoaiXetNghiem CHECK CONSTRAINT FK_LoaiXetNghiem_DanhMuc
;
ALTER TABLE LoThuoc  WITH CHECK ADD  CONSTRAINT FK_LoThuoc_NCC FOREIGN KEY(id_ncc)
REFERENCES NhaCungCap (id_ncc)
;
ALTER TABLE LoThuoc CHECK CONSTRAINT FK_LoThuoc_NCC
;
ALTER TABLE LoThuoc  WITH CHECK ADD  CONSTRAINT FK_LoThuoc_Thuoc FOREIGN KEY(id_thuoc)
REFERENCES Thuoc (id_thuoc)
;
ALTER TABLE LoThuoc CHECK CONSTRAINT FK_LoThuoc_Thuoc
;
ALTER TABLE NhatKyChat  WITH CHECK ADD  CONSTRAINT FK_Chat_TaiKhoan_Safe FOREIGN KEY(id_tai_khoan)
REFERENCES TaiKhoan (id_tai_khoan)
ON DELETE SET NULL
;
ALTER TABLE NhatKyChat CHECK CONSTRAINT FK_Chat_TaiKhoan_Safe
;
ALTER TABLE NhatKyHeThong  WITH CHECK ADD  CONSTRAINT FK_NhatKy_TaiKhoan FOREIGN KEY(ten_dang_nhap)
REFERENCES TaiKhoan (ten_dang_nhap)
;
ALTER TABLE NhatKyHeThong CHECK CONSTRAINT FK_NhatKy_TaiKhoan
;
ALTER TABLE PhanCongNhanVien  WITH CHECK ADD  CONSTRAINT FK_PhanCong_NhanVien FOREIGN KEY(id_nhan_vien)
REFERENCES NhanVien (id_nhan_vien)
;
ALTER TABLE PhanCongNhanVien CHECK CONSTRAINT FK_PhanCong_NhanVien
;
ALTER TABLE PhanCongNhanVien  WITH CHECK ADD  CONSTRAINT FK_PhanCong_VaiTro FOREIGN KEY(id_vai_tro)
REFERENCES VaiTroHeThong (id_vai_tro)
;
ALTER TABLE PhanCongNhanVien CHECK CONSTRAINT FK_PhanCong_VaiTro
;
ALTER TABLE PhanQuyen  WITH CHECK ADD  CONSTRAINT FK_PhanQuyen_ChucNang FOREIGN KEY(id_chuc_nang)
REFERENCES ChucNang (id_chuc_nang)
;
ALTER TABLE PhanQuyen CHECK CONSTRAINT FK_PhanQuyen_ChucNang
;
ALTER TABLE PhanQuyen  WITH CHECK ADD  CONSTRAINT FK_PhanQuyen_VaiTro FOREIGN KEY(id_vai_tro)
REFERENCES VaiTroHeThong (id_vai_tro)
;
ALTER TABLE PhanQuyen CHECK CONSTRAINT FK_PhanQuyen_VaiTro
;
ALTER TABLE TaiKhoan  WITH CHECK ADD  CONSTRAINT FK_TaiKhoan_KhachHang FOREIGN KEY(id_khach_hang)
REFERENCES KhachHang (id_khach_hang)
;
ALTER TABLE TaiKhoan CHECK CONSTRAINT FK_TaiKhoan_KhachHang
;
ALTER TABLE TaiKhoan  WITH CHECK ADD  CONSTRAINT FK_TaiKhoan_NhanVien FOREIGN KEY(id_nhan_vien)
REFERENCES NhanVien (id_nhan_vien)
;
ALTER TABLE TaiKhoan CHECK CONSTRAINT FK_TaiKhoan_NhanVien
;
ALTER TABLE TaiKhoan  WITH CHECK ADD  CONSTRAINT FK_TaiKhoan_VaiTro FOREIGN KEY(id_vai_tro)
REFERENCES VaiTroHeThong (id_vai_tro)
;
ALTER TABLE TaiKhoan CHECK CONSTRAINT FK_TaiKhoan_VaiTro
;
ALTER TABLE ThanhToan  WITH CHECK ADD  CONSTRAINT FK_ThanhToan_HoaDon FOREIGN KEY(id_hoa_don)
REFERENCES HoaDon (id_hoa_don)
;
ALTER TABLE ThanhToan CHECK CONSTRAINT FK_ThanhToan_HoaDon
;
ALTER TABLE ThanhToan  WITH CHECK ADD  CONSTRAINT FK_ThanhToan_NhanVien FOREIGN KEY(id_nhan_vien)
REFERENCES NhanVien (id_nhan_vien)
;
ALTER TABLE ThanhToan CHECK CONSTRAINT FK_ThanhToan_NhanVien
;
ALTER TABLE ThongBao  WITH CHECK ADD  CONSTRAINT FK_ThongBao_TaiKhoan FOREIGN KEY(id_tai_khoan)
REFERENCES TaiKhoan (id_tai_khoan)
;
ALTER TABLE ThongBao CHECK CONSTRAINT FK_ThongBao_TaiKhoan
;
ALTER TABLE ThuCung  WITH CHECK ADD  CONSTRAINT FK_ThuCung_KhachHang FOREIGN KEY(id_khach_hang)
REFERENCES KhachHang (id_khach_hang)
;
ALTER TABLE ThuCung CHECK CONSTRAINT FK_ThuCung_KhachHang
;
ALTER TABLE TiemChung  WITH CHECK ADD  CONSTRAINT FK_TiemChung_BacSi FOREIGN KEY(id_bac_si)
REFERENCES NhanVien (id_nhan_vien)
;
ALTER TABLE TiemChung CHECK CONSTRAINT FK_TiemChung_BacSi
;
ALTER TABLE TiemChung  WITH CHECK ADD  CONSTRAINT FK_TiemChung_ThuCung FOREIGN KEY(id_thu_cung)
REFERENCES ThuCung (id_thu_cung)
;
ALTER TABLE TiemChung CHECK CONSTRAINT FK_TiemChung_ThuCung
;
ALTER TABLE DanhGiaDichVu  WITH CHECK ADD CHECK  ((so_sao>=(1) AND so_sao<=(5)))
;
/****** Object:  StoredProcedure sp_AddAppointment    Script Date: 27/05/2026 07:14:56 ******/

;

;
-- =========================================
-- PHáº¦N 4: STORED PROCEDURES
-- =========================================

-- 1. Äáº·t lá»‹ch háº¹n
CREATE PROCEDURE sp_AddAppointment
    @NgayHen        DATE,
    @GioHen         TIME,
    @LyDo           VARCHAR(500) = NULL,
    @IdKhachHang    INT,
    @IdThuCung      INT,
    @IdBacSi        INT,
    @IdNguoiDat     INT = NULL,
    @PhongKham      VARCHAR(100) = NULL,
    @GhiChu         VARCHAR(500) = NULL
AS
BEGIN
    ;

    INSERT INTO dbo.LichHen 
        (ngay_kham, gio_kham, ly_do, trang_thai, id_khach_hang, id_thu_cung, 
         id_bac_si, id_nguoi_dat, phong_kham, ghi_chu_noi_bo, ngay_tao)
    VALUES 
        (@NgayHen, @GioHen, @LyDo, 'da_dat', @IdKhachHang, @IdThuCung, 
         @IdBacSi, @IdNguoiDat, @PhongKham, @GhiChu, GETDATE());

    SELECT SCOPE_IDENTITY() AS id_lich_hen_moi;
END;
;
/****** Object:  StoredProcedure sp_AddMedicalRecord    Script Date: 27/05/2026 07:14:56 ******/

;

;

-- 2. Táº¡o há»“ sÆ¡ bá»‡nh Ã¡n
CREATE PROCEDURE sp_AddMedicalRecord
    @IdLichHen          INT,
    @NgayKham           DATE,
    @IdBacSi            INT,
    @CanNang            DECIMAL(8,2),
    @NhietDo            DECIMAL(5,2),
    @TrieuChung         VARCHAR(500),
    @ChanDoan           VARCHAR(500),
    @PhacDoDieuTri      VARCHAR(500) = NULL,
    @HuongDanChamSoc    VARCHAR(500) = NULL,
    @IdNguoiTao         INT
AS
BEGIN
    ;

    -- Kiá»ƒm tra lá»‹ch háº¹n tá»“n táº¡i
    IF NOT EXISTS (SELECT 1 FROM dbo.LichHen WHERE id_lich_hen = @IdLichHen)
    BEGIN
        RAISERROR('KhÃ´ng tÃ¬m tháº¥y lá»‹ch háº¹n vá»›i id = %d', 16, 1, @IdLichHen);
        RETURN;
    END

    INSERT INTO dbo.HoSoBenhAn (
        id_lich_hen, ngay_kham, id_bac_si, can_nang, nhiet_do, 
        trieu_chung, chan_doan, phac_do_dieu_tri, huong_dan_cham_soc, 
        trang_thai_ho_so, id_nguoi_tao, ngay_tao
    )
    VALUES (
        @IdLichHen, @NgayKham, @IdBacSi, @CanNang, @NhietDo, 
        @TrieuChung, @ChanDoan, @PhacDoDieuTri, @HuongDanChamSoc, 
        'nhap', @IdNguoiTao, GETDATE()
    );

    -- Cáº­p nháº­t tráº¡ng thÃ¡i lá»‹ch háº¹n
    UPDATE dbo.LichHen 
    SET trang_thai = 'da_kham' 
    WHERE id_lich_hen = @IdLichHen;

    SELECT SCOPE_IDENTITY() AS id_ho_so_moi;
END;
;
/****** Object:  StoredProcedure sp_CapNhatThongTinKhachHang    Script Date: 27/05/2026 07:14:56 ******/

;

;

-- 2. Cáº­p nháº­t Stored Procedure sp_CapNhatThongTinKhachHang
CREATE PROCEDURE sp_CapNhatThongTinKhachHang 
    @IdKhachHang VARCHAR(50), 
    @TenKhachHang VARCHAR(100), 
    @Email VARCHAR(100) = NULL, 
    @SDT VARCHAR(15) = NULL, 
    @DiaChi VARCHAR(255) = NULL,
    @NamSinh INT = NULL
AS 
BEGIN 
    UPDATE dbo.KhachHang 
    SET 
        ten_khach_hang = @TenKhachHang, 
        email = @Email, 
        sdt = @SDT, 
        dia_chi = @DiaChi, 
        nam_sinh = @NamSinh,
        ngay_cap_nhat = GETDATE() 
    WHERE id_khach_hang = @IdKhachHang; 
    
    SELECT 'Cáº­p nháº­t thÃ´ng tin thÃ nh cÃ´ng' AS ThongBao; 
END;

;
/****** Object:  StoredProcedure sp_CapNhatTonKho    Script Date: 27/05/2026 07:14:56 ******/

;

;

-- 5. Cáº­p nháº­t tá»“n kho thá»§ cÃ´ng (dÃ nh cho quáº£n lÃ½ kho)
CREATE PROCEDURE sp_CapNhatTonKho
    @IdLo INT,
    @SoLuongThayDoi INT,
    @LoaiGiaoDich VARCHAR(50),   -- 'nhap_them', 'xuat_huy', 'kiem_ke'...
    @IdNhanVien INT,
    @GhiChu VARCHAR(500) = NULL
AS
BEGIN
    ;

    UPDATE dbo.LoThuoc
    SET so_luong_ton = so_luong_ton + @SoLuongThayDoi,
        ngay_cap_nhat_ton_kho = GETDATE()
    WHERE id_lo = @IdLo;

    INSERT INTO dbo.GiaoDichKho 
        (id_lo, loai_giao_dich, so_luong, ngay_giao_dich, id_nhan_vien, ghi_chu)
    VALUES 
        (@IdLo, @LoaiGiaoDich, @SoLuongThayDoi, GETDATE(), @IdNhanVien, @GhiChu);

    SELECT 'Cáº­p nháº­t tá»“n kho thÃ nh cÃ´ng' AS ThongBao;
END;
;
/****** Object:  StoredProcedure sp_DangKyKhachHang    Script Date: 27/05/2026 07:14:56 ******/

;

;
-- =========================================
-- PHáº¦N Bá»” SUNG 3: STORED PROCEDURE QUAN TRá»ŒNG CHO WEB
-- =========================================

-- 1. ÄÄƒng kÃ½ tÃ i khoáº£n khÃ¡ch hÃ ng
CREATE   PROCEDURE sp_DangKyKhachHang
    @TenDangNhap VARCHAR(50),
    @MatKhau VARCHAR(255),           -- sáº½ Ä‘Æ°á»£c hash á»Ÿ backend
    @TenKhachHang VARCHAR(100),
    @Email VARCHAR(100) = NULL,
    @SDT VARCHAR(15) = NULL,
    @DiaChi VARCHAR(255) = NULL
AS
BEGIN
    ;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Táº¡o khÃ¡ch hÃ ng
        INSERT INTO dbo.KhachHang (ten_khach_hang, email, sdt, dia_chi, ngay_tao, ngay_cap_nhat, da_xoa)
        VALUES (@TenKhachHang, @Email, @SDT, @DiaChi, GETDATE(), GETDATE(), 0);

        DECLARE @IdKhachHang INT = SCOPE_IDENTITY();

        -- Táº¡o tÃ i khoáº£n
        INSERT INTO dbo.TaiKhoan (ten_dang_nhap, mat_khau, id_vai_tro, trang_thai, ngay_tao, id_khach_hang)
        VALUES (@TenDangNhap, @MatKhau, 
                (SELECT id_vai_tro FROM dbo.VaiTroHeThong WHERE ten_vai_tro = 'khÃ¡ch hÃ ng'),
                'active', GETDATE(), @IdKhachHang);

        COMMIT TRANSACTION;

        SELECT 'ÄÄƒng kÃ½ thÃ nh cÃ´ng' AS ThongBao, @IdKhachHang AS IdKhachHang;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
;
/****** Object:  StoredProcedure sp_DangNhap    Script Date: 27/05/2026 07:14:56 ******/

;

;

CREATE PROCEDURE sp_DangNhap
    @TenDangNhap VARCHAR(255)
AS
BEGIN
    ;

    -- Tìm tài khoản dựa trên ten_dang_nhap HOẶC email của khách hàng/nhân viên
    SELECT 
        t.id_tai_khoan, 
        t.ten_dang_nhap, 
        t.mat_khau, 
        t.mat_khau_hash,
        v.ten_vai_tro, 
        t.trang_thai, 
        k.ten_khach_hang, 
        n.ho_ten,
        ISNULL(k.id_khach_hang, 0) AS id_khach_hang, 
        ISNULL(n.id_nhan_vien, 0) AS id_nhan_vien,
        ISNULL(k.email, n.email) AS email
    FROM dbo.TaiKhoan t
    LEFT JOIN dbo.VaiTroHeThong v ON t.id_vai_tro = v.id_vai_tro
    LEFT JOIN dbo.KhachHang k ON t.id_khach_hang = k.id_khach_hang
    LEFT JOIN dbo.NhanVien n ON t.id_nhan_vien = n.id_nhan_vien
    WHERE (t.ten_dang_nhap = @TenDangNhap OR k.email = @TenDangNhap OR n.email = @TenDangNhap)
      AND t.trang_thai = 'active';
END;

;
/****** Object:  StoredProcedure sp_DonDepNhatKy    Script Date: 27/05/2026 07:14:56 ******/

;

;

-- KỊCH BẢN 5: THỦ TỤC DỌN DẸP LOG HỆ THỐNG
CREATE PROCEDURE sp_DonDepNhatKy
AS
BEGIN
    ;
    -- Xóa các log cũ hơn 60 ngày
    DELETE FROM dbo.NhatKyHeThong
    WHERE ngay_gio < DATEADD(DAY, -60, GETDATE());
END;
;
/****** Object:  StoredProcedure sp_HuyLichHen    Script Date: 27/05/2026 07:14:56 ******/

;

;

-- 4. Há»§y lá»‹ch háº¹n (cáº­p nháº­t tráº¡ng thÃ¡i)
CREATE PROCEDURE sp_HuyLichHen
    @IdLichHen INT,
    @LyDoHuy VARCHAR(500) = NULL
AS
BEGIN
    ;

    UPDATE dbo.LichHen
    SET trang_thai = 'da_huy',
        ghi_chu_noi_bo = ISNULL(ghi_chu_noi_bo, '') + ' - Há»§y: ' + ISNULL(@LyDoHuy, '')
    WHERE id_lich_hen = @IdLichHen;

    IF @@ROWCOUNT = 0
        RAISERROR('KhÃ´ng tÃ¬m tháº¥y lá»‹ch háº¹n Ä‘á»ƒ há»§y!', 16, 1);
    ELSE
        SELECT 'Há»§y lá»‹ch háº¹n thÃ nh cÃ´ng' AS ThongBao;
END;
;
/****** Object:  StoredProcedure sp_LapHoaDon    Script Date: 27/05/2026 07:14:56 ******/

;

;

        CREATE PROCEDURE sp_LapHoaDon
            @IdLichHen          INT,
            @ThueSuat           DECIMAL(5,2) = 0,
            @TongTienGiamGia    DECIMAL(12,2) = 0,
            @IdNhanVienLap      INT,
            @GhiChu             VARCHAR(500) = NULL
        AS
        BEGIN
            ;
            DECLARE @IdKhachHang INT;
            DECLARE @TongTruocGiam DECIMAL(18,2) = 0;
            DECLARE @TienDichVu DECIMAL(18,2) = 0;
            DECLARE @TienThuoc DECIMAL(18,2) = 0;
            DECLARE @TongSauGiam DECIMAL(18,2);
            DECLARE @ThuePhai DECIMAL(18,2);
            DECLARE @TongCuoi DECIMAL(18,2);

            SELECT @IdKhachHang = id_khach_hang FROM dbo.LichHen WHERE id_lich_hen = @IdLichHen;
            IF @IdKhachHang IS NULL
            BEGIN
                RAISERROR('KhÃ´ng tÃ¬m tháº¥y lá»‹ch háº¹n!', 16, 1);
                RETURN;
            END

            -- TÃ­nh tiá»n Dá»‹ch vá»¥ (Náº¿u cÃ³ báº£ng riÃªng, náº¿u khÃ´ng láº¥y tá»« báº£ng LichHen join DichVu)
            SELECT @TienDichVu = ISNULL(dv.gia, 0) 
            FROM dbo.LichHen lh 
            JOIN dbo.DichVu dv ON lh.id_dich_vu = dv.id_dich_vu 
            WHERE lh.id_lich_hen = @IdLichHen;

            -- TÃ­nh tiá»n Thuá»‘c (tá»« ÄÆ¡n thuá»‘c)
            SELECT @TienThuoc = ISNULL(SUM(dtc.so_luong * t.gia_ban), 0)
            FROM dbo.HoSoBenhAn hs
            JOIN dbo.DonThuoc dt ON hs.id_ho_so_benh_an = dt.id_ho_so_benh_an
            JOIN dbo.DonThuocChiTiet dtc ON dt.id_don_thuoc = dtc.id_don_thuoc
            JOIN dbo.Thuoc t ON dtc.id_thuoc = t.id_thuoc
            WHERE hs.id_lich_hen = @IdLichHen;

            SET @TongTruocGiam = @TienDichVu + @TienThuoc;
            SET @TongSauGiam = @TongTruocGiam - ISNULL(@TongTienGiamGia, 0);
            SET @ThuePhai    = @TongSauGiam * ISNULL(@ThueSuat, 0) / 100;
            SET @TongCuoi    = @TongSauGiam + @ThuePhai;

            -- LÆ°u HÃ³a Ä‘Æ¡n chÃ­nh (Schema má»›i)
            INSERT INTO dbo.HoaDon (
                id_lich_hen, id_khach_hang, id_nhan_vien, ngay_lap_hoa_don, 
                tong_tien_ban_dau, tong_giam_gia, tong_tien_cuoi, trang_thai, ghi_chu
            )
            VALUES (
                @IdLichHen, @IdKhachHang, @IdNhanVienLap, GETDATE(), 
                @TongTruocGiam, @TongTienGiamGia, @TongCuoi, 'cho_thanh_toan', @GhiChu
            );
            
            SELECT SCOPE_IDENTITY() AS id_hoa_don_moi;
        END
        
;
/****** Object:  StoredProcedure sp_LichHenCuaKhachHang    Script Date: 27/05/2026 07:14:56 ******/

;

;

-- 4. Láº¥y lá»‹ch háº¹n cá»§a khÃ¡ch hÃ ng (dÃ¹ng cho khÃ¡ch hÃ ng xem)
CREATE   PROCEDURE sp_LichHenCuaKhachHang
    @IdKhachHang INT
AS
BEGIN
    SELECT 
        lh.id_lich_hen,
        lh.ngay_kham,
        lh.gio_kham,
        lh.trang_thai,
        tc.ten_thu_cung,
        nv.ho_ten AS ten_bac_si,
        lh.ly_do
    FROM dbo.LichHen lh
    JOIN dbo.ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung
    JOIN dbo.NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien
    WHERE lh.id_khach_hang = @IdKhachHang
    ORDER BY lh.ngay_kham DESC, lh.gio_kham DESC;
END;
;
/****** Object:  StoredProcedure sp_TaoThongBaoTiemChung    Script Date: 27/05/2026 07:14:56 ******/

;

;

-- KỊCH BẢN 4: THỦ TỤC NHẮC LỊCH TIÊM CHỦNG
CREATE PROCEDURE sp_TaoThongBaoTiemChung
AS
BEGIN
    ;
    -- Tạo thông báo trước 3 ngày
    INSERT INTO dbo.ThongBao (id_tai_khoan, tieu_de, noi_dung, loai_thong_bao, da_doc, ngay_tao)
    SELECT 
        tk.id_tai_khoan,
        'Nhắc nhở tiêm chủng',
        'Thú cưng ' + tc.ten_thu_cung + ' sắp đến lịch tiêm nhắc lại vaccine ' + t.ten_vaccine + ' vào ngày ' + CONVERT(VARCHAR, t.ngay_tiem_lai, 103),
        'he_thong',
        0,
        GETDATE()
    FROM dbo.TiemChung t
    JOIN dbo.ThuCung tc ON t.id_thu_cung = tc.id_thu_cung
    JOIN dbo.TaiKhoan tk ON tc.id_khach_hang = tk.id_khach_hang
    WHERE t.ngay_tiem_lai = DATEADD(DAY, 3, CAST(GETDATE() AS DATE));
END;
;

;
;
