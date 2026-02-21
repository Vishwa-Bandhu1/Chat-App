
package com.chatapp.backend.util;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Date;
import java.util.Map;
import java.util.TreeMap;
import java.util.zip.CRC32;
import java.util.zip.Deflater;
import java.util.zip.Inflater;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.math.BigInteger;

/**
 * Self-contained AgoraUtil based on official Agora DynamicKey Java SDK.
 * Includes RtcTokenBuilder2, AccessToken2, ByteBuf, Utils, PackableEx,
 * Packable.
 * Uses java.util.Base64 instead of Apache Commons Codec.
 */
public class AgoraUtil {

    // Helper Enum for Controller usage
    public enum Role {
        Role_Attendee(0),
        Role_Publisher(1),
        Role_Subscriber(2),
        Role_Admin(101);

        public int initValue;

        Role(int initValue) {
            this.initValue = initValue;
        }
    }

    // Public method to build token
    public static String buildTokenWithUid(String appId, String appCertificate,
            String channelName, int uid,
            Role role, int privilegeTs) {
        RtcTokenBuilder2 builder = new RtcTokenBuilder2();
        // privilegeTs is absolute timestamp
        // we map Role enum to privileges

        // Calculate relative expire time?
        // No, AccessToken2 takes 'expire' as relative seconds usually?
        // Let's check RtcTokenBuilder2 code.
        // It calls buildTokenWithUid(..., tokenExpire, joinChannelPrivilegeExpire, ...)

        // The standard valid time logic:
        int tokenExpire = 24 * 3600; // 24 hours
        int privilegeExpire = privilegeTs; // Wait?

        // The method signature in RtcTokenBuilder2 is:
        // buildTokenWithUid(appId, appCert, channel, uid, tokenExpire,
        // joinChannelPrivilegeExpire, ...)
        // ALL expires are in SECONDS relative to NOW.

        // My previous code passed absolute timestamp.
        // I need to convert absolute timestamp to relative seconds.
        int currentTs = (int) (System.currentTimeMillis() / 1000);
        int expireSeconds = privilegeTs - currentTs;
        if (expireSeconds < 0)
            expireSeconds = 0;

        RtcTokenBuilder2.Role agoraRole = RtcTokenBuilder2.Role.Role_Attendee;
        if (role == Role.Role_Publisher)
            agoraRole = RtcTokenBuilder2.Role.Role_Publisher;
        if (role == Role.Role_Subscriber)
            agoraRole = RtcTokenBuilder2.Role.Role_Subscriber;
        if (role == Role.Role_Admin)
            agoraRole = RtcTokenBuilder2.Role.Role_Admin;

        return builder.buildTokenWithUid(appId, appCertificate, channelName, uid, agoraRole, expireSeconds,
                expireSeconds);
    }

    // ==========================================
    // RtcTokenBuilder2
    // ==========================================
    public static class RtcTokenBuilder2 {
        public enum Role {
            Role_Publisher(1),
            Role_Subscriber(2),
            Role_Admin(101),
            Role_Attendee(0);

            public int initValue;

            Role(int initValue) {
                this.initValue = initValue;
            }
        }

        public String buildTokenWithUid(String appId, String appCertificate, String channelName, int uid, Role role,
                int tokenExpire, int privilegeExpire) {
            return buildTokenWithUserAccount(appId, appCertificate, channelName, AccessToken2.getUidStr(uid), role,
                    tokenExpire, privilegeExpire);
        }

        public String buildTokenWithUserAccount(String appId, String appCertificate, String channelName, String account,
                Role role, int tokenExpire, int privilegeExpire) {
            AccessToken2 accessToken = new AccessToken2(appId, appCertificate, tokenExpire);
            AccessToken2.Service serviceRtc = new AccessToken2.ServiceRtc(channelName, account);

            serviceRtc.addPrivilegeRtc(AccessToken2.PrivilegeRtc.PRIVILEGE_JOIN_CHANNEL, tokenExpire);
            if (role == Role.Role_Publisher || role == Role.Role_Admin || role == Role.Role_Attendee) {
                serviceRtc.addPrivilegeRtc(AccessToken2.PrivilegeRtc.PRIVILEGE_PUBLISH_AUDIO_STREAM, privilegeExpire);
                serviceRtc.addPrivilegeRtc(AccessToken2.PrivilegeRtc.PRIVILEGE_PUBLISH_VIDEO_STREAM, privilegeExpire);
                serviceRtc.addPrivilegeRtc(AccessToken2.PrivilegeRtc.PRIVILEGE_PUBLISH_DATA_STREAM, privilegeExpire);
            }

            accessToken.addService(serviceRtc);
            try {
                return accessToken.build();
            } catch (Exception e) {
                e.printStackTrace();
                return "";
            }
        }
    }

    // ==========================================
    // AccessToken2
    // ==========================================
    public static class AccessToken2 {
        public enum PrivilegeRtc {
            PRIVILEGE_JOIN_CHANNEL(1), PRIVILEGE_PUBLISH_AUDIO_STREAM(2), PRIVILEGE_PUBLISH_VIDEO_STREAM(3),
            PRIVILEGE_PUBLISH_DATA_STREAM(4);

            public short intValue;

            PrivilegeRtc(int value) {
                intValue = (short) value;
            }
        }

        private static final String VERSION = "007"; // Wait, official source says 007? Yes.
        public static final short SERVICE_TYPE_RTC = 1;

        public String appCert = "";
        public String appId = "";
        public int expire;
        public int issueTs;
        public int salt;
        public Map<Short, Service> services = new TreeMap<>();

        public AccessToken2(String appId, String appCert, int expire) {
            this.appCert = appCert;
            this.appId = appId;
            this.expire = expire;
            this.issueTs = Utils.getTimestamp();
            this.salt = Utils.randomInt();
        }

        public void addService(Service service) {
            this.services.put(service.getServiceType(), service);
        }

        public String build() throws Exception {
            if (!Utils.isUUID(this.appId) || !Utils.isUUID(this.appCert)) {
                return "";
            }

            ByteBuf buf = new ByteBuf().put(this.appId).put(this.issueTs).put(this.expire).put(this.salt)
                    .put((short) this.services.size());
            byte[] signing = getSign();

            this.services.forEach((k, v) -> {
                v.pack(buf);
            });

            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(signing, "HmacSHA256"));
            byte[] signature = mac.doFinal(buf.asBytes());

            ByteBuf bufferContent = new ByteBuf();
            bufferContent.put(signature);
            bufferContent.buffer.put(buf.asBytes());

            return VERSION + Utils.base64Encode(Utils.compress(bufferContent.asBytes()));
        }

        public byte[] getSign() throws Exception {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(new ByteBuf().put(this.issueTs).asBytes(), "HmacSHA256"));
            byte[] signing = mac.doFinal(this.appCert.getBytes());
            mac.init(new SecretKeySpec(new ByteBuf().put(this.salt).asBytes(), "HmacSHA256"));
            return mac.doFinal(signing);
        }

        public static String getUidStr(int uid) {
            if (uid == 0)
                return "";
            return String.valueOf(uid & 0xFFFFFFFFL);
        }

        public static class Service {
            public short type;
            public TreeMap<Short, Integer> privileges = new TreeMap<>();

            public Service() {
            }

            public Service(short serviceType) {
                this.type = serviceType;
            }

            public void addPrivilegeRtc(PrivilegeRtc privilege, int expire) {
                this.privileges.put(privilege.intValue, expire);
            }

            public short getServiceType() {
                return this.type;
            }

            public ByteBuf pack(ByteBuf buf) {
                return buf.put(this.type).putIntMap(this.privileges);
            }
        }

        public static class ServiceRtc extends Service {
            public String channelName;
            public String uid;

            public ServiceRtc(String channelName, String uid) {
                this.type = SERVICE_TYPE_RTC;
                this.channelName = channelName;
                this.uid = uid;
            }

            public ByteBuf pack(ByteBuf buf) {
                return super.pack(buf).put(this.channelName).put(this.uid);
            }
        }
    }

    // ==========================================
    // Utils
    // ==========================================
    public static class Utils {
        public static int getTimestamp() {
            return (int) ((new Date().getTime()) / 1000);
        }

        public static int randomInt() {
            return new SecureRandom().nextInt();
        }

        public static boolean isUUID(String uuid) {
            return uuid.length() == 32 && uuid.matches("\\p{XDigit}+");
        }

        public static String base64Encode(byte[] data) {
            return Base64.getEncoder().encodeToString(data);
        }

        public static byte[] compress(byte[] data) {
            byte[] output;
            Deflater deflater = new Deflater();
            java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream(data.length);
            try {
                deflater.reset();
                deflater.setInput(data);
                deflater.finish();
                byte[] buf = new byte[data.length];
                while (!deflater.finished()) {
                    int i = deflater.deflate(buf);
                    bos.write(buf, 0, i);
                }
                output = bos.toByteArray();
            } catch (Exception e) {
                output = data;
                e.printStackTrace();
            } finally {
                deflater.end();
            }
            return output;
        }
    }

    // ==========================================
    // ByteBuf
    // ==========================================
    public static class ByteBuf {
        ByteBuffer buffer = ByteBuffer.allocate(1024).order(ByteOrder.LITTLE_ENDIAN);

        public ByteBuf() {
        }

        public byte[] asBytes() {
            byte[] out = new byte[buffer.position()];
            buffer.rewind();
            buffer.get(out, 0, out.length);
            return out;
        }

        public ByteBuf put(short v) {
            buffer.putShort(v);
            return this;
        }

        public ByteBuf put(byte[] v) {
            put((short) v.length);
            buffer.put(v);
            return this;
        }

        public ByteBuf put(int v) {
            buffer.putInt(v);
            return this;
        }

        public ByteBuf put(String v) {
            return put(v.getBytes());
        }

        public ByteBuf putIntMap(TreeMap<Short, Integer> extra) {
            put((short) extra.size());
            for (Map.Entry<Short, Integer> pair : extra.entrySet()) {
                put(pair.getKey());
                put(pair.getValue());
            }
            return this;
        }
    }
}
