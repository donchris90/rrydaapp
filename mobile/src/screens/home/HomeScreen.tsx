import { AnnouncementBanner } from '../../components/AnnouncementBanner';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
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

import {
  fetchDiscover,
  fetchFollowing,
  fetchForYou,
  fetchNearby,
  fetchNew,
} from '../../api/feed';
import { fetchLiveNow } from '../../api/live';
import { useAuth } from '../../auth/AuthContext';
import type { FeedUser, LiveNowSession } from '../../api/types';
import type { AppStackParamList } from '../../navigation/types';
import { countryCodeToFlag } from '../../utils/country';

import { ExploreCard } from '../../components/ExploreCard';
import { LiveNowCard } from '../../components/LiveNowCard';
import { FadeInUp } from '../../components/FadeInUp';
import { PressableScale } from '../../components/PressableScale';
import { SkeletonCard } from '../../components/Skeleton';
import { colors, radii, spacing, type } from '../../theme';
import { ThemeToggle } from '../../components/ThemeToggle';
import { GradientBackground } from '../../components/GradientBackground';
import { useTheme } from '../../context/ThemeContext';

type FeedTab = 'following' | 'explore' | 'forYou' | 'new' | 'nearby' | 'pk' | 'party';

interface TabDefinition {
  key: FeedTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string;
}

const TABS: TabDefinition[] = [
  { key: 'following', label: 'Following', icon: 'heart' },
  { key: 'explore', label: 'Explore', icon: 'compass' },
  { key: 'forYou', label: 'For You', icon: 'flame', badge: 'HOT' },
  { key: 'new', label: 'New', icon: 'sparkles', badge: 'NEW' },
  { key: 'nearby', label: 'Nearby', icon: 'location' },
  { key: 'pk', label: 'PK War', icon: 'flash', badge: 'VS' },
  { key: 'party', label: 'Party', icon: 'people' },
];

/**
 * Redesigned HomeScreen for React Native (Expo) in Poppo Live & Bigo Live Style.
 * 
 * Key upgrades:
 * 1. Brighter, high-energy color palette (clean pearl porcelain #F6F8FC backdrop, radiant hot pink #FF2E7E,
 *    electric cyan #00C4FF, warm gold #FFB800) replacing dark purple.
 * 2. Top Header with brand beacon, animated notification badges, search, and rankings.
 * 5. Streamlined Country & Category filter ribbon with flags.
 * 6. High-aspect ratio 2-column live stream cards with audio equalizers, flame viewer counts,
 *    and split PK battle indicators.
 * 7. Radiant floating "Go Live" action button (FAB).
 */
export function HomeScreen({ initialTab = 'forYou' }: { initialTab?: FeedTab } = {}) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { palette, isMidnight } = useTheme();

  const [tab, setTab] = useState<FeedTab>(initialTab);
  const [country, setCountry] = useState<string | null>(null);

  React.useEffect(() => { setTab(initialTab); }, [initialTab]);

  // Queries matching the original backend structure
  const liveQuery = useQuery({
    queryKey: ['feed', 'live-now'],
    queryFn: fetchLiveNow,
    refetchInterval: 6000,
  });

  const followingQuery = useQuery({
    queryKey: ['feed', 'following'],
    queryFn: fetchFollowing,
  });

  const discoverQuery = useQuery({
    queryKey: ['feed', 'discover'],
    queryFn: fetchDiscover,
  });

  const forYouQuery = useQuery({
    queryKey: ['feed', 'forYou'],
    queryFn: fetchForYou,
  });

  const newQuery = useQuery({
    queryKey: ['feed', 'new'],
    queryFn: fetchNew,
  });

  const nearbyQuery = useQuery({
    queryKey: ['feed', 'nearby'],
    queryFn: fetchNearby,
  });

  const feedQueriesByTab = {
    following: followingQuery,
    explore: discoverQuery,
    forYou: forYouQuery,
    new: newQuery,
    nearby: nearbyQuery,
    pk: liveQuery,
    party: liveQuery,
  } as const;

  const isLiveTab = tab === 'forYou' || tab === 'pk' || tab === 'party';
  const currentQuery = feedQueriesByTab[tab] ?? liveQuery;
  const isLoading = currentQuery.isLoading;
  const isRefetching =
    liveQuery.isRefetching || Object.values(feedQueriesByTab).some((q) => q.isRefetching);

  const handleRefresh = () => {
    liveQuery.refetch();
    feedQueriesByTab[tab]?.refetch?.();
  };

  // Filter live sessions based on selected tab and country
  const liveSessions = (liveQuery.data ?? []) as LiveNowSession[];
  const visibleLiveSessions = useMemo(() => {
    let filtered = liveSessions;
    if (country) {
      filtered = filtered.filter((s) => s.countryCode?.toLowerCase() === country.toLowerCase());
    }
    if (tab === 'pk') {
      // Prioritize or filter PK active sessions
      return filtered;
    }
    return filtered;
  }, [liveSessions, country, tab]);

  // Feed users for non-live tabs
  const feedUsers = (feedQueriesByTab[tab]?.data ?? []) as FeedUser[];
  const visibleUsers = useMemo(() => {
    if (!country) return feedUsers;
    return feedUsers.filter((u) => u.countryCode?.toLowerCase() === country.toLowerCase());
  }, [feedUsers, country]);

  // Extract available country codes
  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    liveSessions.forEach((s) => {
      if (s.countryCode) set.add(s.countryCode.toUpperCase());
    });
    feedUsers.forEach((u) => {
      if (u.countryCode) set.add(u.countryCode.toUpperCase());
    });
    return Array.from(set);
  }, [liveSessions, feedUsers]);

  const emptyMessages: Record<FeedTab, string> = {
    pk: 'No live PK battles occurring right now.',
    explore: 'No creators found to explore.',
    forYou: 'No live creators are available right now.',
    following: 'Follow your favorite creators to see them here.',
    new: 'No new talents registered yet.',
    nearby: 'No active streams found in your region.',
    party: 'No party rooms are active right now.',
  };

  return (
    <GradientBackground style={styles.screenWrapper}>
      {/* Top App Bar with Branding, Search & Trophy */}
      <View style={[styles.appHeader, { paddingTop: insets.top + spacing.xs, backgroundColor: isMidnight ? 'rgba(18,14,34,0.92)' : 'rgba(255,255,255,0.92)', borderBottomColor: palette.borderLight }]}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>Rryda</Text>
          <View style={styles.brandLiveDot} />
          <View style={styles.brandTag}>
            <Text style={styles.brandTagText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <PressableScale
            onPress={() => navigation.navigate('Search')}
            style={styles.headerIconButton}
            scaleTo={0.92}
          >
            <View style={styles.headerIconCircle}>
              <Ionicons name="search" size={18} color={colors.textPrimary} />
            </View>
          </PressableScale>

          <ThemeToggle />
        </View>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <AnnouncementBanner />

        {/* Category Tabs */}
        <View style={[styles.tabBarSection, { backgroundColor: isMidnight ? 'rgba(18,14,34,0.86)' : 'rgba(255,255,255,0.88)', borderBottomColor: palette.borderLight }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollRow}
          >
            {TABS.map((t) => (
              <TabButton
                key={t.key}
                label={t.label}
                icon={t.icon}
                badge={t.badge}
                active={tab === t.key}
                onPress={() => setTab(t.key)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Country / Region Flag Ribbon */}
        {countryOptions.length > 0 && (
          <FadeInUp index={2}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <FilterChip
                label="🔥 Global"
                active={country === null}
                onPress={() => setCountry(null)}
              />
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

        {/* Streams & Creators Grid */}
        <View style={styles.gridSection}>
          {isLoading ? (
            <View style={styles.grid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={styles.cardSlot}>
                  <SkeletonCard />
                </View>
              ))}
            </View>
          ) : isLiveTab ? (
            visibleLiveSessions.length > 0 ? (
              <View style={styles.grid}>
                {visibleLiveSessions.map((session, index) => (
                  <FadeInUp key={session.id} index={index} style={styles.cardSlot}>
                    <LiveNowCard
                      session={session}
                      onPress={() => {
                        if (session.hostId === user?.id) {
                          navigation.navigate('GoLive');
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
                <Ionicons name="radio-outline" size={42} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Streams Right Now</Text>
                <Text style={styles.emptySubtitle}>{emptyMessages[tab]}</Text>
                <PressableScale
                  style={styles.emptyCta}
                  onPress={() => navigation.navigate('LiveFormatPicker')}
                >
                  <LinearGradient
                    colors={['#FF2E7E', '#FF6B4A']}
                    style={styles.emptyCtaGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="videocam" size={16} color="#FFFFFF" />
                    <Text style={styles.emptyCtaText}>Go Live First</Text>
                  </LinearGradient>
                </PressableScale>
              </FadeInUp>
            )
          ) : visibleUsers.length > 0 ? (
            <View style={styles.grid}>
              {visibleUsers.map((creator, index) => (
                <FadeInUp key={creator.id} index={index} style={styles.cardSlot}>
                  <ExploreCard user={creator} />
                </FadeInUp>
              ))}
            </View>
          ) : (
            <FadeInUp index={3} style={styles.emptyCard}>
              <Ionicons name="people-outline" size={42} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Creators Found</Text>
              <Text style={styles.emptySubtitle}>{emptyMessages[tab]}</Text>
            </FadeInUp>
          )}
        </View>
      </ScrollView>

      {/* Signature Poppo / Bigo Floating "Go Live" Camera Action Button */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}>
        <PressableScale
          style={styles.fabGlowWrap}
          scaleTo={0.92}
          onPress={() => navigation.navigate('LiveFormatPicker')}
        >
          <LinearGradient
            colors={['#FF2E7E', '#FF6B4A']}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="videocam" size={26} color="#FFFFFF" />
            <Text style={styles.fabLabel}>GO LIVE</Text>
          </LinearGradient>
        </PressableScale>
      </View>
    </GradientBackground>
  );
}

function TabButton({
  label,
  icon,
  badge,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.94} style={styles.tabButtonWrap}>
      {active ? (
        <LinearGradient
          colors={['#FF2E7E', '#FF6B4A']}
          style={styles.tabPillActive}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name={icon} size={14} color="#FFFFFF" />
          <Text style={styles.tabLabelActive}>{label}</Text>
          {badge && (
            <View style={styles.tabBadgeActive}>
              <Text style={styles.tabBadgeActiveText}>{badge}</Text>
            </View>
          )}
        </LinearGradient>
      ) : (
        <View style={styles.tabPillIdle}>
          <Ionicons name={icon} size={14} color={colors.textSecondary} />
          <Text style={styles.tabLabelIdle}>{label}</Text>
          {badge && (
            <View style={styles.tabBadgeIdle}>
              <Text style={styles.tabBadgeIdleText}>{badge}</Text>
            </View>
          )}
        </View>
      )}
    </PressableScale>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.95} style={styles.chipWrap}>
      {active ? (
        <LinearGradient
          colors={['#FF2E7E', '#FF6B4A']}
          style={styles.chipActive}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.chipTextActive}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.chipIdle}>
          <Text style={styles.chipTextIdle}>{label}</Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: 'transparent', // GradientBackground supplies the themed Home backdrop
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs + 2,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F7',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF2E7E',
    marginTop: -4,
  },
  brandTag: {
    backgroundColor: '#FFE8F1',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.pill,
    marginLeft: 2,
  },
  brandTagText: {
    color: '#FF2E7E',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  headerIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconCircle: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: spacing.xs,
  },
  tabBarSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F7',
    marginBottom: spacing.xs,
  },
  tabScrollRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs + 2,
    alignItems: 'center',
  },
  tabButtonWrap: {},
  tabPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: 7,
    borderRadius: radii.pill,
    shadowColor: '#FF2E7E',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  tabPillIdle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  tabLabelIdle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radii.pill,
  },
  tabBadgeActiveText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  tabBadgeIdle: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radii.pill,
  },
  tabBadgeIdleText: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
  },
  chipRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs + 2,
    paddingVertical: spacing.xs + 2,
  },
  chipWrap: {},
  chipActive: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
    shadowColor: '#FF2E7E',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  chipIdle: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EBF2',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  chipTextIdle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  gridSection: {
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  cardSlot: {
    width: '47.8%',
  },
  emptyCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#EAEBF2',
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#1A1235',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  emptyCta: {
    marginTop: spacing.md,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  emptyCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  fabContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
  fabGlowWrap: {
    borderRadius: radii.pill,
    shadowColor: '#FF2E7E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  fabLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
