package com.chatapp.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ConversationDTO {
    private String userId;
    private String username;
    private String fullName;
    private String avatar;
    private String lastMessage;
    private LocalDateTime timestamp;
}
