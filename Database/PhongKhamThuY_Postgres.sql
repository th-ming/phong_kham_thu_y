
-- PostgreSQL Sequences for automatic ID generation of VARCHAR fields
CREATE SEQUENCE IF NOT EXISTS seq_lich_hen START WITH 1000;
CREATE SEQUENCE IF NOT EXISTS seq_ho_so_benh_an START WITH 1000;
CREATE SEQUENCE IF NOT EXISTS seq_hoa_don START WITH 1000;
CREATE SEQUENCE IF NOT EXISTS seq_don_thuoc START WITH 1000;
CREATE SEQUENCE IF NOT EXISTS seq_chi_tiet_don_thuoc START WITH 1000;
CREATE SEQUENCE IF NOT EXISTS seq_thanh_toan START WITH 1000;
CREATE SEQUENCE IF NOT EXISTS seq_thong_bao START WITH 1000;
CREATE SEQUENCE IF NOT EXISTS seq_khach_hang START WITH 1000;
CREATE SEQUENCE IF NOT EXISTS seq_thu_cung START WITH 1000;
CREATE SEQUENCE IF NOT EXISTS seq_tai_khoan START WITH 1000;
CREATE SEQUENCE IF NOT EXISTS seq_nhan_vien START WITH 1000;
CREATE SEQUENCE IF NOT EXISTS seq_dich_vu START WITH 1000;
CREATE SEQUENCE IF NOT EXISTS seq_giao_dich_kho START WITH 1000;
CREATE SEQUENCE IF NOT EXISTS seq_hoa_don_chi_tiet START WITH 1000;
-- ==========================================
-- TABLES
-- ==========================================

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
	gioi_thieu TEXT NULL,
	hinh_anh TEXT NULL,
	id_tai_khoan varchar(50) NULL,
	nhan_email BOOLEAN NULL,
	nhan_sms BOOLEAN NULL,
 CONSTRAINT PK_NhanVien PRIMARY KEY  
(id_nhan_vien) 
)
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
	hinh_anh TEXT NULL,
	nam_sinh int NULL,
 CONSTRAINT PK_KhachHang PRIMARY KEY  
(
	id_khach_hang 
) 
)
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
	ghi_chu TEXT NULL,
	hinh_anh TEXT NULL,
	ngay_cap_nhat TIMESTAMP NULL,
 CONSTRAINT PK_ThuCung PRIMARY KEY  
(
	id_thu_cung 
) 
)
;

CREATE TABLE LichHen(
	id_lich_hen varchar(20) NOT NULL,
	ngay_kham date NOT NULL,
	gio_kham TIME NOT NULL,
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
	id_lich_hen 
) 
) 
;
-- ==========================================
-- VIEWS
-- ==========================================

CREATE TABLE HoSoBenhAn(
	id_ho_so_benh_an varchar(20) NOT NULL,
	id_lich_hen varchar(20) NOT NULL,
	ngay_kham date NOT NULL,
	id_bac_si varchar(20) NOT NULL,
	can_nang numeric(38, 2) NULL,
	nhiet_do numeric(38, 2) NULL,
	huyet_ap VARCHAR(255) NULL,
	trieu_chung TEXT NULL,
	ket_qua_tham_kham TEXT NULL,
	chan_doan TEXT NULL,
	phac_do_dieu_tri TEXT NULL,
	huong_dan_cham_soc TEXT NULL,
	ngay_tai_kham_de_xuat date NULL,
	trang_thai_ho_so VARCHAR(50) NULL,
	id_nguoi_tao varchar(20) NOT NULL,
	ngay_tao TIMESTAMP NOT NULL,
	nguoi_cap_nhat_gan_nhat varchar(20) NULL,
	ngay_cap_nhat_gan_nhat TIMESTAMP NULL,
	id_thu_cung varchar(20) NULL,
 CONSTRAINT PK_HoSoBenhAn PRIMARY KEY  
(
	id_ho_so_benh_an 
) 
)
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
 CONSTRAINT PK_HoaDon PRIMARY KEY  
(
	id_hoa_don 
) 
) 
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
	id_thuoc 
) 
) 
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
	id_lo 
) 
) 
;



CREATE TABLE BenhAn_XetNghiem(
	id_xet_nghiem_benh_an SERIAL NOT NULL,
	id_ho_so varchar(20) NULL,
	id_loai_xet_nghiem varchar(20) NULL,
	ngay_lay_mau TIMESTAMP NOT NULL,
	id_bac_si varchar(20) NOT NULL,
	trang_thai VARCHAR(50) NULL,
PRIMARY KEY  
(
	id_xet_nghiem_benh_an 
) 
) 
;

CREATE TABLE CauHinhHeThong(
	id_cau_hinh SERIAL NOT NULL,
	ten_cau_hinh varchar(100) NULL,
	gia_tri VARCHAR(500) NULL,
	mo_ta VARCHAR(500) NULL,
	id_nhan_vien_cap_nhat varchar(20) NULL,
PRIMARY KEY  
(
	id_cau_hinh 
) ,
UNIQUE 
(
	ten_cau_hinh 
) 
) 
;

CREATE TABLE ChiSoXetNghiem(
	id_chi_so SERIAL NOT NULL,
	id_loai_xet_nghiem int NOT NULL,
	ten_thong_so VARCHAR(100) NOT NULL,
	don_vi VARCHAR(50) NULL,
PRIMARY KEY  
(
	id_chi_so 
) 
) 
;

CREATE TABLE ChucNang(
	id_chuc_nang SERIAL NOT NULL,
	ma_chuc_nang VARCHAR(100) NOT NULL,
	ten_chuc_nang VARCHAR(100) NOT NULL,
	mo_ta VARCHAR(255) NULL,
PRIMARY KEY  
(
	id_chuc_nang 
) ,
UNIQUE 
(
	ma_chuc_nang 
) 
) 
;

CREATE TABLE DangKyNhanTin(
	id SERIAL NOT NULL,
	Email VARCHAR(255) NOT NULL,
	NgayDangKy TIMESTAMP NULL,
PRIMARY KEY  
(
	id 
) ,
UNIQUE 
(
	Email 
) 
) 
;

CREATE TABLE DanhGiaDichVu(
	id_danh_gia SERIAL NOT NULL,
	id_khach_hang varchar(20) NOT NULL,
	id_dich_vu varchar(20) NOT NULL,
	so_sao int NOT NULL,
	noi_dung TEXT NULL,
	ngay_danh_gia TIMESTAMP NOT NULL,
PRIMARY KEY  
(
	id_danh_gia 
) 
)
;

CREATE TABLE DanhMucXetNghiem(
	id_danh_muc SERIAL NOT NULL,
	ten_danh_muc VARCHAR(100) NOT NULL,
	mo_ta VARCHAR(255) NULL,
PRIMARY KEY  
(
	id_danh_muc 
) 
) 
;

CREATE TABLE DichVu(
	id_dich_vu varchar(20) NOT NULL,
	ten_dich_vu VARCHAR(200) NOT NULL,
	mo_ta VARCHAR(500) NULL,
	gia numeric(38, 2) NULL,
	thoi_luong_phut int NULL,
	trang_thai BOOLEAN NOT NULL,
	da_xoa BOOLEAN NULL,
	hinh_anh TEXT NULL,
	ngay_tao TIMESTAMP NULL,
PRIMARY KEY  
(
	id_dich_vu 
) 
)
;

CREATE TABLE DichVuLichHen(
	id_lich_hen varchar(20) NOT NULL,
	id_dich_vu varchar(20) NOT NULL,
	so_luong int NULL,
	don_gia decimal(10, 2) NOT NULL,
	ghi_chu VARCHAR(500) NULL,
 CONSTRAINT PK_DichVuLichHen PRIMARY KEY  
(
	id_lich_hen ,
	id_dich_vu 
) 
) 
;

CREATE TABLE DonThuoc(
	id_don_thuoc varchar(20) NOT NULL,
	id_ho_so_benh_an varchar(20) NOT NULL,
	id_bac_si varchar(20) NOT NULL,
	ngay_ke_don TIMESTAMP NULL,
	ghi_chu TEXT NULL,
	trang_thai varchar(50) DEFAULT 'CHUA_XUAT' NULL,
PRIMARY KEY  
(
	id_don_thuoc 
) 
)
;

CREATE TABLE DonThuocChiTiet(
	id_chi_tiet_don_thuoc varchar(20) NOT NULL,
	id_don_thuoc varchar(20) NOT NULL,
	id_thuoc varchar(20) NOT NULL,
	so_luong int NOT NULL,
	lieu_dung VARCHAR(255) NULL,
PRIMARY KEY  
(
	id_chi_tiet_don_thuoc 
) 
) 
;

CREATE TABLE EmailMarketing(
	id_email SERIAL NOT NULL,
	email VARCHAR(100) NOT NULL,
	ngay_dang_ky TIMESTAMP NOT NULL,
	trang_thai BOOLEAN NOT NULL,
PRIMARY KEY  
(
	id_email 
) ,
UNIQUE 
(
	email 
) 
) 
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
	id 
) 
) 
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
	id_giao_dich 
) 
) 
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
	id_chi_tiet_hoa_don 
) 
) 
;

CREATE TABLE KetQuaXetNghiem_ChiTiet(
	id_ket_qua_chi_tiet SERIAL NOT NULL,
	id_xet_nghiem_benh_an int NULL,
	id_chi_so int NOT NULL,
	gia_tri_ket_qua VARCHAR(255) NOT NULL,
PRIMARY KEY  
(
	id_ket_qua_chi_tiet 
) 
) 
;

CREATE TABLE LichLamViecNhanVien(
	id_lich_lam_viec BIGSERIAL NOT NULL,
	id_nhan_vien varchar(20) NULL,
	ngay_lam date NOT NULL,
	gio_bat_dau TIME NOT NULL,
	gio_ket_thuc TIME NULL,
	ghi_chu VARCHAR(500) NULL,
PRIMARY KEY  
(
	id_lich_lam_viec 
) 
) 
;

CREATE TABLE LichSuTuVan(
	id_tu_van varchar(20) NOT NULL,
	id_khach_hang varchar(20) NULL,
	id_thu_cung varchar(20) NULL,
	noi_dung_khach TEXT NULL,
	noi_dung_rexi TEXT NULL,
	ngay_tu_van TIMESTAMP NULL,
	id_bac_si varchar(20) NULL,
PRIMARY KEY  
(
	id_tu_van 
) 
)
;

CREATE TABLE LoaiXetNghiem(
	id_loai_xet_nghiem SERIAL NOT NULL,
	id_danh_muc int NOT NULL,
	ten_xet_nghiem VARCHAR(255) NOT NULL,
	mo_ta VARCHAR(500) NULL,
	gia_tien decimal(10, 2) NOT NULL,
PRIMARY KEY  
(
	id_loai_xet_nghiem 
) ,
UNIQUE 
(
	ten_xet_nghiem 
) 
) 
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
	id_ncc 
) 
) 
;

CREATE TABLE NhatKyChat(
	id_chat BIGSERIAL NOT NULL,
	id_tai_khoan varchar(20) NULL,
	cau_hoi TEXT NOT NULL,
	cau_tra_loi TEXT NOT NULL,
	thoi_gian TIMESTAMP NOT NULL,
PRIMARY KEY  
(
	id_chat 
) 
)
;

CREATE TABLE NhatKyHeThong(
	id SERIAL NOT NULL,
	nguoi_thao_tac varchar(100) NULL,
	hanh_dong VARCHAR(255) NULL,
	bang_du_lieu varchar(100) NULL,
	chi_tiet TEXT NULL,
	ngay_tao TIMESTAMP NULL,
	ten_dang_nhap VARCHAR(100) NULL,
	ip_address VARCHAR(50) NULL,
	device_info VARCHAR(500) NULL,
PRIMARY KEY  
(
	id 
) 
)
;

CREATE TABLE PhanCongNhanVien(
	id_nhan_vien varchar(20) NOT NULL,
	id_vai_tro varchar(20) NOT NULL,
	ngay_bat_dau_phan_cong date NOT NULL,
	ngay_ket_thuc_phan_cong date NULL,
 CONSTRAINT PK_PhanCongNhanVien PRIMARY KEY  
(
	id_nhan_vien ,
	id_vai_tro ,
	ngay_bat_dau_phan_cong 
) 
) 
;

CREATE TABLE PhanQuyen(
	id_vai_tro varchar(20) NOT NULL,
	id_chuc_nang int NOT NULL,
 CONSTRAINT PK_PhanQuyen PRIMARY KEY  
(
	id_vai_tro ,
	id_chuc_nang 
) 
) 
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
	id_tai_khoan 
) ,
 CONSTRAINT UQ_TaiKhoan_TenDangNhap UNIQUE 
(
	ten_dang_nhap 
) 
) 
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
	id_thanh_toan 
) 
) 
;

CREATE TABLE ThongBao(
	id_thong_bao varchar(20) NOT NULL,
	id_tai_khoan varchar(20) NOT NULL,
	tieu_de VARCHAR(255) NULL,
	noi_dung TEXT NULL,
	loai_thong_bao VARCHAR(50) NULL,
	ngay_tao TIMESTAMP NOT NULL,
	da_doc BOOLEAN NULL,
PRIMARY KEY  
(
	id_thong_bao 
) 
)
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
	id_tiem_chung 
) 
) 
;

CREATE TABLE VaiTroHeThong(
	id_vai_tro varchar(20) NOT NULL,
	ten_vai_tro VARCHAR(50) NOT NULL,
	mo_ta VARCHAR(255) NULL,
 CONSTRAINT PK_VaiTroHeThong PRIMARY KEY  
(
	id_vai_tro 
) 
) 
;
-- INDEXES
CREATE INDEX IX_HoaDon_NgayLap ON HoaDon
(
	ngay_lap_hoa_don ASC
) 
;

CREATE INDEX IX_KhachHang_Email ON KhachHang
(
	email ASC
) 
;

CREATE INDEX IX_KhachHang_SDT ON KhachHang
(
	sdt ASC
) 
;

CREATE INDEX IX_LichHen_KhachHang ON LichHen
(
	id_khach_hang ASC
) 
;

CREATE INDEX IX_LichHen_NgayKham ON LichHen
(
	ngay_kham ASC
) 
;

CREATE INDEX IX_NhanVien_Email ON NhanVien
(
	email ASC
) 
;

CREATE INDEX IX_NhatKy_NguoiThaoTac ON NhatKyHeThong
(
	nguoi_thao_tac ASC
) 
;

CREATE INDEX IX_ThuCung_IdKhachHang ON ThuCung
(
	id_khach_hang ASC
) 
;
ALTER TABLE DangKyNhanTin ALTER COLUMN NgayDangKy SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE DanhGiaDichVu ALTER COLUMN ngay_danh_gia SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE EmailMarketing ALTER COLUMN ngay_dang_ky SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE EmailMarketing ALTER COLUMN trang_thai SET DEFAULT true;
ALTER TABLE HoaDon ALTER COLUMN ngay_lap SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE HoSoBenhAn ALTER COLUMN ngay_tao SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE KhachHang ALTER COLUMN ngay_tao SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE KhachHang ALTER COLUMN ngay_cap_nhat SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE KhachHang ALTER COLUMN da_xoa SET DEFAULT false;
ALTER TABLE LichHen ALTER COLUMN ngay_tao SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE NhanVien ALTER COLUMN da_xoa SET DEFAULT false;
ALTER TABLE NhanVien ALTER COLUMN nhan_email SET DEFAULT true;
ALTER TABLE NhanVien ALTER COLUMN nhan_sms SET DEFAULT true;
ALTER TABLE NhatKyChat ALTER COLUMN thoi_gian SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE NhatKyHeThong ALTER COLUMN ngay_tao SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE TaiKhoan ALTER COLUMN ngay_tao SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE TaiKhoan ALTER COLUMN welcome_email_sent SET DEFAULT false;
ALTER TABLE ThongBao ALTER COLUMN da_doc SET DEFAULT false;
ALTER TABLE ThuCung ALTER COLUMN ngay_tao SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE ThuCung ALTER COLUMN da_xoa SET DEFAULT false;
ALTER TABLE BenhAn_XetNghiem ADD CONSTRAINT FK_BAXN_BacSi FOREIGN KEY(id_bac_si)
REFERENCES NhanVien (id_nhan_vien);
ALTER TABLE BenhAn_XetNghiem ADD CONSTRAINT FK_BAXN_HoSo FOREIGN KEY(id_ho_so)
REFERENCES HoSoBenhAn (id_ho_so_benh_an);
ALTER TABLE BenhAn_XetNghiem ADD CONSTRAINT FK_BenhAnXetNghiem_DichVu FOREIGN KEY(id_loai_xet_nghiem)
REFERENCES DichVu (id_dich_vu);
-- DUP_REMOVED: FK_BenhAnXetNghiem_HoSo trùng với FK_BAXN_HoSo
ALTER TABLE CauHinhHeThong ADD CONSTRAINT FK_CauHinh_NhanVien_LienKet FOREIGN KEY(id_nhan_vien_cap_nhat)
REFERENCES NhanVien (id_nhan_vien);
ALTER TABLE ChiSoXetNghiem ADD CONSTRAINT FK_ChiSo_LoaiXN FOREIGN KEY(id_loai_xet_nghiem)
REFERENCES LoaiXetNghiem (id_loai_xet_nghiem);
-- DUP_REMOVED: FK_ChiSoXetNghiem_LoaiXN trùng với FK_ChiSo_LoaiXN
ALTER TABLE DanhGiaDichVu ADD CONSTRAINT FK_DanhGia_DV_Final FOREIGN KEY(id_dich_vu)
REFERENCES DichVu (id_dich_vu)
ON DELETE CASCADE;
ALTER TABLE DanhGiaDichVu ADD CONSTRAINT FK_DanhGia_KH_Final FOREIGN KEY(id_khach_hang)
REFERENCES KhachHang (id_khach_hang)
ON DELETE CASCADE;
ALTER TABLE DichVuLichHen ADD CONSTRAINT FK_DichVuLichHen_DichVu FOREIGN KEY(id_dich_vu)
REFERENCES DichVu (id_dich_vu);
ALTER TABLE DichVuLichHen ADD CONSTRAINT FK_DichVuLichHen_LichHen FOREIGN KEY(id_lich_hen)
REFERENCES LichHen (id_lich_hen);
ALTER TABLE DonThuoc ADD CONSTRAINT FK_DonThuoc_HoSo FOREIGN KEY(id_ho_so_benh_an)
REFERENCES HoSoBenhAn (id_ho_so_benh_an);
ALTER TABLE DonThuocChiTiet ADD CONSTRAINT FK_DonThuocChiTiet_DonThuoc FOREIGN KEY(id_don_thuoc)
REFERENCES DonThuoc (id_don_thuoc);
ALTER TABLE DonThuocChiTiet ADD CONSTRAINT FK_DonThuocChiTiet_Thuoc FOREIGN KEY(id_thuoc)
REFERENCES Thuoc (id_thuoc);
-- DUP_REMOVED: FK_DonThuocCT_DonThuoc trùng với FK_DonThuocChiTiet_DonThuoc
-- DUP_REMOVED: FK_DonThuocCT_Thuoc trùng với FK_DonThuocChiTiet_Thuoc
ALTER TABLE file_dinh_kem ADD CONSTRAINT FK_FileDinhKem_HoSo FOREIGN KEY(id_ho_so_benh_an)
REFERENCES HoSoBenhAn (id_ho_so_benh_an);
ALTER TABLE GiaoDichKho ADD CONSTRAINT FK_GDKho_Lo FOREIGN KEY(id_lo)
REFERENCES LoThuoc (id_lo);
ALTER TABLE GiaoDichKho ADD CONSTRAINT FK_GDKho_Thuoc FOREIGN KEY(id_thuoc)
REFERENCES Thuoc (id_thuoc);
-- DUP_REMOVED: FK_GiaoDichKho_LoThuoc trùng với FK_GDKho_Lo
ALTER TABLE HoaDon ADD CONSTRAINT FK_HoaDon_KhachHang FOREIGN KEY(id_khach_hang)
REFERENCES KhachHang (id_khach_hang);
ALTER TABLE HoaDon ADD CONSTRAINT FK_HoaDon_LichHen FOREIGN KEY(id_lich_hen)
REFERENCES LichHen (id_lich_hen);
ALTER TABLE HoaDon ADD CONSTRAINT FK_HoaDon_NhanVien FOREIGN KEY(id_nhan_vien)
REFERENCES NhanVien (id_nhan_vien);
ALTER TABLE HoaDonChiTiet ADD CONSTRAINT FK_HoaDonChiTiet_HoaDon FOREIGN KEY(id_hoa_don)
REFERENCES HoaDon (id_hoa_don);
ALTER TABLE HoSoBenhAn ADD CONSTRAINT FK_HoSo_BacSi FOREIGN KEY(id_bac_si)
REFERENCES NhanVien (id_nhan_vien);
ALTER TABLE HoSoBenhAn ADD CONSTRAINT FK_HoSo_LichHen FOREIGN KEY(id_lich_hen)
REFERENCES LichHen (id_lich_hen);
ALTER TABLE HoSoBenhAn ADD CONSTRAINT FK_HoSo_NguoiTao FOREIGN KEY(id_nguoi_tao)
REFERENCES NhanVien (id_nhan_vien);
ALTER TABLE HoSoBenhAn ADD CONSTRAINT FK_HoSo_ThuCung FOREIGN KEY(id_thu_cung)
REFERENCES ThuCung (id_thu_cung);
-- DUP_REMOVED: FK_HoSoBenhAn_ThuCung trùng với FK_HoSo_ThuCung
ALTER TABLE KetQuaXetNghiem_ChiTiet ADD CONSTRAINT FK_KetQuaXetNghiem_BAXN FOREIGN KEY(id_xet_nghiem_benh_an)
REFERENCES BenhAn_XetNghiem (id_xet_nghiem_benh_an);
ALTER TABLE KetQuaXetNghiem_ChiTiet ADD CONSTRAINT FK_KetQuaXetNghiem_ChiSo FOREIGN KEY(id_chi_so)
REFERENCES ChiSoXetNghiem (id_chi_so);
-- DUP_REMOVED: FK_KQChiTiet_BAXN trùng với FK_KetQuaXetNghiem_BAXN
-- DUP_REMOVED: FK_KQChiTiet_ChiSo trùng với FK_KetQuaXetNghiem_ChiSo
-- DUP_REMOVED: FK_KQCT_XetNghiem_Final trùng với FK_KetQuaXetNghiem_BAXN
ALTER TABLE LichHen ADD CONSTRAINT FK_LichHen_BacSi FOREIGN KEY(id_bac_si)
REFERENCES NhanVien (id_nhan_vien);
ALTER TABLE LichHen ADD CONSTRAINT FK_LichHen_KhachHang FOREIGN KEY(id_khach_hang)
REFERENCES KhachHang (id_khach_hang);
ALTER TABLE LichHen ADD CONSTRAINT FK_LichHen_ThuCung FOREIGN KEY(id_thu_cung)
REFERENCES ThuCung (id_thu_cung);
ALTER TABLE LichLamViecNhanVien ADD CONSTRAINT FK_LichLamViec_NhanVien FOREIGN KEY(id_nhan_vien)
REFERENCES NhanVien (id_nhan_vien);
ALTER TABLE LichSuTuVan ADD CONSTRAINT FK_LichSuTuVan_KhachHang FOREIGN KEY(id_khach_hang)
REFERENCES KhachHang (id_khach_hang);
ALTER TABLE LichSuTuVan ADD CONSTRAINT FK_LichSuTuVan_ThuCung FOREIGN KEY(id_thu_cung)
REFERENCES ThuCung (id_thu_cung);
ALTER TABLE LoaiXetNghiem ADD CONSTRAINT FK_LoaiXetNghiem_DanhMuc FOREIGN KEY(id_danh_muc)
REFERENCES DanhMucXetNghiem (id_danh_muc);
ALTER TABLE LoThuoc ADD CONSTRAINT FK_LoThuoc_NCC FOREIGN KEY(id_ncc)
REFERENCES NhaCungCap (id_ncc);
ALTER TABLE LoThuoc ADD CONSTRAINT FK_LoThuoc_Thuoc FOREIGN KEY(id_thuoc)
REFERENCES Thuoc (id_thuoc);
ALTER TABLE NhatKyChat ADD CONSTRAINT FK_Chat_TaiKhoan_Safe FOREIGN KEY(id_tai_khoan)
REFERENCES TaiKhoan (id_tai_khoan)
ON DELETE SET NULL;
ALTER TABLE NhatKyHeThong ADD CONSTRAINT FK_NhatKy_TaiKhoan FOREIGN KEY(ten_dang_nhap)
REFERENCES TaiKhoan (ten_dang_nhap);
ALTER TABLE PhanCongNhanVien ADD CONSTRAINT FK_PhanCong_NhanVien FOREIGN KEY(id_nhan_vien)
REFERENCES NhanVien (id_nhan_vien);
ALTER TABLE PhanCongNhanVien ADD CONSTRAINT FK_PhanCong_VaiTro FOREIGN KEY(id_vai_tro)
REFERENCES VaiTroHeThong (id_vai_tro);
ALTER TABLE PhanQuyen ADD CONSTRAINT FK_PhanQuyen_ChucNang FOREIGN KEY(id_chuc_nang)
REFERENCES ChucNang (id_chuc_nang);
ALTER TABLE PhanQuyen ADD CONSTRAINT FK_PhanQuyen_VaiTro FOREIGN KEY(id_vai_tro)
REFERENCES VaiTroHeThong (id_vai_tro);
ALTER TABLE TaiKhoan ADD CONSTRAINT FK_TaiKhoan_KhachHang FOREIGN KEY(id_khach_hang)
REFERENCES KhachHang (id_khach_hang);
ALTER TABLE TaiKhoan ADD CONSTRAINT FK_TaiKhoan_NhanVien FOREIGN KEY(id_nhan_vien)
REFERENCES NhanVien (id_nhan_vien);
ALTER TABLE TaiKhoan ADD CONSTRAINT FK_TaiKhoan_VaiTro FOREIGN KEY(id_vai_tro)
REFERENCES VaiTroHeThong (id_vai_tro);
ALTER TABLE ThanhToan ADD CONSTRAINT FK_ThanhToan_HoaDon FOREIGN KEY(id_hoa_don)
REFERENCES HoaDon (id_hoa_don);
ALTER TABLE ThanhToan ADD CONSTRAINT FK_ThanhToan_NhanVien FOREIGN KEY(id_nhan_vien)
REFERENCES NhanVien (id_nhan_vien);
ALTER TABLE ThongBao ADD CONSTRAINT FK_ThongBao_TaiKhoan FOREIGN KEY(id_tai_khoan)
REFERENCES TaiKhoan (id_tai_khoan);
ALTER TABLE ThuCung ADD CONSTRAINT FK_ThuCung_KhachHang FOREIGN KEY(id_khach_hang)
REFERENCES KhachHang (id_khach_hang);
ALTER TABLE TiemChung ADD CONSTRAINT FK_TiemChung_BacSi FOREIGN KEY(id_bac_si)
REFERENCES NhanVien (id_nhan_vien);
ALTER TABLE TiemChung ADD CONSTRAINT FK_TiemChung_ThuCung FOREIGN KEY(id_thu_cung)
REFERENCES ThuCung (id_thu_cung);
ALTER TABLE DanhGiaDichVu ADD CONSTRAINT CK_DanhGia_SoSao CHECK (so_sao >= 1 AND so_sao <= 5);
-- ==========================================
-- FUNCTIONS / PROCEDURES
-- ==========================================


-- Apply default values using sequences to avoid NULL constraint errors when inserting without IDs
ALTER TABLE LichHen ALTER COLUMN id_lich_hen SET DEFAULT 'LH-' || nextval('seq_lich_hen')::TEXT;
ALTER TABLE HoSoBenhAn ALTER COLUMN id_ho_so_benh_an SET DEFAULT 'HS-' || nextval('seq_ho_so_benh_an')::TEXT;
ALTER TABLE HoaDon ALTER COLUMN id_hoa_don SET DEFAULT 'HD-' || nextval('seq_hoa_don')::TEXT;
ALTER TABLE DonThuoc ALTER COLUMN id_don_thuoc SET DEFAULT 'DT-' || nextval('seq_don_thuoc')::TEXT;
ALTER TABLE DonThuocChiTiet ALTER COLUMN id_chi_tiet_don_thuoc SET DEFAULT 'DCT-' || nextval('seq_chi_tiet_don_thuoc')::TEXT;
ALTER TABLE ThanhToan ALTER COLUMN id_thanh_toan SET DEFAULT 'TT-' || nextval('seq_thanh_toan')::TEXT;
ALTER TABLE ThongBao ALTER COLUMN id_thong_bao SET DEFAULT 'TB-' || nextval('seq_thong_bao')::TEXT;
ALTER TABLE KhachHang ALTER COLUMN id_khach_hang SET DEFAULT 'KH-' || nextval('seq_khach_hang')::TEXT;
ALTER TABLE ThuCung ALTER COLUMN id_thu_cung SET DEFAULT 'TC-' || nextval('seq_thu_cung')::TEXT;
ALTER TABLE TaiKhoan ALTER COLUMN id_tai_khoan SET DEFAULT 'TK-' || nextval('seq_tai_khoan')::TEXT;
ALTER TABLE NhanVien ALTER COLUMN id_nhan_vien SET DEFAULT 'NV-' || nextval('seq_nhan_vien')::TEXT;
ALTER TABLE DichVu ALTER COLUMN id_dich_vu SET DEFAULT 'DV-' || nextval('seq_dich_vu')::TEXT;
ALTER TABLE GiaoDichKho ALTER COLUMN id_giao_dich SET DEFAULT 'GDK-' || nextval('seq_giao_dich_kho')::TEXT;
ALTER TABLE HoaDonChiTiet ALTER COLUMN id_chi_tiet_hoa_don SET DEFAULT 'HDCT-' || nextval('seq_hoa_don_chi_tiet')::TEXT;


-- ==========================================
-- PostgreSQL Functions
-- ==========================================

CREATE OR REPLACE FUNCTION fn_CalculatePetAge(NgaySinh DATE)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    Today DATE := CURRENT_DATE;
    Age INT;
BEGIN
    IF NgaySinh IS NULL THEN
        RETURN NULL;
    END IF;
    Age := EXTRACT(YEAR FROM AGE(Today, NgaySinh));
    IF Age < 0 THEN
        Age := 0;
    END IF;
    RETURN Age;
END;
$$;

CREATE OR REPLACE FUNCTION fn_GetInvoiceTotal(IdHoaDon VARCHAR(20))
RETURNS DECIMAL(12,2)
LANGUAGE plpgsql
AS $$
DECLARE
    Total DECIMAL(12,2);
BEGIN
    SELECT tong_tien_cuoi INTO Total FROM HoaDon WHERE id_hoa_don = IdHoaDon;
    RETURN COALESCE(Total, 0);
END;
$$;

-- ==========================================
-- PostgreSQL Views
-- ==========================================

CREATE OR REPLACE VIEW v_LichHenHomNay AS
SELECT 
    lh.id_lich_hen,
    lh.gio_kham,
    tc.ten_thu_cung,
    kh.ten_khach_hang,
    nv.ho_ten AS ten_bac_si,
    lh.trang_thai,
    lh.phong_kham
FROM LichHen lh
JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung
JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang
LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien
WHERE lh.ngay_kham = CURRENT_DATE
  AND lh.trang_thai <> 'da_huy';

CREATE OR REPLACE VIEW v_HoSoBenhAn_GanDay AS
SELECT 
    h.id_ho_so_benh_an,
    h.ngay_kham,
    nv.ho_ten AS ten_bac_si,
    kh.ten_khach_hang,
    tc.ten_thu_cung,
    h.chan_doan,
    h.trang_thai_ho_so
FROM HoSoBenhAn h
LEFT JOIN NhanVien nv ON h.id_bac_si = nv.id_nhan_vien
LEFT JOIN LichHen lh ON h.id_lich_hen = lh.id_lich_hen
LEFT JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang
LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung
WHERE h.ngay_kham >= CURRENT_DATE - INTERVAL '30 days';

CREATE OR REPLACE VIEW v_DoanhThu_TheoThang AS
SELECT 
    EXTRACT(YEAR FROM ngay_lap)::INT AS Nam,
    EXTRACT(MONTH FROM ngay_lap)::INT AS Thang,
    COUNT(id_hoa_don) AS SoHoaDon,
    SUM(tong_tien_cuoi) AS TongDoanhThu
FROM HoaDon
WHERE UPPER(TRIM(trang_thai)) = 'DA_THANH_TOAN'
GROUP BY EXTRACT(YEAR FROM ngay_lap), EXTRACT(MONTH FROM ngay_lap);

CREATE OR REPLACE VIEW v_ThongKe_BacSi AS
SELECT 
    nv.ho_ten AS TenBacSi,
    COUNT(lh.id_lich_hen) AS SoLichHen,
    COUNT(DISTINCT lh.id_thu_cung) AS SoHoSo,
    COALESCE(SUM(CASE WHEN UPPER(TRIM(hd.trang_thai)) = 'DA_THANH_TOAN' THEN hd.tong_tien_cuoi ELSE 0 END), 0) AS TongDoanhThu
FROM NhanVien nv
LEFT JOIN LichHen lh ON nv.id_nhan_vien = lh.id_bac_si
LEFT JOIN HoaDon hd ON lh.id_lich_hen = hd.id_lich_hen
WHERE nv.chuyen_mon ILIKE '%Bác sĩ%' OR nv.id_nhan_vien ILIKE 'BS-%'
GROUP BY nv.ho_ten;

CREATE OR REPLACE VIEW v_DoanhThuThang AS
SELECT 
    EXTRACT(MONTH FROM ngay_lap)::INT AS Thang, 
    EXTRACT(YEAR FROM ngay_lap)::INT AS Nam, 
    SUM(tong_tien_cuoi) AS TongDoanhThu
FROM HoaDon
WHERE UPPER(TRIM(trang_thai)) = 'DA_THANH_TOAN'
GROUP BY EXTRACT(MONTH FROM ngay_lap), EXTRACT(YEAR FROM ngay_lap);

CREATE OR REPLACE VIEW v_ThuocSapHetHan AS
SELECT 
    t.ten_thuoc, 
    lt.so_lo, 
    lt.so_luong_ton,
    lt.han_su_dung AS han_dung,
    (lt.han_su_dung - CURRENT_DATE) AS so_ngay_con_lai
FROM LoThuoc lt
JOIN Thuoc t ON lt.id_thuoc = t.id_thuoc
WHERE lt.han_su_dung <= CURRENT_DATE + INTERVAL '60 days' AND lt.so_luong_ton > 0;

-- ==========================================
-- PostgreSQL Functions (acting as Procedures)
-- ==========================================

CREATE OR REPLACE FUNCTION sp_AddAppointment(
    NgayHen DATE,
    GioHen TIME,
    LyDo VARCHAR(500),
    IdKhachHang VARCHAR(20),
    IdThuCung VARCHAR(20),
    IdBacSi VARCHAR(20),
    IdNguoiDat VARCHAR(20) DEFAULT NULL,
    PhongKham VARCHAR(100) DEFAULT NULL,
    GhiChu VARCHAR(500) DEFAULT NULL
)
RETURNS TABLE (id_lich_hen_moi VARCHAR(20))
LANGUAGE plpgsql
AS $$
DECLARE
    new_id VARCHAR(20);
BEGIN
    INSERT INTO LichHen 
        (ngay_kham, gio_kham, ly_do, trang_thai, id_khach_hang, id_thu_cung, 
         id_bac_si, id_nguoi_dat, phong_kham, ghi_chu_noi_bo, ngay_tao)
    VALUES 
        (NgayHen, GioHen, LyDo, 'da_dat', IdKhachHang, IdThuCung, 
         IdBacSi, IdNguoiDat, PhongKham, GhiChu, CURRENT_TIMESTAMP)
    RETURNING id_lich_hen INTO new_id;

    RETURN QUERY SELECT new_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_AddMedicalRecord(
    IdLichHen VARCHAR(20),
    NgayKham DATE,
    IdBacSi VARCHAR(20),
    CanNang DECIMAL(8,2),
    NhietDo DECIMAL(5,2),
    TrieuChung VARCHAR(500),
    ChanDoan VARCHAR(500),
    PhacDoDieuTri VARCHAR(500) DEFAULT NULL,
    HuongDanChamSoc VARCHAR(500) DEFAULT NULL,
    IdNguoiTao VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (id_ho_so_moi VARCHAR(20))
LANGUAGE plpgsql
AS $$
DECLARE
    new_id VARCHAR(20);
BEGIN
    IF NOT EXISTS (SELECT 1 FROM LichHen WHERE id_lich_hen = IdLichHen) THEN
        RAISE EXCEPTION 'Không tìm thấy lịch hẹn với id = %', IdLichHen;
    END IF;

    INSERT INTO HoSoBenhAn (
        id_lich_hen, ngay_kham, id_bac_si, can_nang, nhiet_do, 
        trieu_chung, chan_doan, phac_do_dieu_tri, huong_dan_cham_soc, 
        trang_thai_ho_so, id_nguoi_tao, ngay_tao
    )
    VALUES (
        IdLichHen, NgayKham, IdBacSi, CanNang, NhietDo, 
        TrieuChung, ChanDoan, PhacDoDieuTri, HuongDanChamSoc, 
        'nhap', IdNguoiTao, CURRENT_TIMESTAMP
    )
    RETURNING id_ho_so_benh_an INTO new_id;

    UPDATE LichHen 
    SET trang_thai = 'da_kham' 
    WHERE id_lich_hen = IdLichHen;

    RETURN QUERY SELECT new_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_CapNhatThongTinKhachHang(
    IdKhachHang VARCHAR(50), 
    TenKhachHang VARCHAR(100), 
    Email VARCHAR(100) DEFAULT NULL, 
    SDT VARCHAR(15) DEFAULT NULL, 
    DiaChi VARCHAR(255) DEFAULT NULL,
    NamSinh INT DEFAULT NULL
)
RETURNS TABLE (ThongBao TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE KhachHang 
    SET 
        ten_khach_hang = TenKhachHang, 
        email = Email, 
        sdt = SDT, 
        dia_chi = DiaChi, 
        nam_sinh = NamSinh,
        ngay_cap_nhat = CURRENT_TIMESTAMP 
    WHERE id_khach_hang = IdKhachHang; 
    
    RETURN QUERY SELECT 'Cập nhật thông tin thành công'::TEXT; 
END;
$$;

CREATE OR REPLACE FUNCTION sp_CapNhatTonKho(
    IdLo VARCHAR(20),
    SoLuongThayDoi INT,
    LoaiGiaoDich VARCHAR(50),
    IdNhanVien VARCHAR(20),
    GhiChu VARCHAR(500) DEFAULT NULL
)
RETURNS TABLE (ThongBao TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_thuoc VARCHAR(20);
BEGIN
    UPDATE LoThuoc
    SET so_luong_ton = so_luong_ton + SoLuongThayDoi,
        ngay_cap_nhat_ton_kho = CURRENT_TIMESTAMP
    WHERE id_lo = IdLo;

    SELECT id_thuoc INTO v_id_thuoc FROM LoThuoc WHERE id_lo = IdLo;

    INSERT INTO GiaoDichKho 
        (id_thuoc, id_lo, loai_giao_dich, so_luong, ngay_giao_dich, id_nhan_vien, ghi_chu)
    VALUES 
        (v_id_thuoc, IdLo, LoaiGiaoDich, SoLuongThayDoi, CURRENT_TIMESTAMP, IdNhanVien, GhiChu);

    RETURN QUERY SELECT 'Cập nhật tồn kho thành công'::TEXT;
END;
$$;

CREATE OR REPLACE FUNCTION sp_DangKyKhachHang(
    TenDangNhap VARCHAR(50),
    MatKhau VARCHAR(255),
    TenKhachHang VARCHAR(100),
    Email VARCHAR(100) DEFAULT NULL,
    SDT VARCHAR(15) DEFAULT NULL,
    DiaChi VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE (ThongBao TEXT, IdKhachHang VARCHAR(20))
LANGUAGE plpgsql
AS $$
DECLARE
    new_kh_id VARCHAR(20);
    role_id VARCHAR(20);
BEGIN
    -- Create customer
    INSERT INTO KhachHang (ten_khach_hang, email, sdt, dia_chi, ngay_tao, ngay_cap_nhat, da_xoa)
    VALUES (TenKhachHang, Email, SDT, DiaChi, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false)
    RETURNING id_khach_hang INTO new_kh_id;

    -- Get customer role ID
    SELECT id_vai_tro INTO role_id FROM VaiTroHeThong WHERE ten_vai_tro = 'khách hàng' LIMIT 1;
    IF role_id IS NULL THEN
        role_id := 'VT-5';
    END IF;

    -- Create account
    INSERT INTO TaiKhoan (ten_dang_nhap, mat_khau, id_vai_tro, trang_thai, ngay_tao, id_khach_hang)
    VALUES (TenDangNhap, MatKhau, role_id, 'active', CURRENT_TIMESTAMP, new_kh_id);

    RETURN QUERY SELECT 'Đăng ký thành công'::TEXT, new_kh_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_DangNhap(
    TenDangNhapParam VARCHAR(255)
)
RETURNS TABLE (
    id_tai_khoan VARCHAR(20), 
    ten_dang_nhap VARCHAR(100), 
    mat_khau VARCHAR(255), 
    mat_khau_hash VARCHAR(255),
    ten_vai_tro VARCHAR(100), 
    trang_thai VARCHAR(50), 
    ten_khach_hang VARCHAR(100), 
    ho_ten VARCHAR(100),
    id_khach_hang VARCHAR(20), 
    id_nhan_vien VARCHAR(20),
    email VARCHAR(100)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id_tai_khoan, 
        t.ten_dang_nhap, 
        t.mat_khau, 
        t.mat_khau_hash,
        v.ten_vai_tro, 
        t.trang_thai, 
        k.ten_khach_hang, 
        n.ho_ten,
        COALESCE(k.id_khach_hang, ''), 
        COALESCE(n.id_nhan_vien, ''),
        COALESCE(k.email, n.email)
    FROM TaiKhoan t
    LEFT JOIN VaiTroHeThong v ON t.id_vai_tro = v.id_vai_tro
    LEFT JOIN KhachHang k ON t.id_khach_hang = k.id_khach_hang
    LEFT JOIN NhanVien n ON t.id_nhan_vien = n.id_nhan_vien
    WHERE (t.ten_dang_nhap = TenDangNhapParam OR k.email = TenDangNhapParam OR n.email = TenDangNhapParam)
      AND t.trang_thai = 'active';
END;
$$;

CREATE OR REPLACE PROCEDURE sp_DonDepNhatKy()
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM NhatKyHeThong
    WHERE ngay_tao < CURRENT_DATE - INTERVAL '60 days';
END;
$$;

CREATE OR REPLACE FUNCTION sp_HuyLichHen(
    IdLichHen VARCHAR(20),
    LyDoHuy VARCHAR(500) DEFAULT NULL
)
RETURNS TABLE (ThongBao TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE LichHen
    SET trang_thai = 'da_huy',
        ghi_chu_noi_bo = COALESCE(ghi_chu_noi_bo, '') || ' - Hủy: ' || COALESCE(LyDoHuy, '')
    WHERE id_lich_hen = IdLichHen;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Không tìm thấy lịch hẹn để hủy!';
    END IF;

    RETURN QUERY SELECT 'Hủy lịch hẹn thành công'::TEXT;
END;
$$;

CREATE OR REPLACE FUNCTION sp_LapHoaDon(
    IdLichHen VARCHAR(20),
    ThueSuat DECIMAL(5,2) DEFAULT 0,
    TongTienGiamGia DECIMAL(12,2) DEFAULT 0,
    IdNhanVienLap VARCHAR(20) DEFAULT NULL,
    GhiChu VARCHAR(500) DEFAULT NULL
)
RETURNS TABLE (id_hoa_don_moi VARCHAR(20))
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_khach_hang VARCHAR(20);
    v_tong_truoc_giam DECIMAL(18,2) := 0;
    v_tien_dich_vu DECIMAL(18,2) := 0;
    v_tien_thuoc DECIMAL(18,2) := 0;
    v_tong_sau_giam DECIMAL(18,2);
    v_thue_phai DECIMAL(18,2);
    v_tong_cuoi DECIMAL(18,2);
    new_hd_id VARCHAR(20);
BEGIN
    SELECT id_khach_hang INTO v_id_khach_hang FROM LichHen WHERE id_lich_hen = IdLichHen;
    IF v_id_khach_hang IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy lịch hẹn!';
    END IF;

    -- Tính tiền dịch vụ
    SELECT COALESCE(dv.gia, 0) INTO v_tien_dich_vu 
    FROM LichHen lh 
    JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu 
    WHERE lh.id_lich_hen = IdLichHen;

    -- Tính tiền thuốc
    SELECT COALESCE(SUM(dtc.so_luong * t.gia_ban), 0) INTO v_tien_thuoc
    FROM HoSoBenhAn hs
    JOIN DonThuoc dt ON hs.id_ho_so_benh_an = dt.id_ho_so_benh_an
    JOIN DonThuocChiTiet dtc ON dt.id_don_thuoc = dtc.id_don_thuoc
    JOIN Thuoc t ON dtc.id_thuoc = t.id_thuoc
    WHERE hs.id_lich_hen = IdLichHen;

    v_tong_truoc_giam := v_tien_dich_vu + v_tien_thuoc;
    v_tong_sau_giam := v_tong_truoc_giam - COALESCE(TongTienGiamGia, 0);
    v_thue_phai := v_tong_sau_giam * COALESCE(ThueSuat, 0) / 100;
    v_tong_cuoi := v_tong_sau_giam + v_thue_phai;

    INSERT INTO HoaDon (
        id_lich_hen, id_khach_hang, id_nhan_vien, ngay_lap_hoa_don, 
        tong_tien_ban_dau, tong_giam_gia, tong_tien_cuoi, trang_thai, ghi_chu, ngay_lap
    )
    VALUES (
        IdLichHen, v_id_khach_hang, IdNhanVienLap, CURRENT_TIMESTAMP, 
        v_tong_truoc_giam, TongTienGiamGia, v_tong_cuoi, 'cho_thanh_toan', GhiChu, CURRENT_TIMESTAMP
    )
    RETURNING id_hoa_don INTO new_hd_id;
    
    RETURN QUERY SELECT new_hd_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_LichHenCuaKhachHang(
    IdKhachHangParam VARCHAR(20)
)
RETURNS TABLE (
    id_lich_hen VARCHAR(20),
    ngay_kham DATE,
    gio_kham TIME,
    trang_thai VARCHAR(50),
    ten_thu_cung VARCHAR(100),
    ten_bac_si VARCHAR(100),
    ly_do VARCHAR(255)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lh.id_lich_hen,
        lh.ngay_kham,
        lh.gio_kham,
        lh.trang_thai,
        tc.ten_thu_cung,
        nv.ho_ten AS ten_bac_si,
        lh.ly_do
    FROM LichHen lh
    JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung
    JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien
    WHERE lh.id_khach_hang = IdKhachHangParam
    ORDER BY lh.ngay_kham DESC, lh.gio_kham DESC;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_TaoThongBaoTiemChung()
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO ThongBao (id_tai_khoan, tieu_de, noi_dung, loai_thong_bao, da_doc, ngay_tao)
    SELECT 
        tk.id_tai_khoan,
        'Nhắc nhở tiêm chủng',
        'Thú cưng ' || tc.ten_thu_cung || ' sắp đến lịch tiêm nhắc lại vaccine ' || t.ten_vaccine || ' vào ngày ' || to_char(t.ngay_tiem_lai, 'DD/MM/YYYY'),
        'he_thong',
        false,
        CURRENT_TIMESTAMP
    FROM TiemChung t
    JOIN ThuCung tc ON t.id_thu_cung = tc.id_thu_cung
    JOIN TaiKhoan tk ON tc.id_khach_hang = tk.id_khach_hang
    WHERE t.ngay_tiem_lai = CURRENT_DATE + INTERVAL '3 days';
END;
$$;
