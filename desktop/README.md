# Synthetix OS Desktop App

This is the desktop client for Synthetix OS, built with Electron, React, and Vite.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Mode**:
    ```bash
    npm run dev
    ```
    This will start the Vite dev server and launch the Electron window.

3.  **Build for Production**:
    ```bash
    npm run build
    ```
    The output will be in the `dist` and `dist-electron` directories.
    To package the app, you may need to configure `electron-builder` further in `package.json`.

## Configuration

*   **API URL**: By default, it connects to `http://localhost:8000/api`.
    *   To change this, set `VITE_API_URL` in a `.env` file in the `desktop` directory.

## Features

*   **Authentication**: Login using the same credentials as mobile/web.
*   **Device Dashboard**: View and toggle devices.
*   **Electron Integration**: Native window management.

## Troubleshooting

*   If Electron doesn't open, ensure `npm run dev` output shows "VITE vX.X.X ready".
*   If API calls fail, ensure the backend is running on port 8000.
