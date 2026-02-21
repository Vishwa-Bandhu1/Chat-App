package com.chatapp.backend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "messages")
public class ChatMessage {
    @Id
    private String id;
    private String senderId;
    private String recipientId; // Can be null if groupId is present
    private String groupId;
    private String content;
    private LocalDateTime timestamp;
    private MessageStatus status;
    private MessageType type;
    private String attachmentUrl;

    public enum MessageStatus {
        RECEIVED, DELIVERED
    }

    public enum MessageType {
        TEXT, IMAGE, FILE
    }
}
