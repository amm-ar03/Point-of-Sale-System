package com.example.pos.repository;

import com.example.pos.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    java.util.List<com.example.pos.model.Order> findByStatusOrderByIdDesc(String status);
    java.util.List<com.example.pos.model.Order> findByCustomerIdAndStatusOrderByIdDesc(Long customerId, String status);
}
