package com.chatapp.backend.service;

import com.chatapp.backend.dto.ConversationDTO;
import com.chatapp.backend.model.ChatMessage;
import com.chatapp.backend.model.User;
import com.chatapp.backend.repository.MessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatService {

        private static final Logger log = LoggerFactory.getLogger(ChatService.class);

        @Autowired
        private MongoTemplate mongoTemplate;

        public List<ConversationDTO> getRecentConversations(String userId) {
                try {
                        // 1. Find all direct messages involving this user, sorted by newest first
                        Query query = new Query();
                        query.addCriteria(new Criteria().andOperator(
                                        new Criteria().orOperator(
                                                        Criteria.where("groupId").exists(false),
                                                        Criteria.where("groupId").is(null)),
                                        new Criteria().orOperator(
                                                        Criteria.where("senderId").is(userId),
                                                        Criteria.where("recipientId").is(userId))));
                        query.with(Sort.by(Sort.Direction.DESC, "timestamp"));

                        List<ChatMessage> messages = mongoTemplate.find(query, ChatMessage.class, "messages");

                        // 2. Group by conversation partner, keeping only the latest message per partner
                        Map<String, ChatMessage> latestByPartner = new LinkedHashMap<>();
                        for (ChatMessage msg : messages) {
                                String partnerId = msg.getSenderId().equals(userId) ? msg.getRecipientId()
                                                : msg.getSenderId();
                                if (partnerId != null && !latestByPartner.containsKey(partnerId)) {
                                        latestByPartner.put(partnerId, msg);
                                }
                        }

                        if (latestByPartner.isEmpty()) {
                                return Collections.emptyList();
                        }

                        // 3. Lookup user details for all partner IDs
                        Query userQuery = new Query(Criteria.where("_id").in(latestByPartner.keySet()));
                        List<User> users = mongoTemplate.find(userQuery, User.class, "users");
                        Map<String, User> userMap = users.stream().collect(Collectors.toMap(User::getId, u -> u));

                        // 4. Build DTOs
                        List<ConversationDTO> result = new ArrayList<>();
                        for (Map.Entry<String, ChatMessage> entry : latestByPartner.entrySet()) {
                                String partnerId = entry.getKey();
                                ChatMessage msg = entry.getValue();
                                User partner = userMap.get(partnerId);

                                ConversationDTO dto = new ConversationDTO();
                                dto.setUserId(partnerId);
                                dto.setUsername(partner != null ? partner.getUsername() : "Unknown");
                                dto.setFullName(partner != null ? partner.getFullName() : "Unknown User");
                                dto.setAvatar(partner != null ? partner.getAvatar() : null);
                                dto.setLastMessage(msg.getContent());
                                dto.setTimestamp(msg.getTimestamp());
                                result.add(dto);
                        }

                        return result;
                } catch (Exception e) {
                        log.error("Error fetching conversations for user {}: {}", userId, e.getMessage(), e);
                        return Collections.emptyList();
                }
        }
}
