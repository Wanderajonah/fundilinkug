#!/usr/bin/env bash
# Source Android SDK paths for local Expo/React Native builds (no sudo required).
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin"

if [ ! -x "$ANDROID_HOME/platform-tools/adb" ]; then
  echo "adb not found at $ANDROID_HOME/platform-tools/adb"
  echo "Run: bash scripts/install-android-sdk.sh"
  exit 1
fi

exec "$@"
