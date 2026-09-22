import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { registerPushToken, unregisterPushToken } from '../api/notifications';

// While the app is open the backend already updates the inbox over the
// socket (and deliberately skips phone push for anyone with a live socket),
// so a foreground notification is never shown as a banner on top of that.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let registeredToken: string | null = null;

// Asks for permission (once — the OS remembers a refusal), gets this
// device's Expo push token and registers it with the backend. Returns null
// whenever push isn't possible: simulator, permission refused, or no EAS
// project id configured.
export async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null; // simulators/emulators can't receive push

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return null;

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  await registerPushToken(data, Platform.OS);
  registeredToken = data;
  return data;
}

// Called on logout, while the session token is still valid, so the signed-out
// account stops receiving pushes on this device. Best-effort: if it fails, the
// next account to sign in on this device re-points the token to itself.
export async function unregisterCurrentPushToken(): Promise<void> {
  const token = registeredToken;
  if (!token) return;
  registeredToken = null;
  try {
    await unregisterPushToken(token);
  } catch {
    /* see above */
  }
}
