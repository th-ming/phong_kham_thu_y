USE [master]
GO
/****** Object:  Database [PhongKhamThuY]    Script Date: 23/04/2026 16:26:24 ******/
CREATE DATABASE [PhongKhamThuY]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'PhongKhamThuY', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQL\DATA\PhongKhamThuY.mdf' , SIZE = 73728KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'PhongKhamThuY_log', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQL\DATA\PhongKhamThuY_log.ldf' , SIZE = 73728KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT, LEDGER = OFF
GO
ALTER DATABASE [PhongKhamThuY] SET COMPATIBILITY_LEVEL = 160
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [PhongKhamThuY].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [PhongKhamThuY] SET ANSI_NULL_DEFAULT ON 
GO
ALTER DATABASE [PhongKhamThuY] SET ANSI_NULLS ON 
GO
ALTER DATABASE [PhongKhamThuY] SET ANSI_PADDING ON 
GO
ALTER DATABASE [PhongKhamThuY] SET ANSI_WARNINGS ON 
GO
ALTER DATABASE [PhongKhamThuY] SET ARITHABORT OFF 
GO
ALTER DATABASE [PhongKhamThuY] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [PhongKhamThuY] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [PhongKhamThuY] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [PhongKhamThuY] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [PhongKhamThuY] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [PhongKhamThuY] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [PhongKhamThuY] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [PhongKhamThuY] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [PhongKhamThuY] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [PhongKhamThuY] SET  ENABLE_BROKER 
GO
ALTER DATABASE [PhongKhamThuY] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [PhongKhamThuY] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [PhongKhamThuY] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [PhongKhamThuY] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [PhongKhamThuY] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [PhongKhamThuY] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [PhongKhamThuY] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [PhongKhamThuY] SET RECOVERY FULL 
GO
ALTER DATABASE [PhongKhamThuY] SET  MULTI_USER 
GO
ALTER DATABASE [PhongKhamThuY] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [PhongKhamThuY] SET DB_CHAINING OFF 
GO
ALTER DATABASE [PhongKhamThuY] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [PhongKhamThuY] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [PhongKhamThuY] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [PhongKhamThuY] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
ALTER DATABASE [PhongKhamThuY] SET QUERY_STORE = ON
GO
ALTER DATABASE [PhongKhamThuY] SET QUERY_STORE (OPERATION_MODE = READ_WRITE, CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30), DATA_FLUSH_INTERVAL_SECONDS = 900, INTERVAL_LENGTH_MINUTES = 60, MAX_STORAGE_SIZE_MB = 1000, QUERY_CAPTURE_MODE = AUTO, SIZE_BASED_CLEANUP_MODE = AUTO, MAX_PLANS_PER_QUERY = 200, WAIT_STATS_CAPTURE_MODE = ON)
GO
USE [PhongKhamThuY]
GO
/****** Object:  UserDefinedFunction [dbo].[fn_CalculatePetAge]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =========================================
-- PH?N 3: FUNCTION + VIEW
-- =========================================

-- ==================== FUNCTIONS ====================

-- Function tính tu?i thú cung
CREATE FUNCTION [dbo].[fn_CalculatePetAge] (@NgaySinh DATE)
RETURNS INT
AS
BEGIN
    IF @NgaySinh IS NULL 
        RETURN NULL;

    DECLARE @Today DATE = GETDATE();
    DECLARE @Age INT = DATEDIFF(YEAR, @NgaySinh, @Today);

    -- Ði?u ch?nh n?u chua d?n sinh nh?t trong nam nay
    IF DATEFROMPARTS(YEAR(@Today), MONTH(@NgaySinh), DAY(@NgaySinh)) > @Today
        SET @Age = @Age - 1;

    RETURN CASE WHEN @Age < 0 THEN 0 ELSE @Age END;
END;
GO
/****** Object:  UserDefinedFunction [dbo].[fn_GetInvoiceTotal]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Function l?y t?ng ti?n hóa don
CREATE FUNCTION [dbo].[fn_GetInvoiceTotal] (@IdHoaDon INT)
RETURNS DECIMAL(12,2)
AS
BEGIN
    DECLARE @Total DECIMAL(12,2);
    SELECT @Total = tong_tien_cuoi 
    FROM dbo.HoaDon 
    WHERE id_hoa_don = @IdHoaDon;
    RETURN ISNULL(@Total, 0);
END;
GO
/****** Object:  Table [dbo].[KhachHang]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[KhachHang](
	[id_khach_hang] [int] IDENTITY(1,1) NOT NULL,
	[ten_khach_hang] [nvarchar](100) NOT NULL,
	[email] [nvarchar](100) NULL,
	[sdt] [nvarchar](15) NULL,
	[dia_chi] [nvarchar](255) NULL,
	[ngay_tao] [datetime] NOT NULL,
	[ngay_cap_nhat] [datetime] NOT NULL,
	[da_xoa] [bit] NOT NULL,
 CONSTRAINT [PK_KhachHang] PRIMARY KEY CLUSTERED 
(
	[id_khach_hang] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_KhachHang_Email] UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ThuCung]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ThuCung](
	[id_thu_cung] [int] IDENTITY(1,1) NOT NULL,
	[ten_thu_cung] [nvarchar](100) NOT NULL,
	[loai] [nvarchar](50) NULL,
	[giong] [nvarchar](100) NULL,
	[ngay_sinh] [date] NULL,
	[gioi_tinh] [nvarchar](10) NULL,
	[mau_sac] [nvarchar](50) NULL,
	[trong_luong] [decimal](5, 2) NULL,
	[id_khach_hang] [int] NOT NULL,
	[ngay_tao] [datetime] NOT NULL,
	[da_xoa] [bit] NOT NULL,
 CONSTRAINT [PK_ThuCung] PRIMARY KEY CLUSTERED 
(
	[id_thu_cung] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[NhanVien]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[NhanVien](
	[id_nhan_vien] [int] IDENTITY(1,1) NOT NULL,
	[id_tai_khoan] [int] NULL,
	[ho_ten] [nvarchar](100) NOT NULL,
	[ngay_sinh] [date] NULL,
	[gioi_tinh] [nvarchar](10) NULL,
	[dia_chi] [nvarchar](255) NULL,
	[so_dien_thoai] [nvarchar](15) NULL,
	[email] [nvarchar](100) NULL,
	[so_cccd] [nvarchar](20) NULL,
	[ngay_vao_lam] [date] NOT NULL,
	[ngay_nghi_viec] [date] NULL,
	[trang_thai] [nvarchar](50) NULL,
	[da_xoa] [bit] NOT NULL,
 CONSTRAINT [PK_NhanVien] PRIMARY KEY CLUSTERED 
(
	[id_nhan_vien] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_NhanVien_CCCD] UNIQUE NONCLUSTERED 
(
	[so_cccd] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_NhanVien_Email] UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_NhanVien_TaiKhoan] UNIQUE NONCLUSTERED 
(
	[id_tai_khoan] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LichHen]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LichHen](
	[id_lich_hen] [int] IDENTITY(1,1) NOT NULL,
	[ngay_kham] [date] NOT NULL,
	[gio_kham] [time](7) NOT NULL,
	[ly_do] [nvarchar](500) NULL,
	[trang_thai] [nvarchar](50) NULL,
	[id_khach_hang] [int] NOT NULL,
	[id_thu_cung] [int] NOT NULL,
	[id_bac_si] [int] NOT NULL,
	[id_nguoi_dat] [int] NULL,
	[phong_kham] [nvarchar](100) NULL,
	[ghi_chu_noi_bo] [nvarchar](500) NULL,
	[ngay_tao] [datetime] NOT NULL,
 CONSTRAINT [PK_LichHen] PRIMARY KEY CLUSTERED 
(
	[id_lich_hen] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_LichHen_BacSi_ThoiGian] UNIQUE NONCLUSTERED 
(
	[id_bac_si] ASC,
	[ngay_kham] ASC,
	[gio_kham] ASC,
	[phong_kham] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [dbo].[v_LichHenHomNay]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


-- ==================== VIEWS ====================

-- View l?ch h?n hôm nay
CREATE VIEW [dbo].[v_LichHenHomNay] AS
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
JOIN dbo.NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien
WHERE lh.ngay_kham = CAST(GETDATE() AS DATE)
  AND lh.trang_thai <> N'da_huy';
GO
/****** Object:  Table [dbo].[HoaDon]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[HoaDon](
	[id_hoa_don] [int] IDENTITY(1,1) NOT NULL,
	[id_lich_hen] [int] NOT NULL,
	[id_khach_hang] [int] NOT NULL,
	[tong_tien_truoc_giam_gia] [decimal](12, 2) NULL,
	[tong_tien_giam_gia] [decimal](12, 2) NULL,
	[tong_tien_sau_giam_gia] [decimal](12, 2) NULL,
	[thue_suat] [decimal](5, 2) NULL,
	[thue_phai_nop] [decimal](12, 2) NULL,
	[tong_tien_cuoi] [decimal](12, 2) NULL,
	[ngay_lap] [datetime] NOT NULL,
	[id_nhan_vien] [int] NOT NULL,
	[trang_thai] [nvarchar](50) NULL,
	[ghi_chu] [nvarchar](500) NULL,
 CONSTRAINT [PK_HoaDon] PRIMARY KEY CLUSTERED 
(
	[id_hoa_don] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_HoaDon_LichHen] UNIQUE NONCLUSTERED 
(
	[id_lich_hen] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [dbo].[v_DoanhThuKhachHang]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- View doanh thu theo khách hàng
CREATE VIEW [dbo].[v_DoanhThuKhachHang] AS
SELECT 
    kh.id_khach_hang,
    kh.ten_khach_hang,
    kh.sdt,
    COUNT(hd.id_hoa_don) AS so_hoa_don,
    ISNULL(SUM(hd.tong_tien_cuoi), 0) AS tong_doanh_thu,
    MAX(hd.ngay_lap) AS lan_kham_cuoi
FROM dbo.KhachHang kh
LEFT JOIN dbo.HoaDon hd ON kh.id_khach_hang = hd.id_khach_hang
WHERE hd.trang_thai = N'da_thanh_toan' OR hd.trang_thai IS NULL
GROUP BY kh.id_khach_hang, kh.ten_khach_hang, kh.sdt;
GO
/****** Object:  Table [dbo].[NhaCungCap]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[NhaCungCap](
	[id_ncc] [int] IDENTITY(1,1) NOT NULL,
	[ten_ncc] [nvarchar](255) NOT NULL,
	[dia_chi] [nvarchar](255) NULL,
	[so_dien_thoai] [nvarchar](15) NULL,
	[email] [nvarchar](100) NULL,
	[ma_so_thue] [nvarchar](20) NULL,
	[ghi_chu] [nvarchar](500) NULL,
	[ngay_tao] [datetime] NOT NULL,
 CONSTRAINT [PK_NhaCungCap] PRIMARY KEY CLUSTERED 
(
	[id_ncc] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_NhaCungCap_Email] UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Thuoc]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Thuoc](
	[id_thuoc] [int] IDENTITY(1,1) NOT NULL,
	[ten_thuoc] [nvarchar](100) NOT NULL,
	[thanh_phan] [nvarchar](255) NULL,
	[dang_bao_che] [nvarchar](50) NULL,
	[don_vi] [nvarchar](20) NULL,
	[mo_ta] [nvarchar](500) NULL,
	[gia_ban] [decimal](10, 2) NOT NULL,
	[trang_thai] [bit] NOT NULL,
 CONSTRAINT [PK_Thuoc] PRIMARY KEY CLUSTERED 
(
	[id_thuoc] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LoThuoc]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LoThuoc](
	[id_lo] [int] IDENTITY(1,1) NOT NULL,
	[id_thuoc] [int] NOT NULL,
	[id_ncc] [int] NOT NULL,
	[so_lo] [nvarchar](100) NOT NULL,
	[ngay_nhap] [date] NOT NULL,
	[han_su_dung] [date] NOT NULL,
	[gia_nhap] [decimal](18, 2) NOT NULL,
	[so_luong_nhap] [int] NOT NULL,
	[so_luong_ton] [int] NOT NULL,
	[ngay_cap_nhat_ton_kho] [datetime] NULL,
 CONSTRAINT [PK_LoThuoc] PRIMARY KEY CLUSTERED 
(
	[id_lo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_LoThuoc_SoLo] UNIQUE NONCLUSTERED 
(
	[so_lo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [dbo].[v_ThuocSapHetHan]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- View thu?c s?p h?t h?n (30 ngày t?i)
CREATE VIEW [dbo].[v_ThuocSapHetHan] AS
SELECT 
    t.id_thuoc,
    t.ten_thuoc,
    lt.id_lo,
    lt.so_lo,
    lt.han_su_dung,
    lt.so_luong_ton,
    DATEDIFF(DAY, GETDATE(), lt.han_su_dung) AS so_ngay_con_lai,
    n.ten_ncc
FROM dbo.LoThuoc lt
JOIN dbo.Thuoc t ON lt.id_thuoc = t.id_thuoc
JOIN dbo.NhaCungCap n ON lt.id_ncc = n.id_ncc
WHERE lt.han_su_dung <= DATEADD(DAY, 30, GETDATE())
  AND lt.so_luong_ton > 0;
GO
/****** Object:  Table [dbo].[HoSoBenhAn]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[HoSoBenhAn](
	[id_ho_so] [int] IDENTITY(1,1) NOT NULL,
	[id_lich_hen] [int] NOT NULL,
	[ngay_kham] [date] NOT NULL,
	[id_bac_si] [int] NOT NULL,
	[can_nang] [decimal](8, 2) NULL,
	[nhiet_do] [decimal](5, 2) NULL,
	[huyet_ap] [nvarchar](20) NULL,
	[trieu_chung] [nvarchar](500) NULL,
	[ket_qua_tham_kham] [nvarchar](500) NULL,
	[chan_doan] [nvarchar](500) NULL,
	[phac_do_dieu_tri] [nvarchar](500) NULL,
	[huong_dan_cham_soc] [nvarchar](500) NULL,
	[ngay_tai_kham_de_xuat] [date] NULL,
	[trang_thai_ho_so] [nvarchar](50) NULL,
	[id_nguoi_tao] [int] NOT NULL,
	[ngay_tao] [datetime] NOT NULL,
	[nguoi_cap_nhat_gan_nhat] [int] NULL,
	[ngay_cap_nhat_gan_nhat] [datetime] NULL,
 CONSTRAINT [PK_HoSoBenhAn] PRIMARY KEY CLUSTERED 
(
	[id_ho_so] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_HoSo_LichHen] UNIQUE NONCLUSTERED 
(
	[id_lich_hen] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [dbo].[v_HoSoBenhAn_GanDay]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- View h? so b?nh án g?n dây c?a bác si
CREATE VIEW [dbo].[v_HoSoBenhAn_GanDay] AS
SELECT 
    h.id_ho_so,
    h.ngay_kham,
    nv.ho_ten AS ten_bac_si,
    kh.ten_khach_hang,
    tc.ten_thu_cung,
    h.chan_doan,
    h.trang_thai_ho_so
FROM dbo.HoSoBenhAn h
JOIN dbo.NhanVien nv ON h.id_bac_si = nv.id_nhan_vien
JOIN dbo.LichHen lh ON h.id_lich_hen = lh.id_lich_hen
JOIN dbo.KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang
JOIN dbo.ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung
WHERE h.ngay_kham >= DATEADD(DAY, -30, GETDATE());
GO
/****** Object:  Table [dbo].[VaiTroHeThong]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VaiTroHeThong](
	[id_vai_tro] [int] IDENTITY(1,1) NOT NULL,
	[ten_vai_tro] [nvarchar](50) NOT NULL,
	[mo_ta] [nvarchar](255) NULL,
 CONSTRAINT [PK_VaiTroHeThong] PRIMARY KEY CLUSTERED 
(
	[id_vai_tro] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_VaiTroHeThong_Ten] UNIQUE NONCLUSTERED 
(
	[ten_vai_tro] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ChucNang]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ChucNang](
	[id_chuc_nang] [int] IDENTITY(1,1) NOT NULL,
	[ma_chuc_nang] [nvarchar](100) NOT NULL,
	[ten_chuc_nang] [nvarchar](100) NOT NULL,
	[mo_ta] [nvarchar](255) NULL,
 CONSTRAINT [PK_ChucNang] PRIMARY KEY CLUSTERED 
(
	[id_chuc_nang] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_ChucNang_Ma] UNIQUE NONCLUSTERED 
(
	[ma_chuc_nang] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PhanQuyen]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PhanQuyen](
	[id_vai_tro] [int] NOT NULL,
	[id_chuc_nang] [int] NOT NULL,
 CONSTRAINT [PK_PhanQuyen] PRIMARY KEY CLUSTERED 
(
	[id_vai_tro] ASC,
	[id_chuc_nang] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [dbo].[v_PhanQuyen_ChiTiet]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- View xem phân quy?n (dã s?a l?i ORDER BY)
CREATE   VIEW [dbo].[v_PhanQuyen_ChiTiet] AS
SELECT 
    v.ten_vai_tro,
    c.ma_chuc_nang,
    c.ten_chuc_nang,
    c.mo_ta
FROM dbo.PhanQuyen p
JOIN dbo.VaiTroHeThong v ON p.id_vai_tro = v.id_vai_tro
JOIN dbo.ChucNang c ON p.id_chuc_nang = c.id_chuc_nang;
GO
/****** Object:  View [dbo].[v_DoanhThu_TheoThang]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =========================================
-- PH?N B? SUNG 2: VIEW BÁO CÁO + PHÂN QUY?N HOÀN CH?NH
-- =========================================

-- ==================== VIEW BÁO CÁO M?I ====================

-- Doanh thu theo tháng
CREATE   VIEW [dbo].[v_DoanhThu_TheoThang] AS
SELECT 
    YEAR(ngay_lap) AS Nam,
    MONTH(ngay_lap) AS Thang,
    COUNT(id_hoa_don) AS SoHoaDon,
    SUM(tong_tien_cuoi) AS TongDoanhThu,
    SUM(tong_tien_giam_gia) AS TongGiamGia
FROM dbo.HoaDon
WHERE trang_thai = N'da_thanh_toan'
GROUP BY YEAR(ngay_lap), MONTH(ngay_lap);
GO
/****** Object:  View [dbo].[v_TopKhachHang]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Top 10 khách hàng khám nhi?u nh?t
CREATE   VIEW [dbo].[v_TopKhachHang] AS
SELECT TOP 10
    kh.id_khach_hang,
    kh.ten_khach_hang,
    kh.sdt,
    COUNT(hd.id_hoa_don) AS SoLanKham,
    SUM(hd.tong_tien_cuoi) AS TongChiTieu
FROM dbo.KhachHang kh
JOIN dbo.HoaDon hd ON kh.id_khach_hang = hd.id_khach_hang
WHERE hd.trang_thai = N'da_thanh_toan'
GROUP BY kh.id_khach_hang, kh.ten_khach_hang, kh.sdt
ORDER BY TongChiTieu DESC;
GO
/****** Object:  View [dbo].[v_ThongKe_BacSi]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Th?ng kê theo bác si
CREATE   VIEW [dbo].[v_ThongKe_BacSi] AS
SELECT 
    nv.ho_ten AS TenBacSi,
    COUNT(DISTINCT lh.id_lich_hen) AS SoLichHen,
    COUNT(DISTINCT h.id_ho_so) AS SoHoSo,
    COUNT(DISTINCT hd.id_hoa_don) AS SoHoaDon,
    SUM(hd.tong_tien_cuoi) AS TongDoanhThu
FROM dbo.NhanVien nv
LEFT JOIN dbo.LichHen lh ON nv.id_nhan_vien = lh.id_bac_si
LEFT JOIN dbo.HoSoBenhAn h ON lh.id_lich_hen = h.id_lich_hen
LEFT JOIN dbo.HoaDon hd ON lh.id_lich_hen = hd.id_lich_hen
WHERE nv.trang_thai = N'dang_lam'
GROUP BY nv.ho_ten;
GO
/****** Object:  Table [dbo].[BenhAn_XetNghiem]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[BenhAn_XetNghiem](
	[id_xet_nghiem_benh_an] [int] IDENTITY(1,1) NOT NULL,
	[id_ho_so] [int] NOT NULL,
	[id_loai_xet_nghiem] [int] NOT NULL,
	[ngay_lay_mau] [datetime] NOT NULL,
	[ngay_co_ket_qua] [datetime] NULL,
	[id_bac_si] [int] NOT NULL,
	[ket_qua_chung] [nvarchar](500) NULL,
	[trang_thai] [nvarchar](50) NULL,
	[ghi_chu] [nvarchar](500) NULL,
 CONSTRAINT [PK_BenhAn_XetNghiem] PRIMARY KEY CLUSTERED 
(
	[id_xet_nghiem_benh_an] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CauHinhHeThong]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CauHinhHeThong](
	[khoa_cau_hinh] [nvarchar](100) NOT NULL,
	[gia_tri_cau_hinh] [nvarchar](max) NULL,
	[mo_ta] [nvarchar](255) NULL,
	[ngay_cap_nhat] [datetime] NOT NULL,
	[id_nguoi_cap_nhat] [int] NULL,
 CONSTRAINT [PK_CauHinhHeThong] PRIMARY KEY CLUSTERED 
(
	[khoa_cau_hinh] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ChiSoXetNghiem]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ChiSoXetNghiem](
	[id_chi_so] [int] IDENTITY(1,1) NOT NULL,
	[id_loai_xet_nghiem] [int] NOT NULL,
	[ten_thong_so] [nvarchar](100) NOT NULL,
	[don_vi] [nvarchar](50) NULL,
	[gia_tri_min] [decimal](18, 4) NULL,
	[gia_tri_max] [decimal](18, 4) NULL,
	[kieu_du_lieu] [nvarchar](50) NULL,
	[mo_ta] [nvarchar](500) NULL,
 CONSTRAINT [PK_ChiSoXetNghiem] PRIMARY KEY CLUSTERED 
(
	[id_chi_so] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DanhMucXetNghiem]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DanhMucXetNghiem](
	[id_danh_muc] [int] IDENTITY(1,1) NOT NULL,
	[ten_the_loai] [nvarchar](100) NOT NULL,
	[mo_ta] [nvarchar](500) NULL,
 CONSTRAINT [PK_DanhMucXetNghiem] PRIMARY KEY CLUSTERED 
(
	[id_danh_muc] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_DanhMuc_TenTheLoai] UNIQUE NONCLUSTERED 
(
	[ten_the_loai] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DichVu]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DichVu](
	[id_dich_vu] [int] IDENTITY(1,1) NOT NULL,
	[ten_dich_vu] [nvarchar](100) NOT NULL,
	[mo_ta] [nvarchar](500) NULL,
	[gia] [decimal](10, 2) NOT NULL,
	[thoi_luong_phut] [int] NULL,
	[trang_thai] [bit] NOT NULL,
 CONSTRAINT [PK_DichVu] PRIMARY KEY CLUSTERED 
(
	[id_dich_vu] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DichVuLichHen]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DichVuLichHen](
	[id_lich_hen] [int] NOT NULL,
	[id_dich_vu] [int] NOT NULL,
	[so_luong] [int] NULL,
	[don_gia] [decimal](10, 2) NOT NULL,
	[ghi_chu] [nvarchar](500) NULL,
 CONSTRAINT [PK_DichVuLichHen] PRIMARY KEY CLUSTERED 
(
	[id_lich_hen] ASC,
	[id_dich_vu] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DonThuoc_ChiTiet]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DonThuoc_ChiTiet](
	[id_don_thuoc_ct] [int] IDENTITY(1,1) NOT NULL,
	[id_ho_so] [int] NOT NULL,
	[id_thuoc] [int] NOT NULL,
	[id_lo] [int] NOT NULL,
	[so_luong] [int] NOT NULL,
	[lieu_dung] [nvarchar](500) NULL,
 CONSTRAINT [PK_DonThuoc_ChiTiet] PRIMARY KEY CLUSTERED 
(
	[id_don_thuoc_ct] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_DonThuoc_HoSo_Thuoc_Lo] UNIQUE NONCLUSTERED 
(
	[id_ho_so] ASC,
	[id_thuoc] ASC,
	[id_lo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FileDinhKem]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FileDinhKem](
	[id_file] [int] IDENTITY(1,1) NOT NULL,
	[loai_thuc_the] [nvarchar](50) NOT NULL,
	[id_thuc_the] [int] NOT NULL,
	[ten_file_goc] [nvarchar](255) NOT NULL,
	[loai_file] [nvarchar](50) NULL,
	[duong_dan] [nvarchar](500) NOT NULL,
	[kich_thuoc] [bigint] NULL,
	[ngay_tai_len] [datetime] NOT NULL,
	[id_nhan_vien] [int] NOT NULL,
	[ghi_chu] [nvarchar](500) NULL,
 CONSTRAINT [PK_FileDinhKem] PRIMARY KEY CLUSTERED 
(
	[id_file] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[GiaoDichKho]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GiaoDichKho](
	[id_giao_dich] [int] IDENTITY(1,1) NOT NULL,
	[id_thuoc] [int] NULL,
	[id_lo] [int] NULL,
	[loai_giao_dich] [nvarchar](50) NOT NULL,
	[so_luong] [int] NOT NULL,
	[gia_tri] [decimal](18, 2) NULL,
	[ngay_giao_dich] [datetime] NOT NULL,
	[id_nhan_vien] [int] NOT NULL,
	[ghi_chu] [nvarchar](500) NULL,
 CONSTRAINT [PK_GiaoDichKho] PRIMARY KEY CLUSTERED 
(
	[id_giao_dich] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[KetQuaXetNghiem_ChiTiet]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[KetQuaXetNghiem_ChiTiet](
	[id_ket_qua_chi_tiet] [int] IDENTITY(1,1) NOT NULL,
	[id_xet_nghiem_benh_an] [int] NOT NULL,
	[id_chi_so] [int] NOT NULL,
	[gia_tri_ket_qua] [nvarchar](255) NOT NULL,
	[co_bat_thuong] [bit] NULL,
	[ghi_chu_rieng] [nvarchar](500) NULL,
 CONSTRAINT [PK_KetQuaXN_ChiTiet] PRIMARY KEY CLUSTERED 
(
	[id_ket_qua_chi_tiet] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[khach_hang]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[khach_hang](
	[id_khach_hang] [int] IDENTITY(1,1) NOT NULL,
	[email] [varchar](255) NULL,
	[sdt] [varchar](255) NULL,
	[ten_khach_hang] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_khach_hang] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LichLamViecNhanVien]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LichLamViecNhanVien](
	[id_lich_lam_viec] [int] IDENTITY(1,1) NOT NULL,
	[id_nhan_vien] [int] NOT NULL,
	[ngay_lam] [date] NOT NULL,
	[gio_bat_dau] [time](7) NOT NULL,
	[gio_ket_thuc] [time](7) NOT NULL,
	[ghi_chu] [nvarchar](500) NULL,
 CONSTRAINT [PK_LichLamViec] PRIMARY KEY CLUSTERED 
(
	[id_lich_lam_viec] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LoaiXetNghiem]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LoaiXetNghiem](
	[id_loai_xet_nghiem] [int] IDENTITY(1,1) NOT NULL,
	[id_danh_muc] [int] NOT NULL,
	[ten_xet_nghiem] [nvarchar](255) NOT NULL,
	[mo_ta] [nvarchar](500) NULL,
	[gia_tien] [decimal](10, 2) NOT NULL,
 CONSTRAINT [PK_LoaiXetNghiem] PRIMARY KEY CLUSTERED 
(
	[id_loai_xet_nghiem] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_LoaiXN_Ten] UNIQUE NONCLUSTERED 
(
	[ten_xet_nghiem] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[NhatKyHeThong]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[NhatKyHeThong](
	[id_log] [bigint] IDENTITY(1,1) NOT NULL,
	[ngay_gio] [datetime] NOT NULL,
	[id_tai_khoan] [int] NOT NULL,
	[hanh_dong] [nvarchar](50) NOT NULL,
	[ten_bang_anh_huong] [nvarchar](100) NULL,
	[id_ban_ghi_anh_huong] [nvarchar](50) NULL,
	[du_lieu_cu] [nvarchar](max) NULL,
	[du_lieu_moi] [nvarchar](max) NULL,
	[mo_ta_chi_tiet] [nvarchar](500) NULL,
	[dia_chi_ip] [nvarchar](50) NULL,
 CONSTRAINT [PK_NhatKyHeThong] PRIMARY KEY CLUSTERED 
(
	[id_log] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PhanCongNhanVien]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PhanCongNhanVien](
	[id_nhan_vien] [int] NOT NULL,
	[id_vai_tro] [int] NOT NULL,
	[ngay_bat_dau_phan_cong] [date] NOT NULL,
	[ngay_ket_thuc_phan_cong] [date] NULL,
 CONSTRAINT [PK_PhanCongNhanVien] PRIMARY KEY CLUSTERED 
(
	[id_nhan_vien] ASC,
	[id_vai_tro] ASC,
	[ngay_bat_dau_phan_cong] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TaiKhoan]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TaiKhoan](
	[id_tai_khoan] [int] IDENTITY(1,1) NOT NULL,
	[ten_dang_nhap] [nvarchar](50) NOT NULL,
	[mat_khau] [nvarchar](255) NOT NULL,
	[id_vai_tro] [int] NULL,
	[trang_thai] [nvarchar](50) NULL,
	[ngay_tao] [datetime] NOT NULL,
	[id_khach_hang] [int] NULL,
	[mat_khau_hash] [nvarchar](255) NULL,
 CONSTRAINT [PK_TaiKhoan] PRIMARY KEY CLUSTERED 
(
	[id_tai_khoan] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_TaiKhoan_TenDangNhap] UNIQUE NONCLUSTERED 
(
	[ten_dang_nhap] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TaiKhoan_VaiTro]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TaiKhoan_VaiTro](
	[id_tai_khoan] [int] NOT NULL,
	[id_vai_tro] [int] NOT NULL,
	[ngay_bat_dau] [date] NULL,
	[ngay_ket_thuc] [date] NULL,
 CONSTRAINT [PK_TaiKhoan_VaiTro] PRIMARY KEY CLUSTERED 
(
	[id_tai_khoan] ASC,
	[id_vai_tro] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ThanhToan]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ThanhToan](
	[id_thanh_toan] [int] IDENTITY(1,1) NOT NULL,
	[id_hoa_don] [int] NOT NULL,
	[so_tien] [decimal](12, 2) NOT NULL,
	[phuong_thuc] [nvarchar](50) NULL,
	[ngay_tra_tien] [datetime] NULL,
	[id_nhan_vien] [int] NULL,
	[ma_giao_dich_ngan_hang] [nvarchar](100) NULL,
	[ghi_chu] [nvarchar](500) NULL,
 CONSTRAINT [PK_ThanhToan] PRIMARY KEY CLUSTERED 
(
	[id_thanh_toan] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TiemChung]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TiemChung](
	[id_tiem_chung] [int] IDENTITY(1,1) NOT NULL,
	[id_thu_cung] [int] NOT NULL,
	[ten_vaccine] [nvarchar](100) NOT NULL,
	[ngay_tiem] [date] NOT NULL,
	[ngay_tiem_lai] [date] NULL,
	[loai_vaccine] [nvarchar](100) NULL,
	[id_bac_si] [int] NULL,
	[ghi_chu] [nvarchar](500) NULL,
 CONSTRAINT [PK_TiemChung] PRIMARY KEY CLUSTERED 
(
	[id_tiem_chung] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VaiTroNhanVien]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VaiTroNhanVien](
	[id_vai_tro] [int] IDENTITY(1,1) NOT NULL,
	[ten_vai_tro] [nvarchar](100) NOT NULL,
	[mo_ta] [nvarchar](500) NULL,
 CONSTRAINT [PK_VaiTroNhanVien] PRIMARY KEY CLUSTERED 
(
	[id_vai_tro] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_VaiTroNhanVien_Ten] UNIQUE NONCLUSTERED 
(
	[ten_vai_tro] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [IX_BenhAn_XetNghiem_HoSo]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_BenhAn_XetNghiem_HoSo] ON [dbo].[BenhAn_XetNghiem]
(
	[id_ho_so] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_BenhAn_XetNghiem_Loai]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_BenhAn_XetNghiem_Loai] ON [dbo].[BenhAn_XetNghiem]
(
	[id_loai_xet_nghiem] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_BenhAn_XetNghiem_Ngay]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_BenhAn_XetNghiem_Ngay] ON [dbo].[BenhAn_XetNghiem]
(
	[ngay_lay_mau] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_ChiSoXetNghiem_Loai]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_ChiSoXetNghiem_Loai] ON [dbo].[ChiSoXetNghiem]
(
	[id_loai_xet_nghiem] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_DichVu_Ten]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_DichVu_Ten] ON [dbo].[DichVu]
(
	[ten_dich_vu] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_DichVu_TrangThai]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_DichVu_TrangThai] ON [dbo].[DichVu]
(
	[trang_thai] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_DichVuLichHen_DichVu]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_DichVuLichHen_DichVu] ON [dbo].[DichVuLichHen]
(
	[id_dich_vu] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_DichVuLichHen_LichHen]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_DichVuLichHen_LichHen] ON [dbo].[DichVuLichHen]
(
	[id_lich_hen] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_DonThuoc_HoSo]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_DonThuoc_HoSo] ON [dbo].[DonThuoc_ChiTiet]
(
	[id_ho_so] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_DonThuoc_Lo]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_DonThuoc_Lo] ON [dbo].[DonThuoc_ChiTiet]
(
	[id_lo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_DonThuoc_Thuoc]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_DonThuoc_Thuoc] ON [dbo].[DonThuoc_ChiTiet]
(
	[id_thuoc] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_FileDinhKem_Ngay]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_FileDinhKem_Ngay] ON [dbo].[FileDinhKem]
(
	[ngay_tai_len] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_FileDinhKem_ThucThe]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_FileDinhKem_ThucThe] ON [dbo].[FileDinhKem]
(
	[loai_thuc_the] ASC,
	[id_thuc_the] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_GiaoDichKho_Lo]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_GiaoDichKho_Lo] ON [dbo].[GiaoDichKho]
(
	[id_lo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_GiaoDichKho_Ngay]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_GiaoDichKho_Ngay] ON [dbo].[GiaoDichKho]
(
	[ngay_giao_dich] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_GiaoDichKho_NhanVien]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_GiaoDichKho_NhanVien] ON [dbo].[GiaoDichKho]
(
	[id_nhan_vien] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_GiaoDichKho_Thuoc]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_GiaoDichKho_Thuoc] ON [dbo].[GiaoDichKho]
(
	[id_thuoc] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_HoaDon_KhachHang]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_HoaDon_KhachHang] ON [dbo].[HoaDon]
(
	[id_khach_hang] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_HoaDon_NgayLap]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_HoaDon_NgayLap] ON [dbo].[HoaDon]
(
	[ngay_lap] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_HoaDon_TrangThai]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_HoaDon_TrangThai] ON [dbo].[HoaDon]
(
	[trang_thai] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_HoSoBenhAn_BacSi]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_HoSoBenhAn_BacSi] ON [dbo].[HoSoBenhAn]
(
	[id_bac_si] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_HoSoBenhAn_NgayKham]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_HoSoBenhAn_NgayKham] ON [dbo].[HoSoBenhAn]
(
	[ngay_kham] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_HoSoBenhAn_NguoiTao]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_HoSoBenhAn_NguoiTao] ON [dbo].[HoSoBenhAn]
(
	[id_nguoi_tao] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_HoSoBenhAn_TrangThai]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_HoSoBenhAn_TrangThai] ON [dbo].[HoSoBenhAn]
(
	[trang_thai_ho_so] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_KetQuaXetNghiem_ChiTiet_BenhAn]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_KetQuaXetNghiem_ChiTiet_BenhAn] ON [dbo].[KetQuaXetNghiem_ChiTiet]
(
	[id_xet_nghiem_benh_an] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_KhachHang_SDT]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_KhachHang_SDT] ON [dbo].[KhachHang]
(
	[sdt] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_KhachHang_Ten]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_KhachHang_Ten] ON [dbo].[KhachHang]
(
	[ten_khach_hang] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LichHen_BacSi]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_LichHen_BacSi] ON [dbo].[LichHen]
(
	[id_bac_si] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LichHen_KhachHang]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_LichHen_KhachHang] ON [dbo].[LichHen]
(
	[id_khach_hang] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_LichHen_KhachHang_TrangThai]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_LichHen_KhachHang_TrangThai] ON [dbo].[LichHen]
(
	[id_khach_hang] ASC,
	[trang_thai] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LichHen_Ngay_Gio]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_LichHen_Ngay_Gio] ON [dbo].[LichHen]
(
	[ngay_kham] ASC,
	[gio_kham] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LichHen_NguoiDat]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_LichHen_NguoiDat] ON [dbo].[LichHen]
(
	[id_nguoi_dat] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LichHen_ThuCung]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_LichHen_ThuCung] ON [dbo].[LichHen]
(
	[id_thu_cung] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_LichHen_TrangThai]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_LichHen_TrangThai] ON [dbo].[LichHen]
(
	[trang_thai] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LichLamViec_Ngay]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_LichLamViec_Ngay] ON [dbo].[LichLamViecNhanVien]
(
	[ngay_lam] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LichLamViec_NhanVien]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_LichLamViec_NhanVien] ON [dbo].[LichLamViecNhanVien]
(
	[id_nhan_vien] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LoThuoc_Han_Ton]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_LoThuoc_Han_Ton] ON [dbo].[LoThuoc]
(
	[han_su_dung] ASC,
	[so_luong_ton] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LoThuoc_HanSuDung]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_LoThuoc_HanSuDung] ON [dbo].[LoThuoc]
(
	[han_su_dung] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LoThuoc_NCC]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_LoThuoc_NCC] ON [dbo].[LoThuoc]
(
	[id_ncc] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LoThuoc_SoLuongTon]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_LoThuoc_SoLuongTon] ON [dbo].[LoThuoc]
(
	[so_luong_ton] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LoThuoc_Thuoc]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_LoThuoc_Thuoc] ON [dbo].[LoThuoc]
(
	[id_thuoc] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_NhanVien_HoTen]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_NhanVien_HoTen] ON [dbo].[NhanVien]
(
	[ho_ten] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_NhanVien_NgayVaoLam]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_NhanVien_NgayVaoLam] ON [dbo].[NhanVien]
(
	[ngay_vao_lam] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_NhanVien_TrangThai]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_NhanVien_TrangThai] ON [dbo].[NhanVien]
(
	[trang_thai] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_NhatKy_HanhDong]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_NhatKy_HanhDong] ON [dbo].[NhatKyHeThong]
(
	[hanh_dong] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_NhatKy_Ngay]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_NhatKy_Ngay] ON [dbo].[NhatKyHeThong]
(
	[ngay_gio] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_NhatKy_TaiKhoan]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_NhatKy_TaiKhoan] ON [dbo].[NhatKyHeThong]
(
	[id_tai_khoan] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_TaiKhoan_KhachHang]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_TaiKhoan_KhachHang] ON [dbo].[TaiKhoan]
(
	[id_khach_hang] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_TaiKhoan_TrangThai]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_TaiKhoan_TrangThai] ON [dbo].[TaiKhoan]
(
	[trang_thai] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_TaiKhoan_VaiTro]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_TaiKhoan_VaiTro] ON [dbo].[TaiKhoan]
(
	[id_vai_tro] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_ThanhToan_HoaDon]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_ThanhToan_HoaDon] ON [dbo].[ThanhToan]
(
	[id_hoa_don] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_ThanhToan_Ngay]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_ThanhToan_Ngay] ON [dbo].[ThanhToan]
(
	[ngay_tra_tien] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_ThuCung_KhachHang]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_ThuCung_KhachHang] ON [dbo].[ThuCung]
(
	[id_khach_hang] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_ThuCung_KhachHang_Ten]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_ThuCung_KhachHang_Ten] ON [dbo].[ThuCung]
(
	[id_khach_hang] ASC,
	[ten_thu_cung] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_ThuCung_Loai_Giong]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_ThuCung_Loai_Giong] ON [dbo].[ThuCung]
(
	[loai] ASC,
	[giong] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_ThuCung_Ten]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_ThuCung_Ten] ON [dbo].[ThuCung]
(
	[ten_thu_cung] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Thuoc_Ten]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_Thuoc_Ten] ON [dbo].[Thuoc]
(
	[ten_thuoc] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Thuoc_TrangThai]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_Thuoc_TrangThai] ON [dbo].[Thuoc]
(
	[trang_thai] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_TiemChung_BacSi]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_TiemChung_BacSi] ON [dbo].[TiemChung]
(
	[id_bac_si] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_TiemChung_NgayTiem]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_TiemChung_NgayTiem] ON [dbo].[TiemChung]
(
	[ngay_tiem] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_TiemChung_ThuCung]    Script Date: 23/04/2026 16:26:25 ******/
CREATE NONCLUSTERED INDEX [IX_TiemChung_ThuCung] ON [dbo].[TiemChung]
(
	[id_thu_cung] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[CauHinhHeThong] ADD  DEFAULT (getdate()) FOR [ngay_cap_nhat]
GO
ALTER TABLE [dbo].[DichVu] ADD  DEFAULT ((1)) FOR [trang_thai]
GO
ALTER TABLE [dbo].[DichVuLichHen] ADD  DEFAULT ((1)) FOR [so_luong]
GO
ALTER TABLE [dbo].[FileDinhKem] ADD  DEFAULT (getdate()) FOR [ngay_tai_len]
GO
ALTER TABLE [dbo].[GiaoDichKho] ADD  DEFAULT (getdate()) FOR [ngay_giao_dich]
GO
ALTER TABLE [dbo].[HoaDon] ADD  DEFAULT (getdate()) FOR [ngay_lap]
GO
ALTER TABLE [dbo].[HoSoBenhAn] ADD  DEFAULT (getdate()) FOR [ngay_tao]
GO
ALTER TABLE [dbo].[KhachHang] ADD  DEFAULT (getdate()) FOR [ngay_tao]
GO
ALTER TABLE [dbo].[KhachHang] ADD  DEFAULT (getdate()) FOR [ngay_cap_nhat]
GO
ALTER TABLE [dbo].[KhachHang] ADD  DEFAULT ((0)) FOR [da_xoa]
GO
ALTER TABLE [dbo].[LichHen] ADD  DEFAULT (N'da_dat') FOR [trang_thai]
GO
ALTER TABLE [dbo].[LichHen] ADD  DEFAULT (getdate()) FOR [ngay_tao]
GO
ALTER TABLE [dbo].[NhaCungCap] ADD  DEFAULT (getdate()) FOR [ngay_tao]
GO
ALTER TABLE [dbo].[NhanVien] ADD  DEFAULT (N'dang_lam') FOR [trang_thai]
GO
ALTER TABLE [dbo].[NhanVien] ADD  DEFAULT ((0)) FOR [da_xoa]
GO
ALTER TABLE [dbo].[NhatKyHeThong] ADD  DEFAULT (getdate()) FOR [ngay_gio]
GO
ALTER TABLE [dbo].[TaiKhoan] ADD  DEFAULT (N'active') FOR [trang_thai]
GO
ALTER TABLE [dbo].[TaiKhoan] ADD  DEFAULT (getdate()) FOR [ngay_tao]
GO
ALTER TABLE [dbo].[ThuCung] ADD  DEFAULT (getdate()) FOR [ngay_tao]
GO
ALTER TABLE [dbo].[ThuCung] ADD  DEFAULT ((0)) FOR [da_xoa]
GO
ALTER TABLE [dbo].[Thuoc] ADD  DEFAULT ((1)) FOR [trang_thai]
GO
ALTER TABLE [dbo].[BenhAn_XetNghiem]  WITH CHECK ADD  CONSTRAINT [FK_BAXN_BacSi] FOREIGN KEY([id_bac_si])
REFERENCES [dbo].[NhanVien] ([id_nhan_vien])
GO
ALTER TABLE [dbo].[BenhAn_XetNghiem] CHECK CONSTRAINT [FK_BAXN_BacSi]
GO
ALTER TABLE [dbo].[BenhAn_XetNghiem]  WITH CHECK ADD  CONSTRAINT [FK_BAXN_HoSo] FOREIGN KEY([id_ho_so])
REFERENCES [dbo].[HoSoBenhAn] ([id_ho_so])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[BenhAn_XetNghiem] CHECK CONSTRAINT [FK_BAXN_HoSo]
GO
ALTER TABLE [dbo].[BenhAn_XetNghiem]  WITH CHECK ADD  CONSTRAINT [FK_BAXN_LoaiXN] FOREIGN KEY([id_loai_xet_nghiem])
REFERENCES [dbo].[LoaiXetNghiem] ([id_loai_xet_nghiem])
GO
ALTER TABLE [dbo].[BenhAn_XetNghiem] CHECK CONSTRAINT [FK_BAXN_LoaiXN]
GO
ALTER TABLE [dbo].[CauHinhHeThong]  WITH CHECK ADD  CONSTRAINT [FK_CauHinh_NhanVien] FOREIGN KEY([id_nguoi_cap_nhat])
REFERENCES [dbo].[NhanVien] ([id_nhan_vien])
GO
ALTER TABLE [dbo].[CauHinhHeThong] CHECK CONSTRAINT [FK_CauHinh_NhanVien]
GO
ALTER TABLE [dbo].[ChiSoXetNghiem]  WITH CHECK ADD  CONSTRAINT [FK_ChiSo_LoaiXN] FOREIGN KEY([id_loai_xet_nghiem])
REFERENCES [dbo].[LoaiXetNghiem] ([id_loai_xet_nghiem])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ChiSoXetNghiem] CHECK CONSTRAINT [FK_ChiSo_LoaiXN]
GO
ALTER TABLE [dbo].[DichVuLichHen]  WITH CHECK ADD  CONSTRAINT [FK_DVLichHen_DichVu] FOREIGN KEY([id_dich_vu])
REFERENCES [dbo].[DichVu] ([id_dich_vu])
GO
ALTER TABLE [dbo].[DichVuLichHen] CHECK CONSTRAINT [FK_DVLichHen_DichVu]
GO
ALTER TABLE [dbo].[DichVuLichHen]  WITH CHECK ADD  CONSTRAINT [FK_DVLichHen_LichHen] FOREIGN KEY([id_lich_hen])
REFERENCES [dbo].[LichHen] ([id_lich_hen])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[DichVuLichHen] CHECK CONSTRAINT [FK_DVLichHen_LichHen]
GO
ALTER TABLE [dbo].[DonThuoc_ChiTiet]  WITH CHECK ADD  CONSTRAINT [FK_DonThuoc_HoSo] FOREIGN KEY([id_ho_so])
REFERENCES [dbo].[HoSoBenhAn] ([id_ho_so])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[DonThuoc_ChiTiet] CHECK CONSTRAINT [FK_DonThuoc_HoSo]
GO
ALTER TABLE [dbo].[DonThuoc_ChiTiet]  WITH CHECK ADD  CONSTRAINT [FK_DonThuoc_Lo] FOREIGN KEY([id_lo])
REFERENCES [dbo].[LoThuoc] ([id_lo])
GO
ALTER TABLE [dbo].[DonThuoc_ChiTiet] CHECK CONSTRAINT [FK_DonThuoc_Lo]
GO
ALTER TABLE [dbo].[DonThuoc_ChiTiet]  WITH CHECK ADD  CONSTRAINT [FK_DonThuoc_Thuoc] FOREIGN KEY([id_thuoc])
REFERENCES [dbo].[Thuoc] ([id_thuoc])
GO
ALTER TABLE [dbo].[DonThuoc_ChiTiet] CHECK CONSTRAINT [FK_DonThuoc_Thuoc]
GO
ALTER TABLE [dbo].[FileDinhKem]  WITH CHECK ADD  CONSTRAINT [FK_FileDinhKem_NhanVien] FOREIGN KEY([id_nhan_vien])
REFERENCES [dbo].[NhanVien] ([id_nhan_vien])
GO
ALTER TABLE [dbo].[FileDinhKem] CHECK CONSTRAINT [FK_FileDinhKem_NhanVien]
GO
ALTER TABLE [dbo].[GiaoDichKho]  WITH CHECK ADD  CONSTRAINT [FK_GDKho_Lo] FOREIGN KEY([id_lo])
REFERENCES [dbo].[LoThuoc] ([id_lo])
GO
ALTER TABLE [dbo].[GiaoDichKho] CHECK CONSTRAINT [FK_GDKho_Lo]
GO
ALTER TABLE [dbo].[GiaoDichKho]  WITH CHECK ADD  CONSTRAINT [FK_GDKho_NhanVien] FOREIGN KEY([id_nhan_vien])
REFERENCES [dbo].[NhanVien] ([id_nhan_vien])
GO
ALTER TABLE [dbo].[GiaoDichKho] CHECK CONSTRAINT [FK_GDKho_NhanVien]
GO
ALTER TABLE [dbo].[GiaoDichKho]  WITH CHECK ADD  CONSTRAINT [FK_GDKho_Thuoc] FOREIGN KEY([id_thuoc])
REFERENCES [dbo].[Thuoc] ([id_thuoc])
GO
ALTER TABLE [dbo].[GiaoDichKho] CHECK CONSTRAINT [FK_GDKho_Thuoc]
GO
ALTER TABLE [dbo].[HoaDon]  WITH CHECK ADD  CONSTRAINT [FK_HoaDon_KhachHang] FOREIGN KEY([id_khach_hang])
REFERENCES [dbo].[KhachHang] ([id_khach_hang])
GO
ALTER TABLE [dbo].[HoaDon] CHECK CONSTRAINT [FK_HoaDon_KhachHang]
GO
ALTER TABLE [dbo].[HoaDon]  WITH CHECK ADD  CONSTRAINT [FK_HoaDon_LichHen] FOREIGN KEY([id_lich_hen])
REFERENCES [dbo].[LichHen] ([id_lich_hen])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[HoaDon] CHECK CONSTRAINT [FK_HoaDon_LichHen]
GO
ALTER TABLE [dbo].[HoaDon]  WITH CHECK ADD  CONSTRAINT [FK_HoaDon_NhanVien] FOREIGN KEY([id_nhan_vien])
REFERENCES [dbo].[NhanVien] ([id_nhan_vien])
GO
ALTER TABLE [dbo].[HoaDon] CHECK CONSTRAINT [FK_HoaDon_NhanVien]
GO
ALTER TABLE [dbo].[HoSoBenhAn]  WITH CHECK ADD  CONSTRAINT [FK_HoSo_BacSi] FOREIGN KEY([id_bac_si])
REFERENCES [dbo].[NhanVien] ([id_nhan_vien])
GO
ALTER TABLE [dbo].[HoSoBenhAn] CHECK CONSTRAINT [FK_HoSo_BacSi]
GO
ALTER TABLE [dbo].[HoSoBenhAn]  WITH CHECK ADD  CONSTRAINT [FK_HoSo_LichHen] FOREIGN KEY([id_lich_hen])
REFERENCES [dbo].[LichHen] ([id_lich_hen])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[HoSoBenhAn] CHECK CONSTRAINT [FK_HoSo_LichHen]
GO
ALTER TABLE [dbo].[HoSoBenhAn]  WITH CHECK ADD  CONSTRAINT [FK_HoSo_NguoiCapNhat] FOREIGN KEY([nguoi_cap_nhat_gan_nhat])
REFERENCES [dbo].[NhanVien] ([id_nhan_vien])
GO
ALTER TABLE [dbo].[HoSoBenhAn] CHECK CONSTRAINT [FK_HoSo_NguoiCapNhat]
GO
ALTER TABLE [dbo].[HoSoBenhAn]  WITH CHECK ADD  CONSTRAINT [FK_HoSo_NguoiTao] FOREIGN KEY([id_nguoi_tao])
REFERENCES [dbo].[NhanVien] ([id_nhan_vien])
GO
ALTER TABLE [dbo].[HoSoBenhAn] CHECK CONSTRAINT [FK_HoSo_NguoiTao]
GO
ALTER TABLE [dbo].[KetQuaXetNghiem_ChiTiet]  WITH CHECK ADD  CONSTRAINT [FK_KQChiTiet_BAXN] FOREIGN KEY([id_xet_nghiem_benh_an])
REFERENCES [dbo].[BenhAn_XetNghiem] ([id_xet_nghiem_benh_an])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[KetQuaXetNghiem_ChiTiet] CHECK CONSTRAINT [FK_KQChiTiet_BAXN]
GO
ALTER TABLE [dbo].[KetQuaXetNghiem_ChiTiet]  WITH CHECK ADD  CONSTRAINT [FK_KQChiTiet_ChiSo] FOREIGN KEY([id_chi_so])
REFERENCES [dbo].[ChiSoXetNghiem] ([id_chi_so])
GO
ALTER TABLE [dbo].[KetQuaXetNghiem_ChiTiet] CHECK CONSTRAINT [FK_KQChiTiet_ChiSo]
GO
ALTER TABLE [dbo].[LichHen]  WITH CHECK ADD  CONSTRAINT [FK_LichHen_BacSi] FOREIGN KEY([id_bac_si])
REFERENCES [dbo].[NhanVien] ([id_nhan_vien])
GO
ALTER TABLE [dbo].[LichHen] CHECK CONSTRAINT [FK_LichHen_BacSi]
GO
ALTER TABLE [dbo].[LichHen]  WITH CHECK ADD  CONSTRAINT [FK_LichHen_KhachHang] FOREIGN KEY([id_khach_hang])
REFERENCES [dbo].[KhachHang] ([id_khach_hang])
GO
ALTER TABLE [dbo].[LichHen] CHECK CONSTRAINT [FK_LichHen_KhachHang]
GO
ALTER TABLE [dbo].[LichHen]  WITH CHECK ADD  CONSTRAINT [FK_LichHen_NguoiDat] FOREIGN KEY([id_nguoi_dat])
REFERENCES [dbo].[NhanVien] ([id_nhan_vien])
GO
ALTER TABLE [dbo].[LichHen] CHECK CONSTRAINT [FK_LichHen_NguoiDat]
GO
ALTER TABLE [dbo].[LichHen]  WITH CHECK ADD  CONSTRAINT [FK_LichHen_ThuCung] FOREIGN KEY([id_thu_cung])
REFERENCES [dbo].[ThuCung] ([id_thu_cung])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[LichHen] CHECK CONSTRAINT [FK_LichHen_ThuCung]
GO
ALTER TABLE [dbo].[LichLamViecNhanVien]  WITH CHECK ADD  CONSTRAINT [FK_LichLamViec_NhanVien] FOREIGN KEY([id_nhan_vien])
REFERENCES [dbo].[NhanVien] ([id_nhan_vien])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[LichLamViecNhanVien] CHECK CONSTRAINT [FK_LichLamViec_NhanVien]
GO
ALTER TABLE [dbo].[LoaiXetNghiem]  WITH CHECK ADD  CONSTRAINT [FK_LoaiXN_DanhMuc] FOREIGN KEY([id_danh_muc])
REFERENCES [dbo].[DanhMucXetNghiem] ([id_danh_muc])
GO
ALTER TABLE [dbo].[LoaiXetNghiem] CHECK CONSTRAINT [FK_LoaiXN_DanhMuc]
GO
ALTER TABLE [dbo].[LoThuoc]  WITH CHECK ADD  CONSTRAINT [FK_LoThuoc_NCC] FOREIGN KEY([id_ncc])
REFERENCES [dbo].[NhaCungCap] ([id_ncc])
GO
ALTER TABLE [dbo].[LoThuoc] CHECK CONSTRAINT [FK_LoThuoc_NCC]
GO
ALTER TABLE [dbo].[LoThuoc]  WITH CHECK ADD  CONSTRAINT [FK_LoThuoc_Thuoc] FOREIGN KEY([id_thuoc])
REFERENCES [dbo].[Thuoc] ([id_thuoc])
GO
ALTER TABLE [dbo].[LoThuoc] CHECK CONSTRAINT [FK_LoThuoc_Thuoc]
GO
ALTER TABLE [dbo].[NhanVien]  WITH CHECK ADD  CONSTRAINT [FK_NhanVien_TaiKhoan] FOREIGN KEY([id_tai_khoan])
REFERENCES [dbo].[TaiKhoan] ([id_tai_khoan])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[NhanVien] CHECK CONSTRAINT [FK_NhanVien_TaiKhoan]
GO
ALTER TABLE [dbo].[NhatKyHeThong]  WITH CHECK ADD  CONSTRAINT [FK_NhatKy_TaiKhoan] FOREIGN KEY([id_tai_khoan])
REFERENCES [dbo].[TaiKhoan] ([id_tai_khoan])
GO
ALTER TABLE [dbo].[NhatKyHeThong] CHECK CONSTRAINT [FK_NhatKy_TaiKhoan]
GO
ALTER TABLE [dbo].[PhanCongNhanVien]  WITH CHECK ADD  CONSTRAINT [FK_PhanCong_NhanVien] FOREIGN KEY([id_nhan_vien])
REFERENCES [dbo].[NhanVien] ([id_nhan_vien])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PhanCongNhanVien] CHECK CONSTRAINT [FK_PhanCong_NhanVien]
GO
ALTER TABLE [dbo].[PhanCongNhanVien]  WITH CHECK ADD  CONSTRAINT [FK_PhanCong_VaiTro] FOREIGN KEY([id_vai_tro])
REFERENCES [dbo].[VaiTroNhanVien] ([id_vai_tro])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PhanCongNhanVien] CHECK CONSTRAINT [FK_PhanCong_VaiTro]
GO
ALTER TABLE [dbo].[PhanQuyen]  WITH CHECK ADD  CONSTRAINT [FK_PhanQuyen_ChucNang] FOREIGN KEY([id_chuc_nang])
REFERENCES [dbo].[ChucNang] ([id_chuc_nang])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PhanQuyen] CHECK CONSTRAINT [FK_PhanQuyen_ChucNang]
GO
ALTER TABLE [dbo].[PhanQuyen]  WITH CHECK ADD  CONSTRAINT [FK_PhanQuyen_VaiTro] FOREIGN KEY([id_vai_tro])
REFERENCES [dbo].[VaiTroHeThong] ([id_vai_tro])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PhanQuyen] CHECK CONSTRAINT [FK_PhanQuyen_VaiTro]
GO
ALTER TABLE [dbo].[TaiKhoan]  WITH CHECK ADD  CONSTRAINT [FK_TaiKhoan_KhachHang] FOREIGN KEY([id_khach_hang])
REFERENCES [dbo].[KhachHang] ([id_khach_hang])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[TaiKhoan] CHECK CONSTRAINT [FK_TaiKhoan_KhachHang]
GO
ALTER TABLE [dbo].[TaiKhoan]  WITH CHECK ADD  CONSTRAINT [FK_TaiKhoan_VaiTro] FOREIGN KEY([id_vai_tro])
REFERENCES [dbo].[VaiTroHeThong] ([id_vai_tro])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[TaiKhoan] CHECK CONSTRAINT [FK_TaiKhoan_VaiTro]
GO
ALTER TABLE [dbo].[TaiKhoan_VaiTro]  WITH CHECK ADD  CONSTRAINT [FK_TKVaiTro_TaiKhoan] FOREIGN KEY([id_tai_khoan])
REFERENCES [dbo].[TaiKhoan] ([id_tai_khoan])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[TaiKhoan_VaiTro] CHECK CONSTRAINT [FK_TKVaiTro_TaiKhoan]
GO
ALTER TABLE [dbo].[TaiKhoan_VaiTro]  WITH CHECK ADD  CONSTRAINT [FK_TKVaiTro_VaiTro] FOREIGN KEY([id_vai_tro])
REFERENCES [dbo].[VaiTroHeThong] ([id_vai_tro])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[TaiKhoan_VaiTro] CHECK CONSTRAINT [FK_TKVaiTro_VaiTro]
GO
ALTER TABLE [dbo].[ThanhToan]  WITH CHECK ADD  CONSTRAINT [FK_ThanhToan_HoaDon] FOREIGN KEY([id_hoa_don])
REFERENCES [dbo].[HoaDon] ([id_hoa_don])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ThanhToan] CHECK CONSTRAINT [FK_ThanhToan_HoaDon]
GO
ALTER TABLE [dbo].[ThanhToan]  WITH CHECK ADD  CONSTRAINT [FK_ThanhToan_NhanVien] FOREIGN KEY([id_nhan_vien])
REFERENCES [dbo].[NhanVien] ([id_nhan_vien])
GO
ALTER TABLE [dbo].[ThanhToan] CHECK CONSTRAINT [FK_ThanhToan_NhanVien]
GO
ALTER TABLE [dbo].[ThuCung]  WITH CHECK ADD  CONSTRAINT [FK_ThuCung_KhachHang] FOREIGN KEY([id_khach_hang])
REFERENCES [dbo].[KhachHang] ([id_khach_hang])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ThuCung] CHECK CONSTRAINT [FK_ThuCung_KhachHang]
GO
ALTER TABLE [dbo].[TiemChung]  WITH CHECK ADD  CONSTRAINT [FK_TiemChung_BacSi] FOREIGN KEY([id_bac_si])
REFERENCES [dbo].[NhanVien] ([id_nhan_vien])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[TiemChung] CHECK CONSTRAINT [FK_TiemChung_BacSi]
GO
ALTER TABLE [dbo].[TiemChung]  WITH CHECK ADD  CONSTRAINT [FK_TiemChung_ThuCung] FOREIGN KEY([id_thu_cung])
REFERENCES [dbo].[ThuCung] ([id_thu_cung])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[TiemChung] CHECK CONSTRAINT [FK_TiemChung_ThuCung]
GO
ALTER TABLE [dbo].[HoaDon]  WITH CHECK ADD  CONSTRAINT [CK_HoaDon_TrangThai] CHECK  (([trang_thai]=N'da_huy' OR [trang_thai]=N'da_thanh_toan' OR [trang_thai]=N'chua_thanh_toan'))
GO
ALTER TABLE [dbo].[HoaDon] CHECK CONSTRAINT [CK_HoaDon_TrangThai]
GO
ALTER TABLE [dbo].[LichHen]  WITH CHECK ADD  CONSTRAINT [CK_LichHen_TrangThai] CHECK  (([trang_thai]=N'da_hoan_thanh' OR [trang_thai]=N'da_kham' OR [trang_thai]=N'da_huy' OR [trang_thai]=N'da_dat'))
GO
ALTER TABLE [dbo].[LichHen] CHECK CONSTRAINT [CK_LichHen_TrangThai]
GO
ALTER TABLE [dbo].[NhanVien]  WITH CHECK ADD  CONSTRAINT [CK_GioiTinh_NV] CHECK  (([gioi_tinh]=N'Khác' OR [gioi_tinh]=N'N?' OR [gioi_tinh]=N'Nam'))
GO
ALTER TABLE [dbo].[NhanVien] CHECK CONSTRAINT [CK_GioiTinh_NV]
GO
ALTER TABLE [dbo].[ThuCung]  WITH CHECK ADD  CONSTRAINT [CK_GioiTinh_Pet] CHECK  (([gioi_tinh]=N'd?c' OR [gioi_tinh]=N'cái' OR [gioi_tinh] IS NULL))
GO
ALTER TABLE [dbo].[ThuCung] CHECK CONSTRAINT [CK_GioiTinh_Pet]
GO
/****** Object:  StoredProcedure [dbo].[sp_AddAppointment]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =========================================
-- PH?N 4: STORED PROCEDURES
-- =========================================

-- Ð?t l?ch h?n
CREATE PROCEDURE [dbo].[sp_AddAppointment]
    @NgayHen        DATE,
    @GioHen         TIME,
    @LyDo           NVARCHAR(500) = NULL,
    @IdKhachHang    INT,
    @IdThuCung      INT,
    @IdBacSi        INT,
    @IdNguoiDat     INT = NULL,
    @PhongKham      NVARCHAR(100) = NULL,
    @GhiChu         NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.LichHen 
        (ngay_kham, gio_kham, ly_do, trang_thai, id_khach_hang, id_thu_cung, 
         id_bac_si, id_nguoi_dat, phong_kham, ghi_chu_noi_bo, ngay_tao)
    VALUES 
        (@NgayHen, @GioHen, @LyDo, N'da_dat', @IdKhachHang, @IdThuCung, 
         @IdBacSi, @IdNguoiDat, @PhongKham, @GhiChu, GETDATE());

    SELECT SCOPE_IDENTITY() AS id_lich_hen_moi;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_AddMedicalRecord]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- T?o h? so b?nh án
CREATE PROCEDURE [dbo].[sp_AddMedicalRecord]
    @IdLichHen          INT,
    @NgayKham           DATE,
    @IdBacSi            INT,
    @CanNang            DECIMAL(8,2),
    @NhietDo            DECIMAL(5,2),
    @TrieuChung         NVARCHAR(500),
    @ChanDoan           NVARCHAR(500),
    @PhacDoDieuTri      NVARCHAR(500) = NULL,
    @HuongDanChamSoc    NVARCHAR(500) = NULL,
    @IdNguoiTao         INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Ki?m tra l?ch h?n t?n t?i
    IF NOT EXISTS (SELECT 1 FROM dbo.LichHen WHERE id_lich_hen = @IdLichHen)
    BEGIN
        RAISERROR(N'Không tìm th?y l?ch h?n v?i id = %d', 16, 1, @IdLichHen);
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
        N'nhap', @IdNguoiTao, GETDATE()
    );

    -- C?p nh?t tr?ng thái l?ch h?n
    UPDATE dbo.LichHen 
    SET trang_thai = N'da_kham' 
    WHERE id_lich_hen = @IdLichHen;

    SELECT SCOPE_IDENTITY() AS id_ho_so_moi;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_CapNhatThongTinKhachHang]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- C?p nh?t thông tin khách hàng (khách hàng t? c?p nh?t)
CREATE   PROCEDURE [dbo].[sp_CapNhatThongTinKhachHang]
    @IdKhachHang INT,
    @TenKhachHang NVARCHAR(100),
    @Email NVARCHAR(100) = NULL,
    @SDT NVARCHAR(15) = NULL,
    @DiaChi NVARCHAR(255) = NULL
AS
BEGIN
    UPDATE dbo.KhachHang
    SET ten_khach_hang = @TenKhachHang,
        email = @Email,
        sdt = @SDT,
        dia_chi = @DiaChi,
        ngay_cap_nhat = GETDATE()
    WHERE id_khach_hang = @IdKhachHang;

    SELECT N'C?p nh?t thông tin thành công' AS ThongBao;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_CapNhatTonKho]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- C?p nh?t t?n kho th? công (dành cho qu?n lý kho)
CREATE PROCEDURE [dbo].[sp_CapNhatTonKho]
    @IdLo INT,
    @SoLuongThayDoi INT,
    @LoaiGiaoDich NVARCHAR(50),   -- 'nhap_them', 'xuat_huy', 'kiem_ke'...
    @IdNhanVien INT,
    @GhiChu NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.LoThuoc
    SET so_luong_ton = so_luong_ton + @SoLuongThayDoi,
        ngay_cap_nhat_ton_kho = GETDATE()
    WHERE id_lo = @IdLo;

    INSERT INTO dbo.GiaoDichKho 
        (id_lo, loai_giao_dich, so_luong, ngay_giao_dich, id_nhan_vien, ghi_chu)
    VALUES 
        (@IdLo, @LoaiGiaoDich, @SoLuongThayDoi, GETDATE(), @IdNhanVien, @GhiChu);

    SELECT N'C?p nh?t t?n kho thành công' AS ThongBao;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_DangKyKhachHang]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =========================================
-- PH?N B? SUNG 3: STORED PROCEDURE QUAN TR?NG CHO WEB
-- =========================================

-- Ðang ký tài kho?n khách hàng
CREATE   PROCEDURE [dbo].[sp_DangKyKhachHang]
    @TenDangNhap NVARCHAR(50),
    @MatKhau NVARCHAR(255),           -- s? du?c hash ? backend
    @TenKhachHang NVARCHAR(100),
    @Email NVARCHAR(100) = NULL,
    @SDT NVARCHAR(15) = NULL,
    @DiaChi NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- T?o khách hàng
        INSERT INTO dbo.KhachHang (ten_khach_hang, email, sdt, dia_chi, ngay_tao, ngay_cap_nhat, da_xoa)
        VALUES (@TenKhachHang, @Email, @SDT, @DiaChi, GETDATE(), GETDATE(), 0);

        DECLARE @IdKhachHang INT = SCOPE_IDENTITY();

        -- T?o tài kho?n
        INSERT INTO dbo.TaiKhoan (ten_dang_nhap, mat_khau, id_vai_tro, trang_thai, ngay_tao, id_khach_hang)
        VALUES (@TenDangNhap, @MatKhau, 
                (SELECT id_vai_tro FROM dbo.VaiTroHeThong WHERE ten_vai_tro = N'khách hàng'),
                N'active', GETDATE(), @IdKhachHang);

        COMMIT TRANSACTION;

        SELECT N'Ðang ký thành công' AS ThongBao, @IdKhachHang AS IdKhachHang;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_DangNhap]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Ðang nh?p (ki?m tra tài kho?n)
CREATE   PROCEDURE [dbo].[sp_DangNhap]
    @TenDangNhap NVARCHAR(50),
    @MatKhau NVARCHAR(255)
AS
BEGIN
    SELECT 
        t.id_tai_khoan,
        t.ten_dang_nhap,
        v.ten_vai_tro,
        t.trang_thai,
        ISNULL(k.id_khach_hang, 0) AS id_khach_hang,
        ISNULL(n.id_nhan_vien, 0) AS id_nhan_vien
    FROM dbo.TaiKhoan t
    LEFT JOIN dbo.VaiTroHeThong v ON t.id_vai_tro = v.id_vai_tro
    LEFT JOIN dbo.KhachHang k ON t.id_khach_hang = k.id_khach_hang
    LEFT JOIN dbo.NhanVien n ON t.id_tai_khoan = n.id_tai_khoan
    WHERE t.ten_dang_nhap = @TenDangNhap 
      AND t.mat_khau = @MatKhau
      AND t.trang_thai = N'active';
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_HuyLichHen]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- H?y l?ch h?n (c?p nh?t tr?ng thái)
CREATE PROCEDURE [dbo].[sp_HuyLichHen]
    @IdLichHen INT,
    @LyDoHuy NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.LichHen
    SET trang_thai = N'da_huy',
        ghi_chu_noi_bo = ISNULL(ghi_chu_noi_bo, '') + N' - H?y: ' + ISNULL(@LyDoHuy, N'')
    WHERE id_lich_hen = @IdLichHen;

    IF @@ROWCOUNT = 0
        RAISERROR(N'Không tìm th?y l?ch h?n d? h?y!', 16, 1);
    ELSE
        SELECT N'H?y l?ch h?n thành công' AS ThongBao;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_LapHoaDon]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- L?p hóa don
CREATE PROCEDURE [dbo].[sp_LapHoaDon]
    @IdLichHen          INT,
    @ThueSuat           DECIMAL(5,2) = 0,
    @TongTienGiamGia    DECIMAL(12,2) = 0,
    @IdNhanVienLap      INT,
    @GhiChu             NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @IdKhachHang INT;
    DECLARE @TongTruocGiam DECIMAL(12,2) = 0;
    DECLARE @TongSauGiam DECIMAL(12,2);
    DECLARE @ThuePhai DECIMAL(12,2);
    DECLARE @TongCuoi DECIMAL(12,2);

    -- L?y thông tin khách hàng t? l?ch h?n
    SELECT @IdKhachHang = id_khach_hang 
    FROM dbo.LichHen 
    WHERE id_lich_hen = @IdLichHen;

    IF @IdKhachHang IS NULL
    BEGIN
        RAISERROR(N'Không tìm th?y l?ch h?n v?i id = %d', 16, 1, @IdLichHen);
        RETURN;
    END

    -- Tính t?ng ti?n t? d?ch v?
    SELECT @TongTruocGiam = ISNULL(SUM(so_luong * don_gia), 0)
    FROM dbo.DichVuLichHen 
    WHERE id_lich_hen = @IdLichHen;

    SET @TongSauGiam = @TongTruocGiam - ISNULL(@TongTienGiamGia, 0);
    SET @ThuePhai    = @TongSauGiam * ISNULL(@ThueSuat, 0) / 100;
    SET @TongCuoi    = @TongSauGiam + @ThuePhai;

    INSERT INTO dbo.HoaDon (
        id_lich_hen, id_khach_hang,
        tong_tien_truoc_giam_gia, tong_tien_giam_gia, tong_tien_sau_giam_gia,
        thue_suat, thue_phai_nop, tong_tien_cuoi,
        ngay_lap, id_nhan_vien, trang_thai, ghi_chu
    )
    VALUES (
        @IdLichHen, @IdKhachHang,
        @TongTruocGiam, @TongTienGiamGia, @TongSauGiam,
        @ThueSuat, @ThuePhai, @TongCuoi,
        GETDATE(), @IdNhanVienLap, N'chua_thanh_toan', @GhiChu
    );

    SELECT SCOPE_IDENTITY() AS id_hoa_don_moi;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_LichHenCuaKhachHang]    Script Date: 23/04/2026 16:26:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- L?y l?ch h?n c?a khách hàng (dùng cho khách hàng xem)
CREATE   PROCEDURE [dbo].[sp_LichHenCuaKhachHang]
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
GO
USE [master]
GO
ALTER DATABASE [PhongKhamThuY] SET  READ_WRITE 
GO
