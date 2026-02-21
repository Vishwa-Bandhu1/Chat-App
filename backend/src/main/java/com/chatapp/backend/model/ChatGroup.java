package com.chatapp.backend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Set;

@Data
@Document(collection = "chat_groups")
public class ChatGroup {
    @Id
    private String id;
    private String name;
    private String avatar;
    private String ownerId;
    private Set<String> memberIds;
    private List<String> adminIds;
    private String lastMessage; // Optional: for list preview
    private String lastMessageTime;
}
