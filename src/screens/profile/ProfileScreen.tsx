import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../../auth/AuthContext';
import { fetchWallet, fetchFollowing, fetchFollowers } from '../../api/feed';
import { fetchCheckInStatus, performCheckIn, updateBio } from '../../api/auth';
import { buildCheckInWeek } from '../../utils/checkIn';
import { fetchSocialStats } from '../../api/social';
import { fetchMyAgency } from '../../api/agencies';
import type { MainTabParamList, AppStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from '../../components/ThemeToggle';
import { PressableScale } from '../../components/PressableScale';
import { FadeInUp } from '../../components/FadeInUp';
import { ProfileCompletionIndicator } from '../../components/profile/ProfileCompletionIndicator';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { BioCard } from '../../components/profile/BioCard';
import { StatsRow } from '../../components/profile/StatsRow';
import { WalletCard } from '../../components/profile/WalletCard';
import { DailyCheckInWidget } from '../../components/profile/DailyCheckInWidget';
import { DailyRewardModal } from '../../components/profile/DailyRewardModal';
import { SectionList } from '../../components/profile/SectionList';
import { FeatureGrid } from '../../components/profile/FeatureGrid';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<AppStackParamList>
>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout, refreshUser } = useAuth();
  const { palette, isMidnight } = useTheme();

  const wallet = useQuery({ queryKey: ['wallet'], queryFn: fetchWallet });
  const following = useQuery({ queryKey: ['feed', 'following'], queryFn: fetchFollowing });
  const followers = useQuery({ queryKey: ['social', 'followers'], queryFn: fetchFollowers });
  const stats = useQuery({ queryKey: ['social', 'stats'], queryFn: fetchSocialStats });

  const [rewardOpen, setRewardOpen] = useState(false);
  const agency = useQuery({ queryKey: ['agencies', 'me'], queryFn: fetchMyAgency });
  const isCreator = user?.roles?.some((r) => r.role === 'CREATOR') ?? false;

  // Daily check-in is server state (same query key RewardScreen uses, so the
  // two stay in sync): the streak, whether today is claimed, and the reward
  // amounts all come from the backend, and claiming actually credits coins.
  const queryClient = useQueryClient();
  const checkIn = useQuery({ queryKey: ['users', 'me', 'check-in'], queryFn: fetchCheckInStatus });
  const dailyRewards = useMemo(() => (checkIn.data ? buildCheckInWeek(checkIn.data) : []), [checkIn.data]);
  const checkInMutation = useMutation({
    mutationFn: performCheckIn,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'check-in'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setRewardOpen(false);
      Alert.alert('Daily Check-in', `You earned ${result.rewardCoins} coins. Streak: ${result.streak} day${result.streak === 1 ? '' : 's'}.`);
    },
    onError: (error: any) => {
      Alert.alert('Could not check in', error?.response?.data?.message ?? 'Something went wrong. Try again.');
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'check-in'] });
    },
  });
  const claimToday = () => {
    if (!checkInMutation.isPending) checkInMutation.mutate();
  };

  const bio = user?.bio ?? '';
  // Saved through PATCH /users/me. On failure this alerts and rethrows so the
  // BioCard stays open with what the user typed instead of losing it.
  const saveBio = async (newBio: string) => {
    try {
      await updateBio(newBio);
      await refreshUser();
    } catch (error: any) {
      Alert.alert('Could not save bio', error?.response?.data?.message ?? 'Please try again.');
      throw error;
    }
  };

  return (
    <View style={styles.fill}>
      <LinearGradient
        colors={palette.bgGradient}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.fill} edges={['top']}>
        <View style={styles.topBar}>
          <Text style={[styles.title, { color: palette.textPrimary }]}>Me</Text>
          <View style={styles.actions}>
            <ThemeToggle />
            <PressableScale style={styles.action} onPress={() => navigation.navigate('EditProfile')}>
              <Ionicons name="settings-outline" size={21} color={palette.textPrimary} />
            </PressableScale>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FadeInUp index={0}>
            <ThemeToggle variant="card" compact={false} />
          </FadeInUp>

          <FadeInUp index={1}>
            <ProfileCompletionIndicator
              onOpenEdit={() => navigation.navigate('EditProfile')}
              onOpenKyc={() => navigation.navigate('Authentication')}
            />
          </FadeInUp>

          <FadeInUp index={2}>
            <ProfileHeader
              onOpenEdit={() => navigation.navigate('EditProfile')}
              onOpenKyc={() => navigation.navigate('Authentication')}
            />
          </FadeInUp>

          <FadeInUp index={3}>
            <BioCard bio={bio} onSaveBio={saveBio} />
          </FadeInUp>

          <FadeInUp index={5}>
            <StatsRow
              pkWins={stats.data?.pkWins ?? 0}
              pkLosses={stats.data?.pkLosses ?? 0}
              followingCount={stats.data?.following ?? following.data?.length ?? 0}
              followersCount={stats.data?.followers ?? followers.data?.length ?? 0}
              onSelectStat={(key) => {
                if (key === 'following') navigation.navigate('FollowList', { mode: 'following' });
                if (key === 'followers') navigation.navigate('FollowList', { mode: 'followers' });
                if (key === 'pkWins') navigation.navigate('PkHistory');
              }}
            />
          </FadeInUp>

          <FadeInUp index={6}>
            <WalletCard
              coin={wallet.data?.coin}
              bonus={wallet.data?.bonus}
              earnings={wallet.data?.creatorEarnings}
              showEarnings={isCreator}
              onBuyCoins={() => navigation.navigate('BuyCoins')}
              onCashOut={() => navigation.navigate('CreatorCenter', { defaultTab: 'streamer' })}
            />
          </FadeInUp>

          {checkIn.data && (
            <FadeInUp index={8}>
              <DailyCheckInWidget
                rewards={dailyRewards}
                streak={checkIn.data.streak}
                onOpenFullModal={() => setRewardOpen(true)}
                onClaimToday={claimToday}
              />
            </FadeInUp>
          )}

          <FadeInUp index={9}>
            <FeatureGrid
              onOpenReward={() => setRewardOpen(true)}
              onOpenRank={() => navigation.navigate('HonorRanking')}
              onOpenStore={() => navigation.navigate('BuyCoins')}
              onOpenInvite={() => navigation.navigate('Invite')}
              onOpenGames={() => navigation.navigate('GameCenter')}
              onOpenVideos={() => navigation.navigate('VideoFeed')}
            />
          </FadeInUp>

          <FadeInUp index={10}>
            <PressableScale
              style={[styles.notice, { borderColor: palette.border }]}
              onPress={() => Alert.alert('Community Guidelines', 'Be respectful. No harassment, hate speech, sexual content, scams, fraud, or attempts to move payments outside the app.')}
            >
              <LinearGradient
                colors={isMidnight ? ['#4A2670', '#2B1B50'] : ['#7B4DFF', '#FF3D8A']}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="megaphone-outline" size={17} color="#FFFFFF" />
              <Text style={styles.noticeText}>Notice: User Conduct Standards and Prohibited Activities</Text>
            </PressableScale>
          </FadeInUp>

          <FadeInUp index={11}>
            <SectionList
              onOpenBackpack={() => navigation.navigate('Bag')}
              onOpenStreamerCenter={() => navigation.navigate('CreatorCenter', { defaultTab: 'streamer' })}
              onOpenVideoCreator={() => navigation.navigate('VideoCreatorCenter')}
              onOpenHelpCenter={() => navigation.navigate('HelpCenter')}
              onOpenWatchHistory={() => navigation.navigate('WatchHistory')}
              onOpenAgency={() => navigation.navigate('Agency')}
              onOpenPayoutAccount={() => navigation.navigate('PayoutAccount')}
              onOpenKyc={() => navigation.navigate('Authentication')}
              onOpenBlocked={() => navigation.navigate('BlockedUsers')}
              onLogout={logout}
              kycVerified={!!user?.kycVerified}
              agencyName={agency.data?.agencyName ?? null}
            />
          </FadeInUp>

          <PressableScale style={[styles.logout, { borderColor: palette.border }]} onPress={logout}>
            <Text style={[styles.logoutText, { color: palette.danger }]}>Log out</Text>
          </PressableScale>
        </ScrollView>
      </SafeAreaView>

      <DailyRewardModal
        isOpen={rewardOpen}
        onClose={() => setRewardOpen(false)}
        rewards={dailyRewards}
        streak={checkIn.data?.streak ?? 0}
        onClaim={claimToday}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 25, fontWeight: '900', letterSpacing: -0.5 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  action: { padding: 6 },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 2 },
  notice: { minHeight: 52, borderRadius: 18, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginTop: 8 },
  noticeText: { flex: 1, color: '#FFF', fontSize: 12, fontWeight: '800', marginLeft: 9 },
  logout: { marginTop: 16, marginBottom: 20, borderWidth: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  logoutText: { fontSize: 13, fontWeight: '900' },
});
