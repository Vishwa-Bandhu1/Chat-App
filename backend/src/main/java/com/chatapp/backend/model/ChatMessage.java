package com.chatapp.backend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

@Data
@Document(collection = "messages")
public class ChatMessage {
    @Id
    @JsonProperty("messageId")
    private String id;

    private String senderId;

    @JsonProperty("receiverId")
    private String recipientId; // Can be null if groupId is present

    private String groupId;

    @JsonProperty("message")
    private String content;
    private LocalDateTime timestamp;
    private MessageStatus status;
    private MessageType type;
    private String attachmentUrl;

    public enum MessageStatus {
        RECEIVED, DELIVERED
    }

    public enum MessageType {
        TEXT, IMAGE, FILE, STICKER
    }
}
