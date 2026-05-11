package com.rexi.pkty.repository;

import com.rexi.pkty.entity.FileDinhKem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FileDinhKemRepository extends JpaRepository<FileDinhKem, String> {
}

