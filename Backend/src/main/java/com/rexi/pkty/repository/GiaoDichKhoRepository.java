package com.rexi.pkty.repository;

import com.rexi.pkty.entity.GiaoDichKho;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GiaoDichKhoRepository extends JpaRepository<GiaoDichKho, String> {
}


