package com.rexi.pkty.repository;

import com.rexi.pkty.entity.LichHen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Repository
public interface LichHenRepository extends JpaRepository<LichHen, String> {

    // Lấy lịch hẹn hôm nay từ View
    @Query(value = "SELECT * FROM v_LichHenHomNay", nativeQuery = true)
    List<Map<String, Object>> getTodayAppointments();

    // Tìm lịch hẹn theo id khách hàng
    @Query("SELECT l FROM LichHen l WHERE l.id_khach_hang = :idKhachHang ORDER BY l.ngay_kham DESC")
    List<LichHen> findByIdKhachHang(@Param("idKhachHang") String idKhachHang);

    // Gọi Stored Procedure đặt lịch hẹn mới
    @Query(value = "EXEC sp_AddAppointment :date, :time, :reason, :customerId, :petId, :doctorId, :bookerId, :clinic, :note", nativeQuery = true)
    List<Map<String, Object>> callSpAddAppointment(
        @Param("date") LocalDate date,
        @Param("time") LocalTime time,
        @Param("reason") String reason,
        @Param("customerId") Integer customerId,
        @Param("petId") Integer petId,
        @Param("doctorId") Integer doctorId,
        @Param("bookerId") Integer bookerId,
        @Param("clinic") String clinic,
        @Param("note") String note
    );

    // Lấy tất cả lịch hẹn (cho Admin)
    @Query(value = "SELECT l.*, t.ten_thu_cung, nv.ho_ten as ten_bac_si FROM LichHen l " +
                   "LEFT JOIN ThuCung t ON l.id_thu_cung = t.id_thu_cung " +
                   "LEFT JOIN NhanVien nv ON l.id_bac_si = nv.id_nhan_vien " +
                   "ORDER BY l.ngay_kham DESC, l.gio_kham DESC", nativeQuery = true)
    List<Map<String, Object>> getAllAppointments();
}


