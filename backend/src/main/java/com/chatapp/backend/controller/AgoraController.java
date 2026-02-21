
package com.chatapp.backend.controller;

import com.chatapp.backend.util.AgoraUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/agora")
@CrossOrigin(origins = "*") // Allow requests from React Native
public class AgoraController {

    @Value("${agora.app.id}")
    private String appId;

    @Value("${agora.app.certificate}")
    private String appCertificate;

    @GetMapping("/token")
    public ResponseEntity<Map<String, Object>> getToken(
            @RequestParam String channelName,
            @RequestParam(defaultValue = "0") int uid) {

        System.out.println("Agora Token Request: Channel=" + channelName + ", UID=" + uid);
        System.out.println("App ID: " + appId); // Do not log certificate for security in prod, but ok for debug

        if (appId == null || appCertificate == null) {
            System.err.println("Agora Configuration Missing!");
            return ResponseEntity.internalServerError().body(Map.of("error", "Agora Configuration Missing"));
        }

        // Token validity time in seconds (e.g., 24 hours)
        int expirationTimeInSeconds = 3600 * 24;
        int privilegeTs = (int) (System.currentTimeMillis() / 1000) + expirationTimeInSeconds;

        String token = "";
        try {
            token = AgoraUtil.buildTokenWithUid(
                    appId,
                    appCertificate,
                    channelName,
                    uid,
                    AgoraUtil.Role.Role_Publisher,
                    privilegeTs);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("channelName", channelName);
        response.put("uid", uid);
        response.put("appId", appId);

        return ResponseEntity.ok(response);
    }
}
