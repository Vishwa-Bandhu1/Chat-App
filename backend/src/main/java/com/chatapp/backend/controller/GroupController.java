package com.chatapp.backend.controller;

import com.chatapp.backend.model.ChatGroup;
import com.chatapp.backend.repository.ChatGroupRepository;
import com.chatapp.backend.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    @Autowired
    private ChatGroupRepository chatGroupRepository;

    @Autowired
    private MessageRepository messageRepository;

    @PostMapping("/create")
    public ResponseEntity<ChatGroup> createGroup(@RequestBody ChatGroup group) {
        if (group.getMemberIds() == null) {
            group.setMemberIds(new HashSet<>());
        }
        // Ensure owner is a member
        if (group.getOwnerId() != null) {
            group.getMemberIds().add(group.getOwnerId());
        }

        ChatGroup savedGroup = chatGroupRepository.save(group);
        return ResponseEntity.ok(savedGroup);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ChatGroup>> getUserGroups(@PathVariable String userId) {
        List<ChatGroup> groups = chatGroupRepository.findByMemberIdsContaining(userId);
        return ResponseEntity.ok(groups);
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(@PathVariable String groupId) {
        messageRepository.deleteByGroupId(groupId);
        chatGroupRepository.deleteById(groupId);
        return ResponseEntity.ok().build();
    }
}
