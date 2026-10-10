package com.example.pos.controller;

import com.example.pos.model.BusinessDetails;
import com.example.pos.repository.BusinessDetailsRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/business")
@CrossOrigin(origins = "http://localhost:5173")
public class BusinessController {

    private final BusinessDetailsRepository repo;

    public BusinessController(BusinessDetailsRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public BusinessDetails get() {
        return repo.findById(1L).orElseGet(BusinessDetails::new);
    }

    @PutMapping
    @PreAuthorize("hasRole('MASTER')")
    public BusinessDetails save(@RequestBody BusinessDetails in) {
        BusinessDetails b = repo.findById(1L).orElseGet(BusinessDetails::new);
        b.setName(in.getName());
        b.setAddress(in.getAddress());
        b.setPhone(in.getPhone());
        b.setEmail(in.getEmail());
        b.setTaxNumber(in.getTaxNumber());
        b.setFooterNote(in.getFooterNote());
        return repo.save(b);
    }
}