package com.rexi.pkty.repository;

import com.rexi.pkty.entity.LoThuoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoThuocRepository extends JpaRepository<LoThuoc, Long> {
}



