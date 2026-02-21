package com.chatapp.backend.controller;

import com.chatapp.backend.model.ChatMessage;
import com.chatapp.backend.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private com.chatapp.backend.service.ChatService chatService;

    @Autowired
    private com.chatapp.backend.service.FileStorageService fileStorageService;

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
        chatMessage.setStatus(ChatMessage.MessageStatus.RECEIVED);
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

    @GetMapping("/messages/{senderId}/{recipientId}")
    @ResponseBody
    public List<ChatMessage> findChatMessages(@PathVariable String senderId, @PathVariable String recipientId) {
        try {
            return messageRepository.findBySenderIdAndRecipientIdOrSenderIdAndRecipientIdOrderByTimestampAsc(
                    senderId, recipientId, recipientId, senderId);
        } catch (Exception e) {
            return messageRepository.findBySenderIdAndRecipientId(senderId, recipientId);
        }
    }

    @GetMapping("/conversations/{userId}")
    @ResponseBody
    public List<com.chatapp.backend.dto.ConversationDTO> getRecentConversations(@PathVariable String userId) {
        return chatService.getRecentConversations(userId);
    }

    @GetMapping("/messages/group/{groupId}")
    @ResponseBody
    public List<ChatMessage> findGroupMessages(@PathVariable String groupId) {
        return messageRepository.findByGroupIdOrderByTimestampAsc(groupId);
    }

    // Delete a single message
    @DeleteMapping("/messages/{messageId}")
    @ResponseBody
    public ResponseEntity<Void> deleteMessage(@PathVariable String messageId) {
        messageRepository.deleteById(messageId);
        return ResponseEntity.ok().build();
    }

    // Delete entire conversation between two users
    @DeleteMapping("/conversations/{userId}/{recipientId}")
    @ResponseBody
    public ResponseEntity<Void> deleteConversation(@PathVariable String userId, @PathVariable String recipientId) {
        messageRepository.deleteBySenderIdAndRecipientIdOrSenderIdAndRecipientId(
                userId, recipientId, recipientId, userId);
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
}
