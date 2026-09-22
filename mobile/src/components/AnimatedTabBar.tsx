import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchUnreadCounts } from '../api/notifications';
import { colors, gradients, glow, radii } from '../theme';

// Nice icons configuration for the 5 requested tabs: Live, Party, Explore, Message, Profile
const ICONS: Record<string, { filled: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap }> = {
  Live: { filled: 'radio', outline: 'radio-outline' },
  Party: { filled: 'people', outline: 'people-outline' },
  Explore: { filled: 'play-circle', outline: 'play-circle-outline' },
  Message: { filled: 'chatbubble-ellipses', outline: 'chatbubble-ellipses-outline' },
  Profile: { filled: 'person', outline: 'person-outline' },
};

export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // One small count request instead of downloading the whole notification and
  // conversation lists just to count them. It sits under the ['notifications']
  // key prefix, so every existing "something changed" invalidation (a push
  // arriving, a message read, a notification marked read) refreshes it. The
  // old version shared the exact ['notifications'] key with the Inbox list
  // while asking for unread-only, so the two overwrote each other's data, and
  // it counted every unread DM twice (as a message and as its notification).
  const countsQuery = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: fetchUnreadCounts,
    refetchInterval: 60000, // fallback only — pushes over the socket invalidate it
  });

  const unreadCount = countsQuery.data?.total ?? 0;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const icon = ICONS[route.name];

        return (
          <TabItem
            key={route.key}
            label={String(options.title ?? route.name)}
            iconName={icon ? (isFocused ? icon.filled : icon.outline) : 'ellipse'}
            focused={isFocused}
            onPress={onPress}
            badgeCount={route.name === 'Message' ? unreadCount : 0}
            isParty={route.name === 'Party'}
          />
        );
      })}
    </View>
  );
}

function TabItem({
  label,
  iconName,
  focused,
  onPress,
  badgeCount = 0,
  isParty = false,
}: {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  onPress: () => void;
  badgeCount?: number;
  isParty?: boolean;
}) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      speed: 30,
      bounciness: 9,
    }).start();
  }, [focused, progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const lift = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });

  return (
    <Pressable onPress={onPress} style={styles.item} hitSlop={8}>
      <Animated.View style={[styles.iconContainer, { transform: [{ scale }, { translateY: lift }] }]}>
        {focused ? (
          <LinearGradient
            colors={gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.pill, glow.pink]}
          >
            <Ionicons name={iconName} size={20} color="#FFFFFF" />
          </LinearGradient>
        ) : (
          <View style={styles.pillIdle}>
            <Ionicons name={iconName} size={20} color={colors.textMuted} />
          </View>
        )}

        {badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
          </View>
        )}

      </Animated.View>

      <Text
        style={[
          styles.label,
          { color: focused ? colors.primary : colors.textMuted, fontWeight: focused ? '800' : '600' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F2F7',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    width: 44,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillIdle: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  partyBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: colors.party,
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  partyBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
});
