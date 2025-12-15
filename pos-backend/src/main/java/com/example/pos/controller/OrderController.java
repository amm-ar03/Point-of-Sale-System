package com.example.pos.controller;

import com.example.pos.dto.CreateOrderRequest;
import com.example.pos.dto.CreateOrderItemRequest;
import com.example.pos.model.Order;
import com.example.pos.model.OrderItem;
import com.example.pos.model.Product;
import com.example.pos.repository.OrderRepository;
import com.example.pos.repository.ProductRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:5173")
public class OrderController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    private static final double TAX_RATE = 0.13; // 13%

    public OrderController(OrderRepository orderRepository,
                           ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody CreateOrderRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body("Order must contain at least one item");
        }

        Order order = new Order();
        order.setCreatedAt(LocalDateTime.now());
        order.setStatus("PAID");

        double netTotal = 0.0;
        double taxableTotal = 0.0;

        for (CreateOrderItemRequest itemReq : request.getItems()) {
            Optional<Product> optProduct = productRepository.findById(itemReq.getProductId());
            if (optProduct.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Product not found: id=" + itemReq.getProductId());
            }

            Product product = optProduct.get();

            int quantity = itemReq.getQuantity() != null ? itemReq.getQuantity() : 0;
            if (quantity <= 0) {
                return ResponseEntity.badRequest()
                        .body("Invalid quantity for product id=" + product.getId());
            }

            // check stock
            if (product.getStockQuantity() == null ||
                product.getStockQuantity() < quantity) {
                return ResponseEntity.badRequest()
                        .body("Not enough stock for product id=" + product.getId());
            }

            double unitPrice = itemReq.getUnitPrice() != null
                    ? itemReq.getUnitPrice()
                    : (product.getPrice() != null ? product.getPrice() : 0.0);

            boolean taxExempt = Boolean.TRUE.equals(itemReq.getTaxExempt())
                    || Boolean.TRUE.equals(product.getTaxExempt());

            OrderItem orderItem = new OrderItem(product, quantity, unitPrice, taxExempt);
            order.addItem(orderItem);

            double line = orderItem.getLineTotal();
            netTotal += line;
            if (!taxExempt) {
                taxableTotal += line;
            }

            // decrement stock
            product.setStockQuantity(product.getStockQuantity() - quantity);
            productRepository.save(product);
        }

        double taxAmount = taxableTotal * TAX_RATE;
        double grandTotal = netTotal + taxAmount;

        order.setNetTotal(netTotal);
        order.setTaxAmount(taxAmount);
        order.setGrandTotal(grandTotal);

        Order saved = orderRepository.save(order);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<?> listOrders() {
        return ResponseEntity.ok(orderRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrder(@PathVariable Long id) {
        return orderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
