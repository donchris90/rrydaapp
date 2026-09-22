import { LiveMediaBox } from '../../components/live/LiveMediaBox';
import { fetchLiveMedia, type LiveMediaMessage, type LiveMediaState } from '../../api/liveMedia';
import { GiftFlyOverlay } from '../../components/GiftFlyOverlay';
import { fetchProfile } from '../../api/profiles';
import { PkBox } from '../../components/live/PkBox';
import { LiveBottomBar } from '../../components/LiveBottomBar';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { joinLiveSession } from '../../api/live';
import { fetchActivePkForHost } from '../../api/pk';
import { GradientBackground } from '../../components/GradientBackground';
import { AgoraVideoView } from '../../components/AgoraVideoView';
import { LiveChatFeed } from '../../components/LiveChatFeed';
import { LiveHeaderBar } from '../../components/LiveHeaderBar';
import { GiftTicker } from '../../components/GiftTicker';
import { FloatingHeartsOverlay } from '../../components/FloatingHeartsOverlay';
import { PkBattleOverlay } from '../../components/PkBattleOverlay';
import { LiveToolsSheet } from '../../components/LiveToolsSheet';
import { GiftSheet } from '../../components/GiftSheet';
import { useAgoraEngine } from '../../live/useAgoraEngine';
import { useLiveChat } from '../../live/useLiveChat';
import { useAuth } from '../../auth/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { colors, spacing, radii, type, glow, gradients } from '../../theme';

type LiveViewerNav = CompositeNavigationProp<
  NativeStackNavigationProp<AppStackParamList, 'LiveViewer'>,
  NativeStackNavigationProp<AppStackParamList>
>;

export function LiveViewerScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<LiveViewerNav>();
  const { params } = useRoute<RouteProp<AppStackParamList, 'LiveViewer'>>();
  const insets = useSafeAreaInsets();
  const [isGiftSheetOpen, setIsGiftSheetOpen] = useState(false);
  const [hostAvatarPos, setHostAvatarPos] = useState<{ x: number; y: number } | null>(null);
  const [isToolsSheetOpen, setIsToolsSheetOpen] = useState(false);

  const joinQuery = useQuery({
    queryKey: ['live', 'join', params.sessionId],
    queryFn: () => joinLiveSession(params.sessionId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const {
    remoteUid,
    error: agoraError,
    secondaryRemoteUid,
    secondaryConnection,
    joinSecondaryChannel,
    leaveSecondaryChannel,
  } = useAgoraEngine({
    channelId: joinQuery.data?.session.providerChannel ?? '',
    token: joinQuery.data?.token ?? '',
    userAccount: user?.id ?? '',
    role: 'audience',
  });

  // The video the host is sharing (if any): pushed live, and fetched once on joining so
  // someone who arrives late catches up.
  const [media, setMedia] = useState<LiveMediaState | null>(null);
  const [mediaAt, setMediaAt] = useState(0);
  const applyMedia = (m: LiveMediaMessage) => {
    if (m.active) {
      setMedia(m);
      setMediaAt(Date.now());
    } else setMedia(null);
  };
  const { messages, giftEvents, sendMessage } = useLiveChat('LIVE', params.sessionId, { onMedia: applyMedia });
  useEffect(() => {
    fetchLiveMedia(params.sessionId).then(applyMedia).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.sessionId]);

  // Real PK battle detection — polls the actual missing-link endpoint
  // (pk.service.ts's findActiveForHost) rather than assuming a battle is
  // happening. hostId comes from the join response, so this only starts
  // once that's loaded.
  const hostId = joinQuery.data?.session.hostId;
  const pkQuery = useQuery({
    queryKey: ['pk', 'active-for-host', hostId],
    queryFn: () => fetchActivePkForHost(hostId!),
    enabled: !!hostId,
    refetchInterval: 3000,
  });
  const activePk = pkQuery.data;

  // Names and the battle clock for the PK box.
  const hostProfile = useQuery({ queryKey: ['profile', hostId], queryFn: () => fetchProfile(hostId!), enabled: !!hostId, retry: false });
  const [clockNow, setClockNow] = useState(Date.now());
  useEffect(() => {
    if (!activePk) return;
    const t = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [!!activePk]);
  const pkTimeLeft = activePk?.battle.endsAt ? Math.max(0, Math.ceil((new Date(activePk.battle.endsAt).getTime() - clockNow) / 1000)) : 0;
  // The host you are watching may be either side of the battle.
  const hostIsChallenger = activePk?.battle.challengerId === hostId;
  const hostPkScore = activePk ? Number(hostIsChallenger ? activePk.battle.scoreChallenger : activePk.battle.scoreOpponent) : 0;
  const opponentPkScore = activePk ? Number(hostIsChallenger ? activePk.battle.scoreOpponent : activePk.battle.scoreChallenger) : 0;

  // Joins the opponent's channel the moment their session becomes known,
  // leaves it the moment it isn't (battle ended, or the opponent isn't
  // live). A real token, fetched from the same joinLiveSession() every
  // other viewer join already uses — not a second, separate
  // token-issuing path built just for PK.
  const opponentSessionId = activePk?.opponentSession?.id;
  useEffect(() => {
    if (!opponentSessionId) {
      leaveSecondaryChannel();
      return;
    }
    let cancelled = false;
    joinLiveSession(opponentSessionId).then((result) => {
      if (!cancelled) joinSecondaryChannel(result.session.providerChannel, result.token);
    });
    return () => {
      cancelled = true;
      leaveSecondaryChannel();
    };
  }, [opponentSessionId]);

  if (joinQuery.isLoading) {
    return (
      <GradientBackground style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </GradientBackground>
    );
  }

  if (joinQuery.isError || !joinQuery.data) {
    return (
      <GradientBackground style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.textSecondary} />
        <Text style={styles.errorText}>This session has ended or is no longer available.</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go back</Text>
        </Pressable>
      </GradientBackground>
    );
  }

  const { session } = joinQuery.data;

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <FloatingHeartsOverlay>
        {activePk ? (
          <LinearGradient colors={['#1A1030', '#0B0716']} style={StyleSheet.absoluteFill} />
        ) : remoteUid != null ? (
          <AgoraVideoView uid={remoteUid} style={StyleSheet.absoluteFill} />
        ) : (
          <GradientBackground style={StyleSheet.absoluteFill}>
            <View style={styles.videoArea}>
              <Ionicons
                name={agoraError ? 'videocam-off-outline' : 'hourglass-outline'}
                size={40}
                color={colors.textMuted}
              />
              <Text style={styles.videoPlaceholderText}>
                {agoraError ? 'Video unavailable in this build' : 'Waiting for host video...'}
              </Text>
              {agoraError && <Text style={styles.videoPlaceholderSubtext}>{agoraError}</Text>}
            </View>
          </GradientBackground>
        )}
      </FloatingHeartsOverlay>

      <View style={styles.header}>
        <LiveHeaderBar
          hostId={session.hostId}
          hostName={session.title}
          startedAt={session.startedAt}
          isOwnSession={session.hostId === user?.id}
          onClose={() => navigation.goBack()}
          onAvatarPosition={setHostAvatarPos}
        />
        <GiftTicker events={giftEvents} />
      </View>

      {/* Gifts fly to the host's head */}
      <GiftFlyOverlay events={giftEvents} meId={user?.id} bottomInset={insets.bottom} resolveTarget={() => hostAvatarPos} />

      {/* The host's shared video, under the header (the PK box takes this spot while a PK is on) */}
      {media && !activePk && <LiveMediaBox key={media.videoId} state={media} receivedAt={mediaAt} isHost={false} top={insets.top + 64} />}

      {/* PK Battle: a box under the header — the host on the left, the opponent on the right */}
      {activePk && (
        <PkBox
          top={insets.top + 64}
          hostName={hostProfile.data?.displayName ?? session.title}
          opponentName={activePk.opponentDisplayName ?? 'Opponent'}
          hostScore={hostPkScore}
          opponentScore={opponentPkScore}
          timeLeft={pkTimeLeft}
          left={
            remoteUid != null ? (
              <AgoraVideoView uid={remoteUid} style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.splitPlaceholder]} />
            )
          }
          right={
            secondaryRemoteUid != null && secondaryConnection ? (
              <AgoraVideoView uid={secondaryRemoteUid} connection={secondaryConnection} style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.splitPlaceholder]}>
                <Ionicons name="hourglass-outline" size={24} color={colors.textMuted} />
              </View>
            )
          }
        />
      )}

      {/* Bottom: the comments, then ONE bar — comment box, emoji, menu, gift. (It used
          to be a comment box with a second row of loose buttons stacked under it.) */}
      <View style={styles.actionBar}>
        <LiveChatFeed messages={messages} sendMessage={sendMessage} hideInput />
        <LiveBottomBar
          onSend={sendMessage}
          onGift={() => setIsGiftSheetOpen(true)}
          bottomInset={insets.bottom}
          menuItems={[
            { key: 'pk', label: 'PK', icon: 'flash', onPress: () => navigation.navigate('PkScreen') },
            { key: 'games', label: 'Games', icon: 'game-controller', onPress: () => navigation.navigate('GameCenter') },
            { key: 'settings', label: 'Settings', icon: 'settings-outline', onPress: () => setIsToolsSheetOpen(true) },
          ]}
        />
      </View>

      <LiveToolsSheet
        visible={isToolsSheetOpen}
        onClose={() => setIsToolsSheetOpen(false)}
        isHost={false}
        sessionTitle={session.title}
      />

      {/* ── GIFT SHEET (new) ─────────────────────────── */}
      <GiftSheet
        visible={isGiftSheetOpen}
        onClose={() => setIsGiftSheetOpen(false)}
        recipientId={session.hostId}
        context="LIVE"
        contextId={params.sessionId}
        recipientName={session.title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: { ...type.body, color: colors.textSecondary, textAlign: 'center' },
  backButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
  },
  backButtonText: { color: colors.textPrimary, fontWeight: '700' },
  videoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  videoPlaceholderText: { ...type.bodyStrong, color: colors.textSecondary },
  videoPlaceholderSubtext: { ...type.caption, color: colors.textMuted },
  splitVideoRow: { flex: 1, flexDirection: 'row' },
  splitVideoHalf: { flex: 1, overflow: 'hidden' },
  splitPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgDeepest },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: 'rgba(8,4,20,0.35)',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.sm,
  },
  actionButton: { alignItems: 'center' },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pkLabel: {
    color: '#FFD700',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 0.5,
    paddingVertical: 9,
  },
  actionLabel: { ...type.caption, color: colors.textSecondary, marginTop: spacing.xs },
});