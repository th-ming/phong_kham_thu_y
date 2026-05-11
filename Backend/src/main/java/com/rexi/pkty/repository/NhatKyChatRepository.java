package com.rexi.pkty.repository;

import com.rexi.pkty.entity.NhatKyChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NhatKyChatRepository extends JpaRepository<NhatKyChat, Long> {
    List<NhatKyChat> findByIdTaiKhoanOrderByThoiGianDesc(String idTaiKhoan);
}
