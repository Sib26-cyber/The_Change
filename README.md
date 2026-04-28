# The Change (Prototype)

This is a React Native + Expo project developed as part of my final-year work.
The app provides a private personal diary and symptom tracking tool designed for 
women experiencing perimenopausal symptoms.

## Install & Test (iOS)

1. Install [TestFlight](https://apps.apple.com/app/testflight/id899247664) from the App Store
2. Open the beta invite: **https://testflight.apple.com/join/rr72Xnvz**
3. Accept the invitation and install **The Change**
4. Launch the app and use the main features as normal

> TestFlight is required on iOS before you can install the beta app.

## Run Locally (Developers)

```bash
npm install
npx expo login
$env:REACT_NATIVE_PACKAGER_HOSTNAME="<your-wifi-ip>" ; npx expo start --port 8081
```
Scan the QR code with the Expo Go app or open `exp://<your-wifi-ip>:8081` in Safari on your device.

## Features in this prototype:
- Onboarding (Welcome → Set PIN)
- Local-only PIN validation (no cloud storage)
- Tab navigation (Home, Diary, Insights)
- Placeholder screens ready for expansion
- Clear local storage
- Reset Pin
- Log out
