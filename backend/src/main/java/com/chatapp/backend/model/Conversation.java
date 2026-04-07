package com.chatapp.backend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "conversations")
public class Conversation {
    @Id
    private String id;

    private String conversationId;
    private List<String> participantIds;
    private Map<String, Integer> unreadCounts;
    private String lastMessage;
    private LocalDateTime lastUpdated;
}
