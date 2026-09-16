import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createLiveSession,
  endLiveSession,
  fetchMyLiveSession,
  fetchLiveViewers,
  type LiveSessionRaw,
  type LiveViewer,
} from '../../api/live';
import { GradientBackground } from '../../components/GradientBackground';
import { GradientButton } from '../../components/GradientButton';
import { FadeInUp } from '../../components/FadeInUp';
import { Avatar } from '../../components/Avatar';
import { AgoraVideoView } from '../../components/AgoraVideoView';
import { LiveChatFeed, type LiveChatFeedHandle } from '../../components/LiveChatFeed';
import { LiveToolsSheet } from '../../components/LiveToolsSheet';
import { GiftSheet } from '../../components/GiftSheet';
import { ViewerPickerSheet } from '../../components/ViewerPickerSheet';
import { notImplemented } from '../../utils/notImplemented';
import { useAgoraEngine } from '../../live/useAgoraEngine';
import { useLiveChat } from '../../live/useLiveChat';
import { useAuth } from '../../auth/AuthContext';
import type { AppStackParamList, MainTabParamList } from '../../navigation/types';
import { colors, gradients, radii, spacing, type } from '../../theme';

const FILTERS = ['None', 'Soft', 'Vivid', 'Cool', 'Warm', 'Mono', 'Dream'] as const;
const LIVE_CATEGORIES = ['Chatting', 'Singing', 'Dancing', 'Gaming', 'Just Chill'];
export type LiveFilter = typeof FILTERS[number];

type GoLiveNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'GoLive'>,
  NativeStackNavigationProp<AppStackParamList>
>;

function filterStyle(f: LiveFilter) {
  switch (f) {
    case 'Soft':  return { backgroundColor: 'rgba(255,220,200,0.12)' };
    case 'Vivid': return { backgroundColor: 'rgba(255,0,180,0.10)' };
    case 'Cool':  return { backgroundColor: 'rgba(0,180,255,0.14)' };
    case 'Warm':  return { backgroundColor: 'rgba(255,140,0,0.14)' };
    case 'Mono':  return { backgroundColor: 'rgba(120,120,120,0.28)' };
    case 'Dream': return { backgroundColor: 'rgba(180,120,255,0.20)' };
    default:      return {};
  }
}

function AnimatedChatLine({
  username,
  text,
  color = '#FFD700',
}: {
  username: string;
  text: string;
  color?: string;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Text style={styles.chatText} numberOfLines={2}>
        <Text style={[styles.chatUser, { color }]}>{username}: </Text>
        {text}
      </Text>
    </Animated.View>
  );
}

export function GoLiveScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<GoLiveNav>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Chatting');
  const [session, setSession] = useState<LiveSessionRaw | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isToolsSheetOpen, setIsToolsSheetOpen] = useState(false);
  const [filter, setFilter] = useState<LiveFilter>('None');

  // Gift flow state: pick a viewer first, then pick a gift.
  const [isViewerPickerOpen, setIsViewerPickerOpen] = useState(false);
  const [giftRecipient, setGiftRecipient] = useState<LiveViewer | null>(null);

  const myLiveQuery = useQuery({
    queryKey: ['live', 'mine'],
    queryFn: fetchMyLiveSession,
    enabled: !session,
  });

  // Viewer list — only fetched while the picker is open and a session
  // exists, refreshed on each open. Live viewers change constantly.
  const viewersQuery = useQuery({
    queryKey: ['live', session?.id, 'viewers'],
    queryFn: () => fetchLiveViewers(session!.id),
    enabled: !!session && isViewerPickerOpen,
    refetchInterval: isViewerPickerOpen ? 5000 : false,
  });

  const endOrphanedMutation = useMutation({
    mutationFn: (sessionId: string) => endLiveSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'live-now'] });
    },
    onError: (error: any) => {
      Alert.alert(
        'Could not end session',
        error?.response?.data?.message ?? 'Something went wrong. Try again.'
      );
    },
  });

  const {
    isJoined,
    engineReady,
    error: agoraError,
    isMicMuted,
    toggleMic,
    switchCamera,
    isNoiseSuppressionOn,
    toggleNoiseSuppression,
    beauty,
    setBeauty,
    background,
    setBackground,
    faceShape,
    setFaceShape,
  } = useAgoraEngine({
    channelId: session?.providerChannel ?? '',
    token: token ?? '',
    userAccount: user?.id ?? '',
    role: 'host',
  });

  const { messages, sendMessage } = useLiveChat('LIVE', session?.id ?? '');

  const startMutation = useMutation({
    mutationFn: () => createLiveSession({ title: title.trim(), category }),
    onSuccess: ({ session: newSession, token: newToken }) => {
      setSession(newSession);
      setToken(newToken);
      queryClient.invalidateQueries({ queryKey: ['feed', 'live-now'] });
    },
    onError: (error: any) => {
      Alert.alert('Could not go live', error?.response?.data?.message ?? 'Something went wrong');
    },
  });

  const endMutation = useMutation({
    mutationFn: () => endLiveSession(session!.id),
    onSuccess: () => {
      setSession(null);
      setToken(null);
      setTitle('');
      setGiftRecipient(null);
      setIsViewerPickerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['feed', 'live-now'] });
    },
    onError: (error: any) => {
      Alert.alert(
        'Could not end session',
        error?.response?.data?.message ?? 'Something went wrong. Try again.'
      );
    },
  });

  // Set to true right before navigating to a screen that's still
  // logically part of this live session (PkScreen) — without this, the
  // blur listener below can't tell "tapped PK, coming right back" apart
  // from "actually leaving" (switching tabs, closing), and was ending
  // the session on every PK tap. Reset immediately after being read once.
  const isExpectedSubScreenNav = useRef(false);

  // Shared by both LiveToolsSheet instances (pre-live and live) — routes
  // each Features Center tap to the real screen that now exists for it,
  // built earlier this session, rather than leaving every single one as
  // notImplemented. giftCenter reuses the exact same real pick-a-viewer-
  // then-gift flow the main action bar already uses, not a separate one.
  const handleToolFeature = (key: string) => {
    switch (key) {
      case 'rank':
        navigation.navigate('HonorRanking');
        return;
      case 'pk':
        isExpectedSubScreenNav.current = true;
        navigation.navigate('PkScreen');
        return;
      case 'rewards':
        navigation.navigate('Reward');
        return;
      case 'store':
        navigation.navigate('BuyCoins');
        return;
      case 'bag':
        navigation.navigate('Bag');
        return;
      case 'giftCenter':
        setIsToolsSheetOpen(false);
        setIsViewerPickerOpen(true);
        return;
      case 'share':
        Share.share({ message: `Come watch "${session?.title || title || 'my stream'}" live!` }).catch(() => {});
        return;
      default:
        notImplemented(`Tool: ${key}`);
    }
  };
  const chatFeedRef = useRef<LiveChatFeedHandle>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (isExpectedSubScreenNav.current) {
        isExpectedSubScreenNav.current = false;
        return;
      }
      if (session) {
        endLiveSession(session.id)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['feed', 'live-now'] });
            setSession(null);
            setToken(null);
          })
          .catch(() => {});
      }
    });
    return unsubscribe;
  }, [navigation, session, queryClient]);

  const handleSelectViewer = (viewer: LiveViewer) => {
    setIsViewerPickerOpen(false);
    // Small delay so the picker fully closes before the gift sheet
    // slides up — two stacked modals on Android look janky otherwise.
    setTimeout(() => setGiftRecipient(viewer), 220);
  };

  const handleCloseGift = () => {
    setGiftRecipient(null);
  };

  // ── Orphaned session recovery ───────────────────────────────
  if (!session && myLiveQuery.data) {
    const orphaned = myLiveQuery.data;
    return (
      <GradientBackground style={styles.centered}>
        <View style={styles.warnIcon}>
          <Ionicons name="alert-circle" size={40} color="#FFB347" />
        </View>
        <Text style={styles.title}>You have an existing live session</Text>
        <Text style={styles.subtitle}>
          "{orphaned.title}" is still marked live. End it before starting a new one.
        </Text>
        <View style={{ width: '100%', marginTop: spacing.lg }}>
          <GradientButton
            label={endOrphanedMutation.isPending ? 'Ending...' : 'End that session'}
            onPress={() => endOrphanedMutation.mutate(orphaned.id)}
            loading={endOrphanedMutation.isPending}
          />
        </View>
      </GradientBackground>
    );
  }

  // ── ACTIVE BROADCAST ────────────────────────────────────────
  if (session) {
    return (
      <View style={styles.root}>
        <View style={StyleSheet.absoluteFill}>
          {/* Local preview reflects camera capture directly (started
              immediately on mount for the host — see useAgoraEngine),
              independent of channel-join status. Gating this on isJoined
              meant the host's own preview stayed on a "Connecting
              camera..." placeholder even once the camera was genuinely
              already live locally, only actually swapping in once the
              network channel-join round-trip completed too. */}
          {!agoraError ? (
            <AgoraVideoView key={engineReady ? 'ready' : 'pending'} uid={0} style={StyleSheet.absoluteFill} />
          ) : (
            <GradientBackground style={StyleSheet.absoluteFill}>
              <View style={styles.videoLoading}>
                <Ionicons name="videocam" size={40} color={colors.textMuted} />
                <Text style={styles.videoLoadingText}>Video unavailable in this build</Text>
                <Text style={styles.videoErrorDetail}>{agoraError}</Text>
              </View>
            </GradientBackground>
          )}
          {filter !== 'None' && (
            <View style={[StyleSheet.absoluteFill, filterStyle(filter)]} />
          )}
        </View>

        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.xs }]}>
          <View style={styles.avatarWrap}>
            <Avatar uri={user?.avatar ?? 'https://i.pravatar.cc/150?img=1'} size={38} />
          </View>
          <View style={styles.topBarText}>
            <View style={styles.hostNameRow}>
              <Text style={styles.hostName} numberOfLines={1}>{session.title}</Text>
              <Text style={styles.heartCount}>♡ 0</Text>
            </View>
          </View>
          <View style={styles.pinkHeart}>
            <Ionicons name="heart" size={16} color="#FFF" />
          </View>
          <View style={styles.trophyCircle}>
            <Ionicons name="trophy" size={16} color="#FFF" />
          </View>
          <View style={styles.coinPill}>
            <Text style={styles.coinText}>0</Text>
          </View>
          <Pressable onPress={() => setIsToolsSheetOpen(true)} style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={20} color="#FFF" />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' } as never)}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={22} color="#FFF" />
          </Pressable>
        </View>

        {/* Stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.hourBadge}>
            <Ionicons name="flame" size={11} color="#FFD700" />
            <Text style={styles.hourText}>Hour 100+</Text>
          </View>
          <View style={styles.pkBadge}>
            <Ionicons name="git-compare" size={9} color="#FFF" />
            <Text style={styles.pkBadgeText}>5</Text>
          </View>
          <Text style={styles.percentText}>16.48%</Text>
        </View>

        {/* Team row */}
        <View style={styles.teamRow}>
          <View style={styles.teamBadge}>
            <Ionicons name="home" size={14} color="#FFF" />
            <View style={{ marginLeft: 4 }}>
              <Text style={styles.teamLabel}>Team U...</Text>
              <Text style={styles.teamScore}>0/12</Text>
            </View>
          </View>
          <LinearGradient
            colors={['#7B2FF7', '#B621FE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shareBadge}
          >
            <Text style={styles.shareTitle}>#Share Poppo Glory</Text>
            <Text style={styles.shareSub}>Post and win up to 8,000</Text>
            <Text style={styles.shareDate}>24/08/15/08</Text>
          </LinearGradient>
        </View>

        {/* Fan club banner */}
        <View style={styles.floatArea}>
          <LinearGradient
            colors={['#B06AB3', '#E0A9F5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fanClubBanner}
          >
            <Ionicons name="megaphone" size={12} color="#FFF" />
            <Text style={styles.fanClubText}>Join my fans club</Text>
          </LinearGradient>
        </View>

        {/* Chat */}
        <View style={[styles.chatArea, { bottom: insets.bottom + 62 }]}>
          <View style={styles.sideTabs}>
            <View style={[styles.sideTab, styles.sideTabActive]}>
              <Text style={styles.sideTabTextActive}>All</Text>
            </View>
            <View style={styles.sideTab}>
              <Text style={styles.sideTabText}>Room</Text>
            </View>
            <View style={styles.sideTab}>
              <Text style={styles.sideTabText}>Chat</Text>
            </View>
          </View>

          <View style={styles.chatColumn}>
            <View style={styles.systemBlock}>
              <Text style={styles.systemText}>
                <Text style={styles.warnHighlight}>Cam rooms are strictly prohibited.{'\n'}</Text>
                Administrators monitor the feed 24/7. Reported contents and violations will be severely penalized.
              </Text>
            </View>

            <View style={styles.systemBlock}>
              <Text style={styles.systemText}>
                <Text style={styles.boostText}>🔊 Like Boost is active!</Text> Encourage viewers to double-tap for likes to boost traffic.
              </Text>
            </View>

            <View style={styles.joinedRow}>
              <View style={styles.joinedBadge}>
                <Ionicons name="heart" size={9} color="#FFF" />
                <Text style={styles.joinedBadgeText}>24</Text>
              </View>
              <Text style={styles.joinedText}>Ch 👑👑💰 Joined</Text>
            </View>

            <LiveChatFeed
              ref={chatFeedRef}
              messages={messages}
              sendMessage={sendMessage}
              renderLine={(message, isMe) => (
                <AnimatedChatLine
                  username={isMe ? 'You' : message.senderId.slice(0, 6)}
                  text={message.content}
                  color="#FFD700"
                />
              )}
            />
          </View>
        </View>

        {/* Bottom bar */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
          <Pressable style={styles.bottomIcon} onPress={() => chatFeedRef.current?.focus()}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FFF" />
          </Pressable>

          <Pressable style={styles.bottomIcon} onPress={toggleMic}>
            <Ionicons
              name={isMicMuted ? 'mic-off-outline' : 'mic-outline'}
              size={24}
              color={isMicMuted ? '#FF4D4D' : '#FFF'}
            />
          </Pressable>

          <Pressable style={styles.bottomIcon} onPress={() => setIsToolsSheetOpen(true)}>
            <Ionicons name="grid-outline" size={24} color="#FFF" />
          </Pressable>

          <Pressable
            style={styles.bottomIcon}
            onPress={() => {
              isExpectedSubScreenNav.current = true;
              navigation.navigate('Search');
            }}
          >
            <Ionicons name="search-outline" size={24} color="#FFF" />
          </Pressable>

          {/* PK */}
          <Pressable
            style={styles.bottomIcon}
            onPress={() => {
              isExpectedSubScreenNav.current = true;
              navigation.navigate('PkScreen');
            }}
          >
            <Text style={styles.pkLabel}>PK</Text>
          </Pressable>

          {/* Games — same "still part of this live session" navigation
              guard as PK above, for the same reason: GameCenter is a
              separate pushed screen, not an in-place overlay like Tools/
              Gift, so without the flag this would end the broadcast the
              moment it's tapped. */}
          <Pressable
            style={styles.bottomIcon}
            onPress={() => {
              isExpectedSubScreenNav.current = true;
              navigation.navigate('GameCenter');
            }}
          >
            <Ionicons name="game-controller-outline" size={24} color="#FFF" />
          </Pressable>

          {/* Gift — opens the viewer picker */}
          <Pressable
            style={styles.bottomIcon}
            onPress={() => setIsViewerPickerOpen(true)}
          >
            <View style={styles.giftCircle}>
              <Ionicons name="gift" size={16} color="#FFF" />
            </View>
          </Pressable>

          <Pressable onPress={() => endMutation.mutate()} style={styles.bottomIcon}>
            <View style={styles.endCircle}>
              <Ionicons name="stop" size={16} color="#FFF" />
            </View>
          </Pressable>
        </View>

        <LiveToolsSheet
          visible={isToolsSheetOpen}
          onClose={() => setIsToolsSheetOpen(false)}
          isHost
          sessionTitle={session.title}
          switchCamera={switchCamera}
          isNoiseSuppressionOn={isNoiseSuppressionOn}
          toggleNoiseSuppression={toggleNoiseSuppression}
          isMicMuted={isMicMuted}
          toggleMic={toggleMic}
          filter={filter}
          onFilterChange={(f) => setFilter(f as LiveFilter)}
          filters={FILTERS as unknown as string[]}
          beauty={beauty}
          setBeauty={setBeauty}
          background={background}
          setBackground={setBackground}
          faceShape={faceShape}
          setFaceShape={setFaceShape}
          onFeature={handleToolFeature}
        />

        <ViewerPickerSheet
          visible={isViewerPickerOpen}
          onClose={() => setIsViewerPickerOpen(false)}
          viewers={viewersQuery.data}
          isLoading={viewersQuery.isLoading}
          onSelect={handleSelectViewer}
        />

        {giftRecipient && (
          <GiftSheet
            visible={!!giftRecipient}
            onClose={handleCloseGift}
            recipientId={giftRecipient.userId}
            context="LIVE"
            contextId={session.id}
            recipientName={giftRecipient.displayName ?? 'Viewer'}
          />
        )}
      </View>
    );
  }

  // ── PRE-BROADCAST SETUP ─────────────────────────────────────
  // Shows the real local camera preview (already running — see
  // useAgoraEngine's split preview/join design above) with the setup
  // UI overlaid on top, instead of a plain form on a static background.
  // Local preview reflects camera capture directly, independent of
  // channel-join status, so it's correct to show it here even though
  // isJoined is still false at this point (no channel exists yet).
  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill}>
        {!agoraError ? (
          <AgoraVideoView key={engineReady ? 'ready' : 'pending'} uid={0} style={StyleSheet.absoluteFill} />
        ) : (
          <GradientBackground style={StyleSheet.absoluteFill}>
            <View style={styles.videoLoading}>
              <Ionicons name="videocam-off" size={40} color={colors.textMuted} />
              <Text style={styles.videoLoadingText}>Video unavailable in this build</Text>
              <Text style={styles.videoErrorDetail}>{agoraError}</Text>
            </View>
          </GradientBackground>
        )}
      </View>

      <View style={[styles.preLiveTopBar, { paddingTop: insets.top + spacing.xs }]}>
        <Pressable onPress={() => navigation.navigate('MainTabs', { screen: 'Home' } as never)} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#FFF" />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={toggleMic} style={styles.preLiveIconBtn}>
          <Ionicons name={isMicMuted ? 'mic-off-outline' : 'mic-outline'} size={20} color="#FFF" />
        </Pressable>
        <Pressable onPress={switchCamera} style={styles.preLiveIconBtn}>
          <Ionicons name="camera-reverse-outline" size={20} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.preLiveSetupCard}>
        <View style={styles.preLiveTitleRow}>
          <Avatar uri={user?.avatar ?? 'https://i.pravatar.cc/150?img=1'} size={40} />
          <TextInput
            style={styles.preLiveTitleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Please enter the content"
            placeholderTextColor="rgba(255,255,255,0.75)"
            maxLength={80}
          />
          <Ionicons name="pencil" size={16} color="rgba(255,255,255,0.75)" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.preLiveCategoryRow}>
          {LIVE_CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.preLiveCategoryPill, category === c && styles.preLiveCategoryPillActive]}
            >
              <Text style={[styles.preLiveCategoryText, category === c && styles.preLiveCategoryTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.preLiveBottomRow, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable style={styles.preLiveSparkleBtn} onPress={() => setIsToolsSheetOpen(true)}>
          <Ionicons name="sparkles" size={22} color="#FFF" />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: spacing.md }}>
          <GradientButton
            label={startMutation.isPending ? 'Starting...' : 'Go Live'}
            onPress={() => startMutation.mutate()}
            disabled={title.trim().length === 0}
            loading={startMutation.isPending}
          />
        </View>
        <Pressable style={styles.preLiveSparkleBtn} onPress={() => setIsToolsSheetOpen(true)}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#FFF" />
        </Pressable>
      </View>

      <LiveToolsSheet
        visible={isToolsSheetOpen}
        onClose={() => setIsToolsSheetOpen(false)}
        isHost
        sessionTitle={title || 'My Live'}
        switchCamera={switchCamera}
        isNoiseSuppressionOn={isNoiseSuppressionOn}
        toggleNoiseSuppression={toggleNoiseSuppression}
        isMicMuted={isMicMuted}
        toggleMic={toggleMic}
        filter={filter}
        onFilterChange={(f) => setFilter(f as LiveFilter)}
        filters={FILTERS as unknown as string[]}
        beauty={beauty}
        setBeauty={setBeauty}
        background={background}
        setBackground={setBackground}
          faceShape={faceShape}
          setFaceShape={setFaceShape}
        onFeature={handleToolFeature}
        initialPanel="beauty"
      />
    </View>
  );
}

const SIDEBAR_W = 38;

const styles = StyleSheet.create({
  preLiveTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  preLiveIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preLiveSetupCard: {
    position: 'absolute',
    top: 90,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(20,18,40,0.55)',
    borderRadius: 16,
    padding: spacing.sm,
  },
  preLiveTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  preLiveTitleInput: { flex: 1, color: '#FFF', fontSize: 15 },
  preLiveCategoryRow: { marginTop: spacing.sm },
  preLiveCategoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    marginRight: 8,
  },
  preLiveCategoryPillActive: { backgroundColor: '#FFF', borderColor: '#FFF' },
  preLiveCategoryText: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  preLiveCategoryTextActive: { color: '#1A1A2E' },
  preLiveBottomRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  preLiveSparkleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  root: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  videoLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  videoLoadingText: { ...type.body, color: colors.textSecondary },
  videoErrorDetail: { ...type.caption, color: colors.textMuted, textAlign: 'center', maxWidth: 260, marginTop: spacing.xs },
  liveIconWrap: { marginBottom: spacing.lg },
  liveIconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#6B4EFF',
    alignItems: 'center', justifyContent: 'center',
  },
  warnIcon: { marginBottom: spacing.sm },
  title: { ...type.h1, color: colors.textPrimary, textAlign: 'center', marginTop: spacing.sm },
  subtitle: { ...type.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, maxWidth: 280 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  avatarWrap: { position: 'relative' },
  topBarText: { flex: 1 },
  hostNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hostName: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  heartCount: { color: '#FFF', fontSize: 11 },
  pinkHeart: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FF1493',
    alignItems: 'center', justifyContent: 'center',
  },
  trophyCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,140,0,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  coinPill: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  coinText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  settingsBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  statsBar: {
    position: 'absolute', top: 78, left: spacing.sm, right: spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  hourBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  hourText: { color: '#FFD700', fontSize: 11, fontWeight: '700' },
  pkBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#00C853',
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8,
  },
  pkBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  percentText: { color: '#00E676', fontSize: 12, fontWeight: '700' },
  teamRow: {
    position: 'absolute', top: 110, left: spacing.sm, right: spacing.sm,
    flexDirection: 'row', gap: 8,
  },
  teamBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,140,0,0.85)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  teamLabel: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  teamScore: { color: '#FFF', fontSize: 9 },
  shareBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  shareTitle: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  shareSub: { color: '#FFF', fontSize: 9 },
  shareDate: { color: '#FFD700', fontSize: 8, marginTop: 2 },
  floatArea: { position: 'absolute', top: 165, left: 0, right: 0, alignItems: 'center' },
  fanClubBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
  },
  fanClubText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  chatArea: { position: 'absolute', left: 0, right: spacing.md, flexDirection: 'row', alignItems: 'flex-end' },
  sideTabs: { width: SIDEBAR_W, gap: 2 },
  sideTab: {
    paddingVertical: 10,
    borderTopRightRadius: 8, borderBottomRightRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
  },
  sideTabActive: { backgroundColor: '#6B4EFF' },
  sideTabText: { color: '#AAA', fontSize: 10 },
  sideTabTextActive: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  chatColumn: { flex: 1, marginLeft: 6, gap: 6 },
  chatText: { color: '#FFF', fontSize: 12, lineHeight: 16 },
  chatUser: { fontWeight: '700' },
  systemBlock: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: 6,
  },
  systemText: { color: '#CCC', fontSize: 11, lineHeight: 15 },
  warnHighlight: { color: '#00E5FF', fontWeight: '700' },
  boostText: { color: '#FFD700', fontWeight: '700' },
  joinedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  joinedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#FF1493',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  joinedBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  joinedText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingTop: 6, paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  bottomIcon: { alignItems: 'center', justifyContent: 'center', width: 40, height: 40 },
  pkLabel: { color: '#FFD700', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  giftCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FF1493',
    alignItems: 'center', justifyContent: 'center',
  },
  endCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#E53935',
    alignItems: 'center', justifyContent: 'center',
  },
});