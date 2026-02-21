# Chat App - React Native + Spring Boot

A real-time chat application built with **React Native** (Frontend) and **Java Spring Boot** (Backend), featuring WebSocket communication, MongoDB storage, and a modern UI with Dark Mode support.

## 📱 Features

-   **User Authentication**: Login and Signup with JWT security.
-   **Real-time Messaging**: Instant chat using WebSocket (STOMP protocol).
-   **User Directory**: Search for users and view all registered users.
-   **Contacts Sync**: Automatically fetch and display device contacts.
-   **Dynamic Profile**: Editable user profiles with avatars.
-   **Dark Mode**: Toggle between Light and Dark themes.
-   **Offline Support**: Caches messages locally (AsyncStorage) for better UX.

## 🛠 Tech Stack

### Frontend (Mobile)
-   **React Native** (CLI)
-   **React Navigation** (Stack & Bottom Tabs)
-   **Axios** for REST APIs
-   **SockJS & STOMP** for WebSockets
-   **AsyncStorage** for local data persistence

### Backend (Server)
-   **Java Spring Boot 3**
-   **Spring Security** (JWT Authentication)
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
-   MongoDB Atlas Account (or local MongoDB)

### 1. Backend Setup (Spring Boot)
1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Configure database credentials in `src/main/resources/application.yml`.
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
3.  **Configure API URL**: Open `src/services/AuthService.js` and update `API_URL` with your machine's IP address if running on a physical device.
4.  Start Metro Bundler:
    ```bash
    npm start
    ```
5.  Run on Android:
    ```bash
    npm run android
    ```

---

## 📱 Running on Physical Device (APK)

To run the app on your Android phone:

1.  **Generate Debug APK**:
    ```bash
    cd frontend/android
    ./gradlew assembleDebug
    ```
    APK Location: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

2.  **Install & Configure**:
    -   Connect Phone & PC to the **same Wi-Fi**.
    -   Install the APK on your phone.
    -   Run `npm start` on your PC.
    -   Shake phone -> **Dev Settings** -> **Debug server host & port** -> Enter your PC IP.
    -   Reload the app.

---

## 🤝 Contributing
Feel free to fork this repository and submit pull requests.
