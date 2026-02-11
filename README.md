# 🌌 Synthetix OS

**The ultimate personal cloud and identity-first home automation ecosystem.**

Synthetix OS brings together your personal data and your smart home into a single, secure, and premium experience. Designed for Homelab enthusiasts, built for professionals.

---

## 🚀 Components

### 🧠 [Backend](./app)
FastAPI-powered engine with Supabase integration, Redis caching, and real-time WebSockets.
- **Port**: 8000
- **Docs**: `/docs`

### 🌐 [Web Portal](./web)
A sleek, responsive Next.js dashboard for full system control.
- **Tech**: Next.js 15, Tailwind, Framer Motion.
- **Port**: 3000

### 📱 [Mobile App](./mobile)
Native experience built with Expo for iOS and Android.
- **Tech**: React Native, Expo, Zustand.

### 🖥️ [Desktop App](./desktop)
Powerful desktop client for deep integration.
- **Tech**: Electron, Vite, React.

---

## 🛠️ Quick Setup (One-Click-ish)

### 1. Requirements
- Docker & Docker Compose
- Node.js & npm (for Web/Mobile development)
- Tailscale (for remote access)

### 2. Environment Configuration
Copy the template and fill in your Supabase credentials:
```bash
cp .env.example .env
# Edit .env with your SUPABASE_URL and SUPABASE_KEY
```

### 3. Start the Engine
```bash
docker-compose up -d
```

### 4. Launch the Web Portal
```bash
cd web
npm install
npm run dev
```

---

## 📖 Documentation

- **[System Overview](./SYSTEM_OVERVIEW.md)**: Deep dive into architecture and security.
- **[Tailscale Setup Gateway](./TAILSCALE_SETUP.md)**: How to access your OS from anywhere.
- **[Database Schema](./supabase_schema.sql)**: Core data structures.

---

## ✨ Features

- 🔒 **Privacy First**: Your data stays on your hardware, accessible only via Tailnet.
- ⚡ **Realtime Sync**: Control devices and see state changes instantly across all screens.
- 📁 **Personal Cloud**: High-performance file management with automatic deduplication.
- 🎨 **Premium Aesthetics**: Beautiful, dark-mode-first designs across all platforms.

---

## 🗺️ Roadmap

- [x] Unified Auth System
- [x] Real-time Device Sync
- [x] Cloud File Explorer
- [ ] iOS/Android Build Pipelines
- [ ] Plugin System for New Devices
- [ ] End-to-End Encrypted Storage

---
*Synthetix OS is a project of the [XxRettilexX](https://github.com/XxRettilexX) community.*
