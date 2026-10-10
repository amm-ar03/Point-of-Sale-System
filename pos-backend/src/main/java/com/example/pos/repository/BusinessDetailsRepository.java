package com.example.pos.repository;

import com.example.pos.model.BusinessDetails;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusinessDetailsRepository extends JpaRepository<BusinessDetails, Long> {
}