import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

// Shared press-feedback wrapper: every tappable card/button in the app
// springs down to 0.96 on press-in and back on release, instead of each
// screen inventing its own (or, worse, no) touch feedback. This is
// "motion that answers a person's action" — deliberately not used for
// idle decoration.
//
// IMPORTANT: this wraps Pressable itself in Animated (rather than putting
// an inner Animated.View around `children`) so that `style` lands on the
// actual element Yoga measures. The earlier version applied `style` only
// to an inner wrapper, which silently broke any layout depending on the
// *outer* box being sized by flexbox — width: '25%' in a wrapping grid,
// flex: 1 to fill a row, etc. The outer Pressable would shrink-wrap to
// content instead, with no error, just a wrong/collapsed layout. Simple
// padded buttons happened to still look right because the inner wrapper
// was the only sized box anyone could see; anything relying on relative
// sizing (percentage widths, flex) did not.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableScale({
  children,
  style,
  scaleTo = 0.96,
  disabled,
  ...rest
}: PressableProps & { children: React.ReactNode; style?: StyleProp<ViewStyle>; scaleTo?: number }) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={(e) => {
        animateTo(scaleTo);
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animateTo(1);
        rest.onPressOut?.(e);
      }}
      style={[style, { transform: [{ scale }] }, disabled && { opacity: 0.5 }]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

