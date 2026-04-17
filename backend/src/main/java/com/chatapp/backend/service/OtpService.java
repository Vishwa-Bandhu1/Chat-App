package com.chatapp.backend.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.stereotype.Service;

@Service
public class OtpService {

    public FirebaseToken verifyToken(String idToken) throws Exception {
        if (FirebaseApp.getApps().isEmpty()) {
            throw new IllegalStateException("Firebase authentication is not configured on the server");
        }
        return FirebaseAuth.getInstance().verifyIdToken(idToken);
    }
}
