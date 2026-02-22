package com.chatapp.backend.controller;

import com.chatapp.backend.model.User;
import com.chatapp.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.chatapp.backend.service.FileStorageService fileStorageService;

    @GetMapping("/search")
    public ResponseEntity<List<User>> searchUsers(@RequestParam(value = "query", required = false) String query,
            @RequestParam("currentUserId") String currentUserId) {
        List<User> users;
        if (query == null || query.trim().isEmpty()) {
            users = userRepository.findAll();
        } else {
            users = userRepository.findByUsernameContainingIgnoreCaseOrFullNameContainingIgnoreCase(query, query);
        }

        // Filter out current user
        List<User> filteredUsers = users.stream()
                .filter(u -> !u.getId().equals(currentUserId))
                .collect(Collectors.toList());

        return ResponseEntity.ok(filteredUsers);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<User> updateProfile(@PathVariable String userId, @RequestBody Map<String, String> payload) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String fullName = payload.get("fullName");
        if (fullName != null && !fullName.trim().isEmpty()) {
            user.setFullName(fullName.trim());
        }

        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/upload-avatar")
    public ResponseEntity<User> uploadAvatar(@RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam("userId") String userId) {
        String fileName = fileStorageService.storeFile(file);
        String fileUrl = org.springframework.web.servlet.support.ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/")
                .path(fileName)
                .toUriString();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setAvatar(fileUrl);
        userRepository.save(user);

        return ResponseEntity.ok(user);
    }
}
