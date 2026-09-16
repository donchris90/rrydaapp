import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { colors, glow, radii, spacing, type } from '../../theme';
import { GradientBackground } from '../../components/GradientBackground';
import { PressableScale } from '../../components/PressableScale';
import { FadeInUp } from '../../components/FadeInUp';

type Props = NativeStackScreenProps<AppStackParamList, 'GameCenter'>;

interface GameCardInfo {
  code: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: readonly [string, string];
  // Narrowed to just the param-less routes this screen actually links to
  // (rather than `keyof AppStackParamList`) — now that the stack also has
  // routes requiring params (e.g. FollowList), a bare `keyof` union no
  // longer satisfies navigate()'s no-params overload. null = not built
  // yet, shows "Coming soon".
  route: 'SumDice' | 'CrashGame' | null;
}

// Matches the games actually built and tested on the backend (Lucky
// Number / Sum Dice, and Crash) — Lucky Number here is the S/B/E/O +
// number-grid game confirmed against the real Poppo Live reference video
// earlier in this project. The backend's internal game code for it is
// still SUM_DICE (an implementation detail, not user-facing) — the
// original spec document's separate, simpler "pick N, draw N, exact
// match" game (also called Lucky Number in the spec) turned out not to
// match what the real reference app actually does, so it's not listed
// here as a separate product feature to avoid two different things
// sharing the same name.
const GAMES: GameCardInfo[] = [
  {
    code: 'SUM_DICE',
    name: 'Lucky Number',
    description: 'Pick numbers, bet Big/Small/Odd/Even',
    icon: 'dice',
    accent: ['#FFDD8A', colors.goldDeep],
    route: 'SumDice',
  },
  {
    code: 'CRASH',
    name: 'Crash',
    description: 'Cash out before it crashes',
    icon: 'trending-up',
    accent: [colors.pink, colors.pinkDeep],
    route: 'CrashGame',
  },
];

export function GameCenterScreen({ navigation }: Props) {
  return (
    <GradientBackground>
      <View style={styles.header}>
        <FadeInUp index={0}>
          <Text style={styles.headerTitle}>Game Center</Text>
        </FadeInUp>
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        {GAMES.map((game, index) => (
          <FadeInUp key={game.code} index={index + 1} style={styles.cardWrap}>
            <PressableScale
              style={[styles.card, !game.route && styles.cardDisabled]}
              onPress={() => game.route && navigation.navigate(game.route)}
              disabled={!game.route}
            >
              <LinearGradient colors={game.accent} style={[styles.iconCircle, glow.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name={game.icon} size={28} color={colors.textOnLight} />
              </LinearGradient>
              <Text style={styles.cardTitle}>{game.name}</Text>
              <Text style={styles.cardDescription}>{game.description}</Text>
              {!game.route && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Coming soon</Text>
                </View>
              )}
            </PressableScale>
          </FadeInUp>
        ))}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.xl, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  headerTitle: { ...type.display, color: colors.textPrimary },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  cardWrap: { width: '47%', margin: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDisabled: { opacity: 0.55 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  cardDescription: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
  comingSoonBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  comingSoonText: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
});
