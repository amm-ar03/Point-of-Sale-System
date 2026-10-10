package com.example.pos.controller;

import com.example.pos.dto.CreateOrderRequest;
import com.example.pos.model.Order;
import com.example.pos.repository.OrderRepository;
import com.example.pos.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:5173")
public class OrderController {

    private final OrderService orderService;
    private final OrderRepository orderRepository;

    public OrderController(OrderService orderService, OrderRepository orderRepository) {
        this.orderService = orderService;
        this.orderRepository = orderRepository;
    }

    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody CreateOrderRequest request) {
        return ResponseEntity.ok(orderService.createOrder(request));
    }

    @GetMapping
    public List<Order> listOrders() {
        return orderRepository.findByStatusOrderByIdDesc("PAID");
    }

    @GetMapping("/drafts")
    public List<Order> listDrafts() {
        return orderRepository.findByStatusOrderByIdDesc("DRAFT");
    }

    @GetMapping("/by-customer/{customerId}")
    public List<Order> byCustomer(@PathVariable Long customerId) {
        return orderRepository.findByCustomerIdAndStatusOrderByIdDesc(customerId, "PAID");
    }

    @PostMapping("/drafts")
    public ResponseEntity<Order> createDraft(@RequestBody CreateOrderRequest request, Authentication auth) {
        return ResponseEntity.ok(orderService.saveDraft(null, request, auth.getName()));
    }

    @PutMapping("/drafts/{id}")
    public ResponseEntity<Order> updateDraft(@PathVariable Long id, @RequestBody CreateOrderRequest request,
                                             Authentication auth) {
        return ResponseEntity.ok(orderService.saveDraft(id, request, auth.getName()));
    }

    @PostMapping("/drafts/{id}/pay")
    public ResponseEntity<Order> payDraft(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.payDraft(id));
    }

    @DeleteMapping("/drafts/{id}")
    public ResponseEntity<Void> deleteDraft(@PathVariable Long id) {
        orderService.deleteDraft(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrder(@PathVariable Long id) {
        return orderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}