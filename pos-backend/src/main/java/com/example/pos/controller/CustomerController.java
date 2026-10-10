package com.example.pos.controller;

import com.example.pos.model.Customer;
import com.example.pos.repository.CustomerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "http://localhost:5173")
public class CustomerController {

    private final CustomerRepository repo;

    public CustomerController(CustomerRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Customer> list() {
        return repo.findByActiveTrueOrderByNameAsc();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Customer in) {
        if (in.getName() == null || in.getName().isBlank()) {
            return ResponseEntity.badRequest().body("Name is required");
        }
        if (in.getEmail() != null && !in.getEmail().isBlank()
                && repo.existsByActiveTrueAndEmailIgnoreCase(in.getEmail().trim())) {
            return ResponseEntity.status(409).body("A customer with this email already exists");
        }
        if (in.getPhone() != null && !in.getPhone().isBlank()
                && repo.existsByActiveTrueAndPhone(in.getPhone().trim())) {
            return ResponseEntity.status(409).body("A customer with this phone already exists");
        }
        Customer c = new Customer();
        copy(in, c);
        return ResponseEntity.ok(repo.save(c));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Customer in) {
        if (in.getName() == null || in.getName().isBlank()) {
            return ResponseEntity.badRequest().body("Name is required");
        }
        return repo.findById(id).map(c -> {
            copy(in, c);
            return ResponseEntity.ok((Object) repo.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        return repo.findById(id).map(c -> {
            c.setActive(false);
            repo.save(c);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    private void copy(Customer in, Customer c) {
        c.setName(in.getName().trim());
        c.setPhone(trim(in.getPhone()));
        c.setEmail(trim(in.getEmail()));
        c.setAddress(trim(in.getAddress()));
        c.setNotes(trim(in.getNotes()));
    }

    private String trim(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}