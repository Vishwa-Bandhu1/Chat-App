package com.chatapp.backend.repository;

import com.chatapp.backend.model.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<ChatMessage, String> {
    List<ChatMessage> findBySenderIdAndRecipientId(String senderId, String recipientId);
}
