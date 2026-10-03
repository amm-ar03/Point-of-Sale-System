package com.example.pos.controller;

import com.example.pos.model.appUser;
import com.example.pos.repository.appUserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final appUserRepository repo;
    private final PasswordEncoder encoder;

    public UserController(appUserRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    public record CreateUser(String username, String password, String role) {}
    public record UserView(Long id, String username, String role, boolean active) {}

    @GetMapping
    public List<UserView> list() {
        return repo.findAll().stream()
            .map(u -> new UserView(u.getId(), u.getUsername(), u.getRole(), u.isActive()))
            .toList();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateUser req) {
        if (req.username() == null || req.username().isBlank()) return ResponseEntity.badRequest().body("Username is required");
        if (req.password() == null || req.password().length() < 8) return ResponseEntity.badRequest().body("Password must be at least 8 characters");
        String role = "MASTER".equals(req.role()) ? "MASTER" : "USER";
        if (repo.existsByUsername(req.username().trim())) return ResponseEntity.status(409).body("Username already exists");

        appUser u = new appUser();
        u.setUsername(req.username().trim());
        u.setPasswordHash(encoder.encode(req.password()));
        u.setRole(role);
        appUser saved = repo.save(u);
        return ResponseEntity.ok(new UserView(saved.getId(), saved.getUsername(), saved.getRole(), saved.isActive()));
    }

    @PutMapping("/{id}/active")
    public ResponseEntity<?> setActive(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        return repo.findById(id).map(u -> {
            u.setActive(Boolean.TRUE.equals(body.get("active")));
            repo.save(u);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

}