package com.sa.authservice.components.controllers;

import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ApiController {

    @GetMapping("/protected")
    public ResponseEntity<Map<String, String>> getProtectedData(Authentication authentication) {
        String email = authentication.getName();
        Map<String, String> response = Map.of(
                "message", "Hello, " + email + "! You accessed a protected endpoint."
        );
        return ResponseEntity.ok(response);
    }
}
