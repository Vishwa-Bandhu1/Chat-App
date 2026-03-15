# Chat App - React Native + Spring Boot

A premium real-time chat application built with **React Native** (Frontend) and **Java Spring Boot** (Backend), featuring WebSocket communication, MongoDB storage, and a modern, high-performance UI.

## 📱 Features

-   **User Authentication**: Secure Login and Signup using JWT and Spring Security.
-   **Real-time Messaging**: Instant, low-latency chat using WebSocket (STOMP protocol).
-   **Push Notifications**: Integrated with **Firebase Cloud Messaging (FCM)** for reliable background alerts.
-   **Call Signaling**: Real-time voice and video call alerts using WebSocket signals.
-   **Stickers & Emojis**: Rich expressive chat with integrated sticker packs and emoji keyboard (`rn-emoji-keyboard`).
-   **Image Uploads**: Support for sending images in chat (integrated with backend storage).
-   **User Directory**: Global search for registered users to start new conversations.
-   **Online Presence**: Real-time status tracking (Online/Offline/Last Seen).
-   **Modern UI**: Sleek dark-mode inspired design with smooth micro-animations.
-   **Offline Support**: Local message caching using AsyncStorage for a seamless experience.

## 🛠 Tech Stack

### Frontend (Mobile)
-   **React Native** (CLI)
-   **React Navigation** (Stack & Bottom Tabs)
-   **Axios** for REST APIs
-   **SockJS & STOMP** for WebSockets
-   **Firebase Messaging (FCM)** for notifications
-   **rn-emoji-keyboard** for expressive messaging
-   **AsyncStorage** for local data persistence

### Backend (Server)
-   **Java Spring Boot 3**
-   **Spring Security** (JWT Authentication)
-   **Firebase Admin SDK** for FCM integration
-   **Spring Data MongoDB**
-   **WebSocket** (Message Broker)

### Database
-   **MongoDB Atlas** (Cloud Database)

---

## 🚀 Setup & Installation

### Prerequisites
-   Node.js & npm / Yarn
-   Java JDK 17+
-   Android Studio (for Emulator & SDK)
-   MongoDB Atlas Account

### 1. Backend Setup (Spring Boot)
1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Configure database credentials and **Firebase `serviceAccountKey.json`** in `src/main/resources/application.yml`.
3.  Run the application:
    ```bash
    ./mvnw spring-boot:run
    ```
    The server will start on `http://localhost:8080`.

### 2. Frontend Setup (React Native)
1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **FCM Setup**: Place your `google-services.json` in `frontend/android/app/`.
4.  **Configure API URL**: Update `API_URL` in services to your local IP address.
5.  Start Metro Bundler:
    ```bash
    npm start
    ```
6.  Run on Android:
    ```bash
    npm run android
    ```

---

## 📱 Running on Physical Device (APK)

1.  **Generate Debug APK**:
    ```bash
    cd frontend/android
    ./gradlew assembleDebug
    ```
    APK Location: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

2.  **Install & Configure**:
    -   Connect Phone & PC to the **same Wi-Fi**.
    -   Shake phone -> **Dev Settings** -> **Debug server host & port** -> Enter your PC IP.
    -   Reload the app.

---

## 🤝 Contributing
Feel free to fork this repository and submit pull requests.
