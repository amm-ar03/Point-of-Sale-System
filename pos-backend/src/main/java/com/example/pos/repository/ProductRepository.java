package com.example.pos.repository;

import com.example.pos.model.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySkuAndActiveTrue(String sku);

    List<Product> findByActiveTrue();

    boolean existsBySku(String sku);

    // includes soft-deleted products
    Optional<Product> findBySku(String sku);

    // Row lock so two cashiers can't sell the last unit at the same time. Only valid inside a transaction.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
}
