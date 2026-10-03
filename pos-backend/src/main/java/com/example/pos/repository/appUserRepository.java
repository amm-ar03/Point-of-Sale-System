package com.example.pos.repository;

import com.example.pos.model.appUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface appUserRepository extends JpaRepository<appUser, Long> {
    Optional<appUser> findByUsername(String username);
    boolean existsByUsername(String username);
}