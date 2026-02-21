package com.chatapp.backend.repository;

import com.chatapp.backend.model.ChatGroup;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ChatGroupRepository extends MongoRepository<ChatGroup, String> {
    List<ChatGroup> findByMemberIdsContaining(String userId);
}
