package com.example.pos.config;

import com.example.pos.model.appUser;
import com.example.pos.repository.appUserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {
    @Bean
    CommandLineRunner seedMaster(appUserRepository repo, PasswordEncoder enc) {
        return args -> {
            if (repo.count() == 0) {
                appUser m = new appUser();
                m.setUsername("master");
                m.setPasswordHash(enc.encode("ChangeMe123!"));
                m.setRole("MASTER");
                repo.save(m);
            }
        };
    }
}