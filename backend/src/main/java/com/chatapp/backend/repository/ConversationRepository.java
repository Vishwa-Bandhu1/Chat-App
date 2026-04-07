package com.chatapp.backend.repository;

import com.chatapp.backend.model.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends MongoRepository<Conversation, String> {
    Optional<Conversation> findByConversationId(String conversationId);
    List<Conversation> findByParticipantIdsContainingOrderByLastUpdatedDesc(String userId);
}
