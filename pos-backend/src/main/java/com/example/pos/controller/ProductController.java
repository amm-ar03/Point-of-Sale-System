package com.example.pos.controller;

import com.example.pos.model.Product;
import com.example.pos.repository.ProductRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:5173")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findByActiveTrue();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable Long id) {
        return productRepository.findById(id)
                .filter(Product::isActive)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody Product product) {
        String error = validate(product);
        if (error != null) {
            return ResponseEntity.badRequest().body(error);
        }

        String sku = product.getSku().trim();
        Optional<Product> sameSku = productRepository.findBySku(sku);

        if (sameSku.isPresent()) {
            Product existing = sameSku.get();
            if (existing.isActive()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("SKU already exists: " + sku);
            }
            // The SKU belongs to a deleted product: bring it back with the new details.
            // Reusing the row keeps old orders pointing at a valid product.
            existing.setName(product.getName().trim());
            existing.setPrice(product.getPrice().setScale(2, RoundingMode.HALF_UP));
            existing.setStockQuantity(product.getStockQuantity());
            existing.setTaxExempt(Boolean.TRUE.equals(product.getTaxExempt()));
            existing.setActive(true);
            return ResponseEntity.ok(productRepository.save(existing));
        }

        product.setSku(sku);
        product.setName(product.getName().trim());
        product.setPrice(product.getPrice().setScale(2, RoundingMode.HALF_UP));
        product.setActive(true);
        return ResponseEntity.ok(productRepository.save(product));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody Product updated) {
        Optional<Product> opt = productRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String error = validate(updated);
        if (error != null) {
            return ResponseEntity.badRequest().body(error);
        }

        Product existing = opt.get();
        String sku = updated.getSku().trim();
        if (!sku.equals(existing.getSku()) && productRepository.existsBySku(sku)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("SKU already exists (it may belong to a deleted product): " + sku);
        }

        existing.setName(updated.getName().trim());
        existing.setSku(sku);
        existing.setPrice(updated.getPrice().setScale(2, RoundingMode.HALF_UP));
        existing.setStockQuantity(updated.getStockQuantity());
        existing.setTaxExempt(Boolean.TRUE.equals(updated.getTaxExempt()));
        return ResponseEntity.ok(productRepository.save(existing));
    }

    // Soft delete: keeps history intact for orders that already reference this product
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        Optional<Product> opt = productRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Product product = opt.get();
        product.setActive(false);
        productRepository.save(product);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/sku/{sku}")
    public ResponseEntity<Product> getBySku(@PathVariable String sku) {
        return productRepository.findBySkuAndActiveTrue(sku.trim())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Returns an error message, or null if the product is valid. */
    private String validate(Product p) {
        if (p.getName() == null || p.getName().isBlank()) return "Name is required";
        if (p.getSku() == null || p.getSku().isBlank()) return "SKU is required";
        if (p.getPrice() == null || p.getPrice().signum() < 0) return "Price must be zero or more";
        if (p.getStockQuantity() == null || p.getStockQuantity() < 0) return "Stock must be zero or more";
        return null;
    }
}
