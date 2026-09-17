import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchDiscover, fetchFollowing, fetchForYou, fetchNearby, fetchNew } from '../../api/feed';
import { fetchLiveNow } from '../../api/live';
import { useAuth } from '../../auth/AuthContext';
import type { FeedUser, LiveNowSession } from '../../api/types';
import type { AppStackParamList } from '../../navigation/types';
import { countryCodeToFlag } from '../../utils/country';
import { GradientBackground } from '../../components/GradientBackground';
import { ExploreCard } from '../../components/ExploreCard';
import { LiveNowCard } from '../../components/LiveNowCard';
import { PromoBannerRow } from '../../components/PromoBannerRow';
import { FadeInUp } from '../../components/FadeInUp';
import { PressableScale } from '../../components/PressableScale';
import { SkeletonCard } from '../../components/Skeleton';
import { colors, radii, spacing, type } from '../../theme';

type FeedTab = 'live' | 'following' | 'discover' | 'forYou' | 'new' | 'nearby';

const TABS: { key: FeedTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'live', label: 'Live Now', icon: 'radio' },
  { key: 'following', label: 'Following', icon: 'people' },
  { key: 'discover', label: 'Explore', icon: 'compass' },
  { key: 'forYou', label: 'For You', icon: 'sparkles' },
  { key: 'new', label: 'New', icon: 'star' },
  { key: 'nearby', label: 'Nearby', icon: 'location' },
];

// Redesigned around a real signal: who is actually live right now (GET
// /feed/live-now), the way the reference app's Explore tab leads with
// live thumbnails rather than a generic follower/discovery list. "Live
// Now" is the default tab; the other five keep their previous behaviour
// (feed.controller.ts's routes — see api/feed.ts) for browsing people
// who aren't currently streaming.
//
// The Honor/Game Center banner row replaces the reference app's
// "Honor / Activity Center" pair with the real ranking screen this
// project actually has (GiftService.ranking) and the real Game Center,
// rather than fabricating an events system.
export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tab, setTab] = useState<FeedTab>('live');
  const [country, setCountry] = useState<string | null>(null);

  const liveQuery = useQuery({
    queryKey: ['feed', 'live-now'],
    queryFn: fetchLiveNow,
    refetchInterval: 6000, // sessions start/end frequently — closer to "live" than the other tabs' polling
  });
  const followingQuery = useQuery({ queryKey: ['feed', 'following'], queryFn: fetchFollowing });
  const discoverQuery = useQuery({ queryKey: ['feed', 'discover'], queryFn: fetchDiscover });
  const forYouQuery = useQuery({ queryKey: ['feed', 'forYou'], queryFn: fetchForYou });
  const newQuery = useQuery({ queryKey: ['feed', 'new'], queryFn: fetchNew });
  const nearbyQuery = useQuery({ queryKey: ['feed', 'nearby'], queryFn: fetchNearby });

  const feedQueriesByTab = {
    following: followingQuery,
    discover: discoverQuery,
    forYou: forYouQuery,
    new: newQuery,
    nearby: nearbyQuery,
  } as const;

  const isLoading = tab === 'live' ? liveQuery.isLoading : feedQueriesByTab[tab].isLoading;
  const isRefetching =
    liveQuery.isRefetching || Object.values(feedQueriesByTab).some((q) => q.isRefetching);

  const countryOptions = useMemo(() => {
    const seen = new Map<string, number>();
    const source = tab === 'live' ? (liveQuery.data ?? []) : (feedQueriesByTab[tab].data ?? []);
    for (const item of source as Array<{ countryCode: string }>) {
      seen.set(item.countryCode, (seen.get(item.countryCode) ?? 0) + 1);
    }
    return Array.from(seen.keys());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, liveQuery.data, followingQuery.data, discoverQuery.data, forYouQuery.data, newQuery.data, nearbyQuery.data]);

  const visibleLiveSessions = useMemo(() => {
    const list: LiveNowSession[] = liveQuery.data ?? [];
    return country ? list.filter((s) => s.countryCode === country) : list;
  }, [liveQuery.data, country]);

  const visibleUsers = useMemo(() => {
    if (tab === 'live') return [];
    const list: FeedUser[] = feedQueriesByTab[tab].data ?? [];
    return country ? list.filter((u) => u.countryCode === country) : list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, followingQuery.data, discoverQuery.data, forYouQuery.data, newQuery.data, nearbyQuery.data, country]);

  const handleRefresh = () => {
    liveQuery.refetch();
    followingQuery.refetch();
    discoverQuery.refetch();
    forYouQuery.refetch();
    newQuery.refetch();
    nearbyQuery.refetch();
  };

  const emptyMessages: Record<FeedTab, string> = {
    live: 'No one is live right now.',
    following: "You're not following anyone yet.",
    discover: 'Nothing to discover yet.',
    forYou: 'Nothing picked for you yet.',
    new: 'No new creators yet.',
    nearby: 'No one found in your country yet.',
  };

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        <FadeInUp index={0} style={styles.topRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {TABS.map((t) => (
              <TabButton key={t.key} label={t.label} icon={t.icon} active={tab === t.key} onPress={() => setTab(t.key)} />
            ))}
          </ScrollView>
          <Pressable onPress={() => navigation.navigate('HonorRanking')} hitSlop={12} style={styles.iconButton}>
            <Ionicons name="trophy" size={20} color={colors.gold} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Search')} hitSlop={12} style={styles.iconButton}>
            <Ionicons name="search" size={22} color={colors.textPrimary} />
          </Pressable>
        </FadeInUp>

        <FadeInUp index={1}>
          <PromoBannerRow
            onHonorPress={() => navigation.navigate('HonorRanking')}
            onGamesPress={() => navigation.navigate('GameCenter')}
          />
        </FadeInUp>

        {countryOptions.length > 1 && (
          <FadeInUp index={2}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              <FilterChip label="Popular" active={country === null} onPress={() => setCountry(null)} />
              {countryOptions.map((code) => (
                <FilterChip
                  key={code}
                  label={`${countryCodeToFlag(code)} ${code}`}
                  active={country === code}
                  onPress={() => setCountry(code)}
                />
              ))}
            </ScrollView>
          </FadeInUp>
        )}

        {isLoading ? (
          <View style={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={styles.cardSlot}>
                <SkeletonCard />
              </View>
            ))}
          </View>
        ) : tab === 'live' ? (
          visibleLiveSessions.length > 0 ? (
            <View style={styles.grid}>
              {visibleLiveSessions.map((session, index) => (
                <FadeInUp key={session.id} index={index} style={styles.cardSlot}>
                  <LiveNowCard
                    session={session}
                    onPress={() => {
                      // A session that happens to be the current user's
                      // own broadcast must not open as a plain viewer —
                      // LiveViewerScreen has no host controls (no way to
                      // end it) by design, since a viewer should never be
                      // able to end someone else's stream. Without this
                      // check, tapping your own live card from Home would
                      // land you somewhere with literally no way to stop
                      // broadcasting except force-closing the app.
                      if (session.hostId === user?.id) {
                        navigation.navigate('MainTabs', { screen: 'GoLive' } as never);
                      } else {
                        navigation.navigate('LiveViewer', { sessionId: session.id });
                      }
                    }}
                  />
                </FadeInUp>
              ))}
            </View>
          ) : (
            <FadeInUp index={3} style={styles.emptyCard}>
              <Text style={styles.empty}>{emptyMessages.live}</Text>
            </FadeInUp>
          )
        ) : visibleUsers.length > 0 ? (
          <View style={styles.grid}>
            {visibleUsers.map((user, index) => (
              <FadeInUp key={user.id} index={index} style={styles.cardSlot}>
                <ExploreCard user={user} />
              </FadeInUp>
            ))}
          </View>
        ) : (
          <FadeInUp index={3} style={styles.emptyCard}>
            <Text style={styles.empty}>{emptyMessages[tab]}</Text>
          </FadeInUp>
        )}
      </ScrollView>

      <View style={[styles.fabColumn, { bottom: spacing.xl + insets.bottom }]}>
        <Pressable style={[styles.fab, styles.fabPrimary]} onPress={() => navigation.navigate('LiveFormatPicker')}>
          <Ionicons name="add" size={26} color="#FFF" />
        </Pressable>
      </View>
    </GradientBackground>
  );
}

function TabButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} style={styles.tabButtonWrap}>
      {active ? (
        <LinearGradient colors={[colors.primary, colors.pink]} style={styles.tabPill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Ionicons name={icon} size={14} color="#FFF" />
          <Text style={styles.tabLabelActive}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.tabPillIdle}>
          <Ionicons name={icon} size={14} color={colors.textMuted} />
          <Text style={styles.tabLabel}>{label}</Text>
        </View>
      )}
    </PressableScale>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    paddingRight: spacing.md,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  tabButtonWrap: {},
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  tabPillIdle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabLabel: { ...type.caption, color: colors.textMuted, fontWeight: '700' },
  tabLabelActive: { ...type.caption, color: '#FFF', fontWeight: '800' },
  iconButton: {
    marginLeft: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipRow: { paddingHorizontal: spacing.md, gap: spacing.xs, paddingBottom: spacing.sm },
  chip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: spacing.xs,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...type.caption, color: colors.textSecondary },
  chipTextActive: { color: colors.textPrimary },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cardSlot: { width: '47%' },
  emptyCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
  },
  empty: { color: colors.textSecondary, textAlign: 'center' },
  fabColumn: {
    position: 'absolute',
    right: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  fabPrimary: {
    width: 56,
    height: 56,
    backgroundColor: colors.primary,
  },
});
