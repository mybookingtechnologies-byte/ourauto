# OurAuto Mobile (Expo + React Native)

Production-ready mobile client for OurAuto backend APIs.

## Stack

- Expo SDK 55
- React Native + TypeScript
- Expo Router
- Axios
- TanStack Query
- Expo Secure Store
- Expo Image Picker

## Backend

- Base URL: `https://www.ourauto.in/api`
- API client: `src/api/client.ts`

The backend enforces CSRF checks on mutating endpoints. The mobile client already handles:

- `Origin: https://www.ourauto.in`
- `x-csrf-token`
- `ourauto_csrf` cookie forwarding

## Project Scripts

From `ourauto-mobile`:

```bash
npm install
npm run start
npm run android
npm run ios
npm run web
```

## Android Setup (Windows)

`expo run:android` requires Android SDK + ADB.

1. Install Android Studio.
2. In Android Studio, install:
- Android SDK Platform (latest stable)
- Android SDK Build-Tools
- Android Platform-Tools
- Android Emulator
3. Set environment variables in Windows:
- `ANDROID_HOME=C:\Users\<you>\AppData\Local\Android\Sdk`
- Add to `Path`:
- `%ANDROID_HOME%\platform-tools`
- `%ANDROID_HOME%\emulator`
- `%ANDROID_HOME%\cmdline-tools\latest\bin`
4. Open a new terminal and verify:

```bash
adb version
```

5. Start an emulator from Android Studio Device Manager, then run:

```bash
npx expo run:android
```

## iOS Notes

- `npx expo run:ios` requires macOS + Xcode.
- On Windows, use Expo Go for iOS device preview.

## Manual QA Checklist

### Marketplace

- Launch app via `npx expo start --clear`
- Open Marketplace tab
- Verify listings load
- Open a listing and verify:
- image carousel renders
- details render
- contact action opens phone/mail intent when data exists

### Authentication

- Sign up with a valid test account
- Log out
- Log in again
- Restart app and verify session persistence from Secure Store
- Log out and verify protected actions fail gracefully

### Dealer Upload

- Open Dealer tab
- Open Upload screen
- Select multiple images
- Submit valid listing payload
- Verify success message
- Refresh Marketplace and verify listing appears

### Error Handling

- Disable network and retry fetch/upload/login
- Verify user-visible error messaging
- Verify loading states appear while requests are in flight

## Diagnostics

```bash
npx tsc --noEmit
npx expo-doctor
```

Expected baseline:

- TypeScript passes
- Expo Doctor passes

## Git

Work is pushed on branch:

- `ourauto-mobile-rn`

PR shortcut:

- `https://github.com/mybookingtechnologies-byte/ourauto/pull/new/ourauto-mobile-rn`
