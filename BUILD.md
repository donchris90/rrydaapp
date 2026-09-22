# Build the APK (cloud build with EAS — no Android Studio needed)

Files here: `app.json` and `eas.json` (complete replacements for the ones in your mobile folder). app.json now points at https://bipo-1.onrender.com/api/v1 (baked into the APK).

## One-time setup (PowerShell, in C:\rydaapp\mobile)
1. Copy app.json and eas.json over yours.
2. Delete the committed native folder so EAS applies app.json (icon, permissions, plugins):
   Remove-Item -Recurse -Force android
   Add-Content .gitignore "`n/android`n/ios"
3. Install and check:
   npm ci
   npx expo install expo-font react-native-screens expo-system-ui
   node check-deps.mjs
   npx expo-doctor
   npm run lint
4. Sign in to Expo (account "ryda9"):
   npm install -g eas-cli
   eas login

## Build
   eas build --platform android --profile preview
- First run asks to generate an Android keystore: answer YES (EAS stores it; keep it, updates must use the same one).
- Takes about 15-30 minutes (queue + build). When done it prints a link/QR: open it on the phone, download the .apk, install (allow "install unknown apps" for the browser).
- `preview` = a standalone APK for testing (bundled JavaScript, no Metro, talks to Render).
- Play Store later: `eas build --platform android --profile production` makes an .aab; raise android.versionCode in app.json for every upload.

## Notes
- patches/react-native-agora... adds the Agora "clear-vision" extension the beauty effects need; it applies automatically during the cloud build (patch-package runs on install). Keep the patches folder in what you upload.
- Every change to app.json extra (like the server address) needs a new build; JavaScript-only changes can also ship with `eas update` later if you add it.
- Push notifications on Android need Firebase (optional, later): create a Firebase project, add the app com.ryda90.platformmobile, put google-services.json in the project, set "android.googleServicesFile": "./google-services.json" in app.json, and upload the FCM v1 key with `eas credentials`. Without it the app works; push registration just quietly fails.
- First launch after the server has been idle can take up to a minute (Render wakes up); the app now waits and says so.

## Checked here
Expo's own `expo config` reads both files (apiBaseUrl, versionCode, package). A fresh native project generates from this app.json with the camera/mic permissions and Hermes; Metro bundles the app. I cannot run the EAS build itself (needs your Expo account), so the build is the real test — send me the last lines of the log if it fails.
