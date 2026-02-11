# Synthetix OS Mobile App

This is the mobile client for Synthetix OS, built with React Native and Expo.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Configure API URL**:
    *   Open `src/api/config.js`.
    *   Set `API_URL` to your computer's local IP address (e.g., `http://192.168.1.X:8000/api`).
    *   If using Android Emulator, use `http://10.0.2.2:8000/api`.
    *   If using iOS Simulator, `http://localhost:8000/api` works fine.

3.  **Run the App**:
    *   Start the development server:
        ```bash
        npx expo start
        ```
    *   Press `i` for iOS Simulator.
    *   Press `a` for Android Emulator.
    *   Scan the QR code with Expo Go on a physical device (ensure both devices are on the same Wi-Fi).

## Features

*   **Login/Register**: Works with the local backend (mock authentication by default if Supabase is not configured).
*   **Device Dashboard**: View and control devices.
*   **Real-time Updates**: Toggle switches update in real-time (optimistic UI + API confirmation).

## Troubleshooting

*   **Network Error**: Ensure the backend is running and `API_URL` is reachable from the device/emulator.
