#!/usr/bin/env bash
set -euo pipefail

SDK_ROOT="${ANDROID_HOME:-$HOME/Android/Sdk}"
mkdir -p "$SDK_ROOT"
cd "$SDK_ROOT"

if [ ! -x "$SDK_ROOT/platform-tools/adb" ]; then
  echo "Downloading platform-tools..."
  curl -fsSL -o platform-tools.zip https://dl.google.com/android/repository/platform-tools-latest-linux.zip
  unzip -qo platform-tools.zip
  rm -f platform-tools.zip
fi

if [ ! -x "$SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" ]; then
  echo "Downloading Android command-line tools..."
  curl -fsSL -o cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
  rm -rf cmdline-tools-tmp
  unzip -qo cmdline-tools.zip -d cmdline-tools-tmp
  rm -rf "$SDK_ROOT/cmdline-tools"
  mkdir -p "$SDK_ROOT/cmdline-tools/latest"
  mv cmdline-tools-tmp/cmdline-tools/* "$SDK_ROOT/cmdline-tools/latest/"
  rm -rf cmdline-tools-tmp cmdline-tools.zip
fi

export ANDROID_HOME="$SDK_ROOT"
export ANDROID_SDK_ROOT="$SDK_ROOT"
export PATH="$PATH:$SDK_ROOT/platform-tools:$SDK_ROOT/cmdline-tools/latest/bin"

if [ ! -d "$SDK_ROOT/build-tools/35.0.0" ] || [ ! -d "$SDK_ROOT/platforms/android-35" ]; then
  echo "Installing Android SDK packages (this may take a few minutes)..."
  yes | sdkmanager --licenses >/dev/null || true
  sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"
fi

echo "Android SDK ready at $SDK_ROOT"
"$SDK_ROOT/platform-tools/adb" version
