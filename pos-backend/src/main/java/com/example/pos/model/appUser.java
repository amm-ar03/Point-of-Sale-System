package com.example.pos.model;

import jakarta.persistence.*;

@Entity
@Table(name = "app_users")
public class appUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String role; // "MASTER" or "USER"

    private boolean active = true;

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String u) { this.username = u; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String h) { this.passwordHash = h; }
    public String getRole() { return role; }
    public void setRole(String r) { this.role = r; }
    public boolean isActive() { return active; }
    public void setActive(boolean a) { this.active = a; }
}