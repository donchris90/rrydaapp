import React, { useState, useRef, useEffect } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, gradients, radii, spacing, type } from '../theme';
import { AudioSeatGrid, type AudioSeatOccupant } from '../components/AudioSeatGrid';
import { SoundboardModal } from '../components/SoundboardModal';
import { SeatManagementSheet, type PendingSeatRequest } from '../components/SeatManagementSheet';
import { GiftSheet, type GiftItem, PARTY_GIFTS } from '../components/GiftSheet';
import { PartyThemePicker, PARTY_THEMES, type PartyThemeOption } from '../components/PartyThemePicker';
import { AudioBattlePkBar } from '../components/AudioBattlePkBar';
import { BeautyFilterSheet, type BeautyOptions } from '../components/BeautyFilterSheet';

export interface ChatMessage {
  id: string;
  senderName: string;
  text: string;
  isHost?: boolean;
  seatNumber?: number;
  vipLevel?: number;
  isSystemGift?: boolean;
}

export interface PartyAudioLiveScreenProps {
  initialMode?: 'video' | 'voice';
  initialTitle?: string;
  initialSeatCount?: number;
  initialCameraEnabled?: boolean;
  initialBeauty?: BeautyOptions;
  onLeaveRoom?: () => void;
}

export function PartyAudioLiveScreen({
  initialMode = 'video',
  initialTitle = '🎶 Midnight Video & Audio Live',
  initialSeatCount = 8,
  initialCameraEnabled,
  initialBeauty,
  onLeaveRoom,
}: PartyAudioLiveScreenProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // Room State (Supports both Video and Voice party modes)
  const [roomId] = useState('RYDA-88219');
  const [roomTitle, setRoomTitle] = useState(initialTitle);
  const [roomMode, setRoomMode] = useState<'video' | 'voice'>(initialMode);
  const [seatCount, setSeatCount] = useState<number>(initialSeatCount);
  const [currentTheme, setCurrentTheme] = useState<PartyThemeOption>(PARTY_THEMES[0]);
  const [seatLayout, setSeatLayout] = useState<'grid' | 'spotlight' | 'circle'>('grid');
  const [likesCount, setLikesCount] = useState(14820);
  const [topGiftScore, setTopGiftScore] = useState(258400);
  const [coinBalance, setCoinBalance] = useState(18500);

  // Video & Camera States
  const [isCameraOn, setIsCameraOn] = useState(
    initialCameraEnabled ?? initialMode === 'video'
  );
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [isBeautyOpen, setIsBeautyOpen] = useState(false);
  const [beauty, setBeauty] = useState<BeautyOptions>(
    initialBeauty ?? {
      enabled: true,
      smoothnessLevel: 0.5,
      lighteningLevel: 0.25,
      rednessLevel: 0.2,
      chinSlimming: 30,
      eyeEnlarge: 20,
      virtualBackgroundBlur: false,
    }
  );

  // Audio Engine states
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [activeBgm, setActiveBgm] = useState<string | null>('lofi');
  const [activeVoicePreset, setActiveVoicePreset] = useState('studio');

  // PK Battle Mode
  const [autoApprove, setAutoApprove] = useState(false);
  const [isPkActive, setIsPkActive] = useState(true);
  const [redScore, setRedScore] = useState(4820);
  const [blueScore, setBlueScore] = useState(3960);
  const [pkTimeLeft, setPkTimeLeft] = useState(165);

  // Seat occupants (supporting both Video and Audio)
  const currentUserId = 'user-me';
  const [seats, setSeats] = useState<AudioSeatOccupant[]>([
    {
      seatNumber: 0,
      userId: 'user-host',
      displayName: 'DJ Phoenix',
      isHost: true,
      isSpeaking: true,
      isMuted: false,
      isVideoEnabled: true,
      giftScore: 14200,
      level: 18,
    },
    {
      seatNumber: 1,
      userId: currentUserId,
      displayName: 'You (Alex)',
      isHost: false,
      isSpeaking: false,
      isMuted: false,
      isVideoEnabled: initialMode === 'video',
      giftScore: 5800,
      level: 12,
    },
    {
      seatNumber: 2,
      userId: 'user-2',
      displayName: 'Aria',
      isHost: false,
      isSpeaking: true,
      isMuted: false,
      isVideoEnabled: true,
      giftScore: 18900,
      level: 22,
    },
    {
      seatNumber: 3,
      userId: 'user-3',
      displayName: 'Marcus',
      isHost: false,
      isSpeaking: false,
      isMuted: true,
      isVideoEnabled: false,
      giftScore: 3200,
      level: 9,
    },
    {
      seatNumber: 4,
      userId: 'user-4',
      displayName: 'Chloe',
      isHost: false,
      isSpeaking: false,
      isMuted: false,
      isVideoEnabled: true,
      giftScore: 8400,
      level: 15,
    },
  ]);

  const [lockedSeats, setLockedSeats] = useState<Set<number>>(new Set([7]));

  // Every seat that isn't occupied is locked.
  // (Declared after `seats` and `lockedSeats`, which it reads.)
  const allSeatsLocked = Array.from({ length: seatCount }, (_, n) => n).every(
    (n) => seats.some((s) => s.seatNumber === n) || lockedSeats.has(n)
  );

  // Pending Seat Requests
  const [pendingRequests, setPendingRequests] = useState<PendingSeatRequest[]>([
    { id: 'req-1', userId: 'user-req-1', displayName: 'NovaStar', level: 14, requestedAt: '2m ago' },
    { id: 'req-2', userId: 'user-req-2', displayName: 'BeatMaster', level: 8, requestedAt: 'Just now' },
  ]);

  // Chat Feed
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', senderName: 'DJ Phoenix', text: 'Welcome to the party! Turn up the energy! 🎧', isHost: true, seatNumber: 1 },
    { id: '2', senderName: 'Chloe', text: 'Video stream looking crisp! 💜✨', seatNumber: 5 },
    { id: '3', senderName: 'Marcus', text: 'Sent 100x Neon Stars to the host!', isSystemGift: true },
    { id: '4', senderName: 'Aria', text: 'Who wants to start the audio duet?', seatNumber: 3 },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Modals
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [isSeatManageOpen, setIsSeatManageOpen] = useState(false);
  const [isGiftSheetOpen, setIsGiftSheetOpen] = useState(false);
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);

  // Floating Hearts Animation Ref
  const heartAnim = useRef(new Animated.Value(0)).current;

  // PK Timer countdown effect
  useEffect(() => {
    if (!isPkActive) return;
    const timer = setInterval(() => {
      setPkTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPkActive]);

  // Floating Heart Tap
  const handleLikeTap = () => {
    setLikesCount((prev) => prev + 1);
    heartAnim.setValue(0);
    Animated.timing(heartAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  // Toggle Room Mode between Video and Voice
  const handleToggleRoomMode = () => {
    const nextMode = roomMode === 'video' ? 'voice' : 'video';
    setRoomMode(nextMode);
    Alert.alert(
      'Party Mode Switched',
      `Room is now in ${nextMode === 'video' ? 'Video Party' : 'Audio Lounge'} mode.`
    );
  };

  // Toggle Camera on/off
  const handleToggleCamera = () => {
    const nextCam = !isCameraOn;
    setIsCameraOn(nextCam);
    setSeats((prev) =>
      (Array.isArray(prev) ? prev : []).map((s) => (s.userId === currentUserId ? { ...s, isVideoEnabled: nextCam } : s))
    );
  };

  // Switch Camera front/back
  const handleSwitchCamera = () => {
    const nextFacing = cameraFacing === 'front' ? 'back' : 'front';
    setCameraFacing(nextFacing);
  };

  // Seat Selection Handlers
  const handleSelectEmptySeat = (seatNumber: number) => {
    if (lockedSeats.has(seatNumber)) {
      Alert.alert('Seat Locked', 'This seat is currently locked by the host.');
      return;
    }
    const alreadySeated = seats.some((s) => s.userId === currentUserId);
    if (alreadySeated) {
      setSeats((prev) =>
        (Array.isArray(prev) ? prev : []).map((s) => (s.userId === currentUserId ? { ...s, seatNumber } : s))
      );
    } else {
      setSeats((prev) => [
        ...prev,
        {
          seatNumber,
          userId: currentUserId,
          displayName: 'You (Alex)',
          isHost: false,
          isSpeaking: false,
          isMuted: isMicMuted,
          isVideoEnabled: roomMode === 'video' && isCameraOn,
          giftScore: 0,
          level: 12,
        },
      ]);
    }
  };

  const handleSelectOccupant = (occupant: AudioSeatOccupant) => {
    Alert.alert(
      occupant.displayName,
      `Seat ${occupant.seatNumber + 1} • Level ${occupant.level || 1}`,
      [
        { text: 'Send Gift', onPress: () => setIsGiftSheetOpen(true) },
        {
          text: occupant.isVideoEnabled ? 'Turn Off Video' : 'Turn On Video',
          onPress: () => {
            setSeats((prev) =>
              prev.map((s) =>
                s.seatNumber === occupant.seatNumber
                  ? { ...s, isVideoEnabled: !s.isVideoEnabled }
                  : s
              )
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Moderation Handlers
  const handleApproveRequest = (request: PendingSeatRequest) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== request.id));
    const emptySeat = [0, 1, 2, 3, 4, 5, 6, 7].find(
      (n) => !seats.some((s) => s.seatNumber === n) && !lockedSeats.has(n)
    );
    if (emptySeat !== undefined) {
      setSeats((prev) => [
        ...prev,
        {
          seatNumber: emptySeat,
          userId: request.userId,
          displayName: request.displayName,
          level: request.level,
          isHost: false,
          isSpeaking: false,
          isMuted: false,
          isVideoEnabled: roomMode === 'video',
          giftScore: 0,
        },
      ]);
    }
  };

  const handleRejectRequest = (requestId: string) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleMuteSeat = (seatNumber: number) => {
    setSeats((prev) =>
      (Array.isArray(prev) ? prev : []).map((s) => (s.seatNumber === seatNumber ? { ...s, isMuted: !s.isMuted } : s))
    );
  };

  const handleKickSeat = (seatNumber: number) => {
    setSeats((prev) => prev.filter((s) => s.seatNumber !== seatNumber));
  };

  const handleToggleLockSeat = (seatNumber: number) => {
    setLockedSeats((prev) => {
      const next = new Set(prev);
      if (next.has(seatNumber)) next.delete(seatNumber);
      else next.add(seatNumber);
      return next;
    });
  };

  // Send Chat Message
  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderName: 'You (Alex)',
      text: chatInput.trim(),
      seatNumber: 2,
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

  // Send Gift
  const handleSendGift = (gift: GiftItem, recipientId: string | 'all', comboCount: number) => {
    const recipientCount = recipientId === 'all' ? Math.max(seats.length, 1) : 1;
    const totalCost = gift.coins * comboCount * recipientCount;
    if (coinBalance < totalCost) {
      Alert.alert('Insufficient Coins', 'Recharge your wallet to send this gift.');
      return;
    }
    setCoinBalance((prev) => prev - totalCost);
    setTopGiftScore((prev) => prev + totalCost);

    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        senderName: 'You (Alex)',
        text: `Sent ${comboCount}x ${gift.name} (${gift.emoji})${recipientId === 'all' ? ' to all seats' : ''}! 🎁`,
        isSystemGift: true,
      },
    ]);

    if (isPkActive) {
      setRedScore((prev) => prev + totalCost);
    }
  };

  return (
    <View style={styles.root}>
      {/* Dynamic Background Atmosphere Theme */}
      <LinearGradient
        colors={currentTheme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* TOP HEADER BAR */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        {/* Host Avatar & Room Info */}
        <View style={styles.hostPill}>
          <View style={styles.hostAvatarCircle}>
            <Text style={styles.hostAvatarText}>DJ</Text>
          </View>
          <View style={styles.hostInfo}>
            <Text style={styles.hostTitle} numberOfLines={1}>
              {roomTitle}
            </Text>
            <View style={styles.idRow}>
              <Text style={styles.idText}>ID: {roomId}</Text>
              {/* Room Mode Badge */}
              <Pressable
                onPress={handleToggleRoomMode}
                style={[
                  styles.modeBadge,
                  roomMode === 'video' ? styles.videoBadge : styles.voiceBadge,
                ]}
              >
                <Ionicons
                  name={roomMode === 'video' ? 'videocam' : 'mic'}
                  size={9}
                  color="#FFF"
                />
                <Text style={styles.modeBadgeText}>
                  {roomMode === 'video' ? 'Video' : 'Audio'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Top Action Pills: Coins, Likes, Close */}
        <View style={styles.topRightActions}>
          <View style={styles.coinPill}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.coinCount}>{coinBalance.toLocaleString()}</Text>
          </View>

          {/* Dynamic Seat Layout Switcher */}
          <Pressable
            onPress={() => {
              Alert.alert(
                'Switch Seat Layout',
                'Choose how participant seats are arranged:',
                [
                  { text: 'Grid (Standard)', onPress: () => setSeatLayout('grid') },
                  { text: 'Spotlight (Host Stage)', onPress: () => setSeatLayout('spotlight') },
                  { text: 'Circle (Amphitheater)', onPress: () => setSeatLayout('circle') },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
            style={styles.layoutBtn}
          >
            <Ionicons name="grid-outline" size={14} color="#C084FC" />
          </Pressable>

          <Pressable onPress={handleLikeTap} style={styles.likePill}>
            <Ionicons name="heart" size={14} color="#FF4D6D" />
            <Text style={styles.likeCount}>{likesCount}</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Alert.alert('Leave Party', 'Are you sure you want to leave this room?', [
                { text: 'Stay', style: 'cancel' },
                { text: 'Leave', style: 'destructive', onPress: onLeaveRoom },
              ]);
            }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={18} color="#FFF" />
          </Pressable>
        </View>
      </View>

      {/* AUDIO BATTLE PK BAR */}
      {isPkActive && (
        <AudioBattlePkBar
          redScore={redScore}
          blueScore={blueScore}
          timeLeft={pkTimeLeft}
        />
      )}

      {/* MULTI-SEAT GRID (Supports both Video and Audio occupants) */}
      <View style={styles.seatGridContainer}>
        <AudioSeatGrid
          seatCount={seatCount}
          seats={seats}
          currentUserId={currentUserId}
          isHostUser={true}
          roomMode={roomMode}
          layoutType={seatLayout}
          lockedSeats={lockedSeats}
          screenWidth={screenWidth}
          onSelectEmptySeat={handleSelectEmptySeat}
          onSelectOccupant={handleSelectOccupant}
        />
      </View>

      {/* MIDDLE NOTICES / LIVE GIFTS SCROLL */}
      <View style={styles.noticeBar}>
        <Ionicons name="sparkles" size={12} color={colors.gold} />
        <Text style={styles.noticeText}>
          {roomMode === 'video'
            ? '📹 Video Party active: Tap Camera icon to stream your video on seat'
            : '🎙️ Audio Lounge: Relax and chat in high-fidelity 48kHz audio'}
        </Text>
      </View>

      {/* CHAT MESSAGES FEED */}
      <View style={styles.chatSection}>
        <FlatList
          data={chatMessages}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatListContent}
          renderItem={({ item }) => (
            <View
              style={[
                styles.chatBubble,
                item.isSystemGift && styles.systemGiftBubble,
              ]}
            >
              {item.isHost && (
                <View style={styles.chatHostBadge}>
                  <Text style={styles.chatHostBadgeText}>HOST</Text>
                </View>
              )}
              {item.seatNumber && (
                <View style={styles.chatSeatBadge}>
                  <Text style={styles.chatSeatBadgeText}>{item.seatNumber}</Text>
                </View>
              )}
              <Text style={styles.chatSender}>{item.senderName}:</Text>
              <Text style={styles.chatText}>{item.text}</Text>
            </View>
          )}
        />
      </View>

      {/* BOTTOM ACTION BAR */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}
      >
        {/* Chat input pill */}
        <View style={styles.chatInputPill}>
          <TextInput
            style={styles.chatTextInput}
            placeholder="Say something nice..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            value={chatInput}
            onChangeText={setChatInput}
            onSubmitEditing={handleSendChat}
          />
          <Pressable onPress={handleSendChat} style={styles.sendIconBtn}>
            <Ionicons name="send" size={14} color={colors.primaryLight} />
          </Pressable>
        </View>

        {/* Microphone Toggle */}
        <Pressable
          style={[styles.iconButton, isMicMuted && styles.mutedIconBtn]}
          onPress={() => setIsMicMuted(!isMicMuted)}
        >
          <Ionicons
            name={isMicMuted ? 'mic-off' : 'mic'}
            size={18}
            color={isMicMuted ? colors.danger : '#FFF'}
          />
        </Pressable>

        {/* Video Mode Controls: Camera Toggle + Flip + Beauty */}
        {roomMode === 'video' && (
          <>
            {/* Camera On/Off Toggle */}
            <Pressable
              style={[styles.iconButton, !isCameraOn && styles.camOffIconBtn]}
              onPress={handleToggleCamera}
            >
              <Ionicons
                name={isCameraOn ? 'videocam' : 'videocam-off'}
                size={18}
                color={isCameraOn ? '#FFF' : colors.danger}
              />
            </Pressable>

            {/* Flip Camera */}
            {isCameraOn && (
              <Pressable style={styles.iconButton} onPress={handleSwitchCamera}>
                <Ionicons name="camera-reverse" size={18} color="#FFF" />
              </Pressable>
            )}

            {/* Beauty Filter Retouch */}
            <Pressable
              style={[styles.iconButton, beauty.enabled && styles.beautyActiveBtn]}
              onPress={() => setIsBeautyOpen(true)}
            >
              <Ionicons name="sparkles" size={17} color={colors.gold} />
            </Pressable>
          </>
        )}

        {/* Soundboard Modal Button */}
        <Pressable
          style={styles.iconButton}
          onPress={() => setIsSoundboardOpen(true)}
        >
          <Ionicons name="musical-notes" size={18} color="#FFF" />
        </Pressable>

        {/* Seat Management Sheet Button */}
        <Pressable
          style={styles.iconButton}
          onPress={() => setIsSeatManageOpen(true)}
        >
          <Ionicons name="people" size={18} color="#FFF" />
          {pendingRequests.length > 0 && (
            <View style={styles.badgeIndicator}>
              <Text style={styles.badgeText}>{pendingRequests.length}</Text>
            </View>
          )}
        </Pressable>

        {/* Gift Sheet Button */}
        <Pressable
          style={styles.giftMainBtn}
          onPress={() => setIsGiftSheetOpen(true)}
        >
          <LinearGradient
            colors={gradients.hero}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="gift" size={20} color="#FFF" />
        </Pressable>
      </KeyboardAvoidingView>

      {/* POPUP MODALS & DRAWERS */}
      <SoundboardModal
        visible={isSoundboardOpen}
        onClose={() => setIsSoundboardOpen(false)}
        activeBgm={activeBgm}
        // Demo screen: there is no audio engine behind the sound effects.
        onPlaySound={() => undefined}
        onToggleBgm={(id: string) => setActiveBgm((prev) => (prev === id ? null : id))}
        activeVoicePreset={activeVoicePreset}
        onSelectVoicePreset={(id: string) => setActiveVoicePreset(id)}
      />

      <SeatManagementSheet
        visible={isSeatManageOpen}
        onClose={() => setIsSeatManageOpen(false)}
        seatCount={seatCount}
        selectedLayout={seatLayout}
        onSelectLayout={(l) => setSeatLayout(l)}
        seats={seats}
        requests={pendingRequests}
        // The sheet reports request ids / user ids; the handlers here work on
        // the request object / seat number, so look those up.
        onApproveRequest={(requestId: string) => {
          const request = pendingRequests.find((r) => r.id === requestId);
          if (request) handleApproveRequest(request);
        }}
        onRejectRequest={handleRejectRequest}
        onMuteOccupant={(userId: string) => {
          const seat = seats.find((s) => s.userId === userId);
          if (seat) handleMuteSeat(seat.seatNumber);
        }}
        onKickOccupant={(userId: string) => {
          const seat = seats.find((s) => s.userId === userId);
          if (seat) handleKickSeat(seat.seatNumber);
        }}
        allSeatsLocked={allSeatsLocked}
        onToggleLockAll={(locked: boolean) => {
          setLockedSeats(
            locked
              ? new Set(Array.from({ length: seatCount }, (_, n) => n).filter((n) => !seats.some((s) => s.seatNumber === n)))
              : new Set()
          );
        }}
        autoApprove={autoApprove}
        onToggleAutoApprove={(auto: boolean) => setAutoApprove(auto)}
        onSelectSeatCount={(count: number) => setSeatCount(count)}
      />

      <GiftSheet
        visible={isGiftSheetOpen}
        onClose={() => setIsGiftSheetOpen(false)}
        userCoinBalance={coinBalance}
        seats={seats}
        onSendGift={handleSendGift}
        onRecharge={() => setCoinBalance((prev) => prev + 5000)}
      />

      <PartyThemePicker
        visible={isThemePickerOpen}
        onClose={() => setIsThemePickerOpen(false)}
        activeThemeId={currentTheme.id}
        onSelectTheme={(theme) => setCurrentTheme(theme)}
      />

      <BeautyFilterSheet
        visible={isBeautyOpen}
        onClose={() => setIsBeautyOpen(false)}
        beauty={beauty}
        onChangeBeauty={(next) => setBeauty((prev) => ({ ...prev, ...next }))}
        onSwitchCamera={handleSwitchCamera}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0E081F',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  hostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: radii.pill,
    paddingRight: 10,
    paddingLeft: 3,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxWidth: '55%',
  },
  hostAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  hostAvatarText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  hostInfo: {
    flex: 1,
  },
  hostTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  idText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '500',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.pill,
  },
  videoBadge: {
    backgroundColor: 'rgba(138, 79, 255, 0.6)',
  },
  voiceBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.6)',
  },
  modeBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    gap: 3,
  },
  coinIcon: {
    fontSize: 10,
  },
  coinCount: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
  },
  layoutBtn: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.3)',
    gap: 3,
  },
  likeCount: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  seatGridContainer: {
    flexShrink: 0,
  },
  noticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  noticeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '500',
  },
  chatSection: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
  },
  chatListContent: {
    gap: 4,
    paddingBottom: 4,
  },
  chatBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.md,
    alignSelf: 'flex-start',
    maxWidth: '92%',
    gap: 4,
  },
  systemGiftBubble: {
    backgroundColor: 'rgba(138, 79, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(216, 180, 254, 0.3)',
  },
  chatHostBadge: {
    backgroundColor: colors.gold,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radii.xs,
  },
  chatHostBadgeText: {
    color: '#000',
    fontSize: 8,
    fontWeight: '800',
  },
  chatSeatBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radii.xs,
  },
  chatSeatBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '700',
  },
  chatSender: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
  chatText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '500',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    gap: 6,
    backgroundColor: 'rgba(14, 8, 31, 0.75)',
  },
  chatInputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatTextInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 11,
    paddingVertical: 4,
  },
  sendIconBtn: {
    padding: 3,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    position: 'relative',
  },
  mutedIconBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: colors.danger,
  },
  camOffIconBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: colors.danger,
  },
  beautyActiveBtn: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(255, 209, 102, 0.2)',
  },
  badgeIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  giftMainBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
});
