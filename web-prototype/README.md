# Web prototype (from AI Studio)

This is the standalone web (Vite + React-DOM) prototype that was generated in
Google AI Studio — a browser build of the Crash / Sum Dice games and several
profile/wallet/gift screens.

It is a **separate app** from the React Native / Expo mobile app one level up.
The two cannot share a single `package.json`, `tsconfig.json`, or bundler
config: this one runs on Vite + `react-dom` in a browser, the mobile app runs
on Metro + `react-native` on iOS/Android. They live side by side in the repo
so you can keep using AI Studio to iterate on this web version (e.g. for a
marketing site or browser demo) without it colliding with the mobile app again.

## Running it

```bash
cd web-prototype
npm install
npm run dev
```

## Porting a feature to the mobile app

The native app already has its own, separate implementation of the Crash game
at `../src/screens/game/CrashScreen.native.tsx`, built with React Native
(`react-native-svg`, real API calls, etc.) — it does not use anything in this
folder. If you design something new here first, you'll need to hand-port the
UI/logic into the equivalent React Native screen; the two can't literally
share components since one renders to the DOM and the other to native views.
