package com.example.pos.repository;

import com.example.pos.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByActiveTrueOrderByNameAsc();
    boolean existsByActiveTrueAndEmailIgnoreCase(String email);
    boolean existsByActiveTrueAndPhone(String phone);
}

