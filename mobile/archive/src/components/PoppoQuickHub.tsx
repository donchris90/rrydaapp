import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from './PressableScale';
import { colors, radii, spacing, type } from '../theme';

interface PoppoQuickHubProps {
  onPkPress: () => void;
  onPartyPress: () => void;
  onGamesPress: () => void;
  onHonorPress: () => void;
  onRewardsPress: () => void;
}

interface HubItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly [string, string];
  onPress: () => void;
}

/**
 * Signature Poppo & Bigo Live Quick Feature Entrance Hub.
 * Provides instant 1-tap navigation to PK Battles, Multi-Guest Party Rooms,
 * Game Center, Honor Rankings, and Daily Lucky Rewards.
 */
export function PoppoQuickHub({
  onPkPress,
  onPartyPress,
  onGamesPress,
  onHonorPress,
  onRewardsPress,
}: PoppoQuickHubProps) {
  const items: HubItem[] = [
    {
      id: 'pk',
      title: 'PK Battle',
      subtitle: 'Live Wars',
      badge: 'HOT',
      icon: 'flame',
      gradient: ['#FF1361', '#FF6B00'],
      onPress: onPkPress,
    },
    {
      id: 'party',
      title: 'Party Room',
      subtitle: '9-Seats',
      badge: '9+',
      icon: 'mic',
      gradient: ['#9D4EDD', '#E61565'],
      onPress: onPartyPress,
    },
    {
      id: 'games',
      title: 'Game Center',
      subtitle: 'Win 100x',
      badge: 'COINS',
      icon: 'game-controller',
      gradient: ['#00B894', '#0984E3'],
      onPress: onGamesPress,
    },
    {
      id: 'honor',
      title: 'Ranking',
      subtitle: 'Top Stars',
      icon: 'trophy',
      gradient: ['#FFD200', '#FF8A00'],
      onPress: onHonorPress,
    },
    {
      id: 'rewards',
      title: 'Rewards',
      subtitle: 'Free Gold',
      badge: 'FREE',
      icon: 'gift',
      gradient: ['#FF2E7E', '#FF7A45'],
      onPress: onRewardsPress,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <PressableScale
            key={item.id}
            onPress={item.onPress}
            scaleTo={0.94}
            style={styles.itemWrap}
          >
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={item.gradient}
                style={styles.iconCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={item.icon} size={22} color="#FFFFFF" />
              </LinearGradient>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </PressableScale>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  itemWrap: {
    alignItems: 'center',
    width: 66,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1235',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -6,
    backgroundColor: colors.live,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  title: {
    ...type.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 2,
  },
  subtitle: {
    ...type.captionSmall,
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
});
