package com.example.pos.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.math.BigDecimal;

@Entity
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private BigDecimal price;
    private Integer stockQuantity;
    @Column(unique = true, nullable = false)
    private String sku;
    private Boolean taxExempt = false;

    // Soft delete: products that appear on past orders must never be removed from the database
    private boolean active = true;

    public Product() {
    }

    public Product(String name, BigDecimal price, Integer stockQuantity, String sku) {
        this.name = name;
        this.price = price;
        this.stockQuantity = stockQuantity;
        this.sku = sku;
    }

    public Long getId() {
        return id;
    }

    // no setter for id; JPA manages it

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public Boolean getTaxExempt() {
        return taxExempt;
    }

    public void setTaxExempt(Boolean taxExempt) {
        this.taxExempt = taxExempt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
