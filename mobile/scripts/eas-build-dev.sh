#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [ -z "${EXPO_PUBLIC_GOOGLE_CLIENT_ID:-}" ] && [ -z "${EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:-}" ]; then
  echo "Missing EXPO_PUBLIC_GOOGLE_CLIENT_ID in mobile/.env"
  exit 1
fi

export EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID="${EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:-$EXPO_PUBLIC_GOOGLE_CLIENT_ID}"

echo "Building development APK on EAS (cloud)..."
npx eas-cli build --platform android --profile development --non-interactive
