package com.rexi.pkty.repository;

import com.rexi.pkty.entity.KhachHang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KhachHangRepository extends JpaRepository<KhachHang, String> {
    java.util.Optional<KhachHang> findByEmail(String email);
}
