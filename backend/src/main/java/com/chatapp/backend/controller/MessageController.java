package com.chatapp.backend.controller;

import com.chatapp.backend.model.ChatMessage;
import com.chatapp.backend.model.Conversation;
import com.chatapp.backend.repository.MessageRepository;
import com.chatapp.backend.repository.UserRepository;
import com.chatapp.backend.service.ConversationService;
import com.chatapp.backend.service.FCMService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Slf4j
public class MessageController {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ConversationService conversationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final FCMService fcmService;

    @PostMapping
    public ResponseEntity<ChatMessage> sendMessage(@RequestBody ChatMessage chatMessage) {
        chatMessage.setTimestamp(LocalDateTime.now());
        chatMessage.setStatus(ChatMessage.MessageStatus.DELIVERED); // default delivered to server

        // Save to DB
        ChatMessage savedMessage = messageRepository.save(chatMessage);

        // Update or create conversation metadata for both participants
        Conversation conversation = conversationService.createOrUpdateConversation(
                chatMessage.getSenderId(), chatMessage.getRecipientId(), chatMessage.getContent());

        // Forward via STOMP to the specified recipient
        String topicDestination = "/topic/messages/" + chatMessage.getRecipientId();
        messagingTemplate.convertAndSend(topicDestination, savedMessage);

        // Publish real-time conversation updates
        messagingTemplate.convertAndSendToUser(
                chatMessage.getRecipientId(), "/queue/conversations",
                conversationService.toDto(conversation, chatMessage.getRecipientId()));
        messagingTemplate.convertAndSendToUser(
                chatMessage.getSenderId(), "/queue/conversations",
                conversationService.toDto(conversation, chatMessage.getSenderId()));

        // If recipient happens to be offline, trigger a push notification fallback
        userRepository.findById(chatMessage.getRecipientId()).ifPresent(recipient -> {
            if (!recipient.isOnline() && recipient.getFcmToken() != null) {
                userRepository.findById(chatMessage.getSenderId()).ifPresent(sender -> {
                    String title = "New message from " + sender.getFullName();
                    // Just a preview for body
                    String body = chatMessage.getContent().length() > 50
                            ? chatMessage.getContent().substring(0, 47) + "..."
                            : chatMessage.getContent();

                    fcmService.sendPushNotification(recipient.getFcmToken(), title, body, sender.getId());
                });
            }
        });

        return ResponseEntity.ok(savedMessage);
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<List<ChatMessage>> getConversationHistory(
            @PathVariable String conversationId,
            @RequestParam String currentUserId) {
        // Here conversationId conceptually maps to the other person's ID in a 1-to-1
        // chat context
        List<ChatMessage> messages = messageRepository
                .findBySenderIdAndRecipientIdOrSenderIdAndRecipientIdOrderByTimestampAsc(
                        currentUserId, conversationId, conversationId, currentUserId);

        return ResponseEntity.ok(messages);
    }

    @PatchMapping("/{messageId}/status")
    public ResponseEntity<Void> updateMessageStatus(
            @PathVariable String messageId,
            @RequestBody Map<String, String> statusUpdate) {

        String newStatusStr = statusUpdate.get("status");
        if (newStatusStr == null)
            return ResponseEntity.badRequest().build();

        messageRepository.findById(messageId).ifPresent(msg -> {
            try {
                ChatMessage.MessageStatus newStatus = ChatMessage.MessageStatus.valueOf(newStatusStr.toUpperCase());
                msg.setStatus(newStatus);
                messageRepository.save(msg);

                // Notify sender that their message was read/delivered
                messagingTemplate.convertAndSend("/topic/messages/" + msg.getSenderId() + "/status", msg);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid message status provided: {}", newStatusStr);
            }
        });

        return ResponseEntity.ok().build();
    }

}
