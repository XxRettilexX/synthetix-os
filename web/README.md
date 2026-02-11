
# Synthetix OS Web Portal

This is the web client for Synthetix OS, built with Next.js and Tailwind CSS.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    *   Creates a `.env.local` file.
    *   Set `NEXT_PUBLIC_API_URL` to your backend URL (default: `http://localhost:8000/api`).

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Features

*   **Landing Page**: Introduction to the OS.
*   **Authentication**: Login/Logout flow.
*   **Dashboard**: Manage devices with a responsive interface.
*   **Real-time Updates**: (Planned) WebSocket integration.

## Tech Stack

*   **Framework**: Next.js 14 (App Router)
*   **Styling**: Tailwind CSS
*   **State Management**: Zustand
*   **Icons**: Lucide React
