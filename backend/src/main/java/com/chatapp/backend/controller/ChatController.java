package com.chatapp.backend.controller;

import com.chatapp.backend.model.ChatMessage;
import com.chatapp.backend.repository.MessageRepository;
import com.chatapp.backend.service.ConversationService;
import com.chatapp.backend.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ConversationService conversationService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private com.chatapp.backend.repository.ChatGroupRepository chatGroupRepository;

    @MessageMapping("/call")
    public void processCall(@Payload java.util.Map<String, Object> callSignal) {
        String recipientId = (String) callSignal.get("recipientId");
        if (recipientId != null) {
            messagingTemplate.convertAndSendToUser(recipientId, "/queue/calls", callSignal);
        }
    }

    @MessageMapping("/chat")
    public void processMessage(@Payload ChatMessage chatMessage) {
        chatMessage.setTimestamp(LocalDateTime.now());
        chatMessage.setStatus(ChatMessage.MessageStatus.DELIVERED);
        ChatMessage saved = messageRepository.save(chatMessage);

        if (chatMessage.getGroupId() != null) {
            chatGroupRepository.findById(chatMessage.getGroupId()).ifPresent(group -> {
                group.getMemberIds().stream()
                        .filter(memberId -> !memberId.equals(chatMessage.getSenderId()))
                        .forEach(memberId -> {
                            messagingTemplate.convertAndSendToUser(
                                    memberId, "/queue/messages", saved);
                        });
            });
        } else {
            messagingTemplate.convertAndSendToUser(
                    chatMessage.getRecipientId(), "/queue/messages", saved);
        }
    }

    @MessageMapping("/typing")
    public void processTyping(@Payload Map<String, Object> typingData) {
        String recipientId = (String) typingData.get("recipientId");
        String senderId = (String) typingData.get("senderId");
        Boolean isTyping = (Boolean) typingData.get("isTyping");
        if (recipientId != null && senderId != null) {
            Map<String, Object> typingEvent = Map.of(
                "type", "typing",
                "senderId", senderId,
                "isTyping", isTyping
            );
            messagingTemplate.convertAndSendToUser(recipientId, "/queue/typing", typingEvent);
        }
    }

    @GetMapping("/api/messages/{senderId}/{recipientId}")
    public List<ChatMessage> findChatMessages(@PathVariable("senderId") String senderId,
            @PathVariable("recipientId") String recipientId) {
        try {
            return messageRepository.findBySenderIdAndRecipientIdOrSenderIdAndRecipientIdOrderByTimestampAsc(
                    senderId, recipientId, recipientId, senderId);
        } catch (Exception e) {
            return messageRepository.findBySenderIdAndRecipientId(senderId, recipientId);
        }
    }

    @GetMapping("/api/conversations/{userId}")
    public List<com.chatapp.backend.dto.ConversationDTO> getRecentConversations(@PathVariable("userId") String userId) {
        return conversationService.getRecentConversations(userId);
    }

    @GetMapping("/api/messages/group/{groupId}")
    public List<ChatMessage> findGroupMessages(@PathVariable("groupId") String groupId) {
        return messageRepository.findByGroupIdOrderByTimestampAsc(groupId);
    }

    // Delete a single message
    @DeleteMapping("/api/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable("messageId") String messageId) {
        messageRepository.deleteById(messageId);
        return ResponseEntity.ok().build();
    }

    // Delete entire conversation between two users
    @DeleteMapping("/api/conversations/{userId}/{recipientId}")
    public ResponseEntity<Void> deleteConversation(@PathVariable("userId") String userId,
            @PathVariable("recipientId") String recipientId) {
        messageRepository.deleteBySenderIdAndRecipientIdOrSenderIdAndRecipientId(
                userId, recipientId, recipientId, userId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/api/conversations/{userId}/{participantId}/read")
    public ResponseEntity<Void> markConversationRead(@PathVariable("userId") String userId,
            @PathVariable("participantId") String participantId) {
        conversationService.markConversationRead(userId, participantId).ifPresent(conversation ->
                messagingTemplate.convertAndSendToUser(
                        userId, "/queue/conversations",
                        conversationService.toDto(conversation, userId)));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/chat/upload")
    @ResponseBody
    public ResponseEntity<String> uploadAttachment(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        String fileName = fileStorageService.storeFile(file);
        String fileUrl = org.springframework.web.servlet.support.ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/")
                .path(fileName)
                .toUriString();
        return ResponseEntity.ok(fileUrl);
    }

    // Update message status
    @PutMapping("/api/messages/{messageId}/status")
    @ResponseBody
    public ResponseEntity<Void> updateMessageStatus(@PathVariable("messageId") String messageId,
            @RequestParam("status") String status) {
        messageRepository.findById(messageId).ifPresent(message -> {
            try {
                message.setStatus(ChatMessage.MessageStatus.valueOf(status.toUpperCase()));
                ChatMessage updated = messageRepository.save(message);
                // Send status update to the sender
                messagingTemplate.convertAndSendToUser(
                        updated.getSenderId(), "/queue/messages", updated);
            } catch (IllegalArgumentException e) {
                // Invalid status
            }
        });
        return ResponseEntity.ok().build();
    }
}
