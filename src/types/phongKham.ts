

export type TrangThaiLichHen =
  | "cho_xac_nhan"
  | "da_xac_nhan"
  | "dang_kham"
  | "hoan_thanh"
  | "da_huy";

export type TrangThaiHoaDon =
  | "cho_thanh_toan"
  | "da_thanh_toan"
  | "da_huy";

export type TrangThaiHoSo = "nhap" | "hoan_tat" | "cho_duyet";

export interface KhachHang {
  id_khach_hang: number;
  ten_khach_hang: string;
  email: string | null;
  sdt: string | null;
  dia_chi: string | null;
  ngay_tao: string;
  ngay_cap_nhat: string;
  da_xoa: boolean;
}

export interface ThuCung {
  id_thu_cung: number;
  ten_thu_cung: string;
  loai: string | null;
  giong: string | null;
  ngay_sinh: string | null;
  gioi_tinh: string | null;
  mau_sac: string | null;
  trong_luong: number | null;
  id_khach_hang: number;
  ngay_tao: string;
  da_xoa: boolean;
}

export interface NhanVien {
  id_nhan_vien: number;
  id_tai_khoan: number | null;
  ho_ten: string;
  so_dien_thoai: string | null;
  trang_thai: string | null;
}

export interface DichVu {
  id_dich_vu: number;
  ten_dich_vu: string;
  mo_ta: string | null;
  gia: number;
  thoi_luong_phut: number | null;
  trang_thai: boolean;
}

export interface LichHen {
  id_lich_hen: number;
  ngay_kham: string;
  gio_kham: string;
  ly_do: string | null;
  trang_thai: TrangThaiLichHen | string | null;
  id_khach_hang: number;
  id_thu_cung: number;
  id_bac_si: number;
  id_nguoi_dat: number | null;
  phong_kham: string | null;
  ghi_chu_noi_bo: string | null;
  ngay_tao: string;
}

export interface DichVuLichHen {
  id_lich_hen: number;
  id_dich_vu: number;
  so_luong: number | null;
  don_gia: number;
  ghi_chu: string | null;
}

export interface HoaDon {
  id_hoa_don: number;
  id_lich_hen: number;
  id_khach_hang: number;
  tong_tien_truoc_giam_gia: number | null;
  tong_tien_giam_gia: number | null;
  tong_tien_sau_giam_gia: number | null;
  thue_suat: number | null;
  thue_phai_nop: number | null;
  tong_tien_cuoi: number | null;
  ngay_lap: string;
  id_nhan_vien: number;
  trang_thai: TrangThaiHoaDon | string | null;
  ghi_chu: string | null;
}

export interface HoSoBenhAn {
  id_ho_so: number;
  id_lich_hen: number;
  ngay_kham: string;
  id_bac_si: number;
  can_nang: number | null;
  chan_doan: string | null;
  trieu_chung: string | null;
  trang_thai_ho_so: string | null;
  ngay_tao: string;
}

export interface Thuoc {
  id_thuoc: number;
  ten_thuoc: string;
  thanh_phan: string | null;
  dang_bao_che: string | null;
  don_vi: string | null;
  mo_ta: string | null;
  gia_ban: number;
  trang_thai: boolean;
}

export interface LoThuoc {
  id_lo: number;
  id_thuoc: number;
  id_ncc: number;
  so_lo: string;
  ngay_nhap: string;
  han_su_dung: string;
  gia_nhap: number;
  so_luong_nhap: number;
  so_luong_ton: number;
}

export interface NhaCungCap {
  id_ncc: number;
  ten_ncc: string;
  dia_chi: string | null;
  so_dien_thoai: string | null;
  email: string | null;
}

export interface BenhAn_XetNghiem {
  id_xet_nghiem_benh_an: number;
  id_ho_so: number;
  id_loai_xet_nghiem: number;
  ngay_lay_mau: string;
  ngay_co_ket_qua: string | null;
  id_bac_si: number;
  ket_qua_chung: string | null;
  trang_thai: string | null;
}

export interface KetQuaXetNghiem_ChiTiet {
  id_ket_qua_chi_tiet: number;
  id_xet_nghiem_benh_an: number;
  id_chi_so: number;
  gia_tri_ket_qua: string;
  co_bat_thuong: boolean | null;
}

export interface ChiSoXetNghiem {
  id_chi_so: number;
  id_loai_xet_nghiem: number;
  ten_thong_so: string;
  don_vi: string | null;
  gia_tri_min: number | null;
  gia_tri_max: number | null;
}

export interface DonThuoc_ChiTiet {
  id_don_thuoc_ct: number;
  id_ho_so: number;
  id_thuoc: number;
  id_lo: number;
  so_luong: number;
  lieu_dung: string | null;
}

export interface FileDinhKem {
  id_file: number;
  loai_thuc_the: string;
  id_thuc_the: number;
  ten_file_goc: string;
  duong_dan: string;
  ngay_tai_len: string;
}

export interface CauHinhHeThong {
  khoa_cau_hinh: string;
  gia_tri_cau_hinh: string | null;
  mo_ta: string | null;
}
