import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, glow, radii } from '../theme';

const ICONS: Record<string, { filled: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap }> = {
  Home: { filled: 'home', outline: 'home-outline' },
  Party: { filled: 'people', outline: 'people-outline' },
  Inbox: { filled: 'chatbubble-ellipses', outline: 'chatbubble-ellipses-outline' },
  Profile: { filled: 'person', outline: 'person-outline' },
};

// A custom tab bar so the active tab gets a gradient pill + icon bounce
// instead of react-navigation's flat tint-color default — the one place
// in the nav shell that gets the "hero" gradient treatment, everything
// else around it stays quiet.
//
// "GoLive" (the middle route) gets its own raised, always-gradient
// button instead of the idle/active pill treatment every other tab
// uses — matching the reference apps' elevated center create-action
// button (their "upload video" slot; this app broadcasts, so it starts
// a live session instead).
export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (route.name === 'GoLive') {
          return <GoLiveTabItem key={route.key} focused={isFocused} onPress={onPress} />;
        }

        const icon = ICONS[route.name];
        return (
          <TabItem
            key={route.key}
            label={String(options.title ?? route.name)}
            iconName={icon ? (isFocused ? icon.filled : icon.outline) : 'ellipse'}
            focused={isFocused}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

// Raised circular gradient button, floating above the bar rather than
// sitting flush in it — the visual weight the reference apps give their
// center create action. Always shows the filled gradient state (there's
// no meaningful "idle" look for the one button whose entire job is to
// be pressed), and doesn't bounce/scale like the other tabs since it's
// not indicating a selected *section* the way they are.
function GoLiveTabItem({ focused, onPress }: { focused: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.item} hitSlop={8}>
      <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.goLivePill, glow.pink]}>
        <Ionicons name="add" size={26} color={colors.textPrimary} />
      </LinearGradient>
    </Pressable>
  );
}

function TabItem({
  label,
  iconName,
  focused,
  onPress,
}: {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  onPress: () => void;
}) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, { toValue: focused ? 1 : 0, useNativeDriver: true, speed: 30, bounciness: 9 }).start();
  }, [focused, progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const lift = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });

  return (
    <Pressable onPress={onPress} style={styles.item} hitSlop={8}>
      <Animated.View style={{ transform: [{ scale }, { translateY: lift }] }}>
        {focused ? (
          <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.pill, glow.primary]}>
            <Ionicons name={iconName} size={20} color={colors.textPrimary} />
          </LinearGradient>
        ) : (
          <View style={styles.pillIdle}>
            <Ionicons name={iconName} size={20} color={colors.textMuted} />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bgDeepest,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pill: {
    width: 44,
    height: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillIdle: {
    width: 44,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goLivePill: {
    width: 50,
    height: 50,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22, // raises the button above the bar's top edge
    borderWidth: 3,
    borderColor: colors.bgDeepest,
  },
});
