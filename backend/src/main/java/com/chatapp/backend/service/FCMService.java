package com.chatapp.backend.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class FCMService {

    public void sendPushNotification(String userDeviceToken, String title, String body, String conversationId) {
        if (userDeviceToken == null || userDeviceToken.isEmpty()) {
            log.warn("Attempted to send FCM notification but device token is missing");
            return;
        }

        try {
            Message message = Message.builder()
                    .setToken(userDeviceToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .putData("click_action", "OPEN_CHAT")
                    .putData("conversationId", conversationId != null ? conversationId : "")
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            log.info("Successfully sent FCM notification: {}", response);
        } catch (Exception e) {
            log.error("Error sending FCM notification", e);
        }
    }
}
