import * as Haptics from 'expo-haptics';

export enum HapticsImpactStyle {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
}

export const triggerHapticFeedback = async (
  style: HapticsImpactStyle = HapticsImpactStyle.Light,
): Promise<void> => {
  try {
    const feedbackStyle =
      style === HapticsImpactStyle.Light
        ? Haptics.ImpactFeedbackStyle.Light
        : style === HapticsImpactStyle.Medium
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Heavy;

    await Haptics.impactAsync(feedbackStyle);
  } catch {
    // Web or fallback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(style === HapticsImpactStyle.Light ? 12 : 25);
    }
  }
};
