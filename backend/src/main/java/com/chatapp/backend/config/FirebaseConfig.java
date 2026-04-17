package com.chatapp.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import javax.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.service-account.path:}")
    private String serviceAccountPath;

    @Value("${firebase.service-account.json:}")
    private String serviceAccountJson;

    @PostConstruct
    public void initialize() {
        if (!FirebaseApp.getApps().isEmpty()) {
            return;
        }

        try (InputStream serviceAccount = resolveCredentialsStream()) {
            if (serviceAccount == null) {
                log.warn("Firebase credentials not configured. Skipping Firebase initialization.");
                return;
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            FirebaseApp.initializeApp(options);
            log.info("Firebase application initialized");
        } catch (IOException e) {
            log.warn("Failed to initialize Firebase: {}", e.getMessage());
        }
    }

    private InputStream resolveCredentialsStream() throws IOException {
        if (serviceAccountJson != null && !serviceAccountJson.isBlank()) {
            return new ByteArrayInputStream(serviceAccountJson.getBytes(StandardCharsets.UTF_8));
        }

        if (serviceAccountPath != null && !serviceAccountPath.isBlank()) {
            Path configuredPath = Paths.get(serviceAccountPath);
            if (Files.exists(configuredPath)) {
                return Files.newInputStream(configuredPath);
            }
            log.warn("Configured Firebase credentials file not found at {}", serviceAccountPath);
        }

        String googleApplicationCredentials = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
        if (googleApplicationCredentials != null && !googleApplicationCredentials.isBlank()) {
            Path googleCredentialsPath = Paths.get(googleApplicationCredentials);
            if (Files.exists(googleCredentialsPath)) {
                return Files.newInputStream(googleCredentialsPath);
            }
            log.warn("GOOGLE_APPLICATION_CREDENTIALS file not found at {}", googleApplicationCredentials);
        }

        Path localCredentialsPath = Paths.get("serviceAccountKey.json");
        if (Files.exists(localCredentialsPath)) {
            return new FileInputStream(localCredentialsPath.toFile());
        }

        ClassPathResource classPathResource = new ClassPathResource("serviceAccountKey.json");
        if (classPathResource.exists()) {
            return classPathResource.getInputStream();
        }

        return null;
    }
}
