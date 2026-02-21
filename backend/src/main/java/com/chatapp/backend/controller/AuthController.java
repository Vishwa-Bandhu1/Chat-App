package com.chatapp.backend.controller;

import com.chatapp.backend.dto.JwtAuthenticationResponse;
import com.chatapp.backend.dto.LoginRequest;
import com.chatapp.backend.dto.SignUpRequest;
import com.chatapp.backend.model.User;
import com.chatapp.backend.repository.UserRepository;
import com.chatapp.backend.security.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chatapp.backend.model.Role;
import com.google.firebase.auth.FirebaseToken;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    JwtTokenProvider tokenProvider;

    @Autowired
    com.chatapp.backend.service.OtpService otpService;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsernameOrEmail(),
                        loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);

        User user = (User) authentication.getPrincipal(); // Get the UserDetails object (which is our User model)

        return ResponseEntity.ok(new JwtAuthenticationResponse(jwt, user.getId(), user.getUsername(), user.getEmail(),
                user.getFullName()));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignUpRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return new ResponseEntity<>("Username is already taken!", HttpStatus.BAD_REQUEST);
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return new ResponseEntity<>("Email Address already in use!", HttpStatus.BAD_REQUEST);
        }

        // Creating user's account
        User user = new User();
        user.setFullName(signUpRequest.getFullName());
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(passwordEncoder.encode(signUpRequest.getPassword()));
        user.setRole(Role.USER);

        userRepository.save(user);

        return new ResponseEntity<>("User registered successfully", HttpStatus.OK);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String phoneNumber = payload.get("phoneNumber");
        String idToken = payload.get("idToken"); // Now expecting Firebase ID Token

        try {
            // 1. Verify Token with Firebase
            FirebaseToken decodedToken = otpService.verifyToken(idToken);
            String uid = decodedToken.getUid();

            // 2. Ideally, check if uid matches or phone number matches
            // String tokenPhone = (String) decodedToken.getClaims().get("phone_number");

            // 3. Login or Create User
            boolean isNewUser = !userRepository.existsByPhoneNumber(phoneNumber);
            User user;

            if (isNewUser) {
                user = new User();
                user.setPhoneNumber(phoneNumber);
                user.setUsername("User_" + phoneNumber.substring(phoneNumber.length() - 4));
                user.setRole(Role.USER);
                userRepository.save(user);
            } else {
                user = userRepository.findByPhoneNumber(phoneNumber)
                        .orElseThrow(() -> new RuntimeException("User not found"));
            }

            // 4. Generate JWT
            Authentication authentication = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
            String jwt = tokenProvider.generateToken(authentication);

            Map<String, Object> response = new HashMap<>();
            response.put("accessToken", jwt);
            response.put("isNewUser", isNewUser);
            response.put("id", user.getId().toString());
            response.put("username", user.getUsername());
            response.put("fullName", user.getFullName());
            response.put("email", user.getEmail());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace(); // Log error for debugging
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid Token: " + e.getMessage()));
        }
    }
}
