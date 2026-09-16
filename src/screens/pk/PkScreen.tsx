import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchIncomingPk } from '../../api/pk';
import type { AppStackParamList } from '../../navigation/types';
import { notImplemented } from '../../utils/notImplemented';
import { colors, radii, spacing, type } from '../../theme';

type PkMode = 'friend' | 'random' | 'team';

// Only "friend" is backed by the API today — see api/pk.ts. The other two
// are surfaced in the UI (matching the reference) but tapping them gives
// an honest "not implemented" alert rather than pretending to work.
const MODES: { key: PkMode; label: string; sub: string; icon: React.ComponentProps<typeof Ionicons>['name']; implemented: boolean }[] = [
  { key: 'friend', label: 'Friend PK', sub: '1v1', icon: 'people-outline', implemented: true },
  { key: 'random', label: 'Random PK', sub: '1v1', icon: 'shuffle-outline', implemented: false },
  { key: 'team',   label: 'Team PK',   sub: 'Team', icon: 'people-circle-outline', implemented: false },
];

export function PkScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<PkMode>('friend');

  // Real incoming-challenges count. Not a hardcoded badge — if the query
  // returns zero, nothing is shown.
  const incomingQuery = useQuery({
    queryKey: ['pk', 'incoming'],
    queryFn: fetchIncomingPk,
    refetchInterval: 8000,
  });
  const incomingCount = incomingQuery.data?.length ?? 0;

  const handlePkPress = () => {
    const selected = MODES.find((m) => m.key === mode);
    if (!selected) return;

    if (!selected.implemented) {
      notImplemented(`${selected.label} isn't connected to the backend yet.`);
      return;
    }

    if (incomingCount > 0) {
      Alert.alert(
        'Pending PK challenges',
        `You have ${incomingCount} incoming challenge${incomingCount === 1 ? '' : 's'} waiting. Open your Inbox to accept one, or challenge a friend.`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Challenge a friend',
            onPress: () =>
              navigation.navigate('FollowList', { mode: 'following', pkChallenge: true }),
          },
        ]
      );
      return;
    }

    navigation.navigate('FollowList', { mode: 'following', pkChallenge: true });
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.bgElevated, colors.bgDeepest]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.topIcon} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.topIcon} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Sheet */}
      <View style={styles.sheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>PK Types</Text>
            <View style={styles.headerIcons}>
              <Pressable
                style={styles.headerIconBtn}
                onPress={() =>
                  Alert.alert(
                    'About PK',
                    'PK is a live 1v1 battle. Gift more than your opponent before the timer ends to win.'
                  )
                }
              >
                <Text style={styles.headerIconText}>?</Text>
              </Pressable>
              <Pressable
                style={styles.headerIconBtn}
                onPress={() => notImplemented('PK history')}
              >
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              </Pressable>
              <Pressable
                style={styles.headerIconBtn}
                onPress={() => notImplemented('PK settings')}
              >
                <Ionicons name="settings-outline" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Incoming challenges banner — only renders if there ARE
              challenges. No fabricated number. */}
          {incomingCount > 0 && (
            <Pressable
              style={styles.incomingBanner}
              onPress={() => notImplemented('Inbox challenges view')}
            >
              <View style={styles.incomingDot}>
                <Text style={styles.incomingDotText}>{incomingCount}</Text>
              </View>
              <Text style={styles.incomingText}>
                You have {incomingCount} pending PK challenge{incomingCount === 1 ? '' : 's'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>
          )}

          {/* Mode cards */}
          <View style={styles.modesRow}>
            {MODES.map((m) => {
              const active = mode === m.key;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setMode(m.key)}
                  style={[styles.modeCard, active && styles.modeCardActive]}
                >
                  <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>
                    {m.label}
                  </Text>
                  <Text style={styles.modeSub}>{m.sub}</Text>
                  <View style={styles.modeIconWrap}>
                    <Ionicons
                      name={m.icon}
                      size={30}
                      color={active ? colors.primary : colors.textMuted}
                    />
                  </View>
                  {!m.implemented && (
                    <View style={styles.soonBadge}>
                      <Text style={styles.soonBadgeText}>SOON</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Info block — replaces the reference's decorative ring, since
              no matching queue exists to animate. Honest copy instead. */}
          <View style={styles.infoBlock}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.infoText}>
              {mode === 'friend'
                ? 'Pick a friend from your following list to send them a 1v1 PK challenge.'
                : mode === 'random'
                ? 'Random PK matchmaking is not available yet.'
                : 'Team PK is not available yet.'}
            </Text>
          </View>
        </ScrollView>

        {/* PK button */}
        <View style={[styles.pkButtonWrap, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            style={[styles.pkButton, !MODES.find((m) => m.key === mode)?.implemented && styles.pkButtonDisabled]}
            onPress={handlePkPress}
          >
            <Text style={styles.pkButtonText}>PK</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeepest },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  topIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    marginTop: 4,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: { flex: 1, ...type.h2, color: colors.textPrimary },
  headerIcons: { flexDirection: 'row', gap: spacing.sm },
  headerIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: { color: colors.textSecondary, fontSize: 14, fontWeight: '800' },

  incomingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  incomingDot: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomingDotText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  incomingText: { flex: 1, ...type.body, color: colors.textPrimary },

  modesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  modeCard: {
    flex: 1,
    aspectRatio: 0.92,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
  },
  modeCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.bgElevated,
  },
  modeLabel: { ...type.bodyStrong, color: colors.textSecondary },
  modeLabelActive: { color: colors.primary },
  modeSub: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  modeIconWrap: {
    alignSelf: 'center',
    marginTop: spacing.xs,
  },
  soonBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.danger,
  },
  soonBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },

  infoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  infoText: { flex: 1, ...type.caption, color: colors.textSecondary },

  pkButtonWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
  },
  pkButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pkButtonDisabled: { opacity: 0.5 },
  pkButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
});