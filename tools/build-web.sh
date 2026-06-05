#!/usr/bin/env bash
set -euo pipefail
if [ ! -f package.json ]; then
  echo "Run this from the repository root (where package.json is)."
  exit 2
fi
node tools/add-build-scripts.js
npm ci
npm run build
echo "Built web into ./web-build (if using Expo/React Native for Web)."
