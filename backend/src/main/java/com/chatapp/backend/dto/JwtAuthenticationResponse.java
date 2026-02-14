package com.chatapp.backend.dto;

import lombok.Data;

@Data
public class JwtAuthenticationResponse {
    private String accessToken;
    private String tokenType = "Bearer";

    private String id;
    private String username;
    private String email;
    private String fullName;

    public JwtAuthenticationResponse(String accessToken, String id, String username, String email, String fullName) {
        this.accessToken = accessToken;
        this.id = id;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
    }
}
