USE [master]
GO
/****** Object:  Database [PhongKhamThuY]    Script Date: 10/05/2026 01:52:59 ******/
CREATE DATABASE [PhongKhamThuY]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'PhongKhamThuY', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQL\DATA\PhongKhamThuY.mdf' , SIZE = 73728KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'PhongKhamThuY_log', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQL\DATA\PhongKhamThuY_log.ldf' , SIZE = 73728KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
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
ALTER DATABASE [PhongKhamThuY] SET QUERY_STORE = ON
GO
ALTER DATABASE [PhongKhamThuY] SET QUERY_STORE (OPERATION_MODE = READ_WRITE, CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30), DATA_FLUSH_INTERVAL_SECONDS = 900, INTERVAL_LENGTH_MINUTES = 60, MAX_STORAGE_SIZE_MB = 1000, QUERY_CAPTURE_MODE = AUTO, SIZE_BASED_CLEANUP_MODE = AUTO)
GO
USE [PhongKhamThuY]
GO
ALTER DATABASE SCOPED CONFIGURATION SET ACCELERATED_PLAN_FORCING = ON;
GO
ALTER DATABASE SCOPED CONFIGURATION SET ASYNC_STATS_UPDATE_WAIT_AT_LOW_PRIORITY = OFF;
GO
ALTER DATABASE SCOPED CONFIGURATION SET BATCH_MODE_ADAPTIVE_JOINS = ON;
GO
ALTER DATABASE SCOPED CONFIGURATION SET BATCH_MODE_MEMORY_GRANT_FEEDBACK = ON;
GO
ALTER DATABASE SCOPED CONFIGURATION SET BATCH_MODE_ON_ROWSTORE = ON;
GO
ALTER DATABASE SCOPED CONFIGURATION SET CE_FEEDBACK = ON;
GO
ALTER DATABASE SCOPED CONFIGURATION SET DEFERRED_COMPILATION_TV = ON;
GO
ALTER DATABASE SCOPED CONFIGURATION SET DOP_FEEDBACK = OFF;
GO
ALTER DATABASE SCOPED CONFIGURATION SET DW_COMPATIBILITY_LEVEL = 0;
GO
ALTER DATABASE SCOPED CONFIGURATION SET ELEVATE_ONLINE = OFF;
GO
ALTER DATABASE SCOPED CONFIGURATION SET ELEVATE_RESUMABLE = OFF;
GO
ALTER DATABASE SCOPED CONFIGURATION SET EXEC_QUERY_STATS_FOR_SCALAR_FUNCTIONS = ON;
GO
ALTER DATABASE SCOPED CONFIGURATION SET FORCE_SHOWPLAN_RUNTIME_PARAMETER_COLLECTION = OFF;
GO
ALTER DATABASE SCOPED CONFIGURATION SET GLOBAL_TEMPORARY_TABLE_AUTO_DROP = ON;
GO
ALTER DATABASE SCOPED CONFIGURATION SET IDENTITY_CACHE = ON;
GO
ALTER DATABASE SCOPED CONFIGURATION SET INTERLEAVED_EXECUTION_TVF = ON;
GO
ALTER DATABASE SCOPED CONFIGURATION SET ISOLATE_SECURITY_POLICY_CARDINALITY = OFF;
GO
ALTER DATABASE SCOPED CONFIGURATION SET LAST_QUERY_PLAN_STATS = OFF;
GO
ALTER DATABASE SCOPED CONFIGURATION SET LEDGER_DIGEST_STORAGE_ENDPOINT = OFF;
GO
ALTER DATABASE SCOPED CONFIGURATION SET LEGACY_CARDINALITY_ESTIMATION = OFF;
GO
ALTER DATABASE SCOPED CONFIGURATION FOR SECONDARY SET LEGACY_CARDINALITY_ESTIMATION = PRIMARY;
GO
ALTER DATABASE SCOPED CONFIGURATION SET LIGHTWEIGHT_QUERY_PROFILING = ON;
GO
ALTER DATABASE SCOPED CONFIGURATION SET MAXDOP = 0;
GO
ALTER DATABASE SCOPED CONFIGURATION FOR SECONDARY SET MAXDOP = PRIMARY;
GO
ALTER DATABASE SCOPED CONFIGURATION SET MEMORY_GRANT_FEEDBACK_PERCENTILE_GRANT = ON;
GO
ALTER DATABASE SCOPED CONFIGURATION SET MEMORY_GRANT_FEEDBACK_PERSISTENCE = ON;
GO
ALTER DATABASE SCOPED CONFIGURATION SET OPTIMIZED_PLAN_FORCING = ON;
GO
ALTER DATABASE SCOPED CONFIGURATION SET OPTIMIZE_FOR_AD_HOC_WORKLOADS = OFF;
GO
ALTER DATABASE SCOPED CONFIGURATION SET PARAMETER_SENSITIVE_PLAN_OPTIMIZATION = ON;
GO
ALTER DATABASE SCOPED CONFIGURATION SET PARAMETER_SNIFFING = ON;
GO
ALTER DATABASE SCOPED CONFIGURATION FOR SECONDARY SET PARAMETER_SNIFFING = PRIMARY;
GO
ALTER DATABASE SCOPED CONFIGURATION SET PAUSED_RESUMABLE_INDEX_ABORT_DURATION_MINUTES = 1440;
GO
ALTER DATABASE SCOPED CONFIGURATION SET QUERY_OPTIMIZER_HOTFIXES = OFF;
GO
ALTER DATABASE SCOPED CONFIGURATION FOR SECONDARY SET QUERY_OPTIMIZER_HOTFIXES = PRIMARY;
GO
ALTER DATABASE SCOPED CONFIGURATION SET ROW_MODE_MEMORY_GRANT_FEEDBACK = ON;
GO
ALTER DATABASE SCOPED CONFIGURATION SET TSQL_SCALAR_UDF_INLINING = ON;
GO
ALTER DATABASE SCOPED CONFIGURATION SET VERBOSE_TRUNCATION_WARNINGS = ON;
GO
ALTER DATABASE SCOPED CONFIGURATION SET XTP_PROCEDURE_EXECUTION_STATISTICS = OFF;
GO
ALTER DATABASE SCOPED CONFIGURATION SET XTP_QUERY_EXECUTION_STATISTICS = OFF;
GO
USE [PhongKhamThuY]
GO
/****** Object:  UserDefinedFunction [dbo].[fn_CalculatePetAge]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- TÃ¡i táº¡o cÃ¡c Function
CREATE FUNCTION [dbo].[fn_CalculatePetAge] (@NgaySinh DATE)
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

GO
/****** Object:  UserDefinedFunction [dbo].[fn_GetInvoiceTotal]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE FUNCTION [dbo].[fn_GetInvoiceTotal] (@IdHoaDon VARCHAR(20))
RETURNS DECIMAL(12,2)
AS
BEGIN
    DECLARE @Total DECIMAL(12,2);
    SELECT @Total = tong_tien_cuoi FROM dbo.HoaDon WHERE id_hoa_don = @IdHoaDon;
    RETURN ISNULL(@Total, 0);
END;

GO
/****** Object:  Table [dbo].[NhanVien]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[NhanVien](
	[id_nhan_vien] [varchar](20) NOT NULL,
	[ho_ten] [nvarchar](100) NULL,
	[ngay_sinh] [date] NULL,
	[gioi_tinh] [nvarchar](10) NULL,
	[dia_chi] [nvarchar](255) NULL,
	[so_dien_thoai] [varchar](255) NULL,
	[email] [nvarchar](100) NULL,
	[so_cccd] [nvarchar](20) NULL,
	[ngay_vao_lam] [date] NOT NULL,
	[ngay_nghi_viec] [date] NULL,
	[trang_thai] [nvarchar](50) NULL,
	[da_xoa] [bit] NOT NULL,
	[chuyen_mon] [varchar](255) NULL,
 CONSTRAINT [PK_NhanVien] PRIMARY KEY CLUSTERED 
(
	[id_nhan_vien] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[KhachHang]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[KhachHang](
	[id_khach_hang] [varchar](20) NOT NULL,
	[ten_khach_hang] [nvarchar](100) NOT NULL,
	[email] [nvarchar](100) NULL,
	[sdt] [nvarchar](15) NULL,
	[dia_chi] [nvarchar](255) NULL,
	[ngay_tao] [datetime] NOT NULL,
	[ngay_cap_nhat] [datetime] NULL,
	[da_xoa] [bit] NOT NULL,
	[nhan_email] [bit] NULL,
	[nhan_sms] [bit] NULL,
 CONSTRAINT [PK_KhachHang] PRIMARY KEY CLUSTERED 
(
	[id_khach_hang] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ThuCung]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ThuCung](
	[id_thu_cung] [varchar](20) NOT NULL,
	[ten_thu_cung] [nvarchar](100) NOT NULL,
	[loai] [nvarchar](50) NULL,
	[giong] [nvarchar](100) NULL,
	[ngay_sinh] [date] NULL,
	[gioi_tinh] [nvarchar](10) NULL,
	[mau_sac] [varchar](255) NULL,
	[trong_luong] [numeric](38, 2) NULL,
	[id_khach_hang] [varchar](20) NOT NULL,
	[ngay_tao] [datetime] NOT NULL,
	[da_xoa] [bit] NOT NULL,
	[url_anh] [nvarchar](500) NULL,
 CONSTRAINT [PK_ThuCung] PRIMARY KEY CLUSTERED 
(
	[id_thu_cung] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LichHen]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LichHen](
	[id_lich_hen] [varchar](20) NOT NULL,
	[ngay_kham] [date] NOT NULL,
	[gio_kham] [time](7) NOT NULL,
	[ly_do] [nvarchar](255) NULL,
	[trang_thai] [nvarchar](50) NULL,
	[id_khach_hang] [varchar](20) NOT NULL,
	[id_thu_cung] [varchar](20) NOT NULL,
	[id_bac_si] [varchar](20) NOT NULL,
	[id_nguoi_dat] [varchar](20) NULL,
	[phong_kham] [nvarchar](100) NULL,
	[ghi_chu_noi_bo] [nvarchar](255) NULL,
	[ngay_tao] [datetime] NOT NULL,
	[id_dich_vu] [varchar](20) NULL,
 CONSTRAINT [PK_LichHen] PRIMARY KEY CLUSTERED 
(
	[id_lich_hen] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [dbo].[v_LichHenHomNay]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- TÃ¡i táº¡o cÃ¡c View
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
LEFT JOIN dbo.NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien
WHERE lh.ngay_kham = CAST(GETDATE() AS DATE)
  AND lh.trang_thai <> N'da_huy';

GO
/****** Object:  Table [dbo].[HoSoBenhAn]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[HoSoBenhAn](
	[id_ho_so_benh_an] [varchar](20) NOT NULL,
	[id_lich_hen] [varchar](20) NOT NULL,
	[ngay_kham] [date] NOT NULL,
	[id_bac_si] [varchar](20) NOT NULL,
	[can_nang] [numeric](38, 2) NULL,
	[nhiet_do] [numeric](38, 2) NULL,
	[huyet_ap] [nvarchar](255) NULL,
	[trieu_chung] [nvarchar](max) NULL,
	[ket_qua_tham_kham] [nvarchar](max) NULL,
	[chan_doan] [nvarchar](max) NULL,
	[phac_do_dieu_tri] [nvarchar](max) NULL,
	[huong_dan_cham_soc] [nvarchar](max) NULL,
	[ngay_tai_kham_de_xuat] [date] NULL,
	[trang_thai_ho_so] [nvarchar](50) NULL,
	[id_nguoi_tao] [varchar](20) NOT NULL,
	[ngay_tao] [datetime] NOT NULL,
	[nguoi_cap_nhat_gan_nhat] [varchar](20) NULL,
	[ngay_cap_nhat_gan_nhat] [datetime] NULL,
	[id_thu_cung] [varchar](20) NULL,
 CONSTRAINT [PK_HoSoBenhAn] PRIMARY KEY CLUSTERED 
(
	[id_ho_so_benh_an] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  View [dbo].[v_HoSoBenhAn_GanDay]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [dbo].[v_HoSoBenhAn_GanDay] AS
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

GO
/****** Object:  Table [dbo].[HoaDon]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[HoaDon](
	[id_hoa_don] [varchar](20) NOT NULL,
	[id_lich_hen] [varchar](20) NOT NULL,
	[id_khach_hang] [varchar](20) NOT NULL,
	[tong_tien_truoc_giam_gia] [numeric](38, 2) NULL,
	[tong_tien_giam_gia] [numeric](38, 2) NULL,
	[tong_tien_sau_giam_gia] [numeric](38, 2) NULL,
	[thue_suat] [numeric](38, 2) NULL,
	[thue_phai_nop] [numeric](38, 2) NULL,
	[tong_tien_cuoi] [numeric](38, 2) NULL,
	[ngay_lap] [datetime] NOT NULL,
	[id_nhan_vien] [varchar](20) NOT NULL,
	[trang_thai] [nvarchar](50) NULL,
	[ghi_chu] [nvarchar](255) NULL,
	[trang_thai_thanh_toan] [nvarchar](50) NULL,
	[ngay_lap_hoa_don] [datetime] NULL,
	[tong_tien_ban_dau] [numeric](38, 2) NULL,
	[tong_giam_gia] [numeric](38, 2) NULL,
 CONSTRAINT [PK_HoaDon] PRIMARY KEY CLUSTERED 
(
	[id_hoa_don] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [dbo].[v_DoanhThu_TheoThang]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [dbo].[v_DoanhThu_TheoThang] AS
SELECT 
    YEAR(ngay_lap) AS Nam,
    MONTH(ngay_lap) AS Thang,
    COUNT(id_hoa_don) AS SoHoaDon,
    SUM(tong_tien_cuoi) AS TongDoanhThu
FROM dbo.HoaDon
WHERE trang_thai = N'da_thanh_toan'
GROUP BY YEAR(ngay_lap), MONTH(ngay_lap);

GO
/****** Object:  View [dbo].[v_DoanhThuThang]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[v_DoanhThuThang] AS
SELECT 
    MONTH(ngay_lap) AS Thang, 
    YEAR(ngay_lap) AS Nam, 
    SUM(tong_tien_cuoi) AS TongDoanhThu
FROM HoaDon
WHERE trang_thai_thanh_toan = N'Ðã thanh toán'
GROUP BY MONTH(ngay_lap), YEAR(ngay_lap);
GO
/****** Object:  Table [dbo].[Thuoc]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Thuoc](
	[id_thuoc] [varchar](20) NOT NULL,
	[ten_thuoc] [nvarchar](100) NOT NULL,
	[thanh_phan] [nvarchar](255) NULL,
	[dang_bao_che] [nvarchar](50) NULL,
	[don_vi] [nvarchar](20) NULL,
	[mo_ta] [nvarchar](500) NULL,
	[gia_ban] [decimal](10, 2) NOT NULL,
	[trang_thai] [bit] NOT NULL,
	[da_xoa] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_thuoc] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LoThuoc]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LoThuoc](
	[id_lo] [varchar](20) NOT NULL,
	[id_thuoc] [varchar](20) NOT NULL,
	[id_ncc] [varchar](20) NOT NULL,
	[so_lo] [nvarchar](100) NOT NULL,
	[ngay_nhap] [date] NOT NULL,
	[han_su_dung] [date] NOT NULL,
	[gia_nhap] [decimal](18, 2) NOT NULL,
	[so_luong_nhap] [int] NOT NULL,
	[so_luong_ton] [int] NOT NULL,
	[ngay_cap_nhat_ton_kho] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_lo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [dbo].[v_ThuocSapHetHan]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[v_ThuocSapHetHan] AS
                        SELECT 
                            t.ten_thuoc, 
                            lt.so_lo, 
                            lt.so_luong_ton,
                            lt.han_su_dung AS han_dung,
                            DATEDIFF(day, GETDATE(), lt.han_su_dung) AS so_ngay_con_lai
                        FROM LoThuoc lt
                        JOIN Thuoc t ON lt.id_thuoc = t.id_thuoc
                        WHERE lt.han_su_dung <= DATEADD(day, 60, GETDATE()) AND lt.so_luong_ton > 0;
GO
/****** Object:  Table [dbo].[CauHinhHeThong]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CauHinhHeThong](
	[khoa_cau_hinh] [nvarchar](100) NOT NULL,
	[gia_tri_cau_hinh] [nvarchar](max) NULL,
	[mo_ta] [nvarchar](255) NULL,
	[ngay_cap_nhat] [datetime] NOT NULL,
	[id_nguoi_cap_nhat] [varchar](20) NULL,
 CONSTRAINT [PK_CauHinhHeThong] PRIMARY KEY CLUSTERED 
(
	[khoa_cau_hinh] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DichVu]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DichVu](
	[id_dich_vu] [varchar](20) NOT NULL,
	[ten_dich_vu] [nvarchar](200) NOT NULL,
	[mo_ta] [varchar](255) NULL,
	[gia] [numeric](38, 2) NULL,
	[thoi_luong_phut] [int] NULL,
	[trang_thai] [bit] NOT NULL,
	[da_xoa] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_dich_vu] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DonThuoc]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DonThuoc](
	[id_don_thuoc] [varchar](20) NOT NULL,
	[id_ho_so_benh_an] [varchar](20) NOT NULL,
	[id_bac_si] [varchar](20) NOT NULL,
	[ngay_ke_don] [datetime] NULL,
	[ghi_chu] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_don_thuoc] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DonThuocChiTiet]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DonThuocChiTiet](
	[id_chi_tiet_don_thuoc] [varchar](20) NOT NULL,
	[id_don_thuoc] [varchar](20) NOT NULL,
	[id_thuoc] [varchar](20) NOT NULL,
	[so_luong] [int] NOT NULL,
	[lieu_dung] [nvarchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_chi_tiet_don_thuoc] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[file_dinh_kem]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[file_dinh_kem](
	[duong_dan] [varchar](255) NULL,
	[kich_thuoc] [bigint] NULL,
	[loai] [varchar](255) NULL,
	[ngay_upload] [datetime2](6) NULL,
	[ten_file] [varchar](255) NULL,
	[id] [varchar](20) NOT NULL,
	[id_ho_so_benh_an] [varchar](20) NULL,
 CONSTRAINT [PK_file_dinh_kem] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[GiaoDichKho]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GiaoDichKho](
	[id_giao_dich] [varchar](20) NOT NULL,
	[id_thuoc] [varchar](20) NULL,
	[id_lo] [varchar](20) NULL,
	[loai_giao_dich] [nvarchar](50) NOT NULL,
	[so_luong] [int] NOT NULL,
	[gia_tri] [decimal](18, 2) NULL,
	[ngay_giao_dich] [datetime] NOT NULL,
	[id_nhan_vien] [varchar](20) NOT NULL,
	[ghi_chu] [nvarchar](500) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_giao_dich] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[HoaDonChiTiet]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[HoaDonChiTiet](
	[id_chi_tiet_hoa_don] [varchar](20) NOT NULL,
	[id_hoa_don] [varchar](20) NOT NULL,
	[ten_muc] [nvarchar](255) NOT NULL,
	[loai_muc] [nvarchar](50) NULL,
	[so_luong] [int] NULL,
	[don_gia] [decimal](18, 2) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id_chi_tiet_hoa_don] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LichLamViecNhanVien]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LichLamViecNhanVien](
	[id_lich_lam_viec] [varchar](20) NOT NULL,
	[id_nhan_vien] [varchar](20) NOT NULL,
	[ngay_lam] [date] NOT NULL,
	[gio_bat_dau] [time](7) NOT NULL,
	[gio_ket_thuc] [time](7) NOT NULL,
	[ghi_chu] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_lich_lam_viec] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LichSuTuVan]    Script Date: 10/05/2026 01:52:59 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LichSuTuVan](
	[id_tu_van] [varchar](20) NOT NULL,
	[id_khach_hang] [varchar](20) NULL,
	[id_thu_cung] [varchar](20) NULL,
	[noi_dung_khach] [nvarchar](max) NULL,
	[noi_dung_rexi] [nvarchar](max) NULL,
	[ngay_tu_van] [datetime] NULL,
	[id_bac_si] [varchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_tu_van] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[NhaCungCap]    Script Date: 10/05/2026 01:53:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[NhaCungCap](
	[id_ncc] [varchar](20) NOT NULL,
	[ten_ncc] [nvarchar](255) NOT NULL,
	[dia_chi] [nvarchar](255) NULL,
	[so_dien_thoai] [nvarchar](15) NULL,
	[email] [nvarchar](100) NULL,
	[ma_so_thue] [nvarchar](20) NULL,
	[ghi_chu] [nvarchar](500) NULL,
	[ngay_tao] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id_ncc] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TaiKhoan]    Script Date: 10/05/2026 01:53:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TaiKhoan](
	[id_tai_khoan] [varchar](20) NOT NULL,
	[ten_dang_nhap] [nvarchar](50) NOT NULL,
	[mat_khau] [nvarchar](255) NOT NULL,
	[id_vai_tro] [varchar](20) NULL,
	[trang_thai] [nvarchar](50) NULL,
	[ngay_tao] [datetime] NOT NULL,
	[id_khach_hang] [varchar](20) NULL,
	[mat_khau_hash] [nvarchar](255) NULL,
	[id_nhan_vien] [varchar](20) NULL,
 CONSTRAINT [PK_TaiKhoan] PRIMARY KEY CLUSTERED 
(
	[id_tai_khoan] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ThanhToan]    Script Date: 10/05/2026 01:53:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ThanhToan](
	[id_thanh_toan] [varchar](20) NOT NULL,
	[id_hoa_don] [varchar](20) NOT NULL,
	[so_tien] [decimal](12, 2) NOT NULL,
	[phuong_thuc] [nvarchar](50) NULL,
	[ngay_tra_tien] [datetime] NULL,
	[id_nhan_vien] [varchar](20) NULL,
	[ma_giao_dich_ngan_hang] [nvarchar](100) NULL,
	[ghi_chu] [nvarchar](500) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_thanh_toan] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ThongBao]    Script Date: 10/05/2026 01:53:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ThongBao](
	[id_thong_bao] [varchar](20) NOT NULL,
	[id_tai_khoan] [varchar](20) NOT NULL,
	[tieu_de] [nvarchar](255) NULL,
	[noi_dung] [nvarchar](max) NULL,
	[loai_thong_bao] [nvarchar](50) NULL,
	[ngay_tao] [datetime] NOT NULL,
	[da_doc] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_thong_bao] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TiemChung]    Script Date: 10/05/2026 01:53:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TiemChung](
	[id_tiem_chung] [varchar](20) NOT NULL,
	[id_thu_cung] [varchar](20) NOT NULL,
	[ten_vaccine] [nvarchar](100) NOT NULL,
	[ngay_tiem] [date] NOT NULL,
	[ngay_tiem_lai] [date] NULL,
	[id_bac_si] [varchar](20) NULL,
	[ghi_chu] [nvarchar](500) NULL,
	[loai_vaccine] [nvarchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_tiem_chung] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VaiTroHeThong]    Script Date: 10/05/2026 01:53:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VaiTroHeThong](
	[id_vai_tro] [varchar](20) NOT NULL,
	[ten_vai_tro] [nvarchar](50) NOT NULL,
	[mo_ta] [nvarchar](255) NULL,
 CONSTRAINT [PK_VaiTroHeThong] PRIMARY KEY CLUSTERED 
(
	[id_vai_tro] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[DichVu] ([id_dich_vu], [ten_dich_vu], [mo_ta], [gia], [thoi_luong_phut], [trang_thai], [da_xoa]) VALUES (N'DV-501', N'Khám t?ng quát', N'Ki?m tra s?c kh?e toàn di?n cho thú cung', CAST(150000.00 AS Numeric(38, 2)), 30, 1, 0)
INSERT [dbo].[DichVu] ([id_dich_vu], [ten_dich_vu], [mo_ta], [gia], [thoi_luong_phut], [trang_thai], [da_xoa]) VALUES (N'DV-502', N'Tiêm phòng', N'Tiêm vaccine d?nh k? theo l?ch tiêm ch?ng', CAST(200000.00 AS Numeric(38, 2)), 20, 1, 0)
INSERT [dbo].[DichVu] ([id_dich_vu], [ten_dich_vu], [mo_ta], [gia], [thoi_luong_phut], [trang_thai], [da_xoa]) VALUES (N'DV-503', N'T?m & V? sinh', N'T?m, s?y và v? sinh toàn thân cho bé', CAST(120000.00 AS Numeric(38, 2)), 60, 1, 0)
INSERT [dbo].[DichVu] ([id_dich_vu], [ten_dich_vu], [mo_ta], [gia], [thoi_luong_phut], [trang_thai], [da_xoa]) VALUES (N'DV-504', N'C?t t?a lông', N'C?t t?a lông theo yêu c?u khách hàng', CAST(180000.00 AS Numeric(38, 2)), 90, 1, 0)
INSERT [dbo].[DichVu] ([id_dich_vu], [ten_dich_vu], [mo_ta], [gia], [thoi_luong_phut], [trang_thai], [da_xoa]) VALUES (N'DV-505', N'Siêu âm', N'Ch?n doán hình ?nh b?ng siêu âm', CAST(350000.00 AS Numeric(38, 2)), 30, 1, 0)
INSERT [dbo].[DichVu] ([id_dich_vu], [ten_dich_vu], [mo_ta], [gia], [thoi_luong_phut], [trang_thai], [da_xoa]) VALUES (N'DV-506', N'Xét nghi?m máu', N'Xét nghi?m máu toàn ph?n', CAST(280000.00 AS Numeric(38, 2)), 20, 1, 0)
INSERT [dbo].[DichVu] ([id_dich_vu], [ten_dich_vu], [mo_ta], [gia], [thoi_luong_phut], [trang_thai], [da_xoa]) VALUES (N'DV-507', N'Ph?u thu?t nh?', N'Các ca ph?u thu?t nhu thi?n, c?t u nang', CAST(1500000.00 AS Numeric(38, 2)), 120, 1, 0)
INSERT [dbo].[DichVu] ([id_dich_vu], [ten_dich_vu], [mo_ta], [gia], [thoi_luong_phut], [trang_thai], [da_xoa]) VALUES (N'DV-508', N'Nh? rang', N'Nh? rang sâu và v? sinh rang mi?ng', CAST(250000.00 AS Numeric(38, 2)), 45, 1, 0)
INSERT [dbo].[HoaDon] ([id_hoa_don], [id_lich_hen], [id_khach_hang], [tong_tien_truoc_giam_gia], [tong_tien_giam_gia], [tong_tien_sau_giam_gia], [thue_suat], [thue_phai_nop], [tong_tien_cuoi], [ngay_lap], [id_nhan_vien], [trang_thai], [ghi_chu], [trang_thai_thanh_toan], [ngay_lap_hoa_don], [tong_tien_ban_dau], [tong_giam_gia]) VALUES (N'HD-5', N'LH-7', N'KH-1', NULL, NULL, NULL, NULL, NULL, CAST(550000.00 AS Numeric(38, 2)), CAST(N'2026-03-28T03:07:04.073' AS DateTime), N'NV-37', NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[HoaDon] ([id_hoa_don], [id_lich_hen], [id_khach_hang], [tong_tien_truoc_giam_gia], [tong_tien_giam_gia], [tong_tien_sau_giam_gia], [thue_suat], [thue_phai_nop], [tong_tien_cuoi], [ngay_lap], [id_nhan_vien], [trang_thai], [ghi_chu], [trang_thai_thanh_toan], [ngay_lap_hoa_don], [tong_tien_ban_dau], [tong_giam_gia]) VALUES (N'HD-6', N'LH-8', N'KH-1', NULL, NULL, NULL, NULL, NULL, CAST(1210000.00 AS Numeric(38, 2)), CAST(N'2026-04-20T03:07:04.077' AS DateTime), N'NV-37', NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[HoSoBenhAn] ([id_ho_so_benh_an], [id_lich_hen], [ngay_kham], [id_bac_si], [can_nang], [nhiet_do], [huyet_ap], [trieu_chung], [ket_qua_tham_kham], [chan_doan], [phac_do_dieu_tri], [huong_dan_cham_soc], [ngay_tai_kham_de_xuat], [trang_thai_ho_so], [id_nguoi_tao], [ngay_tao], [nguoi_cap_nhat_gan_nhat], [ngay_cap_nhat_gan_nhat], [id_thu_cung]) VALUES (N'HS-5', N'LH-7', CAST(N'2026-03-28' AS Date), N'NV-37', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, N'NV-37', CAST(N'2026-04-27T03:07:04.073' AS DateTime), NULL, NULL, NULL)
INSERT [dbo].[HoSoBenhAn] ([id_ho_so_benh_an], [id_lich_hen], [ngay_kham], [id_bac_si], [can_nang], [nhiet_do], [huyet_ap], [trieu_chung], [ket_qua_tham_kham], [chan_doan], [phac_do_dieu_tri], [huong_dan_cham_soc], [ngay_tai_kham_de_xuat], [trang_thai_ho_so], [id_nguoi_tao], [ngay_tao], [nguoi_cap_nhat_gan_nhat], [ngay_cap_nhat_gan_nhat], [id_thu_cung]) VALUES (N'HS-6', N'LH-8', CAST(N'2026-04-20' AS Date), N'NV-37', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, N'NV-37', CAST(N'2026-04-27T03:07:04.077' AS DateTime), NULL, NULL, NULL)
INSERT [dbo].[KhachHang] ([id_khach_hang], [ten_khach_hang], [email], [sdt], [dia_chi], [ngay_tao], [ngay_cap_nhat], [da_xoa], [nhan_email], [nhan_sms]) VALUES (N'KH-1', N'Hoàng Minh', N'khachhang@rexi.vn', N'0987654322', N'NÐ', CAST(N'2026-04-27T02:55:59.343' AS DateTime), CAST(N'2026-05-09T23:14:59.270' AS DateTime), 0, NULL, NULL)
INSERT [dbo].[KhachHang] ([id_khach_hang], [ten_khach_hang], [email], [sdt], [dia_chi], [ngay_tao], [ngay_cap_nhat], [da_xoa], [nhan_email], [nhan_sms]) VALUES (N'KH-12', N'Kh', N'testkhach@rexi.vn', N'0987654321', N'', CAST(N'2026-04-28T17:07:59.130' AS DateTime), CAST(N'2026-05-09T23:14:59.270' AS DateTime), 0, NULL, NULL)
INSERT [dbo].[KhachHang] ([id_khach_hang], [ten_khach_hang], [email], [sdt], [dia_chi], [ngay_tao], [ngay_cap_nhat], [da_xoa], [nhan_email], [nhan_sms]) VALUES (N'KH-13', N'minh', N'tr@gmail.com', N'0000000000', N'', CAST(N'2026-04-28T18:23:01.340' AS DateTime), CAST(N'2026-05-09T23:14:59.270' AS DateTime), 0, NULL, NULL)
INSERT [dbo].[KhachHang] ([id_khach_hang], [ten_khach_hang], [email], [sdt], [dia_chi], [ngay_tao], [ngay_cap_nhat], [da_xoa], [nhan_email], [nhan_sms]) VALUES (N'KH-15', N'Test User', N'admintest_unique@example.com', N'0987654321', N'123 Street', CAST(N'2026-04-28T22:41:39.203' AS DateTime), CAST(N'2026-05-09T23:14:59.270' AS DateTime), 0, NULL, NULL)
INSERT [dbo].[KhachHang] ([id_khach_hang], [ten_khach_hang], [email], [sdt], [dia_chi], [ngay_tao], [ngay_cap_nhat], [da_xoa], [nhan_email], [nhan_sms]) VALUES (N'KH-17', N'Final Test', N'final@example.com', N'0987654321', N'Hanoi', CAST(N'2026-04-29T10:11:42.920' AS DateTime), CAST(N'2026-05-09T23:14:59.270' AS DateTime), 0, NULL, NULL)
INSERT [dbo].[KhachHang] ([id_khach_hang], [ten_khach_hang], [email], [sdt], [dia_chi], [ngay_tao], [ngay_cap_nhat], [da_xoa], [nhan_email], [nhan_sms]) VALUES (N'KH-18', N'Nguy?n Van Demo', N'demo@rexi.vn', N'0987654321', N'Trâu Qu?, Gia Lâm, Hà N?i', CAST(N'2026-04-30T00:15:30.310' AS DateTime), CAST(N'2026-05-09T23:14:59.270' AS DateTime), 0, NULL, NULL)
INSERT [dbo].[KhachHang] ([id_khach_hang], [ten_khach_hang], [email], [sdt], [dia_chi], [ngay_tao], [ngay_cap_nhat], [da_xoa], [nhan_email], [nhan_sms]) VALUES (N'KH-19', N'Rexi', N'', N'0123456789', N'', CAST(N'2026-05-04T08:21:54.343' AS DateTime), CAST(N'2026-05-09T23:14:59.270' AS DateTime), 0, NULL, NULL)
INSERT [dbo].[KhachHang] ([id_khach_hang], [ten_khach_hang], [email], [sdt], [dia_chi], [ngay_tao], [ngay_cap_nhat], [da_xoa], [nhan_email], [nhan_sms]) VALUES (N'KH-20', N'Test User', N'testuser@example.com', N'0123456789', N'Hanoi', CAST(N'2026-05-04T10:06:08.713' AS DateTime), CAST(N'2026-05-09T23:14:59.270' AS DateTime), 0, NULL, NULL)
INSERT [dbo].[KhachHang] ([id_khach_hang], [ten_khach_hang], [email], [sdt], [dia_chi], [ngay_tao], [ngay_cap_nhat], [da_xoa], [nhan_email], [nhan_sms]) VALUES (N'KH-22', N'Test User New', N'testuser_new_123@example.com', N'0987654321', N'Hanoi City', CAST(N'2026-05-04T10:12:06.723' AS DateTime), CAST(N'2026-05-09T23:14:59.270' AS DateTime), 0, NULL, NULL)
INSERT [dbo].[KhachHang] ([id_khach_hang], [ten_khach_hang], [email], [sdt], [dia_chi], [ngay_tao], [ngay_cap_nhat], [da_xoa], [nhan_email], [nhan_sms]) VALUES (N'KH-24', N'Test Customer', N'customer_test@example.com', N'0987654321', N'123 Test Street', CAST(N'2026-05-05T17:48:37.860' AS DateTime), CAST(N'2026-05-09T23:14:59.270' AS DateTime), 0, NULL, NULL)
INSERT [dbo].[KhachHang] ([id_khach_hang], [ten_khach_hang], [email], [sdt], [dia_chi], [ngay_tao], [ngay_cap_nhat], [da_xoa], [nhan_email], [nhan_sms]) VALUES (N'KH-25', N'Rexi Tester', N'tester_rexi@example.com', N'0987654321', N'456 Demo Road', CAST(N'2026-05-05T18:08:58.777' AS DateTime), CAST(N'2026-05-09T23:14:59.270' AS DateTime), 0, NULL, NULL)
INSERT [dbo].[KhachHang] ([id_khach_hang], [ten_khach_hang], [email], [sdt], [dia_chi], [ngay_tao], [ngay_cap_nhat], [da_xoa], [nhan_email], [nhan_sms]) VALUES (N'KH-26', N'Rexi Final', N'customer_final@example.com', N'0123456789', N'789 Final St', CAST(N'2026-05-05T18:14:24.043' AS DateTime), CAST(N'2026-05-09T23:14:59.270' AS DateTime), 0, NULL, NULL)
INSERT [dbo].[KhachHang] ([id_khach_hang], [ten_khach_hang], [email], [sdt], [dia_chi], [ngay_tao], [ngay_cap_nhat], [da_xoa], [nhan_email], [nhan_sms]) VALUES (N'KH-27', N'Khach Hang Test', N'customer_roleplay@rexi.vn', N'0912345678', N'Ha Noi', CAST(N'2026-05-05T18:30:04.353' AS DateTime), CAST(N'2026-05-09T23:14:59.270' AS DateTime), 0, NULL, NULL)
INSERT [dbo].[KhachHang] ([id_khach_hang], [ten_khach_hang], [email], [sdt], [dia_chi], [ngay_tao], [ngay_cap_nhat], [da_xoa], [nhan_email], [nhan_sms]) VALUES (N'KH-28', N'thm dev', N'devthm814@gmail.com', N'', N'', CAST(N'2026-05-06T02:53:14.307' AS DateTime), CAST(N'2026-05-09T23:14:59.270' AS DateTime), 0, NULL, NULL)
INSERT [dbo].[KhachHang] ([id_khach_hang], [ten_khach_hang], [email], [sdt], [dia_chi], [ngay_tao], [ngay_cap_nhat], [da_xoa], [nhan_email], [nhan_sms]) VALUES (N'KH-5', N'Nguyen Van A', N'test1@gmail.com', N'0912345678', N'', CAST(N'2026-04-27T09:30:22.180' AS DateTime), CAST(N'2026-05-09T23:14:59.270' AS DateTime), 0, NULL, NULL)
INSERT [dbo].[KhachHang] ([id_khach_hang], [ten_khach_hang], [email], [sdt], [dia_chi], [ngay_tao], [ngay_cap_nhat], [da_xoa], [nhan_email], [nhan_sms]) VALUES (N'KH-6', N'19. Tr?n Hoàng Minh', N'thuyvan09818@gmail.com', N'0981848323', N'Hn', CAST(N'2026-04-27T09:35:19.333' AS DateTime), CAST(N'2026-05-09T23:14:59.270' AS DateTime), 0, NULL, NULL)
INSERT [dbo].[KhachHang] ([id_khach_hang], [ten_khach_hang], [email], [sdt], [dia_chi], [ngay_tao], [ngay_cap_nhat], [da_xoa], [nhan_email], [nhan_sms]) VALUES (N'KH-7', N'Test User', N'testuser123@example.com', N'0123456789', N'Test Address', CAST(N'2026-04-27T10:25:28.620' AS DateTime), CAST(N'2026-05-09T23:14:59.270' AS DateTime), 0, NULL, NULL)
INSERT [dbo].[KhachHang] ([id_khach_hang], [ten_khach_hang], [email], [sdt], [dia_chi], [ngay_tao], [ngay_cap_nhat], [da_xoa], [nhan_email], [nhan_sms]) VALUES (N'KH-8', N'User 99', N'user99@example.com', N'0999999999', N'99 St', CAST(N'2026-04-27T10:26:59.777' AS DateTime), CAST(N'2026-05-09T23:14:59.270' AS DateTime), 0, NULL, NULL)
INSERT [dbo].[KhachHang] ([id_khach_hang], [ten_khach_hang], [email], [sdt], [dia_chi], [ngay_tao], [ngay_cap_nhat], [da_xoa], [nhan_email], [nhan_sms]) VALUES (N'KH-9', N'Th', N'thuyvan_test@gmail.com', N'0981812345', N'H', CAST(N'2026-04-27T11:03:31.133' AS DateTime), CAST(N'2026-05-09T23:14:59.270' AS DateTime), 0, NULL, NULL)
INSERT [dbo].[LichHen] ([id_lich_hen], [ngay_kham], [gio_kham], [ly_do], [trang_thai], [id_khach_hang], [id_thu_cung], [id_bac_si], [id_nguoi_dat], [phong_kham], [ghi_chu_noi_bo], [ngay_tao], [id_dich_vu]) VALUES (N'LH-22', CAST(N'2026-05-01' AS Date), CAST(N'10:00:00' AS Time), N'Kham tong quat test REALLY final', N'da_dat', N'KH-1', N'TC-7', N'NV-37', NULL, N'Phong kham chinh', NULL, CAST(N'2026-04-27T11:35:46.190' AS DateTime), NULL)
INSERT [dbo].[LichHen] ([id_lich_hen], [ngay_kham], [gio_kham], [ly_do], [trang_thai], [id_khach_hang], [id_thu_cung], [id_bac_si], [id_nguoi_dat], [phong_kham], [ghi_chu_noi_bo], [ngay_tao], [id_dich_vu]) VALUES (N'LH-23', CAST(N'2026-05-01' AS Date), CAST(N'09:00:00' AS Time), N'Khám t?ng quát - ', N'da_dat', N'KH-9', N'TC-51', N'NV-37', NULL, N'Phòng khám chính', NULL, CAST(N'2026-04-27T11:42:35.537' AS DateTime), NULL)
INSERT [dbo].[LichHen] ([id_lich_hen], [ngay_kham], [gio_kham], [ly_do], [trang_thai], [id_khach_hang], [id_thu_cung], [id_bac_si], [id_nguoi_dat], [phong_kham], [ghi_chu_noi_bo], [ngay_tao], [id_dich_vu]) VALUES (N'LH-24', CAST(N'2026-04-30' AS Date), CAST(N'09:00:00' AS Time), N'Khám t?ng quát - ', N'da_dat', N'KH-6', N'TC-47', N'NV-37', NULL, N'Phòng khám chính', NULL, CAST(N'2026-04-27T12:08:00.187' AS DateTime), NULL)
INSERT [dbo].[LichHen] ([id_lich_hen], [ngay_kham], [gio_kham], [ly_do], [trang_thai], [id_khach_hang], [id_thu_cung], [id_bac_si], [id_nguoi_dat], [phong_kham], [ghi_chu_noi_bo], [ngay_tao], [id_dich_vu]) VALUES (N'LH-39', CAST(N'2026-05-08' AS Date), CAST(N'10:00:00' AS Time), N'KhÃ¡m Ä‘á»‹nh ká»³ chá»©ng minh dá»¯ liá»‡u', N'da_dat', N'KH-6', N'TC-49', N'NV-69', NULL, NULL, NULL, CAST(N'2026-05-08T00:03:24.547' AS DateTime), NULL)
INSERT [dbo].[LichHen] ([id_lich_hen], [ngay_kham], [gio_kham], [ly_do], [trang_thai], [id_khach_hang], [id_thu_cung], [id_bac_si], [id_nguoi_dat], [phong_kham], [ghi_chu_noi_bo], [ngay_tao], [id_dich_vu]) VALUES (N'LH-7', CAST(N'2026-03-28' AS Date), CAST(N'09:00:00' AS Time), N'Khám s?c kh?e d?nh k? và t?y giun', N'da_kham', N'KH-1', N'TC-7', N'NV-37', NULL, NULL, NULL, CAST(N'2026-03-26T03:07:04.073' AS DateTime), NULL)
INSERT [dbo].[LichHen] ([id_lich_hen], [ngay_kham], [gio_kham], [ly_do], [trang_thai], [id_khach_hang], [id_thu_cung], [id_bac_si], [id_nguoi_dat], [phong_kham], [ghi_chu_noi_bo], [ngay_tao], [id_dich_vu]) VALUES (N'LH-8', CAST(N'2026-04-20' AS Date), CAST(N'14:30:00' AS Time), N'Bé Mèo Bông b? tiêu ch?y', N'da_kham', N'KH-1', N'TC-8', N'NV-37', NULL, NULL, NULL, CAST(N'2026-04-19T03:07:04.073' AS DateTime), NULL)
INSERT [dbo].[LichHen] ([id_lich_hen], [ngay_kham], [gio_kham], [ly_do], [trang_thai], [id_khach_hang], [id_thu_cung], [id_bac_si], [id_nguoi_dat], [phong_kham], [ghi_chu_noi_bo], [ngay_tao], [id_dich_vu]) VALUES (N'LH-9', CAST(N'2026-04-28' AS Date), CAST(N'10:00:00' AS Time), N'Ðua bé Lucky di tiêm vaccine mui 1', N'da_dat', N'KH-1', N'TC-9', N'NV-37', NULL, NULL, NULL, CAST(N'2026-04-27T03:07:04.077' AS DateTime), NULL)
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'10', N'NV-37', CAST(N'2026-05-09' AS Date), CAST(N'16:00:00' AS Time), CAST(N'16:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'11', N'NV-37', CAST(N'2026-05-10' AS Date), CAST(N'08:00:00' AS Time), CAST(N'08:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'12', N'NV-37', CAST(N'2026-05-10' AS Date), CAST(N'09:00:00' AS Time), CAST(N'09:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'13', N'NV-37', CAST(N'2026-05-10' AS Date), CAST(N'10:00:00' AS Time), CAST(N'10:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'14', N'NV-37', CAST(N'2026-05-10' AS Date), CAST(N'11:00:00' AS Time), CAST(N'11:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'15', N'NV-37', CAST(N'2026-05-10' AS Date), CAST(N'13:00:00' AS Time), CAST(N'13:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'16', N'NV-37', CAST(N'2026-05-10' AS Date), CAST(N'14:00:00' AS Time), CAST(N'14:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'17', N'NV-37', CAST(N'2026-05-10' AS Date), CAST(N'15:00:00' AS Time), CAST(N'15:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'18', N'NV-37', CAST(N'2026-05-10' AS Date), CAST(N'16:00:00' AS Time), CAST(N'16:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'19', N'NV-37', CAST(N'2026-05-12' AS Date), CAST(N'08:00:00' AS Time), CAST(N'08:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'20', N'NV-37', CAST(N'2026-05-12' AS Date), CAST(N'09:00:00' AS Time), CAST(N'09:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'21', N'NV-37', CAST(N'2026-05-12' AS Date), CAST(N'10:00:00' AS Time), CAST(N'10:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'22', N'NV-37', CAST(N'2026-05-12' AS Date), CAST(N'11:00:00' AS Time), CAST(N'11:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'23', N'NV-37', CAST(N'2026-05-12' AS Date), CAST(N'13:00:00' AS Time), CAST(N'13:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'24', N'NV-37', CAST(N'2026-05-12' AS Date), CAST(N'14:00:00' AS Time), CAST(N'14:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'25', N'NV-37', CAST(N'2026-05-12' AS Date), CAST(N'15:00:00' AS Time), CAST(N'15:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'26', N'NV-37', CAST(N'2026-05-12' AS Date), CAST(N'16:00:00' AS Time), CAST(N'16:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'27', N'NV-38', CAST(N'2026-05-09' AS Date), CAST(N'08:30:00' AS Time), CAST(N'09:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'28', N'NV-38', CAST(N'2026-05-09' AS Date), CAST(N'09:30:00' AS Time), CAST(N'10:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'29', N'NV-38', CAST(N'2026-05-09' AS Date), CAST(N'10:30:00' AS Time), CAST(N'11:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'3', N'NV-37', CAST(N'2026-05-09' AS Date), CAST(N'08:00:00' AS Time), CAST(N'08:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'30', N'NV-38', CAST(N'2026-05-09' AS Date), CAST(N'11:30:00' AS Time), CAST(N'12:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'31', N'NV-38', CAST(N'2026-05-09' AS Date), CAST(N'13:30:00' AS Time), CAST(N'14:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'32', N'NV-38', CAST(N'2026-05-09' AS Date), CAST(N'14:30:00' AS Time), CAST(N'15:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'33', N'NV-38', CAST(N'2026-05-09' AS Date), CAST(N'15:30:00' AS Time), CAST(N'16:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'34', N'NV-38', CAST(N'2026-05-09' AS Date), CAST(N'16:30:00' AS Time), CAST(N'17:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'35', N'NV-38', CAST(N'2026-05-10' AS Date), CAST(N'08:30:00' AS Time), CAST(N'09:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'36', N'NV-38', CAST(N'2026-05-10' AS Date), CAST(N'09:30:00' AS Time), CAST(N'10:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'37', N'NV-38', CAST(N'2026-05-10' AS Date), CAST(N'10:30:00' AS Time), CAST(N'11:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'38', N'NV-38', CAST(N'2026-05-10' AS Date), CAST(N'11:30:00' AS Time), CAST(N'12:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'39', N'NV-38', CAST(N'2026-05-10' AS Date), CAST(N'13:30:00' AS Time), CAST(N'14:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'4', N'NV-37', CAST(N'2026-05-09' AS Date), CAST(N'09:00:00' AS Time), CAST(N'09:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'40', N'NV-38', CAST(N'2026-05-10' AS Date), CAST(N'14:30:00' AS Time), CAST(N'15:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'41', N'NV-38', CAST(N'2026-05-10' AS Date), CAST(N'15:30:00' AS Time), CAST(N'16:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'42', N'NV-38', CAST(N'2026-05-10' AS Date), CAST(N'16:30:00' AS Time), CAST(N'17:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'43', N'NV-38', CAST(N'2026-05-12' AS Date), CAST(N'08:30:00' AS Time), CAST(N'09:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'44', N'NV-38', CAST(N'2026-05-12' AS Date), CAST(N'09:30:00' AS Time), CAST(N'10:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'45', N'NV-38', CAST(N'2026-05-12' AS Date), CAST(N'10:30:00' AS Time), CAST(N'11:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'46', N'NV-38', CAST(N'2026-05-12' AS Date), CAST(N'11:30:00' AS Time), CAST(N'12:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'47', N'NV-38', CAST(N'2026-05-12' AS Date), CAST(N'13:30:00' AS Time), CAST(N'14:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'48', N'NV-38', CAST(N'2026-05-12' AS Date), CAST(N'14:30:00' AS Time), CAST(N'15:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'49', N'NV-38', CAST(N'2026-05-12' AS Date), CAST(N'15:30:00' AS Time), CAST(N'16:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'5', N'NV-37', CAST(N'2026-05-09' AS Date), CAST(N'10:00:00' AS Time), CAST(N'10:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'50', N'NV-38', CAST(N'2026-05-12' AS Date), CAST(N'16:30:00' AS Time), CAST(N'17:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'51', N'NV-39', CAST(N'2026-05-13' AS Date), CAST(N'09:00:00' AS Time), CAST(N'09:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'52', N'NV-39', CAST(N'2026-05-13' AS Date), CAST(N'09:30:00' AS Time), CAST(N'10:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'53', N'NV-39', CAST(N'2026-05-13' AS Date), CAST(N'10:00:00' AS Time), CAST(N'10:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'54', N'NV-39', CAST(N'2026-05-13' AS Date), CAST(N'10:30:00' AS Time), CAST(N'11:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'55', N'NV-39', CAST(N'2026-05-14' AS Date), CAST(N'14:00:00' AS Time), CAST(N'14:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'56', N'NV-39', CAST(N'2026-05-14' AS Date), CAST(N'14:30:00' AS Time), CAST(N'15:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'57', N'NV-39', CAST(N'2026-05-14' AS Date), CAST(N'15:00:00' AS Time), CAST(N'15:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'58', N'NV-39', CAST(N'2026-05-14' AS Date), CAST(N'15:30:00' AS Time), CAST(N'16:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'59', N'NV-39', CAST(N'2026-05-14' AS Date), CAST(N'16:00:00' AS Time), CAST(N'16:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'6', N'NV-37', CAST(N'2026-05-09' AS Date), CAST(N'11:00:00' AS Time), CAST(N'11:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'60', N'NV-39', CAST(N'2026-05-15' AS Date), CAST(N'10:00:00' AS Time), CAST(N'10:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'61', N'NV-39', CAST(N'2026-05-15' AS Date), CAST(N'10:30:00' AS Time), CAST(N'11:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'62', N'NV-39', CAST(N'2026-05-15' AS Date), CAST(N'11:00:00' AS Time), CAST(N'11:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'63', N'NV-39', CAST(N'2026-05-15' AS Date), CAST(N'14:00:00' AS Time), CAST(N'14:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'64', N'NV-39', CAST(N'2026-05-15' AS Date), CAST(N'14:30:00' AS Time), CAST(N'15:00:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'7', N'NV-37', CAST(N'2026-05-09' AS Date), CAST(N'13:00:00' AS Time), CAST(N'13:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'8', N'NV-37', CAST(N'2026-05-09' AS Date), CAST(N'14:00:00' AS Time), CAST(N'14:30:00' AS Time), N'test')
INSERT [dbo].[LichLamViecNhanVien] ([id_lich_lam_viec], [id_nhan_vien], [ngay_lam], [gio_bat_dau], [gio_ket_thuc], [ghi_chu]) VALUES (N'9', N'NV-37', CAST(N'2026-05-09' AS Date), CAST(N'15:00:00' AS Time), CAST(N'15:30:00' AS Time), N'test')
INSERT [dbo].[NhanVien] ([id_nhan_vien], [ho_ten], [ngay_sinh], [gioi_tinh], [dia_chi], [so_dien_thoai], [email], [so_cccd], [ngay_vao_lam], [ngay_nghi_viec], [trang_thai], [da_xoa], [chuyen_mon]) VALUES (N'NV-0', N'Nguy?n Th? Ti?p Tân', NULL, NULL, NULL, NULL, NULL, NULL, CAST(N'2026-04-27' AS Date), NULL, N'dang_lam', 0, NULL)
INSERT [dbo].[NhanVien] ([id_nhan_vien], [ho_ten], [ngay_sinh], [gioi_tinh], [dia_chi], [so_dien_thoai], [email], [so_cccd], [ngay_vao_lam], [ngay_nghi_viec], [trang_thai], [da_xoa], [chuyen_mon]) VALUES (N'NV-37', N'BS. Minh Anh', NULL, N'Nam', NULL, N'0901000001', N'minhanh@rexi.vn', N'000000000001', CAST(N'2026-04-27' AS Date), NULL, N'Ðang làm vi?c', 0, NULL)
INSERT [dbo].[NhanVien] ([id_nhan_vien], [ho_ten], [ngay_sinh], [gioi_tinh], [dia_chi], [so_dien_thoai], [email], [so_cccd], [ngay_vao_lam], [ngay_nghi_viec], [trang_thai], [da_xoa], [chuyen_mon]) VALUES (N'NV-38', N'BS. Khánh Linh', NULL, N'Nam', NULL, N'0901000002', N'khanhlinh@rexi.vn', N'000000000002', CAST(N'2026-04-27' AS Date), NULL, N'Ðang làm vi?c', 0, NULL)
INSERT [dbo].[NhanVien] ([id_nhan_vien], [ho_ten], [ngay_sinh], [gioi_tinh], [dia_chi], [so_dien_thoai], [email], [so_cccd], [ngay_vao_lam], [ngay_nghi_viec], [trang_thai], [da_xoa], [chuyen_mon]) VALUES (N'NV-39', N'BS. Hoàng Nam', NULL, N'Nam', NULL, N'0901000003', N'hoangnam@rexi.vn', N'000000000003', CAST(N'2026-04-27' AS Date), NULL, N'Ðang làm vi?c', 0, NULL)
INSERT [dbo].[NhanVien] ([id_nhan_vien], [ho_ten], [ngay_sinh], [gioi_tinh], [dia_chi], [so_dien_thoai], [email], [so_cccd], [ngay_vao_lam], [ngay_nghi_viec], [trang_thai], [da_xoa], [chuyen_mon]) VALUES (N'NV-40', N'BS. Thu Th?y', NULL, N'Nam', NULL, N'0901000004', N'thuthuy@rexi.vn', N'000000000004', CAST(N'2026-04-27' AS Date), NULL, N'Ðang làm vi?c', 0, NULL)
INSERT [dbo].[NhanVien] ([id_nhan_vien], [ho_ten], [ngay_sinh], [gioi_tinh], [dia_chi], [so_dien_thoai], [email], [so_cccd], [ngay_vao_lam], [ngay_nghi_viec], [trang_thai], [da_xoa], [chuyen_mon]) VALUES (N'NV-41', N'BS. Tr?n Minh', NULL, N'Nam', NULL, N'0901000005', N'tranminh@rexi.vn', N'000000000005', CAST(N'2026-04-27' AS Date), NULL, N'Ðang làm vi?c', 0, NULL)
INSERT [dbo].[NhanVien] ([id_nhan_vien], [ho_ten], [ngay_sinh], [gioi_tinh], [dia_chi], [so_dien_thoai], [email], [so_cccd], [ngay_vao_lam], [ngay_nghi_viec], [trang_thai], [da_xoa], [chuyen_mon]) VALUES (N'NV-42', N'Nhân viên Ti?p Tân', NULL, N'Nam', NULL, N'0901000006', N'tieptan@rexi.vn', N'000000000006', CAST(N'2026-04-27' AS Date), NULL, N'dang_lam', 0, NULL)
INSERT [dbo].[NhanVien] ([id_nhan_vien], [ho_ten], [ngay_sinh], [gioi_tinh], [dia_chi], [so_dien_thoai], [email], [so_cccd], [ngay_vao_lam], [ngay_nghi_viec], [trang_thai], [da_xoa], [chuyen_mon]) VALUES (N'NV-43', N'Nhân viên Y Tá', NULL, N'Nam', NULL, N'0901000007', N'yta@rexi.vn', N'000000000007', CAST(N'2026-04-27' AS Date), NULL, N'dang_lam', 0, NULL)
INSERT [dbo].[NhanVien] ([id_nhan_vien], [ho_ten], [ngay_sinh], [gioi_tinh], [dia_chi], [so_dien_thoai], [email], [so_cccd], [ngay_vao_lam], [ngay_nghi_viec], [trang_thai], [da_xoa], [chuyen_mon]) VALUES (N'NV-44', N'Rexi', NULL, N'Nam', NULL, N'***REMOVED***-VIETQR_ACCOUNT_NO', N'admin@rexi.vn', N'999999999999', CAST(N'2026-04-27' AS Date), NULL, N'dang_lam', 0, NULL)
INSERT [dbo].[NhanVien] ([id_nhan_vien], [ho_ten], [ngay_sinh], [gioi_tinh], [dia_chi], [so_dien_thoai], [email], [so_cccd], [ngay_vao_lam], [ngay_nghi_viec], [trang_thai], [da_xoa], [chuyen_mon]) VALUES (N'NV-69', N'Rexi Super Admin', NULL, NULL, NULL, N'***REMOVED***-VIETQR_ACCOUNT_NO', N'rexivet2026@gmail.com', N'00120260506', CAST(N'2026-05-06' AS Date), NULL, N'Äang lÃ m viá»‡c', 0, NULL)
INSERT [dbo].[NhanVien] ([id_nhan_vien], [ho_ten], [ngay_sinh], [gioi_tinh], [dia_chi], [so_dien_thoai], [email], [so_cccd], [ngay_vao_lam], [ngay_nghi_viec], [trang_thai], [da_xoa], [chuyen_mon]) VALUES (N'NV-72', N'Bác si Rexi', NULL, NULL, NULL, N'0987654321', N'bacsi@rexi.com', N'012345678901', CAST(N'2026-05-08' AS Date), NULL, N'ACTIVE', 0, NULL)
INSERT [dbo].[NhanVien] ([id_nhan_vien], [ho_ten], [ngay_sinh], [gioi_tinh], [dia_chi], [so_dien_thoai], [email], [so_cccd], [ngay_vao_lam], [ngay_nghi_viec], [trang_thai], [da_xoa], [chuyen_mon]) VALUES (N'NV-81', N'K? Toán 1', NULL, NULL, NULL, N'0999999999', N'ketoan@rexi.com', N'001122334455', CAST(N'2026-05-08' AS Date), NULL, N'ACTIVE', 0, NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-105', N'tieptan', N'tieptan@rexi.com', N'VT-3', N'ACTIVE', CAST(N'2026-05-09T19:18:37.770' AS DateTime), NULL, N'.06q71brGLqc9PzEwM0zuux1VlvJreG9pOWXWQHqByvM9SihS39m', NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-106', N'ketoan', N'ketoan@rexi.com', N'VT-9', N'ACTIVE', CAST(N'2026-05-09T19:18:37.790' AS DateTime), NULL, N'.06q71brGLqc9PzEwM0zuux1VlvJreG9pOWXWQHqByvM9SihS39m', NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-107', N'quanly', N'quanly@rexi.com', N'VT-4', N'ACTIVE', CAST(N'2026-05-09T19:18:37.800' AS DateTime), NULL, N'.06q71brGLqc9PzEwM0zuux1VlvJreG9pOWXWQHqByvM9SihS39m', NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-3', N'admin', N'admin@rexi.com', N'VT-1', N'ACTIVE', CAST(N'2026-04-27T02:33:26.887' AS DateTime), NULL, N'.06q71brGLqc9PzEwM0zuux1VlvJreG9pOWXWQHqByvM9SihS39m', N'NV-44')
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-39', N'bs_anh', N'123456', NULL, N'ACTIVE', CAST(N'2026-04-27T02:48:25.477' AS DateTime), NULL, N'$2a$10$7Zqe/sEl1QXT4ExYBaCtOO.LIZFVg06Hh42l8nI47xi4NGc5Y9Kza', N'NV-37')
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-40', N'bs_linh', N'123456', NULL, N'ACTIVE', CAST(N'2026-04-27T02:48:25.477' AS DateTime), NULL, N'$2a$10$7Zqe/sEl1QXT4ExYBaCtOO.LIZFVg06Hh42l8nI47xi4NGc5Y9Kza', N'NV-38')
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-41', N'bs_nam', N'123456', NULL, N'ACTIVE', CAST(N'2026-04-27T02:48:25.480' AS DateTime), NULL, N'$2a$10$7Zqe/sEl1QXT4ExYBaCtOO.LIZFVg06Hh42l8nI47xi4NGc5Y9Kza', N'NV-39')
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-42', N'bs_thuy', N'123456', NULL, N'ACTIVE', CAST(N'2026-04-27T02:48:25.480' AS DateTime), NULL, N'$2a$10$7Zqe/sEl1QXT4ExYBaCtOO.LIZFVg06Hh42l8nI47xi4NGc5Y9Kza', N'NV-40')
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-46', N'khachhang', N'123456', N'VT-5', N'ACTIVE', CAST(N'2026-04-27T02:55:59.347' AS DateTime), N'KH-1', N'$2a$10$7Zqe/sEl1QXT4ExYBaCtOO.LIZFVg06Hh42l8nI47xi4NGc5Y9Kza', NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-50', N'khachhang1', N'$2a$10$QDrPQht2b6r1Y4eglJRE6.ofYJpjNirGvsQfn.7CZLcYKqMPXIpqK', NULL, N'ACTIVE', CAST(N'2026-04-27T09:30:22.180' AS DateTime), N'KH-5', NULL, NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-51', N'thuyvan09818@gmail.com', N'$2a$10$AkSXhhfwv7b3rLizZDrCBuOVBd.HpDyYuMnDATNTG624FGz2G.yeC', NULL, N'ACTIVE', CAST(N'2026-04-27T09:35:19.783' AS DateTime), N'KH-6', N'$2a$10$AkSXhhfwv7b3rLizZDrCBuOVBd.HpDyYuMnDATNTG624FGz2G.yeC', NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-52', N'testuser123', N'$2a$10$MUdZH4J/7TelFFLx5UrDKuYAuybB55bp2W8FOjul71ZyI7FWW0ueq', NULL, N'ACTIVE', CAST(N'2026-04-27T10:25:28.637' AS DateTime), N'KH-7', NULL, NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-53', N'user99', N'$2a$10$Wo0VdZCxXrX0ZA1p5yowhextvcUOKz5I9alR5ZBDYw22pATnghvca', NULL, N'ACTIVE', CAST(N'2026-04-27T10:26:59.780' AS DateTime), N'KH-8', NULL, NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-54', N'thuyvan_test', N'$2a$10$2q8FYoqYx3vpibPSisxWluMm/7NjdCYEZQu06xiFK/mvkRpSb1ZAe', NULL, N'ACTIVE', CAST(N'2026-04-27T11:03:31.160' AS DateTime), N'KH-9', NULL, NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-57', N'testkhach', N'$2a$10$CSKXuhSr9Av9FGugXlArtOe0sHZuKPO3x9BOGI36yfZxV2H2GK5pi', NULL, N'ACTIVE', CAST(N'2026-04-28T17:08:01.627' AS DateTime), N'KH-12', NULL, NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-58', N'minh', N'$2a$10$W5HZwM966HVdmxT.vSuC9.RH6N4dZQnFHPXkH/.GwtDkvjhb5jm7a', NULL, N'ACTIVE', CAST(N'2026-04-28T18:23:01.347' AS DateTime), N'KH-13', NULL, NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-60', N'testuser_unique_999', N'$2a$10$V6/h/aQ89U6wvdp/nAIc7e9t77VONxMjtqCpKbmkfYm5bFp8nA3T6', NULL, N'ACTIVE', CAST(N'2026-04-28T22:41:39.203' AS DateTime), N'KH-15', NULL, NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-61', N'finaluser', N'$2a$10$SxTAc4UR2lh3qnl15KWvjuqQ5u72TimJql.9.mSf5WLw8G1dmnKzi', NULL, N'ACTIVE', CAST(N'2026-04-29T10:11:42.933' AS DateTime), N'KH-17', NULL, NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-62', N'demo', N'123456', N'VT-5', N'ACTIVE', CAST(N'2026-04-30T00:15:30.317' AS DateTime), N'KH-18', NULL, NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-83', N'minhanh@rexi.vn', N'rexi@123', N'VT-8', N'ACTIVE', CAST(N'2026-05-01T18:05:08.607' AS DateTime), NULL, N'$2a$10$U5TvxbnJI44p0bcsahoUQ.B3twKC/zsqdGIkHrrTAWpUld2kSjp6S', NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-84', N'khanhlinh@rexi.vn', N'rexi@123', N'VT-8', N'ACTIVE', CAST(N'2026-05-01T18:05:09.103' AS DateTime), NULL, N'$2a$10$pKxOSL.KKlcPtCoqjiRJJ.KsiZmCwVxnUaDbctNlr7YAHfqIAsxoS', NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-85', N'hoangnam@rexi.vn', N'rexi@123', N'VT-8', N'ACTIVE', CAST(N'2026-05-01T18:05:09.323' AS DateTime), NULL, N'$2a$10$5IOXpbBiyT9knP1hirvFF.308R3pkG.WWRYDWRqlk3KTNtWTOqk5m', NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-86', N'thuthuy@rexi.vn', N'rexi@123', N'VT-8', N'ACTIVE', CAST(N'2026-05-01T18:05:09.580' AS DateTime), NULL, N'$2a$10$LHDdHE3DvcXZ9jKf8gG.2ew3VFOo2/gYbwNpKmARqAX1w5NaSinqe', NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-87', N'tranminh@rexi.vn', N'rexi@123', N'VT-8', N'ACTIVE', CAST(N'2026-05-01T18:05:10.090' AS DateTime), NULL, N'$2a$10$JpYitDkRodgYDVMKQvzFEu4z2iZPS7PHaKLLpcGe/MN5DZEGhKjgC', NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-89', N'admintestuser', N'$2a$10$UT0IbLCE.6S.JcU5t0VSze1MG.nZfC36cXF4i07wW8vq.FcUTIoU.', NULL, N'ACTIVE', CAST(N'2026-05-04T10:06:08.747' AS DateTime), N'KH-20', NULL, NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-90', N'testuser_new_123', N'$2a$10$07V/85fvr0IMcxszl1wRiOLB5SizgencZZrvBDY1ooW5b7KU88Nfq', NULL, N'ACTIVE', CAST(N'2026-05-04T10:12:06.750' AS DateTime), N'KH-22', NULL, NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-92', N'customer_test', N'$2a$10$ctO6fXf2OBB2L7yPG1a6V.2AfFJFj7U8SeVmD7tFucR8td4QszIwC', NULL, N'ACTIVE', CAST(N'2026-05-05T17:48:37.957' AS DateTime), N'KH-24', NULL, NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-93', N'tester_rexi', N'$2a$10$5vJDjfnJGynuRDfhAQAI4uLojGHyPr4GBMHoPTvHOfqkI/xE3tgJm', NULL, N'ACTIVE', CAST(N'2026-05-05T18:08:58.810' AS DateTime), N'KH-25', NULL, NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-94', N'customer_final', N'$2a$10$GJyywI/ewqgUu1i4AyzTlOqP3qQ0tfPeyVzgyMwBjIgV7/WSnXUXC', NULL, N'ACTIVE', CAST(N'2026-05-05T18:14:24.060' AS DateTime), N'KH-26', NULL, NULL)
INSERT [dbo].[TaiKhoan] ([id_tai_khoan], [ten_dang_nhap], [mat_khau], [id_vai_tro], [trang_thai], [ngay_tao], [id_khach_hang], [mat_khau_hash], [id_nhan_vien]) VALUES (N'TK-95', N'roleplay_user', N'$2a$10$LCHKt.QiA.vHdycIJPoMUeXW6VXQEA6G6o9DyHGO9HirwBqg1SZHG', NULL, N'ACTIVE', CAST(N'2026-05-05T18:30:04.533' AS DateTime), N'KH-27', NULL, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-47', N'sss', N'ssss', N'sss', NULL, NULL, NULL, NULL, N'KH-6', CAST(N'2026-04-27T09:48:05.707' AS DateTime), 0, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-48', N'na', N'bò', N'?i', NULL, NULL, NULL, NULL, N'KH-6', CAST(N'2026-04-27T09:49:04.063' AS DateTime), 0, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-49', N'7777', N'iiiiiiio', N'iiiii', NULL, NULL, NULL, NULL, N'KH-6', CAST(N'2026-04-27T10:21:10.287' AS DateTime), 0, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-50', N'Mimi', N'Cat', N'Domestic Cat', NULL, NULL, NULL, NULL, N'KH-8', CAST(N'2026-04-27T10:29:10.013' AS DateTime), 0, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-51', N'Mimi', N'Meo', N'Meo Anh', NULL, NULL, NULL, NULL, N'KH-9', CAST(N'2026-04-27T11:06:19.900' AS DateTime), 0, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-52', N'mm', N'mm', N'hi', NULL, NULL, NULL, NULL, N'KH-1', CAST(N'2026-04-27T13:23:36.033' AS DateTime), 0, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-53', N'udwd', N'udwdw', N'udwdwd', NULL, NULL, NULL, NULL, N'KH-1', CAST(N'2026-04-27T13:25:58.360' AS DateTime), 0, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-55', N'mèo ', N'l?n', N'bò', NULL, NULL, NULL, NULL, N'KH-6', CAST(N'2026-04-28T07:23:55.063' AS DateTime), 1, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-56', N'gà ', N'bò', N'ola', NULL, NULL, NULL, NULL, N'KH-6', CAST(N'2026-04-28T07:24:12.480' AS DateTime), 0, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-57', N'hkhkhk', N'hkhk', N'khk', NULL, NULL, NULL, NULL, N'KH-12', CAST(N'2026-04-28T17:13:13.803' AS DateTime), 0, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-58', N'udw', N'udwdwdw', N'udwd', NULL, NULL, NULL, NULL, N'KH-13', CAST(N'2026-04-28T18:23:34.907' AS DateTime), 0, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-59', N'hghbv', N'jhbhh', N'nnn', NULL, NULL, NULL, NULL, N'KH-6', CAST(N'2026-05-03T21:23:18.783' AS DateTime), 1, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-60', N'7777', N'87', N'', NULL, NULL, NULL, NULL, N'KH-6', CAST(N'2026-05-07T21:59:30.217' AS DateTime), 1, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-61', N'Rexi Video Final', N'Chó Poodle', N'', NULL, NULL, NULL, NULL, N'KH-1', CAST(N'2026-05-08T01:02:35.150' AS DateTime), 0, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-62', N'Rexi Demo Full', N'Chó', N'', NULL, NULL, NULL, NULL, N'KH-1', CAST(N'2026-05-08T01:03:15.817' AS DateTime), 0, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-63', N'Rexi Video VIP', N'Poodle', N'', NULL, NULL, NULL, NULL, N'KH-1', CAST(N'2026-05-08T01:04:43.210' AS DateTime), 0, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-64', N'Rexi Video Final', N'Chó', N'', NULL, NULL, NULL, NULL, N'KH-1', CAST(N'2026-05-08T01:05:27.980' AS DateTime), 0, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-65', N'Tester Rexi VIP', N'Chó Poodle', N'', NULL, NULL, NULL, NULL, N'KH-1', CAST(N'2026-05-08T01:11:04.890' AS DateTime), 0, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-66', N'Tester Rexi VIP', N'Chó Poodle', N'', NULL, NULL, NULL, NULL, N'KH-1', CAST(N'2026-05-08T01:12:26.557' AS DateTime), 0, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-7', N'Rexi Video Final Edited', N'Chó', N'Poodle', NULL, NULL, NULL, NULL, N'KH-1', CAST(N'2026-04-27T03:07:04.070' AS DateTime), 0, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-8', N'Bông', N'Mèo', N'British Shorthair', NULL, NULL, NULL, NULL, N'KH-1', CAST(N'2026-04-27T03:07:04.070' AS DateTime), 0, NULL)
INSERT [dbo].[ThuCung] ([id_thu_cung], [ten_thu_cung], [loai], [giong], [ngay_sinh], [gioi_tinh], [mau_sac], [trong_luong], [id_khach_hang], [ngay_tao], [da_xoa], [url_anh]) VALUES (N'TC-9', N'Lucky', N'Chó', N'Golden Retriever', NULL, NULL, NULL, NULL, N'KH-1', CAST(N'2026-04-27T03:07:04.070' AS DateTime), 0, NULL)
INSERT [dbo].[TiemChung] ([id_tiem_chung], [id_thu_cung], [ten_vaccine], [ngay_tiem], [ngay_tiem_lai], [id_bac_si], [ghi_chu], [loai_vaccine]) VALUES (N'3', N'TC-7', N'Vaccine Phòng D?i', CAST(N'2026-03-28' AS Date), CAST(N'2027-03-28' AS Date), N'NV-37', N'Tiêm d?nh k? hàng nam', N'Phòng d?i')
INSERT [dbo].[VaiTroHeThong] ([id_vai_tro], [ten_vai_tro], [mo_ta]) VALUES (N'VT-1', N'ADMIN', N'Qu?n tr? viên h? th?ng')
INSERT [dbo].[VaiTroHeThong] ([id_vai_tro], [ten_vai_tro], [mo_ta]) VALUES (N'VT-12', N'Y tÃ¡', N'Äiá»u dÆ°á»¡ng/Y tÃ¡ há»— trá»£')
INSERT [dbo].[VaiTroHeThong] ([id_vai_tro], [ten_vai_tro], [mo_ta]) VALUES (N'VT-3', N'l? tân', N'Ti?p tân phòng khám')
INSERT [dbo].[VaiTroHeThong] ([id_vai_tro], [ten_vai_tro], [mo_ta]) VALUES (N'VT-4', N'QUANLY', N'Y tá h? tr? di?u tr?')
INSERT [dbo].[VaiTroHeThong] ([id_vai_tro], [ten_vai_tro], [mo_ta]) VALUES (N'VT-5', N'khách hàng', N'Ch? nuôi thú cung')
INSERT [dbo].[VaiTroHeThong] ([id_vai_tro], [ten_vai_tro], [mo_ta]) VALUES (N'VT-6', N'nhân viên', N'Nhân viên chung')
INSERT [dbo].[VaiTroHeThong] ([id_vai_tro], [ten_vai_tro], [mo_ta]) VALUES (N'VT-7', N'ti?p tân', N'L? tân phòng khám')
INSERT [dbo].[VaiTroHeThong] ([id_vai_tro], [ten_vai_tro], [mo_ta]) VALUES (N'VT-8', N'bác si', N'Ð?i ngu bác si Rexi')
INSERT [dbo].[VaiTroHeThong] ([id_vai_tro], [ten_vai_tro], [mo_ta]) VALUES (N'VT-9', N'K? toán', N'K? toán viên')
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_TaiKhoan_TenDangNhap]    Script Date: 10/05/2026 01:53:00 ******/
ALTER TABLE [dbo].[TaiKhoan] ADD  CONSTRAINT [UQ_TaiKhoan_TenDangNhap] UNIQUE NONCLUSTERED 
(
	[ten_dang_nhap] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
ALTER TABLE [dbo].[CauHinhHeThong] ADD  DEFAULT (getdate()) FOR [ngay_cap_nhat]
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
ALTER TABLE [dbo].[LichHen] ADD  DEFAULT (getdate()) FOR [ngay_tao]
GO
ALTER TABLE [dbo].[NhanVien] ADD  DEFAULT ((0)) FOR [da_xoa]
GO
ALTER TABLE [dbo].[TaiKhoan] ADD  DEFAULT (getdate()) FOR [ngay_tao]
GO
ALTER TABLE [dbo].[ThongBao] ADD  DEFAULT ((0)) FOR [da_doc]
GO
ALTER TABLE [dbo].[ThuCung] ADD  DEFAULT (getdate()) FOR [ngay_tao]
GO
ALTER TABLE [dbo].[ThuCung] ADD  DEFAULT ((0)) FOR [da_xoa]
GO
ALTER TABLE [dbo].[HoaDon]  WITH CHECK ADD  CONSTRAINT [FK_HoaDon_KhachHang] FOREIGN KEY([id_khach_hang])
REFERENCES [dbo].[KhachHang] ([id_khach_hang])
GO
ALTER TABLE [dbo].[HoaDon] CHECK CONSTRAINT [FK_HoaDon_KhachHang]
GO
ALTER TABLE [dbo].[HoaDon]  WITH CHECK ADD  CONSTRAINT [FK_HoaDon_LichHen] FOREIGN KEY([id_lich_hen])
REFERENCES [dbo].[LichHen] ([id_lich_hen])
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
GO
ALTER TABLE [dbo].[HoSoBenhAn] CHECK CONSTRAINT [FK_HoSo_LichHen]
GO
ALTER TABLE [dbo].[HoSoBenhAn]  WITH CHECK ADD  CONSTRAINT [FK_HoSo_NguoiTao] FOREIGN KEY([id_nguoi_tao])
REFERENCES [dbo].[NhanVien] ([id_nhan_vien])
GO
ALTER TABLE [dbo].[HoSoBenhAn] CHECK CONSTRAINT [FK_HoSo_NguoiTao]
GO
ALTER TABLE [dbo].[HoSoBenhAn]  WITH CHECK ADD  CONSTRAINT [FK_HoSo_ThuCung] FOREIGN KEY([id_thu_cung])
REFERENCES [dbo].[ThuCung] ([id_thu_cung])
GO
ALTER TABLE [dbo].[HoSoBenhAn] CHECK CONSTRAINT [FK_HoSo_ThuCung]
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
ALTER TABLE [dbo].[LichHen]  WITH CHECK ADD  CONSTRAINT [FK_LichHen_ThuCung] FOREIGN KEY([id_thu_cung])
REFERENCES [dbo].[ThuCung] ([id_thu_cung])
GO
ALTER TABLE [dbo].[LichHen] CHECK CONSTRAINT [FK_LichHen_ThuCung]
GO
ALTER TABLE [dbo].[TaiKhoan]  WITH CHECK ADD  CONSTRAINT [FK_TaiKhoan_KhachHang] FOREIGN KEY([id_khach_hang])
REFERENCES [dbo].[KhachHang] ([id_khach_hang])
GO
ALTER TABLE [dbo].[TaiKhoan] CHECK CONSTRAINT [FK_TaiKhoan_KhachHang]
GO
ALTER TABLE [dbo].[TaiKhoan]  WITH CHECK ADD  CONSTRAINT [FK_TaiKhoan_NhanVien] FOREIGN KEY([id_nhan_vien])
REFERENCES [dbo].[NhanVien] ([id_nhan_vien])
GO
ALTER TABLE [dbo].[TaiKhoan] CHECK CONSTRAINT [FK_TaiKhoan_NhanVien]
GO
ALTER TABLE [dbo].[TaiKhoan]  WITH CHECK ADD  CONSTRAINT [FK_TaiKhoan_VaiTro] FOREIGN KEY([id_vai_tro])
REFERENCES [dbo].[VaiTroHeThong] ([id_vai_tro])
GO
ALTER TABLE [dbo].[TaiKhoan] CHECK CONSTRAINT [FK_TaiKhoan_VaiTro]
GO
ALTER TABLE [dbo].[ThuCung]  WITH CHECK ADD  CONSTRAINT [FK_ThuCung_KhachHang] FOREIGN KEY([id_khach_hang])
REFERENCES [dbo].[KhachHang] ([id_khach_hang])
GO
ALTER TABLE [dbo].[ThuCung] CHECK CONSTRAINT [FK_ThuCung_KhachHang]
GO
/****** Object:  StoredProcedure [dbo].[sp_AddAppointment]    Script Date: 10/05/2026 01:53:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =========================================
-- PHáº¦N 4: STORED PROCEDURES
-- =========================================

-- Äáº·t lá»‹ch háº¹n
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
/****** Object:  StoredProcedure [dbo].[sp_AddMedicalRecord]    Script Date: 10/05/2026 01:53:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Táº¡o há»“ sÆ¡ bá»‡nh Ã¡n
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

    -- Kiá»ƒm tra lá»‹ch háº¹n tá»“n táº¡i
    IF NOT EXISTS (SELECT 1 FROM dbo.LichHen WHERE id_lich_hen = @IdLichHen)
    BEGIN
        RAISERROR(N'KhÃ´ng tÃ¬m tháº¥y lá»‹ch háº¹n vá»›i id = %d', 16, 1, @IdLichHen);
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

    -- Cáº­p nháº­t tráº¡ng thÃ¡i lá»‹ch háº¹n
    UPDATE dbo.LichHen 
    SET trang_thai = N'da_kham' 
    WHERE id_lich_hen = @IdLichHen;

    SELECT SCOPE_IDENTITY() AS id_ho_so_moi;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_CapNhatThongTinKhachHang]    Script Date: 10/05/2026 01:53:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Cáº­p nháº­t thÃ´ng tin khÃ¡ch hÃ ng (khÃ¡ch hÃ ng tá»± cáº­p nháº­t)
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

    SELECT N'Cáº­p nháº­t thÃ´ng tin thÃ nh cÃ´ng' AS ThongBao;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_CapNhatTonKho]    Script Date: 10/05/2026 01:53:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Cáº­p nháº­t tá»“n kho thá»§ cÃ´ng (dÃ nh cho quáº£n lÃ½ kho)
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

    SELECT N'Cáº­p nháº­t tá»“n kho thÃ nh cÃ´ng' AS ThongBao;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_DangKyKhachHang]    Script Date: 10/05/2026 01:53:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =========================================
-- PHáº¦N Bá»” SUNG 3: STORED PROCEDURE QUAN TRá»ŒNG CHO WEB
-- =========================================

-- ÄÄƒng kÃ½ tÃ i khoáº£n khÃ¡ch hÃ ng
CREATE   PROCEDURE [dbo].[sp_DangKyKhachHang]
    @TenDangNhap NVARCHAR(50),
    @MatKhau NVARCHAR(255),           -- sáº½ Ä‘Æ°á»£c hash á»Ÿ backend
    @TenKhachHang NVARCHAR(100),
    @Email NVARCHAR(100) = NULL,
    @SDT NVARCHAR(15) = NULL,
    @DiaChi NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Táº¡o khÃ¡ch hÃ ng
        INSERT INTO dbo.KhachHang (ten_khach_hang, email, sdt, dia_chi, ngay_tao, ngay_cap_nhat, da_xoa)
        VALUES (@TenKhachHang, @Email, @SDT, @DiaChi, GETDATE(), GETDATE(), 0);

        DECLARE @IdKhachHang INT = SCOPE_IDENTITY();

        -- Táº¡o tÃ i khoáº£n
        INSERT INTO dbo.TaiKhoan (ten_dang_nhap, mat_khau, id_vai_tro, trang_thai, ngay_tao, id_khach_hang)
        VALUES (@TenDangNhap, @MatKhau, 
                (SELECT id_vai_tro FROM dbo.VaiTroHeThong WHERE ten_vai_tro = N'khÃ¡ch hÃ ng'),
                N'active', GETDATE(), @IdKhachHang);

        COMMIT TRANSACTION;

        SELECT N'ÄÄƒng kÃ½ thÃ nh cÃ´ng' AS ThongBao, @IdKhachHang AS IdKhachHang;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_DangNhap]    Script Date: 10/05/2026 01:53:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_DangNhap]
    @TenDangNhap NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    -- Tìm tài kho?n d?a trên ten_dang_nhap HO?C email c?a khách hàng/nhân viên
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
      AND t.trang_thai = N'active';
END;

GO
/****** Object:  StoredProcedure [dbo].[sp_DonDepNhatKy]    Script Date: 10/05/2026 01:53:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- K?CH B?N 5: TH? T?C D?N D?P LOG H? TH?NG
CREATE PROCEDURE [dbo].[sp_DonDepNhatKy]
AS
BEGIN
    SET NOCOUNT ON;
    -- Xóa các log cu hon 60 ngày
    DELETE FROM dbo.NhatKyHeThong
    WHERE ngay_gio < DATEADD(DAY, -60, GETDATE());
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_HuyLichHen]    Script Date: 10/05/2026 01:53:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Há»§y lá»‹ch háº¹n (cáº­p nháº­t tráº¡ng thÃ¡i)
CREATE PROCEDURE [dbo].[sp_HuyLichHen]
    @IdLichHen INT,
    @LyDoHuy NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.LichHen
    SET trang_thai = N'da_huy',
        ghi_chu_noi_bo = ISNULL(ghi_chu_noi_bo, '') + N' - Há»§y: ' + ISNULL(@LyDoHuy, N'')
    WHERE id_lich_hen = @IdLichHen;

    IF @@ROWCOUNT = 0
        RAISERROR(N'KhÃ´ng tÃ¬m tháº¥y lá»‹ch háº¹n Ä‘á»ƒ há»§y!', 16, 1);
    ELSE
        SELECT N'Há»§y lá»‹ch háº¹n thÃ nh cÃ´ng' AS ThongBao;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_LapHoaDon]    Script Date: 10/05/2026 01:53:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

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
            DECLARE @TongTruocGiam DECIMAL(18,2) = 0;
            DECLARE @TienDichVu DECIMAL(18,2) = 0;
            DECLARE @TienThuoc DECIMAL(18,2) = 0;
            DECLARE @TongSauGiam DECIMAL(18,2);
            DECLARE @ThuePhai DECIMAL(18,2);
            DECLARE @TongCuoi DECIMAL(18,2);

            SELECT @IdKhachHang = id_khach_hang FROM dbo.LichHen WHERE id_lich_hen = @IdLichHen;
            IF @IdKhachHang IS NULL
            BEGIN
                RAISERROR(N'KhÃ´ng tÃ¬m tháº¥y lá»‹ch háº¹n!', 16, 1);
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
        
GO
/****** Object:  StoredProcedure [dbo].[sp_LichHenCuaKhachHang]    Script Date: 10/05/2026 01:53:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Láº¥y lá»‹ch háº¹n cá»§a khÃ¡ch hÃ ng (dÃ¹ng cho khÃ¡ch hÃ ng xem)
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
/****** Object:  StoredProcedure [dbo].[sp_TaoThongBaoTiemChung]    Script Date: 10/05/2026 01:53:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- K?CH B?N 4: TH? T?C NH?C L?CH TIÊM CH?NG
CREATE PROCEDURE [dbo].[sp_TaoThongBaoTiemChung]
AS
BEGIN
    SET NOCOUNT ON;
    -- T?o thông báo tru?c 3 ngày
    INSERT INTO dbo.ThongBao (id_tai_khoan, tieu_de, noi_dung, loai_thong_bao, da_doc, ngay_tao)
    SELECT 
        tk.id_tai_khoan,
        N'Nh?c nh? tiêm ch?ng',
        N'Thú cung ' + tc.ten_thu_cung + N' s?p d?n l?ch tiêm nh?c l?i vaccine ' + t.ten_vaccine + N' vào ngày ' + CONVERT(VARCHAR, t.ngay_tiem_lai, 103),
        N'he_thong',
        0,
        GETDATE()
    FROM dbo.TiemChung t
    JOIN dbo.ThuCung tc ON t.id_thu_cung = tc.id_thu_cung
    JOIN dbo.TaiKhoan tk ON tc.id_khach_hang = tk.id_khach_hang
    WHERE t.ngay_tiem_lai = DATEADD(DAY, 3, CAST(GETDATE() AS DATE));
END;
GO
USE [master]
GO
ALTER DATABASE [PhongKhamThuY] SET  READ_WRITE 
GO
