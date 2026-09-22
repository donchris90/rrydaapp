import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { motion } from '../theme';

// The one entrance choreography used across every screen: content fades
// up into place on mount. `index` staggers list items/sections by a
// fixed delay so a screen's pieces arrive in a single orchestrated wave
// rather than popping in all at once — and it only ever runs once per
// mount, never on re-render/refetch.
export function FadeInUp({
  children,
  index = 0,
  style,
  distance = 16,
}: {
  children: React.ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
  distance?: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: motion.base,
      delay: index * motion.stagger,
      useNativeDriver: true,
    }).start();
  }, [progress, index]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] });

  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
