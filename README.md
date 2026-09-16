# FlowDay — The Ultimate Productivity OS

<p align="left">
  <strong>Offline-First Cross-Platform Productivity Suite, Time-Blocking, Habit Architecture & Live Focus</strong><br>
  Engineered by <a href="https://github.com/iamhuitron"><strong>Ian Miguel Delgado Huitrón</strong></a> · Co-Founder at <a href="https://github.com/Xaol-Studio"><strong>@Xaol-Studio</strong></a>
</p>

<p align="left">
  <a href="https://github.com/iamhuitron/flowday/releases/latest"><img src="https://img.shields.io/badge/Download_APK-FlowDay_v3.0.0-7c6aff?style=flat-square&logo=android&logoColor=white" alt="Download APK" /></a>
  <a href="https://flowday-rho.vercel.app/"><img src="https://img.shields.io/badge/Web_Demo-flowday--rho.vercel.app-059669?style=flat-square&logo=vercel&logoColor=white" alt="Web Demo" /></a>
  <a href="https://github.com/iamhuitron"><img src="https://img.shields.io/badge/Author-@iamhuitron-1e293b?style=flat-square&logo=github&logoColor=white" alt="Author" /></a>
  <a href="https://github.com/Xaol-Studio"><img src="https://img.shields.io/badge/Studio-@Xaol--Studio-059669?style=flat-square&logo=github&logoColor=white" alt="Studio" /></a>
  <img src="https://img.shields.io/badge/React_Native-Expo_SDK_52-61DAFB?style=flat-square&logo=react&logoColor=black" alt="Expo SDK 52" />
  <img src="https://img.shields.io/badge/Widgets-Android_&_iOS-fbbf24?style=flat-square" alt="Widgets" />
  <img src="https://img.shields.io/badge/Storage-MMKV_(Sub--ms)-blue?style=flat-square" alt="MMKV" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL_v3-emerald?style=flat-square" alt="License" /></a>
</p>

> **Your routine, your habits, your focus and your life path — all in one offline-first application.** Mobile and web application built with **React Native + Expo (SDK 52, New Architecture)**, featuring sub-millisecond MMKV persistence, home screen widgets, live pomodoro/focus sessions, and automated signed APK delivery via GitHub Actions.

---

## ✨ Features & Architecture

| Module | Features & Capabilities |
|---|---|
| **⚡ Today & Focus Mode** | Real-time ongoing block with live progress track, countdown timer, Pomodoro (25m / 50m / Full block), quick daily habit toggles, mood tracker and direct home widget launcher. |
| **📱 Mobile Widgets** | Native Android AppWidgets (4x2 Focus Block & 2x2 Streak/Habits) powered by custom Expo Config Plugin + in-app interactive Widget Control Center. |
| **📅 Schedule** | Time-blocking weekly templates with dynamic current-time indicator (`NowLine`), auto-scroll to current hour, and categorization balance. |
| **🔥 Habits Tracker** | Daily tracking with streaks, 35-day consistency heatmap, best streak record, weekly completion rate, and one-tap *⚡ Complete All Today* action. |
| **🎯 Goals & Roadmap** | Multi-phase milestones with overall progress track, priority filtering, and custom objectives. |
| **📝 Journal & Mood** | Daily reflections, 14-day mood strip, fast keyword & tag search, and instant text/markdown export. |
| **⚙️ Data & Backups** | JSON export/import with validation, reactive notification scheduling, tactile haptics, and theme customization. |

---

## 🛠 Tech Stack

- **Framework:** React Native 0.76 + Expo SDK 52 (New Architecture Enabled)
- **Routing:** Expo Router v4 (Typed Routes, nested tabs, modals)
- **Styling:** NativeWind v4 (Tailwind CSS) + custom dark OLED theme
- **State Management:** Zustand v5 with custom platform-aware storage adapter
- **Storage:** `react-native-mmkv` on native (sub-millisecond synchronous storage) and `localStorage` on web
- **Widgets:** Android AppWidgetProvider XML layouts + Kotlin native receiver injected via Expo Config Plugin
- **Haptics:** `expo-haptics` with multi-level tactile responses (selection, light, medium, heavy, success)
- **CI/CD:** GitHub Actions building signed Android APKs (`assembleDebug`) and automated GitHub Releases

---

## 📱 Mobile Home Screen Widgets

FlowDay includes native home screen widgets for instant at-a-glance productivity:

1. **Focus Block Widget (4x2):** Displays your current ongoing time block, live progress percentage, end time, and what's coming up next.
2. **Habit & Streak Widget (2x2 / 4x1):** Displays your active streak in days 🔥, completed habits ratio for today (e.g. 4/5), and status dots.

To add them:
1. Long-press any empty space on your Android/iOS home screen.
2. Select **Widgets** and search for **FlowDay**.
3. Drag the widget onto your home screen.
4. Use the in-app **Widgets** button to force immediate synchronization at any time.

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js 20+
- npm or yarn
- Android Studio / Emulator or Expo Go on physical device

### Installation

```bash
git clone https://github.com/iamhuitron/flowday.git
cd flowday
npm install --legacy-peer-deps
```

### Development

```bash
# Mobile (Expo Go / Development Client)
npm start

# Android native prebuild & run
npm run android

# Web build & preview
npm run web
```

---

## 🤖 Automated CI/CD & Releases

Every release tag (`v*`) pushed to GitHub automatically triggers the `.github/workflows/flowday-pipeline.yml` workflow:
1. Sets up JDK 17 and Node 20.
2. Executes `npx expo prebuild --platform android --clean`.
3. Bundles optimized production JS assets with Expo Router.
4. Compiles the APK via `./gradlew assembleDebug`.
5. Publishes a formal **GitHub Release** with `flowday-v3.0.0.apk` attached for direct download.

---

## 📄 License

GNU AGPL v3. Developed with passion by **Ian Miguel Delgado Huitrón** (@iamhuitron) · UNAM FES Cuautitlán.
