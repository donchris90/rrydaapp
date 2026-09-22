import { LiveMediaBox } from '../../components/live/LiveMediaBox';
import { LiveMediaSheet } from '../../components/live/LiveMediaSheet';
import { sendLiveMedia, type LiveMediaAction, type LiveMediaMessage, type LiveMediaState } from '../../api/liveMedia';
import { GiftFlyOverlay } from '../../components/GiftFlyOverlay';
import { LiveBottomBar } from '../../components/LiveBottomBar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../api/uploads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// API and contextual hooks from rrydaapp
import {
  createLiveSession,
  endLiveSession,
  fetchMyLiveSession,
  fetchLiveViewers,
  fetchLiveSummary,
  joinLiveSession,
  leaveLiveSession,
  type LiveSessionRaw,
  type LiveSummary,
  type LiveViewer,
} from '../../api/live';
import { fetchActivePkForHost, type ActivePkForHost } from '../../api/pk';
import { fetchWallet } from '../../api/feed';
import { fetchHonorRanking } from '../../api/ranking';
import { useAgoraEngine } from '../../live/useAgoraEngine';
import { useLiveChat } from '../../live/useLiveChat';
import { usePkScoreSocket } from '../../live/usePkScoreSocket';
import { useAuth } from '../../auth/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { colors, gradients, radii, spacing, type } from '../../theme';

// Redesigned Expo Live Stream Subcomponents
import { LiveHeader } from '../../components/live/LiveHeader';
import { PkBox } from '../../components/live/PkBox';
import { LiveChatOverlay, type ChatMessage } from '../../components/live/LiveChatOverlay';
import { LiveToolsSheet } from '../../components/LiveToolsSheet';
import { FloatingHearts, type FloatingHeartsHandle } from '../../components/live/FloatingHearts';
import { StreamSummaryModal, type StreamStats } from '../../components/live/StreamSummaryModal';
import { AgoraVideoView } from '../../components/AgoraVideoView';
import { ViewerPickerSheet } from '../../components/ViewerPickerSheet';
import { GiftSheet } from '../../components/GiftSheet';
import { PkChallengeSheet } from '../../components/PkChallengeSheet';

const LIVE_CATEGORIES = [
  { id: 'Chatting', label: 'Chatting', icon: 'chatbubbles' },
  { id: 'Singing', label: 'Singing', icon: 'mic' },
  { id: 'Dancing', label: 'Dancing', icon: 'body' },
  { id: 'Gaming', label: 'Gaming', icon: 'game-controller' },
  { id: 'Just Chill', label: 'Just Chill', icon: 'cafe' },
  { id: 'Storytime', label: 'Storytime', icon: 'book' },
];

const SUGGESTED_TAGS = ['#ChillVibes', '#LiveMusic', '#AskMeAnything', '#RankRush', '#GoodVibes'];

type GoLiveNav = NativeStackNavigationProp<AppStackParamList>;

export function GoLiveScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<GoLiveNav>();
  const route = useRoute<RouteProp<AppStackParamList, 'GoLive'>>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Pre-live broadcast configuration
  const [title, setTitle] = useState(route.params?.initialTitle ?? '');
  const [category, setCategory] = useState('Chatting');
  // Optional cover image shown on the Live feed card (falls back to your profile photo).
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);

  // Broadcast state
  const [session, setSession] = useState<LiveSessionRaw | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // Real end-of-stream numbers (duration / peak / totals) from GET /live/:id/summary.
  const [endSummary, setEndSummary] = useState<LiveSummary | null>(null);

  // Sheets & modals
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  // The video being shared in this live, and the panel for choosing video and music.
  const [media, setMedia] = useState<LiveMediaState | null>(null);
  const [mediaAt, setMediaAt] = useState(0);
  const [isMediaSheetOpen, setIsMediaSheetOpen] = useState(false);
  const applyMedia = (m: LiveMediaMessage) => {
    if (m.active) {
      setMedia(m);
      setMediaAt(Date.now());
    } else setMedia(null);
  };
  const controlMedia = async (action: LiveMediaAction, positionMs?: number) => {
    if (!session?.id) return;
    try {
      applyMedia(await sendLiveMedia(session.id, { action, positionMs }));
    } catch (e: any) {
      if (action !== 'sync') Alert.alert("Couldn't update the video", e?.response?.data?.message ?? 'Please try again.');
    }
  };
  const loadMedia = async (videoId: string) => {
    if (!session?.id) return;
    applyMedia(await sendLiveMedia(session.id, { action: 'load', videoId }));
  };
  const [isBeautyOpen, setIsBeautyOpen] = useState(false);
  const [isViewerPickerOpen, setIsViewerPickerOpen] = useState(false);
  const [giftRecipient, setGiftRecipient] = useState<LiveViewer | null>(null);
  const [isEndConfirmationVisible, setIsEndConfirmationVisible] = useState(false);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);

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
    beauty,
    setBeauty,
    background,
    setBackground,
    faceShape,
    setFaceShape,
    secondaryRemoteUid,
    secondaryConnection,
    joinSecondaryChannel,
    leaveSecondaryChannel,
    music,
    musicError,
    startMusic,
    pauseMusic,
    resumeMusic,
    stopMusic,
    setMusicVolume,
  } = useAgoraEngine({
    channelId: session?.providerChannel ?? '',
    token: token ?? '',
    userAccount: user?.id ?? '',
    role: 'host',
  });

  // Live Chat Integration
  // Real chat (backlog + live), real like counter, real public viewer count.
  const {
    messages: rawMessages,
    sendMessage: sendRawChatMessage,
    giftEvents,
    likeCount,
    viewerCount,
    sendLike,
  } = useLiveChat('LIVE', session?.id ?? '', { onMedia: (m) => applyMedia(m) });

  // What this broadcast has actually earned so far, from the same summary
  // endpoint the end-of-stream screen uses. Refreshed on a slow poll and
  // whenever a gift lands in the room.
  const liveSummary = useQuery({
    queryKey: ['live', 'summary', session?.id],
    queryFn: () => fetchLiveSummary(session!.id),
    enabled: !!session,
    refetchInterval: 15000,
  });
  const giftEventCount = giftEvents.length;
  useEffect(() => {
    if (session && giftEventCount > 0) queryClient.invalidateQueries({ queryKey: ['live', 'summary', session.id] });
  }, [giftEventCount, session, queryClient]);
  const coinsEarned = liveSummary.data?.giftCoins ?? 0;

  // The system notice is a genuine (static) welcome line; everything after
  // it is real chat. The host's own messages arrive back over the socket
  // like everyone else's, so nothing is appended locally.
  const chatMessages = useMemo<ChatMessage[]>(
    () => [
      {
        id: 'sys-1',
        senderId: 'system',
        senderName: 'System',
        content: 'Welcome to Rryda Live! Keep the chat respectful and follow Community Guidelines.',
        badgeType: 'system',
      },
      // "Ada joined" arrival notices come from the server as system lines: show them
      // as such in the host's comment section, not as a comment from a "Viewer".
      ...rawMessages.map((m) =>
        m.system
          ? { id: m.id, senderId: 'system', senderName: 'System', content: m.content, badgeType: 'system' as const }
          : {
              id: m.id,
              senderId: m.senderId,
              senderName: m.senderId === user?.id ? (user?.displayName ?? 'You') : (m.senderName ?? 'Viewer'),
              content: m.content,
              badgeType: m.senderId === session?.hostId ? ('mod' as const) : undefined,
            },
      ),
    ],
    [rawMessages, user?.id, user?.displayName, session?.hostId],
  );

  // ── PK battle: all real ──────────────────────────────────────────
  // The same active-battle endpoint viewers use. Status changes and score
  // arrive as socket pushes (usePkScoreSocket); the slow poll is only a
  // fallback for a dropped socket.
  const [isPkSheetOpen, setIsPkSheetOpen] = useState(false);
  const [pkStartsAt, setPkStartsAt] = useState<string | null>(null); // countdown target, set by pk:countdown_start
  const [nowMs, setNowMs] = useState(() => Date.now());
  const skewRef = useRef(0); // server clock minus device clock, from the last push
  const pkKey = ['pk', 'active-for-host', user?.id];

  const pkQuery = useQuery({
    queryKey: pkKey,
    queryFn: () => fetchActivePkForHost(user!.id),
    enabled: !!session && !!user?.id,
    refetchInterval: 15000,
  });
  const activePk = pkQuery.data ?? null;
  const pkBattle = activePk?.battle ?? null;
  // findActiveForHost only ever returns an ACTIVE battle.
  const isPkActive = !!pkBattle;

  usePkScoreSocket(
    pkBattle?.id ?? null,
    (event) => {
      queryClient.setQueryData<ActivePkForHost | null | undefined>(pkKey, (prev) =>
        prev
          ? {
              ...prev,
              battle: { ...prev.battle, scoreChallenger: event.scoreChallenger, scoreOpponent: event.scoreOpponent },
            }
          : prev,
      );
    },
    {
      onCountdownStart: (e) => {
        skewRef.current = new Date(e.serverTime).getTime() - Date.now();
        setPkStartsAt(e.startedAt);
      },
      onActive: (e) => {
        skewRef.current = new Date(e.serverTime).getTime() - Date.now();
        setPkStartsAt(null);
        queryClient.invalidateQueries({ queryKey: pkKey });
      },
      onSettled: () => {
        setPkStartsAt(null);
        queryClient.invalidateQueries({ queryKey: pkKey });
        queryClient.invalidateQueries({ queryKey: ['pk', 'history'] });
      },
    },
  );

  // Second-by-second clock, only while there is one to show.
  useEffect(() => {
    if (!isPkActive && !pkStartsAt) return;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isPkActive, pkStartsAt]);

  const secondsUntil = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - (nowMs + skewRef.current)) / 1000));
  const pkImChallenger = pkBattle?.challengerId === user?.id;
  const pkHostScore = pkBattle ? Number(pkImChallenger ? pkBattle.scoreChallenger : pkBattle.scoreOpponent) : 0;
  const pkOpponentScore = pkBattle ? Number(pkImChallenger ? pkBattle.scoreOpponent : pkBattle.scoreChallenger) : 0;
  const pkTimeLeft = pkBattle?.endsAt ? secondsUntil(pkBattle.endsAt) : 0;

  // Watch the opponent's stream for as long as the battle is on, using the
  // same join call any viewer uses. (That also registers this host as a
  // viewer of the opponent's session for the battle's duration.)
  const opponentSessionId = activePk?.opponentSession?.id;
  useEffect(() => {
    if (!isPkActive || !opponentSessionId) {
      leaveSecondaryChannel();
      return;
    }
    let cancelled = false;
    let joined = false;
    joinLiveSession(opponentSessionId)
      .then((result) => {
        if (cancelled) return;
        joined = true;
        joinSecondaryChannel(result.session.providerChannel, result.token);
      })
      .catch(() => {
        /* the battle still runs; the opponent tile just shows its placeholder */
      });
    return () => {
      cancelled = true;
      leaveSecondaryChannel();
      if (joined) leaveLiveSession(opponentSessionId).catch(() => {});
    };
  }, [isPkActive, opponentSessionId]);

  // A session from an earlier run that never got closed (app killed, phone
  // died). The backend allows one active session per host, so while one is
  // still open you can neither start a new broadcast nor — before this — end
  // the old one from here. It used to be fetched and then ignored.
  const mineQuery = useQuery({
    queryKey: ['live', 'mine'],
    queryFn: fetchMyLiveSession,
    enabled: !session,
  });
  const leftover = !session ? (mineQuery.data ?? null) : null;

  const endLeftoverMutation = useMutation({
    mutationFn: () => endLiveSession(leftover!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'live-now'] });
    },
    onError: (error: any) => {
      Alert.alert("Couldn't end the session", error?.response?.data?.message ?? 'Please try again.');
    },
  });

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.6,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    setCoverUploading(true);
    try {
      setCoverUrl(await uploadImage(result.assets[0].base64));
    } catch (error: any) {
      Alert.alert("Couldn't upload the cover", error?.response?.data?.message ?? error?.message ?? 'Please try again.');
    } finally {
      setCoverUploading(false);
    }
  };

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
        themeColor: route.params?.initialThemeColor ?? undefined,
        coverUrl: coverUrl ?? undefined,
      }),
    onSuccess: ({ session: newSession, token: newToken }) => {
      setSession(newSession);
      setToken(newToken);
      queryClient.invalidateQueries({ queryKey: ['feed', 'live-now'] });
    },
    onError: (error: any) => {
      // Previously fabricated a fake `mock-session-${Date.now()}` here and
      // let the host proceed as if they were really broadcasting — they'd
      // have no real Agora channel and no real backend session, so chat,
      // gifts, and PK would silently fail or error confusingly once
      // attempted. Surfacing the real failure and staying on the setup
      // screen (session stays null, so the pre-broadcast view below
      // remains visible and the button re-enables via isPending) is the
      // honest behavior.
      Alert.alert(
        "Couldn't start broadcast",
        error?.response?.data?.message ?? 'Please check your connection and try again.',
      );
    },
  });

  // End Live Mutation
  const endMutation = useMutation({
    mutationFn: async () => {
      const id = session!.id;
      await endLiveSession(id);
      // Non-fatal: if the summary read fails the modal falls back to the
      // live counters already on screen.
      try {
        return await fetchLiveSummary(id);
      } catch {
        return null;
      }
    },
    onSuccess: (summary) => {
      setEndSummary(summary);
      finishAndShowSummary();
    },
    onError: () => {
      finishAndShowSummary();
    },
  });

  const finishAndShowSummary = () => {
    endedRef.current = true;
    setIsEndConfirmationVisible(false);
    setIsSummaryVisible(true);
  };

  // Leaving this screen any other way (Android back button, swipe-back gesture,
  // the app navigating elsewhere) used to abandon the session on the server —
  // it stayed "live" on everyone's feed with no way to close it. Now: going back
  // while broadcasting asks first, and if the screen is torn down anyway the
  // session is ended on the way out. (If even that can't reach the server, the
  // backend ends the session itself once the host has been gone for ~90s.)
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const endedRef = useRef(false);
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (!sessionRef.current || endedRef.current) return;
      e.preventDefault();
      setIsEndConfirmationVisible(true);
    });
  }, [navigation]);
  useEffect(
    () => () => {
      const live = sessionRef.current;
      if (live && !endedRef.current) endLiveSession(live.id).catch(() => {});
    },
    [],
  );

  const handleConfirmEndSession = () => {
    if (session?.id) {
      endMutation.mutate();
    } else {
      finishAndShowSummary();
    }
  };

  const handleSendMessage = (text: string) => {
    sendRawChatMessage(text);
  };


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
              colors={['#1E163B', '#F6F8FC', '#090514']}
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
            onPress={() => navigation.navigate('MainTabs', { screen: 'Live' })}
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
            {leftover && (
              <View style={styles.leftoverBanner}>
                <Text style={styles.leftoverText}>
                  You still have a live session running{leftover.title ? ` (“${leftover.title}”)` : ''}. End it before you start a new one.
                </Text>
                <Pressable onPress={() => endLeftoverMutation.mutate()} disabled={endLeftoverMutation.isPending} style={styles.leftoverBtn}>
                  <Text style={styles.leftoverBtnText}>{endLeftoverMutation.isPending ? 'Ending…' : 'End it'}</Text>
                </Pressable>
              </View>
            )}

            {/* Cover photo & Title row */}
            <View style={styles.cardHeaderRow}>
              <Pressable onPress={pickCover} disabled={coverUploading} style={styles.coverThumbnailWrap} accessibilityLabel="Choose a cover photo">
                {coverUrl ? (
                  <Image source={{ uri: coverUrl }} style={styles.coverThumbnail} />
                ) : (
                  <View style={[styles.coverThumbnail, styles.coverEmpty]}>
                    <Ionicons name={coverUploading ? 'cloud-upload-outline' : 'image-outline'} size={22} color="#FFF" />
                    <Text style={styles.coverEmptyText}>{coverUploading ? '…' : 'Cover'}</Text>
                  </View>
                )}
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
                      color={isActive ? '#F6F8FC' : '#B0A6D6'}
                    />
                    <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>

        {/* Pre-Live Bottom Actions */}
        <View style={[styles.preLiveBottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable onPress={() => setIsBeautyOpen(true)} style={styles.bottomSecondaryBtn}>
            <Ionicons name="sparkles" size={20} color="#FF2E7E" />
            <Text style={styles.bottomSecondaryText}>Beauty</Text>
          </Pressable>

          <Pressable
            onPress={() => startMutation.mutate()}
            disabled={startMutation.isPending || !!leftover || coverUploading}
            style={[styles.goLiveCtaWrap, (!!leftover || coverUploading) && { opacity: 0.5 }]}
          >
            <LinearGradient
              colors={['#FF2E7E', '#FF2E7E']}
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

        {/* Beauty & tools — the same engine-backed sheet the party room uses, so
            every slider here changes what viewers actually see. */}
        <LiveToolsSheet
          visible={isToolsOpen || isBeautyOpen}
          onClose={() => {
            setIsToolsOpen(false);
            setIsBeautyOpen(false);
          }}
          isHost
          sessionTitle={title || 'Live broadcast'}
          initialPanel={isBeautyOpen ? 'beauty' : 'main'}
          switchCamera={switchCamera}
          isMicMuted={isMicMuted}
          toggleMic={toggleMic}
          isNoiseSuppressionOn={isNoiseSuppressionOn}
          toggleNoiseSuppression={toggleNoiseSuppression}
          beauty={beauty}
          setBeauty={setBeauty}
          background={background}
          setBackground={setBackground}
          faceShape={faceShape}
          setFaceShape={setFaceShape}
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
      {/* (No double-tap likes here: a host can't like their own live.) */}
      <Pressable style={StyleSheet.absoluteFill}>
        {isPkActive ? (
          // During a PK the screen is a dark backdrop; the two videos live in the box below.
          <LinearGradient colors={['#1A1030', '#0B0716']} style={StyleSheet.absoluteFill} />
        ) : (
          /* Solo Broadcast Video Canvas */
          <View style={StyleSheet.absoluteFill}>
            {!agoraError ? (
              <AgoraVideoView key={engineReady ? 'ready' : 'pending'} uid={0} style={StyleSheet.absoluteFill} />
            ) : (
              <LinearGradient
                colors={['#1F163D', '#F6F8FC', '#080512']}
                style={[StyleSheet.absoluteFill, styles.centered]}
              >
                <Ionicons name="radio" size={48} color="#FF2E7E" />
                <Text style={styles.broadcastHostTitle}>{session.title}</Text>
                <Text style={styles.broadcastHostSub}>Broadcasting to {viewerCount ?? 0} viewers</Text>
              </LinearGradient>
            )}
          </View>
        )}
      </Pressable>

      {/* Live Stream Top Header Bar */}
      <LiveHeader
        topInset={insets.top}
        hostName={user?.displayName || session.title}
        hostAvatar={user?.avatarUrl}
        startedAt={session.startedAt}
        likesCount={likeCount ?? 0}
        viewersCount={viewerCount ?? 0}
        coinsEarned={coinsEarned}
        onPressViewers={() => setIsViewerPickerOpen(true)}
        onPressRank={() => navigation.navigate('HonorRanking' as never)}
        onPressClose={() => setIsEndConfirmationVisible(true)}
      />

      {/* Gifts fly to your head (or to the viewer you sent one to) */}
      <GiftFlyOverlay events={giftEvents} meId={user?.id} bottomInset={insets.bottom} resolveTarget={(e) => (e.recipientId === user?.id ? { x: 44, y: insets.top + 44 } : null)} />

      {/* The video you are sharing, under the header (the PK box takes this spot during a PK) */}
      {media && !isPkActive && <LiveMediaBox key={media.videoId} state={media} receivedAt={mediaAt} isHost top={insets.top + 64} onAction={controlMedia} />}

      {/* PK Battle: a box under the header (you on the left, your opponent on the right) */}
      {isPkActive && (
        <PkBox
          top={insets.top + 64}
          hostName={user?.displayName || 'Host'}
          opponentName={activePk?.opponentDisplayName ?? 'Opponent'}
          hostScore={pkHostScore}
          opponentScore={pkOpponentScore}
          timeLeft={pkTimeLeft}
          left={
            !agoraError ? (
              <AgoraVideoView key={engineReady ? 'ready' : 'pending'} uid={0} style={StyleSheet.absoluteFill} />
            ) : (
              <LinearGradient colors={['#1E163B', '#0F091E']} style={[StyleSheet.absoluteFill, styles.centered]}>
                <Ionicons name="videocam" size={32} color="#FF2E7E" />
              </LinearGradient>
            )
          }
          right={
            secondaryRemoteUid != null && secondaryConnection ? (
              <AgoraVideoView uid={secondaryRemoteUid} connection={secondaryConnection} style={StyleSheet.absoluteFill} />
            ) : (
              <LinearGradient colors={['#2A163B', '#14081E']} style={[StyleSheet.absoluteFill, styles.centered]}>
                <Ionicons name="person-circle" size={56} color="#FF0844" />
                <Text style={styles.videoPlaceholderText}>Connecting…</Text>
              </LinearGradient>
            )
          }
        />
      )}

      {/* Accepted, waiting for the countdown to finish */}
      {!isPkActive && pkStartsAt && (
        <View style={[styles.pkCountdownPill, { top: insets.top + 68 }]}>
          <Ionicons name="flash" size={14} color="#FFC24B" />
          <Text style={styles.pkCountdownText}>PK starts in {secondsUntil(pkStartsAt)}s</Text>
        </View>
      )}

      {/* Animated Floating Hearts Particle Emitter */}
      <FloatingHearts ref={heartsRef} />

      {/* Real-time Chat Overlay */}
      <LiveChatOverlay
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        hideInput
        bottomInset={insets.bottom + 8}
      />

      {/* Bottom bar: comment box, emoji, a menu of everything else, and gift.
          (Six loose dock buttons and no way for the host to comment before.) */}
      <View style={styles.bottomBarWrap}>
        <LiveBottomBar
          onSend={handleSendMessage}
          onGift={() => setIsViewerPickerOpen(true)}
          bottomInset={insets.bottom}
          menuItems={[
            { key: 'pk', label: 'PK', icon: 'flash', onPress: () => setIsPkSheetOpen(true), active: isPkActive },
            { key: 'beauty', label: 'Beauty', icon: 'sparkles', onPress: () => setIsBeautyOpen(true) },
            { key: 'tools', label: 'Tools', icon: 'grid', onPress: () => setIsToolsOpen(true) },
            { key: 'media', label: 'Video & music', icon: 'film', onPress: () => setIsMediaSheetOpen(true), active: !!media || !!music },
            { key: 'mic', label: isMicMuted ? 'Unmute' : 'Mute', icon: isMicMuted ? 'mic-off' : 'mic', onPress: toggleMic, active: isMicMuted },
            { key: 'end', label: 'End live', icon: 'power', onPress: () => setIsEndConfirmationVisible(true), danger: true },
          ]}
        />
      </View>

      {/* Sheets & Dialogs */}
      <LiveMediaSheet
        visible={isMediaSheetOpen}
        onClose={() => setIsMediaSheetOpen(false)}
        pkActive={isPkActive}
        activeVideo={media}
        onLoadVideo={loadMedia}
        onStopVideo={() => controlMedia('stop')}
        music={music}
        musicError={musicError}
        onStartMusic={startMusic}
        onPauseMusic={pauseMusic}
        onResumeMusic={resumeMusic}
        onStopMusic={stopMusic}
        onMusicVolume={setMusicVolume}
      />

      <LiveToolsSheet
        visible={isToolsOpen || isBeautyOpen}
        onClose={() => {
          setIsToolsOpen(false);
          setIsBeautyOpen(false);
        }}
        isHost
        sessionTitle={session.title}
        initialPanel={isBeautyOpen ? 'beauty' : 'main'}
        switchCamera={switchCamera}
        isMicMuted={isMicMuted}
        toggleMic={toggleMic}
        isNoiseSuppressionOn={isNoiseSuppressionOn}
        toggleNoiseSuppression={toggleNoiseSuppression}
        beauty={beauty}
        setBeauty={setBeauty}
        background={background}
        setBackground={setBackground}
        faceShape={faceShape}
        setFaceShape={setFaceShape}
        onOpenPk={() => setIsPkSheetOpen(true)}
        shareMessage={`I'm live on Rryda: ${session.title}`}
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
      <PkChallengeSheet visible={isPkSheetOpen} onClose={() => setIsPkSheetOpen(false)} />
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
          setEndSummary(null);
          navigation.navigate('MainTabs', { screen: 'Live' });
        }}
        hostName={user?.displayName || 'Host'}
        hostAvatar={user?.avatarUrl}
        stats={{
          durationMinutes: Math.round((endSummary?.durationSeconds ?? 0) / 60),
          totalViewers: endSummary?.totalViewerCount ?? 0,
          peakViewers: endSummary?.peakViewerCount ?? 0,
          diamondsEarned: endSummary?.giftCoins ?? coinsEarned,
          totalLikes: endSummary?.likeCount ?? likeCount ?? 0,
          newFollowers: endSummary?.newFollowers ?? 0,
          topGifters: (endSummary?.topGifters ?? []).map((g) => ({
            id: g.userId,
            name: g.displayName ?? 'Anonymous',
            avatar: g.avatarUrl,
            amount: g.coins,
          })),
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
  leftoverBanner: {
    backgroundColor: 'rgba(255, 77, 103, 0.18)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  leftoverText: { color: '#FFF', fontSize: 13, lineHeight: 18 },
  leftoverBtn: { alignSelf: 'flex-start', backgroundColor: '#FF4D67', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7 },
  leftoverBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  coverEmpty: { backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', gap: 2 },
  coverEmptyText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
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
    borderColor: '#FF2E7E',
  },
  editCoverBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: '#FF2E7E',
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
    color: '#F6F8FC',
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
  pkCountdownPill: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    zIndex: 30,
  },
  pkCountdownText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
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
  bottomBarWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(14, 10, 26, 0.55)',
    zIndex: 40,
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
    backgroundColor: '#FF2E7E',
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
    ...StyleSheet.absoluteFill,
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
