package com.chatapp.backend.config;

import com.chatapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final UserRepository userRepository;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = headerAccessor.getUser() != null ? headerAccessor.getUser().getName() : null;

        if (username != null) {
            log.info("User connected to WebSocket: {}", username);
            userRepository.findByUsername(username).ifPresent(user -> {
                user.setOnline(true);
                user.setStatus("ONLINE");
                userRepository.save(user);
            });
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = headerAccessor.getUser() != null ? headerAccessor.getUser().getName() : null;

        if (username != null) {
            log.info("User disconnected from WebSocket: {}", username);
            userRepository.findByUsername(username).ifPresent(user -> {
                user.setOnline(false);
                user.setStatus("OFFLINE");
                user.setLastSeen(LocalDateTime.now());
                userRepository.save(user);
            });
        }
    }
}
