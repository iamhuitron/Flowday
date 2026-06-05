# FlowDay 📅

> Your routine, your habits, and your life path — all in one app.

Mobile and web app built with **React Native + Expo**, inspired by TimeTune but with built-in long-term goal tracking.

---

## ✨ Features

| Module      | Description |
|-------------|-------------|
| **Today**     | View of the current day: ongoing activity, habits, and schedule preview |
| **Schedule** | TimeTune-style weekly templates (Weekday, Weekend) |
| **Habits** | Daily tracker with streaks and a 7-day mini-calendar |
| **Goals**   | 5-phase roadmap with checkable objectives and overall progress |
| **Settings** | Profile, notifications, theme, and data export |

---

## 🛠 Stack

```
React Native + Expo (SDK 52)
Expo Router v4          — file-based navigation
NativeWind v4           — Tailwind for RN
Zustand v5              — global state
MMKV                    — ultra-fast local persistence
date-fns                — date handling
TypeScript              — strict typing
```

---

## 🚀 How to run the project

### Prerequisites
- Node.js 20+
- npm or yarn
- Expo Go on your phone (Android/iOS) or emulator

### Installation

```bash
git clone https://github.com/TU_USUARIO/flowday.git
cd flowday
npm install
```

### Development

```bash
# Mobile (scan QR code with Expo Go)
npm start

# Android only
npm run android

# iOS only
npm run ios

# Web
npm run web
```

---

## 📁 Project structure

```
flowday/
├── app/                        # Expo Router — screens
│   ├── _layout.tsx             # Root layout (fonts, splash)
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Tab bar
│   │   ├── index.tsx           # Today
│   │   ├── schedule.tsx        # Schedule
│   │   ├── habits.tsx          # Habits
│   │   ├── goals.tsx           # Goals
│   │   └── settings.tsx        # Settings
│   ├── template/[id].tsx       # Create/edit template
│   └── activity/[id].tsx       # Create/edit activity
├── src/
│   ├── components/             # Reusable components
│   │   ├── ui/                 # Basic buttons, inputs, cards
│   │   ├── schedule/           # ActivityRow, TimelineView
│   │   ├── tracker/            # HabitCard, StreakBadge
│   │   └── habits/             # HabitRow, WeekCalendar
│   ├── constants/              # Colors, default templates, default habits
│   ├── hooks/                  # useHabitStreak, useCurrentActivity, etc.
│   ├── store/                  # Zustand store + MMKV persistence
│   ├── types/                  # TypeScript interfaces
│   └── utils/                  # Helpers (time, dates, IDs)
├── docs/                       # Design, wireframes, technical decisions
├── global.css                  # NativeWind base
├── tailwind.config.js
├── app.config.ts
└── tsconfig.json
```

---

## 🗺 Project Roadmap

### v0.1 — Base (current)
- [x] Project structure
- [x] Complete TypeScript types
- [x] Global store with persistence
- [x] Pre-loaded LMV and MJ templates
- [x] 5 main screens (scaffolding)
- [x] Default habits configured

### v0.2 — Full UI
- [ ] Complete visual design for all screens
- [ ] Animations with Reanimated
- [ ] Haptic feedback for interactions
- [ ] Dark/Light mode

### v0.3 — Full functionality
- [ ] Full CRUD for templates and activities
- [ ] Push notifications (Expo Notifications)
- [ ] Habit statistics and charts
- [ ] Export/import data

### v0.4 — Polish
- [ ] Widgets for Android/iOS
- [ ] Cloud sync (optional)
- [ ] Import from TimeTune

---

## 🎨 Color guide

```js
// Surfaces
bg:       ‘#0f0f11’
bg-2:     ‘#1a1a1f’
bg-3:     '#222228'
border:   ‘#2e2e38’

// Brand
accent:   ‘#7c6aff’  // main purple
pink:     ‘#ff6a8e’

// Activity categories
sleep:    ‘#6b7fff’
wake:     ‘#4ade80’
training: '#ff6a8e'
eating:   ‘#fbbf24’
study:    ‘#a78bfa’
commute:  ‘#f97316’
work:     ‘#34d399’
```

---

## 🤝 Contribute

This is a personal learning project. PRs are welcome.

```bash
# Create feature branch
git checkout -b feature/feature-name

# Commit with a clear message
git commit -m “feat: description of the change”

# Push and PR
git push origin feature/feature-name
```

---

## 📄 License

This project is proprietary and **All Rights Reserved**. The source code is public for portfolio evaluation and code review purposes only. See the [LICENSE](LICENSE.md) file for more details.

© 2026 Ian Miguel Huitrón. All rights reserved.

---

*Developed by Delgado Huitron Ian Miguel · Inoformatica, UNAM FES Cuautitlán*


