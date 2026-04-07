package com.chatapp.backend.service;

import com.chatapp.backend.dto.ConversationDTO;
import com.chatapp.backend.model.Conversation;
import com.chatapp.backend.model.User;
import com.chatapp.backend.repository.ConversationRepository;
import com.chatapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService {
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;

    public List<ConversationDTO> getRecentConversations(String userId) {
        List<Conversation> conversations = conversationRepository
                .findByParticipantIdsContainingOrderByLastUpdatedDesc(userId);

        if (conversations == null || conversations.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, User> participants = userRepository.findAllById(
                        conversations.stream()
                                .flatMap(conv -> conv.getParticipantIds().stream())
                                .filter(id -> !id.equals(userId))
                                .distinct()
                                .collect(Collectors.toList()))
                .stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        return conversations.stream()
                .map(conversation -> toDto(conversation, userId, participants))
                .collect(Collectors.toList());
    }

    public Conversation createOrUpdateConversation(String senderId, String recipientId, String message) {
        if (senderId == null || recipientId == null) {
            throw new IllegalArgumentException("Sender and recipient are required to update conversation");
        }

        String conversationId = buildConversationId(senderId, recipientId);
        Conversation conversation = conversationRepository.findByConversationId(conversationId)
                .orElseGet(() -> {
                    Conversation created = new Conversation();
                    created.setConversationId(conversationId);
                    created.setParticipantIds(Arrays.asList(senderId, recipientId));
                    created.setUnreadCounts(new HashMap<>());
                    created.getUnreadCounts().put(senderId, 0);
                    created.getUnreadCounts().put(recipientId, 0);
                    return created;
                });

        Map<String, Integer> unreadCounts = conversation.getUnreadCounts();
        if (unreadCounts == null) {
            unreadCounts = new HashMap<>();
        }
        unreadCounts.put(senderId, 0);
        unreadCounts.put(recipientId, unreadCounts.getOrDefault(recipientId, 0) + 1);
        conversation.setUnreadCounts(unreadCounts);
        conversation.setLastMessage(message != null ? message : "");
        conversation.setLastUpdated(LocalDateTime.now());

        return conversationRepository.save(conversation);
    }

    public Optional<Conversation> markConversationRead(String userId, String partnerId) {
        String conversationId = buildConversationId(userId, partnerId);
        return conversationRepository.findByConversationId(conversationId)
                .map(conversation -> {
                    if (conversation.getUnreadCounts() == null) {
                        conversation.setUnreadCounts(new HashMap<>());
                    }
                    conversation.getUnreadCounts().put(userId, 0);
                    return conversationRepository.save(conversation);
                });
    }

    public ConversationDTO toDto(Conversation conversation, String currentUserId) {
        return toDto(conversation, currentUserId, null);
    }

    public ConversationDTO toDto(Conversation conversation, String currentUserId, Map<String, User> participantMap) {
        List<String> participants = conversation.getParticipantIds();
        String partnerId = participants.stream()
                .filter(id -> !id.equals(currentUserId))
                .findFirst()
                .orElse(null);

        ConversationDTO dto = new ConversationDTO();
        dto.setId(conversation.getId());
        dto.setUserId(partnerId);
        dto.setLastMessage(conversation.getLastMessage());
        dto.setTimestamp(conversation.getLastUpdated());
        dto.setUnreadCount(conversation.getUnreadCounts() != null
                ? conversation.getUnreadCounts().getOrDefault(currentUserId, 0)
                : 0);

        if (partnerId != null) {
            User partner = participantMap != null ? participantMap.get(partnerId) : userRepository.findById(partnerId).orElse(null);
            dto.setUsername(partner != null ? partner.getUsername() : null);
            dto.setFullName(partner != null ? partner.getFullName() : null);
            dto.setAvatar(partner != null ? partner.getAvatar() : null);
        }

        return dto;
    }

    private String buildConversationId(String userIdA, String userIdB) {
        List<String> ids = new ArrayList<>(Arrays.asList(userIdA, userIdB));
        ids.sort(String::compareTo);
        return String.join("_", ids);
    }
}
