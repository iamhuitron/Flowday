Deployment guide
================

This repository is an Expo/React Native (web-enabled) project. The following describes how to build a static web bundle and deploy it to either GitHub Pages or Vercel.

Prerequisites
- Node.js (>=16)
- npm or yarn
- expo-cli installed (if not present): `npm install -g expo-cli`

Build (static web)

1. Install dependencies:

```bash
npm ci
# or
# npm install
```

2. Build the web output (produces `web-build`):

```bash
# If you have Expo configured
npm run build:web

# If there is no script, try:
npx expo build:web --no-pwa

# Or for a static export:
npx expo export:web --output-dir web-build
```

GitHub Pages (automated)

- A GitHub Action is included at `.github/workflows/deploy-gh-pages.yml` that runs `npm run build:web` and publishes `./web-build` to `gh-pages` branch on push to `main`.
- Ensure your `package.json` has a `build:web` script that creates the `web-build` directory.

GitHub Pages (manual)

```bash
npm run build:web
npm i -g gh-pages
npx gh-pages -d web-build
```

Vercel

- The included `vercel.json` config instructs Vercel to run the build and serve `web-build`. Set the project to use the default build command (it will run `npm run build` or the script used by your project). If needed, set the Build Command to `npm run build:web` and Output Directory to `web-build` in the Vercel project settings.

Notes
- If your project uses Expo Router / React Native for Web, ensure dependencies for web (`react-dom`, `react-native-web`) are in `package.json`.
- If `npm run build:web` is not present, add the following to your `package.json` scripts:

```json
"scripts": {
  "web": "expo start --web",
  "build:web": "expo build:web"
}
```

If you want, I can open a PR that adds the `build:web` script and a small GitHub Action secret guide. Tell me which hosting (Vercel or GitHub Pages) you prefer and I will update `package.json` and create a deploy action accordingly.
