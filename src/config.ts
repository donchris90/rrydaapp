import Constants from 'expo-constants';

// Read from app.json's expo.extra.apiBaseUrl — NOT a real env-var system,
// just Expo's supported way to inject build-time config. See README for
// why this can't be "localhost": the phone (running Expo Go) and the
// backend server (running on your PC) are two different devices on the
// network — "localhost" from the phone's perspective means the phone
// itself, never your PC. Must be your PC's LAN IP instead.
const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string; agoraAppId?: string; imgbbApiKey?: string } | undefined;

export const API_BASE_URL = extra?.apiBaseUrl ?? 'http://localhost:3000/api/v1';

// The realtime chat gateway lives on the server root (no /api/v1 prefix,
// no custom namespace — see realtime.gateway.ts's plain
// @WebSocketGateway() with no path option), so this strips the REST
// API's /api/v1 suffix rather than hardcoding a second value that could
// drift out of sync with API_BASE_URL's host/port.
export const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

// Agora's App ID is meant to be public/client-embedded — unlike the App
// Certificate, which stays server-side only and is what actually signs
// tokens (see the backend's AgoraRtcProvider). The App ID alone can't
// authenticate a join; a valid token from the backend is still required.
export const AGORA_APP_ID = extra?.agoraAppId ?? '';

// ImgBB's free API is meant for exactly this kind of client-side use —
// unlike Agora's App Certificate, there's no server-side secret this key
// could substitute for. Worth being upfront about the real tradeoff
// anyway: any key bundled into a mobile app is extractable by someone
// who decompiles the APK, so this key isn't truly secret once shipped.
// For a free image host with no billing or sensitive scope attached to
// it, that's a reasonable, common tradeoff — not one to make silently,
// though, which is why it's called out here rather than just used.
export const IMGBB_API_KEY = extra?.imgbbApiKey ?? '';
