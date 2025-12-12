package com.sa.authservice.components.controllers;

import com.sa.authservice.components.entities.User;
import com.sa.authservice.config.JwtProperties;
import com.sa.authservice.util.JwtUtil;
import com.sa.authservice.components.entities.UserRepository;
import java.util.Map;
import java.util.Optional;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtProperties jwtProperties;


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail().toLowerCase(),
                            loginRequest.getPassword()
                    )
            );

            String email = loginRequest.getEmail().toLowerCase();
            String accessToken = jwtUtil.generateAccessToken(email);
            String refreshToken = jwtUtil.generateRefreshToken(email);

            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                    .httpOnly(true)
                    .secure(true)
                    .sameSite("None")
                    .path("/")
                    .maxAge(jwtProperties.getRefreshExpiration())
                    .build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                    .body(Map.of("message", "Login successful", "accessToken", accessToken));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
        }
    }


    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail().toLowerCase()).isPresent()) {
            return ResponseEntity.status(409).body(Map.of(
                    "status", "error",
                    "message", "Email already registered"
            ));
        }

        User newUser = User.builder()
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .isGoogleUser(false)
                .build();

        userRepository.save(newUser);

        return ResponseEntity.status(201).body(Map.of(
                "status", "success",
                "message", "User registered successfully"
        ));
    }



    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        ResponseCookie clearRefreshToken = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/")
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearRefreshToken.toString())
                .body(Map.of("message", "Logged out"));
    }


    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@CookieValue(value = "refreshToken", required = false) String refreshToken) {
        if (refreshToken == null || !jwtUtil.validateToken(refreshToken)) {
            ResponseCookie clearRefreshToken = ResponseCookie.from("refreshToken", "")
                    .httpOnly(true)
                    .secure(true)
                    .sameSite("None")
                    .path("/")
                    .maxAge(0)
                    .build();

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .header(HttpHeaders.SET_COOKIE, clearRefreshToken.toString())
                    .body("Invalid refresh token");
        }

        String email = jwtUtil.extractEmail(refreshToken);
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
        }

        String newAccessToken = jwtUtil.generateAccessToken(email);

        return ResponseEntity.ok()
                .body(Map.of("message", "Access token refreshed", "accessToken", newAccessToken));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Forwarded-Authorization", required = false) String forwardedAuthHeader,
            @RequestHeader(value = "X-User-Email", required = false) String forwardedEmail) {

        String usedHeader = (authHeader != null) ? authHeader : forwardedAuthHeader;

        if (usedHeader == null) {
            Map<String, Object> body = Map.of(
                    "error", "Missing Authorization header",
                    "details", "No Authorization or X-Forwarded-Authorization headers present. " +
                            "If you are behind a gateway, ensure it forwards the header.",
                    "gatewayForwarded", forwardedAuthHeader != null,
                    "forwardedEmailPresent", forwardedEmail != null
            );
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
        }

        if (!usedHeader.startsWith("Bearer ")) {
            Map<String, Object> body = Map.of(
                    "error", "Invalid Authorization header format",
                    "details", "Expected 'Bearer <token>'"
            );
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }

        String token = usedHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            Map<String, Object> body = Map.of(
                    "error", "Invalid token",
                    "details", "Token validation failed on auth service.",
                    "tokenPresent", true
            );
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
        }

        String email = forwardedEmail != null ? forwardedEmail : jwtUtil.extractEmail(token);

        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Could not extract email from token"));
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found", "email", email));
        }

        User user = userOptional.get();
        return ResponseEntity.ok(Map.of("email", user.getEmail(), "id", user.getId()));
    }


    @PostMapping("/update-username")
    public ResponseEntity<?> updateUsername(@RequestBody Map<String, String> request) {
        try {
            String newUsername = request.get("username");
            if (newUsername == null || newUsername.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username cannot be empty"));
            }

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName(); // assuming principal is email
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalStateException("User not found"));

            user.setUsername(newUsername);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of(
                    "message", "Username updated successfully",
                    "username", newUsername
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }


    @PostMapping("/delete-account")
    public ResponseEntity<?> deleteAccount() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName(); // principal is email
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalStateException("User not found"));

            userRepository.deleteById(user.getId());

            return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }




    @Data
    static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    static class RegisterRequest {
        private String email;
        private String password;
    }
}




