package com.example.pos.controller;

import com.example.pos.service.OrderService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
@CrossOrigin(origins = "http://localhost:5173")
public class ConfigController {

    private final OrderService orderService;

    public ConfigController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public Map<String, BigDecimal> getConfig() {
        return Map.of("taxRate", orderService.getTaxRate());
    }
}
