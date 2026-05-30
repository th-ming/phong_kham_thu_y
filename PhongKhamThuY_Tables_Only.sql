/****** Object:  Table NhanVien    Script Date: 27/05/2026 07:14:55 ******/






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
(
	id_nhan_vien 
) 
);
/****** Object:  Table KhachHang    Script Date: 27/05/2026 07:14:55 ******/






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
);
/****** Object:  Table ThuCung    Script Date: 27/05/2026 07:14:55 ******/






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
);
/****** Object:  Table LichHen    Script Date: 27/05/2026 07:14:55 ******/






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
	id_lich_hen 
) 
);
/****** Object:  View v_LichHenHomNay    Script Date: 27/05/2026 07:14:55 ******/






/****** Object:  Table HoSoBenhAn    Script Date: 27/05/2026 07:14:55 ******/






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
);
/****** Object:  View v_HoSoBenhAn_GanDay    Script Date: 27/05/2026 07:14:55 ******/






/****** Object:  Table HoaDon    Script Date: 27/05/2026 07:14:55 ******/






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
 CONSTRAINT PK_HoaD PRIMARY KEY  
(
	id_hoa_don 
) 
);
/****** Object:  View v_DoanhThu_TheoThang    Script Date: 27/05/2026 07:14:55 ******/






/****** Object:  View v_ThongKe_BacSi    Script Date: 27/05/2026 07:14:55 ******/






/****** Object:  View v_DoanhThuThang    Script Date: 27/05/2026 07:14:55 ******/






/****** Object:  Table Thuoc    Script Date: 27/05/2026 07:14:55 ******/






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
);
/****** Object:  Table LoThuoc    Script Date: 27/05/2026 07:14:55 ******/






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
);
/****** Object:  View v_ThuocSapHetHan    Script Date: 27/05/2026 07:14:55 ******/






/****** Object:  Table BenhAn_XetNghiem    Script Date: 27/05/2026 07:14:55 ******/






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
);
/****** Object:  Table CauHinhHeThong    Script Date: 27/05/2026 07:14:55 ******/






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
);
/****** Object:  Table ChiSoXetNghiem    Script Date: 27/05/2026 07:14:55 ******/






CREATE TABLE ChiSoXetNghiem(
	id_chi_so SERIAL NOT NULL,
	id_loai_xet_nghiem int NOT NULL,
	ten_thong_so VARCHAR(100) NOT NULL,
	don_vi VARCHAR(50) NULL,
PRIMARY KEY  
(
	id_chi_so 
) 
);
/****** Object:  Table ChucNang    Script Date: 27/05/2026 07:14:55 ******/






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
);
/****** Object:  Table DangKyNhanTin    Script Date: 27/05/2026 07:14:55 ******/






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
);
/****** Object:  Table DanhGiaDichVu    Script Date: 27/05/2026 07:14:55 ******/






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
);
/****** Object:  Table DanhMucXetNghiem    Script Date: 27/05/2026 07:14:55 ******/






CREATE TABLE DanhMucXetNghiem(
	id_danh_muc SERIAL NOT NULL,
	ten_danh_muc VARCHAR(100) NOT NULL,
	mo_ta VARCHAR(255) NULL,
PRIMARY KEY  
(
	id_danh_muc 
) 
);
/****** Object:  Table DichVu    Script Date: 27/05/2026 07:14:55 ******/






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
);
/****** Object:  Table DichVuLichHen    Script Date: 27/05/2026 07:14:55 ******/






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
);
/****** Object:  Table DonThuoc    Script Date: 27/05/2026 07:14:55 ******/






CREATE TABLE DonThuoc(
	id_don_thuoc varchar(20) NOT NULL,
	id_ho_so_benh_an varchar(20) NOT NULL,
	id_bac_si varchar(20) NOT NULL,
	ngay_ke_don TIMESTAMP NULL,
	ghi_chu TEXT NULL,
PRIMARY KEY  
(
	id_don_thuoc 
) 
);
/****** Object:  Table DonThuocChiTiet    Script Date: 27/05/2026 07:14:55 ******/






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
);
/****** Object:  Table EmailMarketing    Script Date: 27/05/2026 07:14:55 ******/






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
);
/****** Object:  Table file_dinh_kem    Script Date: 27/05/2026 07:14:55 ******/






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
);
/****** Object:  Table GiaoDichKho    Script Date: 27/05/2026 07:14:55 ******/






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
);
/****** Object:  Table HoaDonChiTiet    Script Date: 27/05/2026 07:14:55 ******/






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
);
/****** Object:  Table KetQuaXetNghiem_ChiTiet    Script Date: 27/05/2026 07:14:55 ******/






CREATE TABLE KetQuaXetNghiem_ChiTiet(
	id_ket_qua_chi_tiet SERIAL NOT NULL,
	id_xet_nghiem_benh_an int NULL,
	id_chi_so int NOT NULL,
	gia_tri_ket_qua VARCHAR(255) NOT NULL,
PRIMARY KEY  
(
	id_ket_qua_chi_tiet 
) 
);
/****** Object:  Table LichLamViecNhanVien    Script Date: 27/05/2026 07:14:56 ******/






CREATE TABLE LichLamViecNhanVien(
	id_lich_lam_viec BIGSERIAL NOT NULL,
	id_nhan_vien varchar(20) NULL,
	ngay_lam date NOT NULL,
	gio_bat_dau time(7) NOT NULL,
	gio_ket_thuc time(7) NULL,
	ghi_chu VARCHAR(500) NULL,
PRIMARY KEY  
(
	id_lich_lam_viec 
) 
);
/****** Object:  Table LichSuTuVan    Script Date: 27/05/2026 07:14:56 ******/






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
);
/****** Object:  Table LoaiXetNghiem    Script Date: 27/05/2026 07:14:56 ******/






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
);
/****** Object:  Table NhaCungCap    Script Date: 27/05/2026 07:14:56 ******/






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
);
/****** Object:  Table NhatKyChat    Script Date: 27/05/2026 07:14:56 ******/






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
);
/****** Object:  Table NhatKyHeThong    Script Date: 27/05/2026 07:14:56 ******/






CREATE TABLE NhatKyHeThong(
	id SERIAL NOT NULL,
	nguoi_thao_tac varchar(20) NULL,
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
);
/****** Object:  Table PhanCongNhanVien    Script Date: 27/05/2026 07:14:56 ******/






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
);
/****** Object:  Table PhanQuyen    Script Date: 27/05/2026 07:14:56 ******/






CREATE TABLE PhanQuyen(
	id_vai_tro varchar(20) NOT NULL,
	id_chuc_nang int NOT NULL,
 CONSTRAINT PK_PhanQuyen PRIMARY KEY  
(
	id_vai_tro ,
	id_chuc_nang 
) 
);
/****** Object:  Table TaiKhoan    Script Date: 27/05/2026 07:14:56 ******/






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
);
/****** Object:  Table ThanhToan    Script Date: 27/05/2026 07:14:56 ******/






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
);
/****** Object:  Table ThongBao    Script Date: 27/05/2026 07:14:56 ******/






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
);
/****** Object:  Table TiemChung    Script Date: 27/05/2026 07:14:56 ******/






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
);
/****** Object:  Table VaiTroHeThong    Script Date: 27/05/2026 07:14:56 ******/






CREATE TABLE VaiTroHeThong(
	id_vai_tro varchar(20) NOT NULL,
	ten_vai_tro VARCHAR(50) NOT NULL,
	mo_ta VARCHAR(255) NULL,
 CONSTRAINT PK_VaiTroHeThong PRIMARY KEY  
(
	id_vai_tro 
) 
);
/****** Object:  Index IX_HoaDon_NgayLap    Script Date: 27/05/2026 07:14:56 ******/
CREATE INDEX IX_HoaDon_NgayLap ON HoaDon
(
	ngay_lap_hoa_don 
);
/****** Object:  Index IX_KhachHang_Email    Script Date: 27/05/2026 07:14:56 ******/
CREATE INDEX IX_KhachHang_Email ON KhachHang
(
	email 
);
/****** Object:  Index IX_KhachHang_SDT    Script Date: 27/05/2026 07:14:56 ******/
CREATE INDEX IX_KhachHang_SDT ON KhachHang
(
	sdt 
);
/****** Object:  Index IX_LichHen_KhachHang    Script Date: 27/05/2026 07:14:56 ******/
CREATE INDEX IX_LichHen_KhachHang ON LichHen
(
	id_khach_hang 
);
/****** Object:  Index IX_LichHen_NgayKham    Script Date: 27/05/2026 07:14:56 ******/
CREATE INDEX IX_LichHen_NgayKham ON LichHen
(
	ngay_kham 
);
/****** Object:  Index IX_NhanVien_Email    Script Date: 27/05/2026 07:14:56 ******/
CREATE INDEX IX_NhanVien_Email ON NhanVien
(
	email 
);
/****** Object:  Index IX_NhatKy_NguoiThaoTac    Script Date: 27/05/2026 07:14:56 ******/
CREATE INDEX IX_NhatKy_NguoiThaoTac ON NhatKyHeThong
(
	nguoi_thao_tac 
);
/****** Object:  Index IX_ThuCung_IdKhachHang    Script Date: 27/05/2026 07:14:56 ******/
CREATE INDEX IX_ThuCung_IdKhachHang ON ThuCung
(
	id_khach_hang 
); 


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


ALTER TABLE BenhAn_XetNghiem  ADD  CONSTRAINT FK_BAXN_BacSi FOREIGN KEY(id_bac_si)
REFERENCES NhanVien (id_nhan_vien);


ALTER TABLE BenhAn_XetNghiem  ADD  CONSTRAINT FK_BAXN_HoSo FOREIGN KEY(id_ho_so)
REFERENCES HoSoBenhAn (id_ho_so_benh_an);


ALTER TABLE BenhAn_XetNghiem  ADD  CONSTRAINT FK_BenhAnXetNghiem_DichVu FOREIGN KEY(id_loai_xet_nghiem)
REFERENCES DichVu (id_dich_vu);


ALTER TABLE BenhAn_XetNghiem  ADD  CONSTRAINT FK_BenhAnXetNghiem_HoSo FOREIGN KEY(id_ho_so)
REFERENCES HoSoBenhAn (id_ho_so_benh_an);


ALTER TABLE CauHinhHeThong  ADD  CONSTRAINT FK_CauHinh_NhanVien_LienKet FOREIGN KEY(id_nhan_vien_cap_nhat)
REFERENCES NhanVien (id_nhan_vien);


ALTER TABLE ChiSoXetNghiem  ADD  CONSTRAINT FK_ChiSo_LoaiXN FOREIGN KEY(id_loai_xet_nghiem)
REFERENCES LoaiXetNghiem (id_loai_xet_nghiem);


ALTER TABLE ChiSoXetNghiem  ADD  CONSTRAINT FK_ChiSoXetNghiem_LoaiXN FOREIGN KEY(id_loai_xet_nghiem)
REFERENCES LoaiXetNghiem (id_loai_xet_nghiem);


ALTER TABLE DanhGiaDichVu  ADD  CONSTRAINT FK_DanhGia_DV_Final FOREIGN KEY(id_dich_vu)
REFERENCES DichVu (id_dich_vu)
ON DELETE CASCADE;


ALTER TABLE DanhGiaDichVu  ADD  CONSTRAINT FK_DanhGia_KH_Final FOREIGN KEY(id_khach_hang)
REFERENCES KhachHang (id_khach_hang)
ON DELETE CASCADE;


ALTER TABLE DichVuLichHen  ADD  CONSTRAINT FK_DichVuLichHen_DichVu FOREIGN KEY(id_dich_vu)
REFERENCES DichVu (id_dich_vu);


ALTER TABLE DichVuLichHen  ADD  CONSTRAINT FK_DichVuLichHen_LichHen FOREIGN KEY(id_lich_hen)
REFERENCES LichHen (id_lich_hen);


ALTER TABLE DonThuoc  ADD  CONSTRAINT FK_DonThuoc_HoSo FOREIGN KEY(id_ho_so_benh_an)
REFERENCES HoSoBenhAn (id_ho_so_benh_an);


ALTER TABLE DonThuocChiTiet  ADD  CONSTRAINT FK_DonThuocChiTiet_DonThuoc FOREIGN KEY(id_don_thuoc)
REFERENCES DonThuoc (id_don_thuoc);


ALTER TABLE DonThuocChiTiet  ADD  CONSTRAINT FK_DonThuocChiTiet_Thuoc FOREIGN KEY(id_thuoc)
REFERENCES Thuoc (id_thuoc);


ALTER TABLE DonThuocChiTiet  ADD  CONSTRAINT FK_DonThuocCT_DonThuoc FOREIGN KEY(id_don_thuoc)
REFERENCES DonThuoc (id_don_thuoc);


ALTER TABLE DonThuocChiTiet  ADD  CONSTRAINT FK_DonThuocCT_Thuoc FOREIGN KEY(id_thuoc)
REFERENCES Thuoc (id_thuoc);


ALTER TABLE file_dinh_kem  ADD  CONSTRAINT FK_FileDinhKem_HoSo FOREIGN KEY(id_ho_so_benh_an)
REFERENCES HoSoBenhAn (id_ho_so_benh_an);


ALTER TABLE GiaoDichKho  ADD  CONSTRAINT FK_GDKho_Lo FOREIGN KEY(id_lo)
REFERENCES LoThuoc (id_lo);


ALTER TABLE GiaoDichKho  ADD  CONSTRAINT FK_GDKho_Thuoc FOREIGN KEY(id_thuoc)
REFERENCES Thuoc (id_thuoc);


ALTER TABLE GiaoDichKho  ADD  CONSTRAINT FK_GiaoDichKho_LoThuoc FOREIGN KEY(id_lo)
REFERENCES LoThuoc (id_lo);


ALTER TABLE HoaDon  ADD  CONSTRAINT FK_HoaDon_KhachHang FOREIGN KEY(id_khach_hang)
REFERENCES KhachHang (id_khach_hang);


ALTER TABLE HoaDon  ADD  CONSTRAINT FK_HoaDon_LichHen FOREIGN KEY(id_lich_hen)
REFERENCES LichHen (id_lich_hen);


ALTER TABLE HoaDon  ADD  CONSTRAINT FK_HoaDon_NhanVien FOREIGN KEY(id_nhan_vien)
REFERENCES NhanVien (id_nhan_vien);


ALTER TABLE HoaDonChiTiet  ADD  CONSTRAINT FK_HoaDonChiTiet_HoaDon FOREIGN KEY(id_hoa_don)
REFERENCES HoaDon (id_hoa_don);


ALTER TABLE HoSoBenhAn  ADD  CONSTRAINT FK_HoSo_BacSi FOREIGN KEY(id_bac_si)
REFERENCES NhanVien (id_nhan_vien);


ALTER TABLE HoSoBenhAn  ADD  CONSTRAINT FK_HoSo_LichHen FOREIGN KEY(id_lich_hen)
REFERENCES LichHen (id_lich_hen);


ALTER TABLE HoSoBenhAn  ADD  CONSTRAINT FK_HoSo_NguoiTao FOREIGN KEY(id_nguoi_tao)
REFERENCES NhanVien (id_nhan_vien);


ALTER TABLE HoSoBenhAn  ADD  CONSTRAINT FK_HoSo_ThuCung FOREIGN KEY(id_thu_cung)
REFERENCES ThuCung (id_thu_cung);


ALTER TABLE HoSoBenhAn  ADD  CONSTRAINT FK_HoSoBenhAn_ThuCung FOREIGN KEY(id_thu_cung)
REFERENCES ThuCung (id_thu_cung);


ALTER TABLE KetQuaXetNghiem_ChiTiet  ADD  CONSTRAINT FK_KetQuaXetNghiem_BAXN FOREIGN KEY(id_xet_nghiem_benh_an)
REFERENCES BenhAn_XetNghiem (id_xet_nghiem_benh_an);


ALTER TABLE KetQuaXetNghiem_ChiTiet  ADD  CONSTRAINT FK_KetQuaXetNghiem_ChiSo FOREIGN KEY(id_chi_so)
REFERENCES ChiSoXetNghiem (id_chi_so);


ALTER TABLE KetQuaXetNghiem_ChiTiet  ADD  CONSTRAINT FK_KQChiTiet_BAXN FOREIGN KEY(id_xet_nghiem_benh_an)
REFERENCES BenhAn_XetNghiem (id_xet_nghiem_benh_an);


ALTER TABLE KetQuaXetNghiem_ChiTiet  ADD  CONSTRAINT FK_KQChiTiet_ChiSo FOREIGN KEY(id_chi_so)
REFERENCES ChiSoXetNghiem (id_chi_so);


ALTER TABLE KetQuaXetNghiem_ChiTiet  ADD  CONSTRAINT FK_KQCT_XetNghiem_Final FOREIGN KEY(id_xet_nghiem_benh_an)
REFERENCES BenhAn_XetNghiem (id_xet_nghiem_benh_an);


ALTER TABLE LichHen  ADD  CONSTRAINT FK_LichHen_BacSi FOREIGN KEY(id_bac_si)
REFERENCES NhanVien (id_nhan_vien);


ALTER TABLE LichHen  ADD  CONSTRAINT FK_LichHen_KhachHang FOREIGN KEY(id_khach_hang)
REFERENCES KhachHang (id_khach_hang);


ALTER TABLE LichHen  ADD  CONSTRAINT FK_LichHen_ThuCung FOREIGN KEY(id_thu_cung)
REFERENCES ThuCung (id_thu_cung);


ALTER TABLE LichLamViecNhanVien  ADD  CONSTRAINT FK_LichLamViec_NhanVien FOREIGN KEY(id_nhan_vien)
REFERENCES NhanVien (id_nhan_vien);


ALTER TABLE LichSuTuVan  ADD  CONSTRAINT FK_LichSuTuVan_KhachHang FOREIGN KEY(id_khach_hang)
REFERENCES KhachHang (id_khach_hang);


ALTER TABLE LichSuTuVan  ADD  CONSTRAINT FK_LichSuTuVan_ThuCung FOREIGN KEY(id_thu_cung)
REFERENCES ThuCung (id_thu_cung);


ALTER TABLE LoaiXetNghiem  ADD  CONSTRAINT FK_LoaiXetNghiem_DanhMuc FOREIGN KEY(id_danh_muc)
REFERENCES DanhMucXetNghiem (id_danh_muc);


ALTER TABLE LoThuoc  ADD  CONSTRAINT FK_LoThuoc_NCC FOREIGN KEY(id_ncc)
REFERENCES NhaCungCap (id_ncc);


ALTER TABLE LoThuoc  ADD  CONSTRAINT FK_LoThuoc_Thuoc FOREIGN KEY(id_thuoc)
REFERENCES Thuoc (id_thuoc);


ALTER TABLE NhatKyChat  ADD  CONSTRAINT FK_Chat_TaiKhoan_Safe FOREIGN KEY(id_tai_khoan)
REFERENCES TaiKhoan (id_tai_khoan)
ON DELETE SET NULL;


ALTER TABLE NhatKyHeThong  ADD  CONSTRAINT FK_NhatKy_TaiKhoan FOREIGN KEY(ten_dang_nhap)
REFERENCES TaiKhoan (ten_dang_nhap);


ALTER TABLE PhanCongNhanVien  ADD  CONSTRAINT FK_PhanCong_NhanVien FOREIGN KEY(id_nhan_vien)
REFERENCES NhanVien (id_nhan_vien);


ALTER TABLE PhanCongNhanVien  ADD  CONSTRAINT FK_PhanCong_VaiTro FOREIGN KEY(id_vai_tro)
REFERENCES VaiTroHeThong (id_vai_tro);


ALTER TABLE PhanQuyen  ADD  CONSTRAINT FK_PhanQuyen_ChucNang FOREIGN KEY(id_chuc_nang)
REFERENCES ChucNang (id_chuc_nang);


ALTER TABLE PhanQuyen  ADD  CONSTRAINT FK_PhanQuyen_VaiTro FOREIGN KEY(id_vai_tro)
REFERENCES VaiTroHeThong (id_vai_tro);


ALTER TABLE TaiKhoan  ADD  CONSTRAINT FK_TaiKhoan_KhachHang FOREIGN KEY(id_khach_hang)
REFERENCES KhachHang (id_khach_hang);


ALTER TABLE TaiKhoan  ADD  CONSTRAINT FK_TaiKhoan_NhanVien FOREIGN KEY(id_nhan_vien)
REFERENCES NhanVien (id_nhan_vien);


ALTER TABLE TaiKhoan  ADD  CONSTRAINT FK_TaiKhoan_VaiTro FOREIGN KEY(id_vai_tro)
REFERENCES VaiTroHeThong (id_vai_tro);


ALTER TABLE ThanhToan  ADD  CONSTRAINT FK_ThanhToan_HoaDon FOREIGN KEY(id_hoa_don)
REFERENCES HoaDon (id_hoa_don);


ALTER TABLE ThanhToan  ADD  CONSTRAINT FK_ThanhToan_NhanVien FOREIGN KEY(id_nhan_vien)
REFERENCES NhanVien (id_nhan_vien);


ALTER TABLE ThongBao  ADD  CONSTRAINT FK_ThongBao_TaiKhoan FOREIGN KEY(id_tai_khoan)
REFERENCES TaiKhoan (id_tai_khoan);


ALTER TABLE ThuCung  ADD  CONSTRAINT FK_ThuCung_KhachHang FOREIGN KEY(id_khach_hang)
REFERENCES KhachHang (id_khach_hang);


ALTER TABLE TiemChung  ADD  CONSTRAINT FK_TiemChung_BacSi FOREIGN KEY(id_bac_si)
REFERENCES NhanVien (id_nhan_vien);


ALTER TABLE TiemChung  ADD  CONSTRAINT FK_TiemChung_ThuCung FOREIGN KEY(id_thu_cung)
REFERENCES ThuCung (id_thu_cung);


ALTER TABLE DanhGiaDichVu  ADD CHECK  ((so_sao>=(1) AND so_sao<=(5)));
/****** Object:  StoredProcedure sp_AddAppointment    Script Date: 27/05/2026 07:14:56 ******/






/****** Object:  StoredProcedure sp_AddMedicalRecord    Script Date: 27/05/2026 07:14:56 ******/






/****** Object:  StoredProcedure sp_CapNhatThongTinKhachHang    Script Date: 27/05/2026 07:14:56 ******/






/****** Object:  StoredProcedure sp_CapNhatTonKho    Script Date: 27/05/2026 07:14:56 ******/






/****** Object:  StoredProcedure sp_DangKyKhachHang    Script Date: 27/05/2026 07:14:56 ******/






/****** Object:  StoredProcedure sp_DangNhap    Script Date: 27/05/2026 07:14:56 ******/






/****** Object:  StoredProcedure sp_DonDepNhatKy    Script Date: 27/05/2026 07:14:56 ******/






/****** Object:  StoredProcedure sp_HuyLichHen    Script Date: 27/05/2026 07:14:56 ******/






/****** Object:  StoredProcedure sp_LapHoaDon    Script Date: 27/05/2026 07:14:56 ******/






/****** Object:  StoredProcedure sp_LichHenCuaKhachHang    Script Date: 27/05/2026 07:14:56 ******/






/****** Object:  StoredProcedure sp_TaoThongBaoTiemChung    Script Date: 27/05/2026 07:14:56 ******/;