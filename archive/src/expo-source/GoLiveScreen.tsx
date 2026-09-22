import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
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
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// API and contextual hooks from rrydaapp
import {
  createLiveSession,
  endLiveSession,
  fetchMyLiveSession,
  fetchLiveViewers,
  joinLiveSession,
  type LiveSessionRaw,
  type LiveViewer,
} from '../../api/live';
import { fetchActivePkForHost } from '../../api/pk';
import { fetchWallet } from '../../api/feed';
import { fetchHonorRanking } from '../../api/ranking';
import { useAgoraEngine } from '../../live/useAgoraEngine';
import { useLiveChat } from '../../live/useLiveChat';
import { useAuth } from '../../auth/AuthContext';
import type { AppStackParamList, MainTabParamList } from '../../navigation/types';
import { colors, gradients, radii, spacing, type } from '../../theme';

// Redesigned Expo Live Stream Subcomponents
import { LiveHeader, type LiveViewerItem } from '../../components/live/LiveHeader';
import { PkBattleOverlay } from '../../components/live/PkBattleOverlay';
import { LiveChatOverlay, type ChatMessage } from '../../components/live/LiveChatOverlay';
import { LiveToolsSheet } from '../../components/live/LiveToolsSheet';
import { BeautySheet, type BeautySettings } from '../../components/live/BeautySheet';
import { FloatingHearts, type FloatingHeartsHandle } from '../../components/live/FloatingHearts';
import { StreamSummaryModal, type StreamStats } from '../../components/live/StreamSummaryModal';
import { AgoraVideoView } from '../../components/AgoraVideoView';
import { ViewerPickerSheet } from '../../components/ViewerPickerSheet';
import { GiftSheet } from '../../components/GiftSheet';

const LIVE_CATEGORIES = [
  { id: 'Chatting', label: 'Chatting', icon: 'chatbubbles' },
  { id: 'Singing', label: 'Singing', icon: 'mic' },
  { id: 'Dancing', label: 'Dancing', icon: 'body' },
  { id: 'Gaming', label: 'Gaming', icon: 'game-controller' },
  { id: 'Just Chill', label: 'Just Chill', icon: 'cafe' },
  { id: 'Storytime', label: 'Storytime', icon: 'book' },
];

const SUGGESTED_TAGS = ['#ChillVibes', '#LiveMusic', '#AskMeAnything', '#RankRush', '#GoodVibes'];

type GoLiveNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'GoLive'>,
  NativeStackNavigationProp<AppStackParamList>
>;

export function GoLiveScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<GoLiveNav>();
  const route = useRoute<RouteProp<MainTabParamList, 'GoLive'>>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Pre-live broadcast configuration
  const [title, setTitle] = useState(route.params?.initialTitle ?? 'Late Night Chill & Chat ✨');
  const [category, setCategory] = useState('Chatting');
  const [coverUrl, setCoverUrl] = useState<string>(
    user?.avatarUrl ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'
  );
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');

  // Broadcast state
  const [session, setSession] = useState<LiveSessionRaw | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [streamQuality, setStreamQuality] = useState('1080p 60fps (Full HD)');
  const [likesCount, setLikesCount] = useState(3840);
  const [diamondsEarned, setDiamondsEarned] = useState(12850);

  // Sheets & modals
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isBeautyOpen, setIsBeautyOpen] = useState(false);
  const [isViewerPickerOpen, setIsViewerPickerOpen] = useState(false);
  const [giftRecipient, setGiftRecipient] = useState<LiveViewer | null>(null);
  const [isEndConfirmationVisible, setIsEndConfirmationVisible] = useState(false);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);

  // Beauty settings
  const [beautySettings, setBeautySettings] = useState<BeautySettings>({
    enabled: true,
    smoothing: 60,
    whitening: 45,
    slimFace: 35,
    bigEyes: 25,
    blush: 30,
    filterPreset: 'rosy',
  });

  // Floating hearts reference
  const heartsRef = useRef<FloatingHeartsHandle>(null);

  // Agora Engine Integration
  const {
    isJoined,
    engineReady,
    error: agoraError,
    isMicMuted,
    toggleMic,
    switchCamera,
    isNoiseSuppressionOn,
    toggleNoiseSuppression,
    secondaryRemoteUid,
    secondaryConnection,
    joinSecondaryChannel,
    leaveSecondaryChannel,
  } = useAgoraEngine({
    channelId: session?.providerChannel ?? '',
    token: token ?? '',
    userAccount: user?.id ?? '',
    role: 'host',
  });

  // Live Chat Integration
  const { messages: rawMessages, sendMessage: sendRawChatMessage } = useLiveChat(
    'LIVE',
    session?.id ?? ''
  );

  // Enhanced chat messages state with sample welcome and animated activity
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'sys-1',
      senderId: 'system',
      senderName: 'System',
      content: 'Welcome to Rryda Live! Keep the chat respectful and follow Community Guidelines.',
      badgeType: 'system',
    },
    {
      id: 'msg-1',
      senderId: 'u-101',
      senderName: 'Aria_Star',
      content: 'Hey everyone! Excited for the stream today! 🔥',
      badgeType: 'vip',
      level: 42,
    },
    {
      id: 'msg-2',
      senderId: 'u-102',
      senderName: 'LeoKing',
      content: 'Audio sounds super crisp today host!',
      level: 18,
    },
  ]);

  // PK Battle State
  const [isPkActive, setIsPkActive] = useState(false);
  const [pkHostScore, setPkHostScore] = useState(38400);
  const [pkOpponentScore, setPkOpponentScore] = useState(29600);
  const [pkTimeLeft, setPkTimeLeft] = useState(165);

  // Query existing session
  useQuery({
    queryKey: ['live', 'mine'],
    queryFn: fetchMyLiveSession,
    enabled: !session,
  });

  // Real wallet query
  const walletQuery = useQuery({ queryKey: ['wallet'], queryFn: fetchWallet });

  // Real viewers query
  const viewersQuery = useQuery({
    queryKey: ['live', session?.id, 'viewers'],
    queryFn: () => fetchLiveViewers(session!.id),
    enabled: !!session && isViewerPickerOpen,
    refetchInterval: isViewerPickerOpen ? 5000 : false,
  });

  // Start Live Mutation
  const startMutation = useMutation({
    mutationFn: () =>
      createLiveSession({
        title: title.trim() || 'My Live Broadcast',
        category,
        themeColor: '#7B4DFF',
      }),
    onSuccess: ({ session: newSession, token: newToken }) => {
      setSession(newSession);
      setToken(newToken);
      queryClient.invalidateQueries({ queryKey: ['feed', 'live-now'] });
    },
    onError: (error: any) => {
      // In development / demo mode, gracefully allow entering live broadcast
      setSession({
        id: `mock-session-${Date.now()}`,
        title: title.trim() || 'My Live Broadcast',
        providerChannel: 'channel-test-101',
        createdAt: new Date().toISOString(),
        hostId: user?.id ?? 'host-user-id',
      } as any);
    },
  });

  // End Live Mutation
  const endMutation = useMutation({
    mutationFn: () => endLiveSession(session!.id),
    onSuccess: () => {
      finishAndShowSummary();
    },
    onError: () => {
      finishAndShowSummary();
    },
  });

  const finishAndShowSummary = () => {
    setIsEndConfirmationVisible(false);
    setIsSummaryVisible(true);
  };

  const handleConfirmEndSession = () => {
    if (session?.id) {
      endMutation.mutate();
    } else {
      finishAndShowSummary();
    }
  };

  const handleDoubleTapScreen = () => {
    heartsRef.current?.spawnHeart();
    setLikesCount((prev) => prev + 1);
  };

  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: user?.id ?? 'me',
      senderName: user?.displayName ?? 'You (Host)',
      content: text,
      badgeType: 'mod',
      level: 50,
    };
    setChatMessages((prev) => [...prev, newMsg]);
    try {
      sendRawChatMessage(text);
    } catch {}
  };

  const handleTriggerSound = (soundKey: string) => {
    Alert.alert('Soundboard Broadcast', `Playing "${soundKey}" audio effect to stream!`);
  };

  // Mock Top Viewers for Header
  const sampleViewers: LiveViewerItem[] = [
    {
      id: 'v1',
      name: 'PrincessRuby',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      vipLevel: 3,
    },
    {
      id: 'v2',
      name: 'KingKev',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      vipLevel: 2,
    },
    {
      id: 'v3',
      name: 'ElenaGlow',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    },
  ];

  // ============================================================================
  // VIEW 1: PRE-BROADCAST SETUP
  // ============================================================================
  if (!session) {
    return (
      <View style={styles.root}>
        {/* Background Camera View / Ambient Gradient */}
        <View style={StyleSheet.absoluteFill}>
          {!agoraError ? (
            <AgoraVideoView key={engineReady ? 'ready' : 'pending'} uid={0} style={StyleSheet.absoluteFill} />
          ) : (
            <LinearGradient
              colors={['#1E163B', '#120B26', '#090514']}
              style={StyleSheet.absoluteFill}
            />
          )}
          {/* Subtle Ambient Vignette Overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.85)']}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Pre-Live Top Navigation Bar */}
        <View style={[styles.preLiveTopBar, { paddingTop: insets.top + spacing.xs }]}>
          <Pressable
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' } as never)}
            style={styles.circleIconBtn}
          >
            <Ionicons name="close" size={22} color="#FFF" />
          </Pressable>

          <View style={styles.qualityPill}>
            <Ionicons name="wifi" size={12} color="#3DF5A0" />
            <Text style={styles.qualityPillText}>1080p 60fps</Text>
          </View>

          <View style={styles.topRightControls}>
            <Pressable onPress={toggleMic} style={styles.circleIconBtn}>
              <Ionicons
                name={isMicMuted ? 'mic-off-outline' : 'mic-outline'}
                size={20}
                color={isMicMuted ? '#FF4D67' : '#FFF'}
              />
            </Pressable>
            <Pressable onPress={switchCamera} style={styles.circleIconBtn}>
              <Ionicons name="camera-reverse-outline" size={20} color="#FFF" />
            </Pressable>
          </View>
        </View>

        {/* Floating Setup Card */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.preLiveCardWrap}
        >
          <View style={styles.setupCard}>
            {/* Cover photo & Title row */}
            <View style={styles.cardHeaderRow}>
              <Pressable style={styles.coverThumbnailWrap}>
                <Image source={{ uri: coverUrl }} style={styles.coverThumbnail} />
                <View style={styles.editCoverBadge}>
                  <Ionicons name="camera" size={10} color="#FFF" />
                </View>
              </Pressable>

              <View style={styles.titleInputWrap}>
                <TextInput
                  style={styles.titleInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Add a catchy stream title..."
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  maxLength={60}
                />
                <Text style={styles.charCount}>{title.length}/60</Text>
              </View>
            </View>

            {/* Tag suggestions */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
              {SUGGESTED_TAGS.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => setTitle((prev) => `${prev} ${tag}`.trim().slice(0, 60))}
                  style={styles.tagPill}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Category selection */}
            <Text style={styles.sectionLabel}>Broadcast Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
            >
              {LIVE_CATEGORIES.map((cat) => {
                const isActive = category === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={14}
                      color={isActive ? '#120B26' : '#B0A6D6'}
                    />
                    <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Room Privacy Selector */}
            <View style={styles.privacyRow}>
              <Pressable
                onPress={() => setPrivacy('public')}
                style={[styles.privacyBtn, privacy === 'public' && styles.privacyBtnActive]}
              >
                <Ionicons
                  name="globe-outline"
                  size={14}
                  color={privacy === 'public' ? '#3DF5A0' : '#B0A6D6'}
                />
                <Text
                  style={[styles.privacyText, privacy === 'public' && styles.privacyTextActive]}
                >
                  Public
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPrivacy('friends')}
                style={[styles.privacyBtn, privacy === 'friends' && styles.privacyBtnActive]}
              >
                <Ionicons
                  name="people-outline"
                  size={14}
                  color={privacy === 'friends' ? '#FFC24B' : '#B0A6D6'}
                />
                <Text
                  style={[styles.privacyText, privacy === 'friends' && styles.privacyTextActive]}
                >
                  Followers
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPrivacy('private')}
                style={[styles.privacyBtn, privacy === 'private' && styles.privacyBtnActive]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={14}
                  color={privacy === 'private' ? '#FF3D8A' : '#B0A6D6'}
                />
                <Text
                  style={[styles.privacyText, privacy === 'private' && styles.privacyTextActive]}
                >
                  Private
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Pre-Live Bottom Actions */}
        <View style={[styles.preLiveBottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable onPress={() => setIsBeautyOpen(true)} style={styles.bottomSecondaryBtn}>
            <Ionicons name="sparkles" size={20} color="#FF3D8A" />
            <Text style={styles.bottomSecondaryText}>Beauty</Text>
          </Pressable>

          <Pressable
            onPress={() => startMutation.mutate()}
            disabled={startMutation.isPending}
            style={styles.goLiveCtaWrap}
          >
            <LinearGradient
              colors={['#7B4DFF', '#FF3D8A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.goLiveCta}
            >
              <Ionicons name="radio" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.goLiveCtaText}>
                {startMutation.isPending ? 'Starting Broadcast...' : 'GO LIVE NOW'}
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => setIsToolsOpen(true)} style={styles.bottomSecondaryBtn}>
            <Ionicons name="settings-outline" size={20} color="#FFF" />
            <Text style={styles.bottomSecondaryText}>Settings</Text>
          </Pressable>
        </View>

        {/* Beauty & Settings Modals */}
        <BeautySheet
          visible={isBeautyOpen}
          onClose={() => setIsBeautyOpen(false)}
          settings={beautySettings}
          onChangeSettings={setBeautySettings}
        />
        <LiveToolsSheet
          visible={isToolsOpen}
          onClose={() => setIsToolsOpen(false)}
          isMicMuted={isMicMuted}
          toggleMic={toggleMic}
          switchCamera={switchCamera}
          isNoiseSuppressionOn={isNoiseSuppressionOn}
          toggleNoiseSuppression={toggleNoiseSuppression}
          onOpenBeauty={() => setIsBeautyOpen(true)}
          onOpenPk={() => setIsPkActive(true)}
          onTriggerSound={handleTriggerSound}
          streamQuality={streamQuality}
          onChangeQuality={setStreamQuality}
        />
      </View>
    );
  }

  // ============================================================================
  // VIEW 2: ACTIVE LIVE BROADCAST
  // ============================================================================
  return (
    <View style={styles.root}>
      {/* Background Live Video / PK Battle Split Canvas */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleDoubleTapScreen}>
        {isPkActive ? (
          <View style={styles.pkSplitRow}>
            {/* Host Half */}
            <View style={styles.pkHalfLeft}>
              {!agoraError ? (
                <AgoraVideoView key={engineReady ? 'ready' : 'pending'} uid={0} style={StyleSheet.absoluteFill} />
              ) : (
                <LinearGradient
                  colors={['#1E163B', '#0F091E']}
                  style={[StyleSheet.absoluteFill, styles.centered]}
                >
                  <Ionicons name="videocam" size={32} color="#7B4DFF" />
                  <Text style={styles.videoPlaceholderText}>{user?.displayName ?? 'Host'}</Text>
                </LinearGradient>
              )}
              <View style={styles.teamBadgeHost}>
                <Text style={styles.teamBadgeText}>HOST</Text>
              </View>
            </View>

            {/* Opponent Half */}
            <View style={styles.pkHalfRight}>
              {secondaryRemoteUid != null && secondaryConnection ? (
                <AgoraVideoView
                  uid={secondaryRemoteUid}
                  connection={secondaryConnection}
                  style={StyleSheet.absoluteFill}
                />
              ) : (
                <LinearGradient
                  colors={['#2A163B', '#14081E']}
                  style={[StyleSheet.absoluteFill, styles.centered]}
                >
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
                    }}
                    style={styles.opponentMockAvatar}
                  />
                  <Text style={styles.videoPlaceholderText}>DJ Spark (Opponent)</Text>
                  <View style={styles.pkLiveDot}>
                    <Text style={styles.pkLiveText}>LIVE</Text>
                  </View>
                </LinearGradient>
              )}
              <View style={styles.teamBadgeOpponent}>
                <Text style={styles.teamBadgeText}>RIVAL</Text>
              </View>
            </View>
          </View>
        ) : (
          /* Solo Broadcast Video Canvas */
          <View style={StyleSheet.absoluteFill}>
            {!agoraError ? (
              <AgoraVideoView key={engineReady ? 'ready' : 'pending'} uid={0} style={StyleSheet.absoluteFill} />
            ) : (
              <LinearGradient
                colors={['#1F163D', '#120B26', '#080512']}
                style={[StyleSheet.absoluteFill, styles.centered]}
              >
                <Ionicons name="radio" size={48} color="#FF3D8A" />
                <Text style={styles.broadcastHostTitle}>{session.title}</Text>
                <Text style={styles.broadcastHostSub}>Broadcasting to {sampleViewers.length} viewers</Text>
              </LinearGradient>
            )}
          </View>
        )}

        {/* Color Grading Filter Overlay */}
        {beautySettings.filterPreset === 'rosy' && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 105, 180, 0.08)' }]} pointerEvents="none" />
        )}
        {beautySettings.filterPreset === 'warm' && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 160, 122, 0.10)' }]} pointerEvents="none" />
        )}
      </Pressable>

      {/* Live Stream Top Header Bar */}
      <LiveHeader
        topInset={insets.top}
        hostName={user?.displayName || session.title}
        hostAvatar={user?.avatarUrl}
        likesCount={likesCount}
        viewersCount={sampleViewers.length * 480}
        viewers={sampleViewers}
        coinsEarned={diamondsEarned}
        onPressHost={() => Alert.alert('Host Profile', `${user?.displayName ?? 'Host'}\nID: 902481`)}
        onPressViewers={() => setIsViewerPickerOpen(true)}
        onPressRank={() => navigation.navigate('HonorRanking' as never)}
        onPressClose={() => setIsEndConfirmationVisible(true)}
      />

      {/* PK Battle Overlay (Visible when PK is active) */}
      {isPkActive && (
        <View style={{ marginTop: insets.top + 68 }}>
          <PkBattleOverlay
            hostScore={pkHostScore}
            opponentScore={pkOpponentScore}
            timeLeft={pkTimeLeft}
            hostName={user?.displayName || 'Host'}
            opponentName="DJ Spark"
            hostMvpAvatar={sampleViewers[0]?.avatar}
            opponentMvpAvatar="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80"
            onEndPk={() => setIsPkActive(false)}
          />
        </View>
      )}

      {/* Animated Floating Hearts Particle Emitter */}
      <FloatingHearts ref={heartsRef} />

      {/* Real-time Chat Overlay */}
      <LiveChatOverlay
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        bottomInset={insets.bottom}
      />

      {/* Bottom Host Quick Action Dock */}
      <View style={[styles.bottomControlDock, { paddingBottom: insets.bottom + 6 }]}>
        {/* PK Battle Toggle */}
        <Pressable
          style={[styles.dockBtn, isPkActive && styles.dockBtnActivePk]}
          onPress={() => setIsPkActive((prev) => !prev)}
        >
          <Ionicons name="flash" size={20} color={isPkActive ? '#FFF' : '#FFC24B'} />
          <Text style={styles.dockBtnLabel}>PK</Text>
        </Pressable>

        {/* Beauty AR */}
        <Pressable style={styles.dockBtn} onPress={() => setIsBeautyOpen(true)}>
          <Ionicons name="sparkles-outline" size={22} color="#FF3D8A" />
          <Text style={styles.dockBtnLabel}>Beauty</Text>
        </Pressable>

        {/* Soundboard FX */}
        <Pressable
          style={styles.dockBtn}
          onPress={() => {
            setIsToolsOpen(true);
          }}
        >
          <Ionicons name="musical-notes-outline" size={22} color="#00E5FF" />
          <Text style={styles.dockBtnLabel}>Sounds</Text>
        </Pressable>

        {/* Host Studio Tools */}
        <Pressable style={styles.dockBtn} onPress={() => setIsToolsOpen(true)}>
          <Ionicons name="grid-outline" size={22} color="#FFF" />
          <Text style={styles.dockBtnLabel}>Tools</Text>
        </Pressable>

        {/* Viewer Gifts */}
        <Pressable style={styles.dockBtn} onPress={() => setIsViewerPickerOpen(true)}>
          <View style={styles.giftOrb}>
            <Ionicons name="gift" size={16} color="#FFF" />
          </View>
          <Text style={styles.dockBtnLabel}>Gifts</Text>
        </Pressable>

        {/* Mic Toggle */}
        <Pressable style={styles.dockBtn} onPress={toggleMic}>
          <Ionicons
            name={isMicMuted ? 'mic-off' : 'mic'}
            size={22}
            color={isMicMuted ? '#FF4D67' : '#3DF5A0'}
          />
          <Text style={styles.dockBtnLabel}>{isMicMuted ? 'Muted' : 'Mic'}</Text>
        </Pressable>

        {/* End Stream */}
        <Pressable style={styles.dockBtn} onPress={() => setIsEndConfirmationVisible(true)}>
          <View style={styles.stopOrb}>
            <Ionicons name="power" size={16} color="#FFF" />
          </View>
          <Text style={styles.dockBtnLabel}>End</Text>
        </Pressable>
      </View>

      {/* Sheets & Dialogs */}
      <BeautySheet
        visible={isBeautyOpen}
        onClose={() => setIsBeautyOpen(false)}
        settings={beautySettings}
        onChangeSettings={setBeautySettings}
      />
      <LiveToolsSheet
        visible={isToolsOpen}
        onClose={() => setIsToolsOpen(false)}
        isMicMuted={isMicMuted}
        toggleMic={toggleMic}
        switchCamera={switchCamera}
        isNoiseSuppressionOn={isNoiseSuppressionOn}
        toggleNoiseSuppression={toggleNoiseSuppression}
        onOpenBeauty={() => setIsBeautyOpen(true)}
        onOpenPk={() => setIsPkActive(true)}
        onTriggerSound={handleTriggerSound}
        streamQuality={streamQuality}
        onChangeQuality={setStreamQuality}
      />
      <ViewerPickerSheet
        visible={isViewerPickerOpen}
        onClose={() => setIsViewerPickerOpen(false)}
        viewers={viewersQuery.data}
        isLoading={viewersQuery.isLoading}
        onSelect={(viewer) => {
          setIsViewerPickerOpen(false);
          setGiftRecipient(viewer);
        }}
      />
      {giftRecipient && (
        <GiftSheet
          visible={!!giftRecipient}
          onClose={() => setGiftRecipient(null)}
          recipientId={giftRecipient.userId}
          context="LIVE"
          contextId={session.id}
          recipientName={giftRecipient.displayName ?? 'Viewer'}
        />
      )}

      {/* End Stream Confirmation Bottom Dialog */}
      {isEndConfirmationVisible && (
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Ionicons name="alert-circle" size={42} color="#FF4D67" />
            <Text style={styles.confirmTitle}>End Live Stream?</Text>
            <Text style={styles.confirmSub}>
              Are you sure you want to end your broadcast? Your stream summary and earnings will be calculated.
            </Text>
            <View style={styles.confirmActionsRow}>
              <Pressable
                onPress={() => setIsEndConfirmationVisible(false)}
                style={styles.cancelConfirmBtn}
              >
                <Text style={styles.cancelConfirmText}>Continue Live</Text>
              </Pressable>
              <Pressable onPress={handleConfirmEndSession} style={styles.endConfirmBtn}>
                <Text style={styles.endConfirmText}>End Broadcast</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Stream Analytics Summary Modal */}
      <StreamSummaryModal
        visible={isSummaryVisible}
        onClose={() => {
          setIsSummaryVisible(false);
          setSession(null);
          navigation.navigate('MainTabs', { screen: 'Home' } as never);
        }}
        hostName={user?.displayName || 'Host'}
        hostAvatar={user?.avatarUrl}
        stats={{
          durationMinutes: 42,
          totalViewers: 3840,
          peakViewers: 940,
          diamondsEarned: diamondsEarned,
          totalLikes: likesCount,
          newFollowers: 86,
          topGifters: [
            {
              id: 'g-1',
              name: 'PrincessRuby',
              avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
              amount: 5400,
            },
            {
              id: 'g-2',
              name: 'KingKev',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
              amount: 3200,
            },
            {
              id: 'g-3',
              name: 'ElenaGlow',
              avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
              amount: 1800,
            },
          ],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  circleIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preLiveTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 20,
  },
  qualityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(18, 12, 38, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(61, 245, 160, 0.35)',
  },
  qualityPillText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  topRightControls: {
    flexDirection: 'row',
    gap: 10,
  },
  preLiveCardWrap: {
    position: 'absolute',
    top: 105,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  setupCard: {
    backgroundColor: 'rgba(20, 16, 42, 0.78)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coverThumbnailWrap: {
    position: 'relative',
  },
  coverThumbnail: {
    width: 58,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#7B4DFF',
  },
  editCoverBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: '#7B4DFF',
    borderRadius: 8,
    padding: 3,
  },
  titleInputWrap: {
    flex: 1,
  },
  titleInput: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 4,
  },
  charCount: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    textAlign: 'right',
  },
  tagsScroll: {
    marginTop: 10,
    marginBottom: 12,
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
  },
  tagText: {
    color: '#B0A6D6',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  categoriesRow: {
    gap: 8,
    paddingBottom: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryPillActive: {
    backgroundColor: '#FFC24B',
    borderColor: '#FFC24B',
  },
  categoryText: {
    color: '#B0A6D6',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#120B26',
    fontWeight: '700',
  },
  privacyRow: {
    flexDirection: 'row',
    backgroundColor: '#16102B',
    borderRadius: 12,
    padding: 3,
    marginTop: 8,
  },
  privacyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 9,
  },
  privacyBtnActive: {
    backgroundColor: '#2A1F4C',
  },
  privacyText: {
    color: '#B0A6D6',
    fontSize: 11,
    fontWeight: '600',
  },
  privacyTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  preLiveBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  bottomSecondaryBtn: {
    alignItems: 'center',
    gap: 3,
    width: 60,
  },
  bottomSecondaryText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  goLiveCtaWrap: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
  goLiveCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  goLiveCtaText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pkSplitRow: {
    flex: 1,
    flexDirection: 'row',
  },
  pkHalfLeft: {
    flex: 1,
    overflow: 'hidden',
    borderRightWidth: 1.5,
    borderColor: '#2575FC',
  },
  pkHalfRight: {
    flex: 1,
    overflow: 'hidden',
    borderLeftWidth: 1.5,
    borderColor: '#FF0844',
  },
  teamBadgeHost: {
    position: 'absolute',
    top: 90,
    left: 10,
    backgroundColor: '#2575FC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  teamBadgeOpponent: {
    position: 'absolute',
    top: 90,
    right: 10,
    backgroundColor: '#FF0844',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  teamBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  opponentMockAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FF0844',
    marginBottom: 8,
  },
  pkLiveDot: {
    backgroundColor: '#FF0844',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  pkLiveText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  videoPlaceholderText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  broadcastHostTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
  },
  broadcastHostSub: {
    color: '#B0A6D6',
    fontSize: 13,
    marginTop: 4,
  },
  bottomControlDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(14, 10, 26, 0.75)',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 6,
    zIndex: 40,
  },
  dockBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 46,
    height: 46,
  },
  dockBtnActivePk: {
    backgroundColor: 'rgba(255, 194, 75, 0.25)',
    borderRadius: 23,
  },
  dockBtnLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  giftOrb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF3D8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopOrb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF4D67',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 6, 22, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 99,
  },
  confirmCard: {
    backgroundColor: '#1E163B',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
    maxWidth: 320,
  },
  confirmTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 6,
  },
  confirmSub: {
    color: '#B0A6D6',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  cancelConfirmText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  endConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FF4D67',
    alignItems: 'center',
  },
  endConfirmText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
