package com.rexi.pkty.repository;

import com.rexi.pkty.entity.EmailMarketing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EmailMarketingRepository extends JpaRepository<EmailMarketing, Integer> {
    Optional<EmailMarketing> findByEmail(String email);
    boolean existsByEmail(String email);
}
