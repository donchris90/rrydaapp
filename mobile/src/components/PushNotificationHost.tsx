import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { registerForPush } from '../push/pushRegistration';
import { routeForNotification } from '../utils/notificationRoutes';

// Renders nothing. Mounted once inside the signed-in navigator (next to
// IncomingCallOverlay) so that, for as long as someone is signed in, this
// device is registered for phone push and a tap on a notification opens the
// right screen.
export function PushNotificationHost() {
  const navigation = useNavigation<any>();
  const handledResponseId = useRef<string | null>(null);

  useEffect(() => {
    registerForPush().catch(() => {
      /* push is optional — the app works fully without it */
    });
  }, []);

  // Covers both a tap while the app is running and the tap that launched it
  // from a cold start.
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!response) return;
    const id = response.notification.request.identifier;
    if (handledResponseId.current === id) return;
    handledResponseId.current = id;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const data = (response.notification.request.content.data ?? {}) as Record<string, any>;
    const route = routeForNotification(String(data.type ?? ''), data);
    if (route) navigation.navigate(route.name as string, route.params);
  }, [response, navigation]);

  return null;
}
