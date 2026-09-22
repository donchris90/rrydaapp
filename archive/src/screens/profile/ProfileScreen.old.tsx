import React, { useEffect, useRef } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { fetchWallet, fetchFollowing, fetchFollowers } from '../../api/feed';
import { fetchSocialStats } from '../../api/social';
import type { MainTabParamList, AppStackParamList } from '../../navigation/types';
import { meColors, radii, spacing, type, type MeGridColor } from '../../theme';
import { Avatar } from '../../components/Avatar';
import { PressableScale } from '../../components/PressableScale';
import { FadeInUp } from '../../components/FadeInUp';
import { VipPrivilegeBanner } from '../../components/profile/VipPrivilegeBanner';
import { VipDetailsModal } from '../../components/profile/VipDetailsModal';
import { TopUpModal } from '../../components/profile/TopUpModal';
import { WithdrawModal } from '../../components/profile/WithdrawModal';
import { DailyCheckInWidget } from '../../components/profile/DailyCheckInWidget';
import { DailyRewardModal, type DailyReward } from '../../components/profile/DailyRewardModal';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';

type ProfileNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<AppStackParamList>
>;

function useValuePop(value: string | undefined) {
  const scale = useRef(new Animated.Value(1)).current;
  const previous = useRef<string | undefined>(value);

  useEffect(() => {
    if (previous.current !== undefined && previous.current !== value && value !== undefined) {
      scale.setValue(1.25);
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 12 }).start();
    }
    previous.current = value;
  }, [value, scale]);

  return scale;
}

import { notImplemented } from '../../utils/notImplemented';

function StatCell({ label, value, isLoading, onPress }: { label: string; value: string; isLoading?: boolean; onPress?: () => void }) {
  const content = (
    <>
      <Text style={styles.statValue}>{isLoading ? '—' : value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </>
  );
  if (onPress) {
    return (
      <PressableScale style={styles.statCell} onPress={onPress}>
        {content}
      </PressableScale>
    );
  }
  return <View style={styles.statCell}>{content}</View>;
}

function WalletCard({ label, value, gradient, isLoading, onPress }: { label: string; value: string | undefined; gradient: readonly [string, string]; isLoading: boolean; onPress?: () => void }) {
  const { palette } = useTheme();
  const scale = useValuePop(value);
  const content = (
    <>
      <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <Text style={styles.walletLabel}>{label}</Text>
      {isLoading ? (
        <Text style={styles.walletValue}>—</Text>
      ) : (
        <Animated.Text style={[styles.walletValue, { transform: [{ scale }] }]}>{value ?? '0'}</Animated.Text>
      )}
    </>
  );
  if (onPress) {
    return (
      <PressableScale style={[styles.walletCard, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={onPress}>
        {content}
      </PressableScale>
    );
  }
  return <View style={[styles.walletCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>{content}</View>;
}

// No backend yet for cosmetic VIP tiers or a daily check-in ledger, so
// this state lives only on the client for this mount — claiming a day
// or "upgrading" VIP intentionally does NOT touch the real wallet
// balance from useQuery below. Pretending a purchase or reward hit the
// real balance when it didn't would be actively misleading in an app
// that also handles real money (coin purchases, creator cashouts).
const INITIAL_DAILY_REWARDS: DailyReward[] = [
  { day: 1, coins: 100, isClaimed: true, isCurrent: false },
  { day: 2, coins: 150, isClaimed: true, isCurrent: false },
  { day: 3, coins: 200, isClaimed: false, isCurrent: true },
  { day: 4, coins: 250, isClaimed: false, isCurrent: false },
  { day: 5, coins: 300, isClaimed: false, isCurrent: false },
  { day: 6, coins: 400, isClaimed: false, isCurrent: false },
  { day: 7, coins: 1000, isClaimed: false, isCurrent: false },
];

type GridItem = { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: MeGridColor; onPress: () => void };

function GridTile({ item }: { item: GridItem }) {
  const { palette } = useTheme();
  return (
    <PressableScale style={styles.gridItem} onPress={item.onPress}>
      <View style={[styles.gridIconCircle, { backgroundColor: palette[item.color] }]}>
        <Ionicons name={item.icon} size={22} color="#FFFFFF" />
      </View>
      <Text style={styles.gridLabel}>{item.label}</Text>
    </PressableScale>
  );
}

type ListRow = { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: MeGridColor; onPress: () => void; trailing?: React.ReactNode };

function ListItemRow({ row, isLast }: { row: ListRow; isLast?: boolean }) {
  const { palette } = useTheme();
  return (
    <PressableScale style={[styles.listRow, !isLast && styles.listRowDivider]} onPress={row.onPress}>
      <View style={[styles.listIconCircle, { backgroundColor: palette[row.color] }]}>
        <Ionicons name={row.icon} size={16} color="#FFFFFF" />
      </View>
      <Text style={styles.listLabel}>{row.label}</Text>
      <View style={styles.listTrailing}>
        {row.trailing}
        <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
      </View>
    </PressableScale>
  );
}

// Matches the reference app's "Me" screen: profile card, completion
// nudge, stats row, wallet cards, VIP banner, the Reward/Rank/... grid,
// a notice banner, and the Streamer/Help Center list underneath. Only
// Games, the wallet balances, and Following/Followers are wired to real
// data — see notImplemented() above for how the rest is handled.
export function ProfileScreen() {
  const { user, logout } = useAuth();
  const { palette, isMidnight } = useTheme();
  const navigation = useNavigation<ProfileNavigationProp>();
  const walletQuery = useQuery({ queryKey: ['wallet'], queryFn: fetchWallet });
  const followingQuery = useQuery({ queryKey: ['feed', 'following'], queryFn: fetchFollowing });
  const followersQuery = useQuery({ queryKey: ['social', 'followers'], queryFn: fetchFollowers });
  // Real GET /social/stats — this endpoint didn't exist at all before
  // this pass (the mobile client already had a function calling it, but
  // nothing on the backend ever answered). pkWins is a genuine count of
  // settled PKBattle rows this user actually won, not a display number
  // invented for the UI.
  const statsQuery = useQuery({ queryKey: ['social', 'stats'], queryFn: fetchSocialStats });
  const [copied, setCopied] = React.useState(false);

  const [vipModalOpen, setVipModalOpen] = React.useState(false);
  const [topUpOpen, setTopUpOpen] = React.useState(false);
  const [withdrawOpen, setWithdrawOpen] = React.useState(false);
  const [dailyRewardModalOpen, setDailyRewardModalOpen] = React.useState(false);
  const [dailyRewards, setDailyRewards] = React.useState<DailyReward[]>(INITIAL_DAILY_REWARDS);
  const [checkInStreak, setCheckInStreak] = React.useState(2);

  const handleCopyId = async () => {
    if (!shortId || shortId === '—') return;
    await Clipboard.setStringAsync(shortId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleClaimDailyReward = (day: number) => {
    setDailyRewards((prev) => prev.map((r) => (r.day === day ? { ...r, isClaimed: true } : r)));
    setCheckInStreak((s) => s + 1);
    Alert.alert('Streak saved!', `Day ${day} checked in. Coin reward sync is coming soon.`);
  };

  const displayName = user?.displayName ?? user?.email ?? 'Guest';
  const shortId = user?.id ? user.id.slice(0, 7).toUpperCase() : '—';

  const gridItems: GridItem[] = [
    { key: 'reward', label: 'Reward', icon: 'gift-outline', color: 'chipRed', onPress: () => navigation.navigate('Reward') },
    { key: 'rank', label: 'Rank', icon: 'trophy-outline', color: 'chipOrange', onPress: () => navigation.navigate('HonorRanking') },
    { key: 'store', label: 'Store', icon: 'bag-handle-outline', color: 'chipTeal', onPress: () => navigation.navigate('BuyCoins') },
    { key: 'invite', label: 'Invite', icon: 'mail-unread-outline', color: 'chipRed', onPress: () => navigation.navigate('Invite') },
    { key: 'guardian', label: 'Guardian', icon: 'shield-checkmark-outline', color: 'chipGreen', onPress: () => notImplemented('Guardian') },
    { key: 'honor', label: 'Honor Level', icon: 'ribbon-outline', color: 'chipPurple', onPress: () => navigation.navigate('HonorRanking') },
    { key: 'fanclub', label: 'Fan Club', icon: 'heart-outline', color: 'chipPink', onPress: () => notImplemented('Fan Club') },
    { key: 'games', label: 'Games', icon: 'game-controller-outline', color: 'chipBlue', onPress: () => navigation.navigate('GameCenter') },
  ];

  const centerRows: ListRow[] = [
    { key: 'streamer', label: 'Streamer Center', icon: 'tv-outline', color: 'chipPurple', onPress: () => navigation.navigate('CreatorCenter') },
    { key: 'creator', label: 'Video Creator Center', icon: 'bulb-outline', color: 'chipOrange', onPress: () => notImplemented('Video Creator Center') },
    { key: 'builder', label: 'Builder Center', icon: 'planet-outline', color: 'chipBlue', onPress: () => notImplemented('Builder Center') },
  ];

  const accountRows: ListRow[] = [
    { key: 'help', label: 'Help Center', icon: 'headset-outline', color: 'chipTeal', onPress: () => navigation.navigate('HelpCenter') },
    { key: 'history', label: 'Watch History', icon: 'time-outline', color: 'chipBlue', onPress: () => navigation.navigate('WatchHistory') },
    { key: 'level', label: 'Level', icon: 'trending-up-outline', color: 'chipYellow', onPress: () => notImplemented('Level') },
    { key: 'poster', label: 'Achievement Poster', icon: 'medal-outline', color: 'chipOrange', onPress: () => notImplemented('Achievement Poster') },
    { key: 'bag', label: 'Bag', icon: 'briefcase-outline', color: 'chipPink', onPress: () => navigation.navigate('Bag') },
    { key: 'agency', label: 'My Agency', icon: 'business-outline', color: 'chipPurple', onPress: () => navigation.navigate('Agency') },
    { key: 'auth', label: 'Authentication', icon: 'shield-checkmark-outline', color: 'chipGreen', onPress: () => navigation.navigate('Authentication') },
    { key: 'blocked', label: 'Blocked Users', icon: 'ban-outline', color: 'chipRed', onPress: () => navigation.navigate('BlockedUsers') },
    {
      key: 'follow',
      label: 'Follow Us',
      icon: 'heart-outline',
      color: 'chipRed',
      onPress: () => notImplemented('Follow Us'),
      trailing: (
        <View style={styles.socialRow}>
          <Ionicons name="logo-youtube" size={16} color="#FF0000" style={styles.socialIcon} />
          <Ionicons name="logo-facebook" size={16} color="#1877F2" style={styles.socialIcon} />
          <Ionicons name="logo-tiktok" size={16} color="#111111" style={styles.socialIcon} />
        </View>
      ),
    },
  ];

  return (
    <View style={styles.fill}>
      <StatusBar style="dark" />
      <LinearGradient colors={isMidnight ? ['#0B0814', '#120E22', '#171328'] : meColors.bgGradient} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.fill} edges={['top']}>
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>Me</Text>
          <View style={styles.topBarIcons}>
            <ThemeToggle />
            <PressableScale onPress={() => notImplemented('Scan')} style={styles.topBarIconButton}>
              <Ionicons name="scan-outline" size={22} color={palette.textPrimary} />
            </PressableScale>
            <PressableScale onPress={() => notImplemented('Settings')} style={styles.topBarIconButton}>
              <Ionicons name="settings-outline" size={22} color={palette.textPrimary} />
            </PressableScale>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <FadeInUp index={0}>
            <PressableScale style={[styles.profileCard, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={() => navigation.navigate('EditProfile')}>
              <Avatar name={displayName} imageUrl={user?.avatarUrl} size={64} />
              <View style={styles.profileCardBody}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
                  <View style={styles.badgeRow}>
                    <Text style={styles.badgeEmoji}>👑</Text>
                    <View style={styles.vipPill}>
                      <Text style={styles.vipPillText}>VIP</Text>
                    </View>
                  </View>
                </View>
                <Pressable style={styles.idRow} onPress={handleCopyId} hitSlop={8}>
                  <Text style={styles.idText}>ID: {shortId}</Text>
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={13} color={copied ? '#1FD174' : palette.textMuted} style={{ marginLeft: 4 }} />
                  {copied && <Text style={styles.copiedText}>Copied</Text>}
                </Pressable>
              </View>
              <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
            </PressableScale>
          </FadeInUp>

          <FadeInUp index={1}>
            <PressableScale style={styles.completionBanner} onPress={() => navigation.navigate('EditProfile')}>
              <Ionicons name="alert-circle" size={18} color={palette.primary} />
              <Text style={styles.completionText}>
                Add a bit more to your profile — it'll help people find and recognize you.
              </Text>
            </PressableScale>
          </FadeInUp>

          {/* Visitors still shows "—": no profile-visit tracking exists
              on the backend, so a "0" would look like a real, checked
              value instead of "not built yet". Following/Followers are
              wired to the real social graph and push into
              FollowListScreen. PK Wins is now real too — a genuine count
              of settled PKBattle rows this user actually won, from the
              /social/stats endpoint added specifically to answer this. */}
          <FadeInUp index={2} style={styles.statsRow}>
            <StatCell
              label="PK Wins"
              value={String(statsQuery.data?.pkWins ?? 0)}
              isLoading={statsQuery.isLoading}
            />
            <StatCell
              label="Following"
              value={String(followingQuery.data?.length ?? 0)}
              isLoading={followingQuery.isLoading}
              onPress={() => navigation.navigate('FollowList', { mode: 'following' })}
            />
            <StatCell
              label="Followers"
              value={String(followersQuery.data?.length ?? 0)}
              isLoading={followersQuery.isLoading}
              onPress={() => navigation.navigate('FollowList', { mode: 'followers' })}
            />
            <StatCell label="Visitors" value="—" />
          </FadeInUp>

          <FadeInUp index={3} style={styles.walletRow}>
            <WalletCard label="Coins" value={walletQuery.data?.coin} gradient={isMidnight ? ['#4A3A12', '#6B5318'] : meColors.coinsGradient} isLoading={walletQuery.isLoading} onPress={() => setTopUpOpen(true)} />
            <WalletCard label="Earnings" value={walletQuery.data?.creatorEarnings} gradient={isMidnight ? ['#4A1E32', '#6B2848'] : meColors.earningsGradient} isLoading={walletQuery.isLoading} onPress={() => setWithdrawOpen(true)} />
          </FadeInUp>

          <FadeInUp index={4}>
            <VipPrivilegeBanner vipLevel={0} onPress={() => setVipModalOpen(true)} />
          </FadeInUp>

          <FadeInUp index={5}>
            <DailyCheckInWidget
              rewards={dailyRewards}
              streak={checkInStreak}
              onOpenFullModal={() => setDailyRewardModalOpen(true)}
              onClaimToday={() => {
                const current = dailyRewards.find((r) => r.isCurrent);
                if (current) handleClaimDailyReward(current.day);
              }}
            />
          </FadeInUp>

          <FadeInUp index={6} style={[styles.gridCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={styles.grid}>
              {gridItems.map((item) => (
                <GridTile key={item.key} item={item} />
              ))}
            </View>
          </FadeInUp>

          <FadeInUp index={7}>
            <PressableScale
              style={styles.noticeBanner}
              onPress={() =>
                Alert.alert(
                  'Community Guidelines',
                  'Be respectful — no harassment, hate speech, or targeted abuse.\n\nNo nudity or sexual content.\n\nNo scams, fraud, or attempts to move payments outside the app.\n\nGifts and coins purchased are non-refundable except where required by law.\n\nHosts and viewers found violating these standards may be suspended or banned.',
                )
              }
            >
              <LinearGradient colors={isMidnight ? ['#3B1A58', '#281B4B'] : meColors.noticeGradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <Ionicons name="megaphone-outline" size={16} color="#FFFFFF" />
              <Text style={styles.noticeText}>Notice: User Conduct Standards and Prohibited Activities</Text>
            </PressableScale>
          </FadeInUp>

          <FadeInUp index={8} style={[styles.listCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            {centerRows.map((row, i) => (
              <ListItemRow key={row.key} row={row} isLast={i === centerRows.length - 1} />
            ))}
          </FadeInUp>

          <FadeInUp index={9} style={[styles.listCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            {accountRows.map((row, i) => (
              <ListItemRow key={row.key} row={row} isLast={i === accountRows.length - 1} />
            ))}
          </FadeInUp>

          <FadeInUp index={10}>
            <PressableScale style={styles.logoutButton} onPress={() => logout()}>
              <Text style={styles.logoutText}>Log out</Text>
            </PressableScale>
          </FadeInUp>
        </ScrollView>
      </SafeAreaView>

      <VipDetailsModal
        isOpen={vipModalOpen}
        onClose={() => setVipModalOpen(false)}
        currentLevel={0}
        onUpgrade={() => {
          setVipModalOpen(false);
          notImplemented('VIP upgrades');
        }}
      />
      <TopUpModal
        isOpen={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        currentCoins={walletQuery.data?.coin}
        onPurchase={() => {
          setTopUpOpen(false);
          notImplemented('Coin purchases');
        }}
      />
      <WithdrawModal
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        availableEarnings={walletQuery.data?.creatorEarnings}
        onWithdraw={() => {
          setWithdrawOpen(false);
          notImplemented('Creator cashouts');
        }}
      />
      <DailyRewardModal
        isOpen={dailyRewardModalOpen}
        onClose={() => setDailyRewardModalOpen(false)}
        rewards={dailyRewards}
        streak={checkInStreak}
        onClaim={(day) => {
          handleClaimDailyReward(day);
          setDailyRewardModalOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  topBarTitle: { fontSize: 26, fontWeight: '800', color: meColors.textPrimary },
  topBarIcons: { flexDirection: 'row' },
  topBarIconButton: { padding: 6, marginLeft: spacing.sm },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: meColors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  profileCardBody: { flex: 1, marginLeft: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { ...type.h1, fontSize: 20, color: meColors.textPrimary, flexShrink: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginLeft: spacing.xs },
  badgeEmoji: { fontSize: 16, marginRight: 4 },
  vipPill: { backgroundColor: '#3A3550', borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 1 },
  vipPillText: { color: '#F7C567', fontSize: 10, fontWeight: '800' },
  idRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  idText: { ...type.caption, color: meColors.textMuted, fontWeight: '500' },
  copiedText: { ...type.caption, color: '#1FD174', fontWeight: '700', marginLeft: 4 },

  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: meColors.completionBg,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  completionText: { ...type.caption, color: meColors.completionText, marginLeft: spacing.sm, flex: 1, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: meColors.card,
    borderRadius: radii.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: meColors.textPrimary },
  statLabel: { ...type.caption, color: meColors.textSecondary, marginTop: 2, fontWeight: '500' },

  walletRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  walletCard: { flex: 1, borderRadius: radii.lg, padding: spacing.md, overflow: 'hidden' },
  walletLabel: { ...type.caption, color: meColors.textPrimary, opacity: 0.75, fontWeight: '700' },
  walletValue: { fontSize: 22, fontWeight: '900', color: meColors.textPrimary, marginTop: spacing.xs },

  vipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  vipBannerText: { flex: 1, marginLeft: spacing.sm, fontWeight: '800', color: meColors.vipText },

  gridCard: {
    backgroundColor: meColors.card,
    borderRadius: radii.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '25%', alignItems: 'center', marginBottom: spacing.md },
  gridIconCircle: { width: 48, height: 48, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  gridLabel: { ...type.caption, color: meColors.textSecondary, fontWeight: '500' },

  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  noticeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12, marginLeft: spacing.sm, flex: 1 },

  listCard: { backgroundColor: meColors.card, borderRadius: radii.lg, marginTop: spacing.md, paddingHorizontal: spacing.md },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  listRowDivider: { borderBottomWidth: 1, borderBottomColor: meColors.border },
  listIconCircle: { width: 30, height: 30, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  listLabel: { ...type.body, color: meColors.textPrimary, marginLeft: spacing.md, flex: 1, fontWeight: '600' },
  listTrailing: { flexDirection: 'row', alignItems: 'center' },
  socialRow: { flexDirection: 'row', marginRight: spacing.xs },
  socialIcon: { marginLeft: 6 },

  logoutButton: {
    marginTop: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: meColors.danger,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    backgroundColor: meColors.card,
  },
  logoutText: { color: meColors.danger, fontWeight: '700' },
});
