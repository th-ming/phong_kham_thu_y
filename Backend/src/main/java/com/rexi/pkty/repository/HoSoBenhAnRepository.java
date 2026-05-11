package com.rexi.pkty.repository;

import com.rexi.pkty.entity.HoSoBenhAn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Repository
public interface HoSoBenhAnRepository extends JpaRepository<HoSoBenhAn, String> {

    // GÃ¡Â»Âi Stored Procedure tÃ¡ÂºÂ¡o hÃ¡Â»â€œ sÃ†Â¡ bÃ¡Â»â€¡nh ÃƒÂ¡n mÃ¡Â»â€ºi
    @Query(value = "EXEC sp_AddMedicalRecord :apptId, :date, :doctorId, :weight, :temp, :symptoms, :diagnosis, :treatment, :care, :creatorId", nativeQuery = true)
    List<Map<String, Object>> callSpAddMedicalRecord(
        @Param("apptId") String apptId,
        @Param("date") LocalDate date,
        @Param("doctorId") String doctorId,
        @Param("weight") BigDecimal weight,
        @Param("temp") BigDecimal temp,
        @Param("symptoms") String symptoms,
        @Param("diagnosis") String diagnosis,
        @Param("treatment") String treatment,
        @Param("care") String care,
        @Param("creatorId") String creatorId
    );

    // LÃ¡ÂºÂ¥y kÃ¡ÂºÂ¿t quÃ¡ÂºÂ£ xÃƒÂ©t nghiÃ¡Â»â€¡m tÃ¡Â»Â« bÃ¡ÂºÂ£ng BenhAn_XetNghiem thÃƒÂ´ng qua id_ho_so
    @Query(value = "SELECT bx.*, l.ten_xet_nghiem FROM BenhAn_XetNghiem bx " +
                   "JOIN LoaiXetNghiem l ON bx.id_loai_xet_nghiem = l.id_loai_xet_nghiem " +
                   "WHERE bx.id_ho_so = :hosoId", nativeQuery = true)
    List<Map<String, Object>> findXetNghiemByHoSo(@Param("hosoId") String hosoId);

    // LÃ¡ÂºÂ¥y danh sÃƒÂ¡ch hÃ¡Â»â€œ sÃ†Â¡ bÃ¡Â»â€¡nh ÃƒÂ¡n theo ID khÃƒÂ¡ch hÃƒÂ ng
    @Query(value = "SELECT h.*, t.ten_thu_cung, k.ten_khach_hang, nv.ho_ten as ten_bac_si FROM HoSoBenhAn h " +
                   "JOIN LichHen l ON h.id_lich_hen = l.id_lich_hen " +
                   "JOIN ThuCung t ON l.id_thu_cung = t.id_thu_cung " +
                   "JOIN KhachHang k ON t.id_khach_hang = k.id_khach_hang " +
                   "LEFT JOIN NhanVien nv ON h.id_bac_si = nv.id_nhan_vien " +
                   "WHERE k.id_khach_hang = :customerId " +
                   "ORDER BY h.ngay_kham DESC", nativeQuery = true)
    List<Map<String, Object>> findByCustomerId(@Param("customerId") String customerId);

    // LÃ¡ÂºÂ¥y tÃ¡ÂºÂ¥t cÃ¡ÂºÂ£ hÃ¡Â»â€œ sÃ†Â¡ bÃ¡Â»â€¡nh ÃƒÂ¡n (cho Admin)
    @Query(value = "SELECT h.*, t.ten_thu_cung, k.ten_khach_hang, nv.ho_ten as ten_bac_si FROM HoSoBenhAn h " +
                   "JOIN LichHen l ON h.id_lich_hen = l.id_lich_hen " +
                   "JOIN ThuCung t ON l.id_thu_cung = t.id_thu_cung " +
                   "JOIN KhachHang k ON t.id_khach_hang = k.id_khach_hang " +
                   "LEFT JOIN NhanVien nv ON h.id_bac_si = nv.id_nhan_vien " +
                   "ORDER BY h.ngay_kham DESC", nativeQuery = true)
    List<Map<String, Object>> getAllHoSoBenhAn();

    // LÃ¡ÂºÂ¥y tÃ¡ÂºÂ¥t cÃ¡ÂºÂ£ xÃƒÂ©t nghiÃ¡Â»â€¡m (cho Admin)
    @Query(value = "SELECT bx.*, l.ten_xet_nghiem, nv.ho_ten as ten_bac_si FROM BenhAn_XetNghiem bx " +
                   "JOIN LoaiXetNghiem l ON bx.id_loai_xet_nghiem = l.id_loai_xet_nghiem " +
                   "LEFT JOIN NhanVien nv ON bx.id_bac_si = nv.id_nhan_vien " +
                   "ORDER BY bx.ngay_lay_mau DESC", nativeQuery = true)
    List<Map<String, Object>> getAllXetNghiem();

    // LÃ¡ÂºÂ¥y tÃ¡ÂºÂ¥t cÃ¡ÂºÂ£ Ã„â€˜Ã†Â¡n thuÃ¡Â»â€˜c (cho Admin)
    @Query(value = "SELECT dt.*, t.ten_thuoc, tc.ten_thu_cung FROM DonThuoc_ChiTiet dt " +
                   "JOIN Thuoc t ON dt.id_thuoc = t.id_thuoc " +
                   "JOIN HoSoBenhAn hs ON dt.id_ho_so_benh_an = hs.id_ho_so " +
                   "JOIN LichHen lh ON hs.id_lich_hen = lh.id_lich_hen " +
                   "JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
                   "ORDER BY dt.id_don_thuoc DESC", nativeQuery = true)
    List<Map<String, Object>> getAllDonThuoc();
}

