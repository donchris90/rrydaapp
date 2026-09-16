import { Alert } from 'react-native';

// Used wherever a UI element matches the reference app's density (a grid
// tile, a menu row) but has no real backend feature or SDK capability
// behind it yet. Keeps the wording consistent everywhere rather than
// each screen writing its own slightly-different copy — first extracted
// here from ProfileScreen.tsx when LiveToolsSheet needed the exact same
// pattern.
export function notImplemented(feature: string) {
  Alert.alert(feature, "This isn't available yet — coming in a future update.");
}
