import { GiftFlyOverlay } from '../../components/GiftFlyOverlay';
import { describeApiError } from '../../api/errors';
import React, { useEffect, useRef, useState } from 'react';
import { GradientBackground } from '../../components/GradientBackground';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchRoomDetails,
  joinRoom,
  requestSeat,
  leaveSeat,
  closeRoom,
  fetchSeatRequests,
  approveSeatRequest,
  rejectSeatRequest,
  removeGuest,
  banGuest,
  updateRoomTheme,
  updateRoomMode,
  updateRoomSeatCount,
  muteGuest,
  unmuteGuest,
  inviteToSeat,
  lockRoomSeat,
  unlockRoomSeat,
  type RoomDetails,
  type RoomSeatOccupant,
  type SeatRequestRow,
} from '../../api/rooms';

import { fetchFollowersList } from '../../api/social';
import { useAuth } from '../../auth/AuthContext';
import { usePartyRoomEngine } from '../../live/usePartyRoomEngine';
import { useLiveChat, type RoomModerationEvent } from '../../live/useLiveChat';

import {
  LiveChatFeed,
  type LiveChatFeedHandle,
} from '../../components/LiveChatFeed';

import { GiftSheet } from '../../components/GiftSheet';
import { LiveToolsSheet } from '../../components/LiveToolsSheet';
import { fetchWallet } from '../../api/feed';
import { fetchHonorRanking } from '../../api/ranking';
import { AgoraVideoView } from '../../components/AgoraVideoView';
import { Avatar } from '../../components/Avatar';
import { SofaIcon } from '../../components/SofaIcon';
import { RoomThemeSwatches } from '../../components/RoomThemeSwatches';

import {
  colors,
  radii,
  spacing,
  type,
} from '../../theme';

import type { AppStackParamList } from '../../navigation/types';

type RoomRouteProp = RouteProp<AppStackParamList, 'Room'>;

/* ------------------------------------------------------------------ */
/*  SEAT LAYOUT MATH                                                   */
/* ------------------------------------------------------------------ */
/*
 * Layout rule:
 *  - AUDIO room  → all seats equal size (uniform grid)
 *  - VIDEO room  → host gets a hero tile; guests fill the rest
 *
 * Presets (from the sketch):
 *   4  → host hero (left, 58%) + 3 stacked guest tiles (right)
 *   6  → host hero (left, 45%) + 2×2 guest grid (right)
 *   9  → 3×3 uniform grid
 *   12 → 4×3 uniform grid
 */

const GAP = 0;

type SeatLayout = {
  kind: 'hero' | 'uniform' | 'hero-3-bottom';   // ← add the new kind
  hostWidth: number;
  hostHeight: number;
  guestCols: number;
  guestRows: number;
  guestTileWidth: number;
  guestTileHeight: number;

  // New: sizing for the bottom-row tiles (only used by 'hero-3-bottom')
  bottomTileWidth: number;
  bottomTileHeight: number;
};

function computeSeatLayout(
  seatCount: number,
  audio: boolean,
  roomWidth: number,
  stageHeight: number
): SeatLayout {
  // --- AUDIO: everything equal, uniform grid ---
  if (audio) {
    const cols = seatCount <= 4 ? 2 : seatCount <= 9 ? 3 : 4;
    const rows = Math.ceil(seatCount / cols);
    // exact fit — no leftover on right/bottom
    const tileWidth = (roomWidth - GAP * (cols - 1)) / cols;
    const tileHeight = (stageHeight - GAP * (rows - 1)) / rows;
    return {
      kind: 'uniform',
      hostWidth: tileWidth,
      hostHeight: tileHeight,
      guestCols: cols,
      guestRows: rows,
      guestTileWidth: tileWidth,
      guestTileHeight: tileHeight,
      bottomTileWidth: 0,
      bottomTileHeight: 0,
    };
  }

  // --- VIDEO: 4-seat preset ---
  if (seatCount <= 4) {
    const hostWidth = roomWidth * 0.58;
    const guestCols = 1;
    const guestRows = Math.max(1, seatCount - 1);
    const guestAreaWidth = roomWidth - hostWidth - GAP;
    const guestTileWidth = guestAreaWidth;
    const guestTileHeight =
      (stageHeight - GAP * (guestRows - 1)) / guestRows;
    return {
      kind: 'hero',
      hostWidth,
      hostHeight: stageHeight,
      guestCols,
      guestRows,
      guestTileWidth,
      guestTileHeight,
      bottomTileWidth: 0,
      bottomTileHeight: 0,
    };
  }

  // --- VIDEO: 6-seat preset (big host top-left, 2 right, 3 bottom) ---
  if (seatCount <= 6) {
    const bottomRowHeight = (stageHeight - GAP) * 0.34;
    const topBlockHeight = stageHeight - bottomRowHeight - GAP;

    const hostWidth = roomWidth * 0.62;
    const rightColWidth = roomWidth - hostWidth - GAP;
    const rightTileHeight = (topBlockHeight - GAP) / 2;

    const bottomTileWidth = (roomWidth - GAP * 2) / 3;
    const bottomTileHeight = bottomRowHeight;

    return {
      kind: 'hero-3-bottom',
      hostWidth,
      hostHeight: topBlockHeight,
      guestCols: 1,
      guestRows: 2,
      guestTileWidth: rightColWidth,
      guestTileHeight: rightTileHeight,
      bottomTileWidth,
      bottomTileHeight,
    };
  }

  // --- VIDEO: 9 / 12 → uniform grid ---
  const cols = seatCount <= 9 ? 3 : 4;
  const rows = Math.ceil(seatCount / cols);
  const tileWidth = (roomWidth - GAP * (cols - 1)) / cols;
  const tileHeight = (stageHeight - GAP * (rows - 1)) / rows;
  return {
    kind: 'uniform',
    hostWidth: tileWidth,
    hostHeight: tileHeight,
    guestCols: cols,
    guestRows: rows,
    guestTileWidth: tileWidth,
    guestTileHeight: tileHeight,
    bottomTileWidth: 0,
    bottomTileHeight: 0,
  };
}

/* ------------------------------------------------------------------ */
/*  SCREEN                                                             */
/* ------------------------------------------------------------------ */

export function RoomScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RoomRouteProp>();

  const { roomId, initialVideoEnabled } = route.params;

  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [joinState, setJoinState] = useState<{
    token: string;
    role: 'host' | 'audience';
    channel: string;
  } | null>(null);

  const [forcedMuted, setForcedMuted] = useState(false);

  const [isManageSheetOpen, setIsManageSheetOpen] = useState(false);
  const [manageTab, setManageTab] = useState<
    'requests' | 'invite' | 'theme' | 'seats'
  >('requests');

  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isBeautySheetOpen, setIsBeautySheetOpen] = useState(false);

  const [likes, setLikes] = useState(0);
  const [isLikes, setIsLikes] = useState(false);

  const [giftRecipient, setGiftRecipient] =
    useState<RoomSeatOccupant | null>(null);

  /* SAFE BACK NAVIGATION */
  const goBackFromRoom = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs', { screen: 'Party' });
    }
  };

  /* JOIN ROOM */
  const joinMutation = useMutation({
    mutationFn: () => joinRoom(roomId),

    onSuccess: (result) => {
      queryClient.setQueryData(['rooms', roomId], result.room);
      setForcedMuted(!!result.muted);
      setJoinState({
        token: result.token,
        role: result.role,
        channel: result.room.providerChannel,
      });
    },

    onError: (error: any) => {
      Alert.alert(
        'Could not join room',
        describeApiError(error, 'Something went wrong')
      );
      goBackFromRoom();
    },
  });

  useEffect(() => {
    joinMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  /* ROOM DATA */
  const roomQuery = useQuery({
    queryKey: ['rooms', roomId],
    queryFn: () => fetchRoomDetails(roomId),
    refetchInterval: 4000,
    enabled: !!joinState,
  });

  const room = roomQuery.data;

  /* WALLET */
  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: fetchWallet,
  });

  /* RANKING */
  const rankingQuery = useQuery({
    queryKey: ['gifts', 'ranking', 'today'],
    queryFn: () => fetchHonorRanking('today'),
  });

  const topGiftToday = rankingQuery.data?.[0]?.honorScore ?? 0;

  /* SEAT REQUESTS */
  const seatRequestsQuery = useQuery({
    queryKey: ['rooms', roomId, 'seat-requests'],
    queryFn: () => fetchSeatRequests(roomId),
    refetchInterval: 4000,
    enabled:
      !!joinState &&
      !!room &&
      !!user?.id &&
      (room.hostId === user.id || room.moderatorIds.includes(user.id)),
  });

  /* FOLLOWERS */
  const followersQuery = useQuery({
    queryKey: ['social', 'followers'],
    queryFn: fetchFollowersList,
    enabled: isManageSheetOpen && manageTab === 'invite',
  });

  /* INVITE */
  const inviteMutation = useMutation({
    mutationFn: (userId: string) => inviteToSeat(roomId, userId),
    onSuccess: () =>
      Alert.alert('Invited', 'They can accept from their Party tab.'),
    onError: (error: any) =>
      Alert.alert(
        'Could not invite',
        error?.response?.data?.message ?? 'Something went wrong'
      ),
  });

  const lockSeatMutation = useMutation({
    mutationFn: ({
      seatNumber,
      locked,
    }: {
      seatNumber: number;
      locked: boolean;
    }) =>
      locked
        ? lockRoomSeat(roomId, seatNumber)
        : unlockRoomSeat(roomId, seatNumber),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] }),
    onError: (error: any) =>
      Alert.alert(
        'Could not change seat lock',
        error?.response?.data?.message ?? 'Please try again.'
      ),
  });

  /* PARTY ENGINE */
  const publishVideo = room
    ? room.mode === 'VIDEO'
    : initialVideoEnabled ?? false;

  const {
    remoteUids,
    uidToUserAccount,
    isMicMuted,
    toggleMic,
    switchCamera,
    beauty,
    setBeauty,
    faceShape,
    setFaceShape,
    background,
    setBackground,
  } = usePartyRoomEngine({
    channelId: joinState?.channel ?? '',
    token: joinState?.token ?? '',
    userAccount: user?.id ?? '',
    role: joinState?.role ?? 'audience',
    publishVideo,
    forcedMuted,
  });

  /* UID MAP */
  const userAccountToUid = new Map<string, number>();
  uidToUserAccount.forEach((account, uid) => {
    userAccountToUid.set(account, uid);
  });

  /* REJOIN */
  const rejoin = () => {
    setJoinState(null);
    joinMutation.mutate();
  };

  /* THEME */
  const themeColor = room?.themeColor ?? colors.primary;
  const isDefaultTheme =
    !room?.themeColor ||
    room.themeColor.toLowerCase() === colors.primary.toLowerCase();

  /* CHAT + MODERATION */
  const handleModerationEvent = (event: RoomModerationEvent) => {
    queryClient.invalidateQueries({ queryKey: ['rooms', roomId] });

    if (event.targetUserId !== user?.id) return;

    switch (event.action) {
      case 'MUTE':
        setForcedMuted(true);
        Alert.alert('You were muted', 'The host muted you in this room.');
        if (joinState?.role === 'host') rejoin();
        break;

      case 'UNMUTE':
        setForcedMuted(false);
        Alert.alert('You were unmuted', 'Tap the mic when you want to speak.');
        if (mySeat) rejoin();
        break;

      case 'BAN':
        Alert.alert('Removed from room', 'You were banned from this room.');
        goBackFromRoom();
        break;

      default:
        break;
    }
  };

  const { messages, sendMessage, giftEvents } = useLiveChat('ROOM', roomId, {
    onModeration: handleModerationEvent,
    onRoomTheme: (event) =>
      queryClient.setQueryData<RoomDetails | undefined>(
        ['rooms', roomId],
        (prev) =>
          prev ? { ...prev, themeColor: event.themeColor } : prev
      ),
  });

  const chatFeedRef = useRef<LiveChatFeedHandle>(null);

  /* GRID MATH */
  const seatCount = room?.seatCount ?? 8;
  const isAudio = room?.mode === 'AUDIO';

  const ROOM_HORIZONTAL_PADDING = 0;
  const roomWidth = Math.max(
    320,
    screenWidth - ROOM_HORIZONTAL_PADDING * 2
  );
  const stageHeight = Math.max(
    380,
    screenHeight - insets.top - insets.bottom - 860
  );

  const layout = computeSeatLayout(
    seatCount,
    isAudio,
    roomWidth,
    stageHeight
  );

  /* SEAT REQUEST */
  const seatMutation = useMutation({
    mutationFn: (seatNumber: number) => requestSeat(roomId, seatNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] });
      rejoin();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ?? 'Could not take that seat';
      if (room?.privacy !== 'PUBLIC') {
        Alert.alert(
          'Request sent',
          'A pending request was created — the host needs to approve it before you get a seat.'
        );
      } else {
        Alert.alert('Could not take seat', message);
      }
    },
  });

  /* LEAVE SEAT */
  const leaveSeatMutation = useMutation({
    mutationFn: () => leaveSeat(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] });
      rejoin();
    },
  });

  const switchSeatMutation = useMutation({
    mutationFn: async (seatNumber: number) => {
      await leaveSeat(roomId);
      return requestSeat(roomId, seatNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] });
      rejoin();
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] });
      rejoin();
      Alert.alert(
        'Could not switch seat',
        error?.response?.data?.message ?? 'Please try again.'
      );
    },
  });

  const seatCountMutation = useMutation({
    mutationFn: (nextCount: number) =>
      updateRoomSeatCount(roomId, nextCount),
    onSuccess: (result) => {
      queryClient.setQueryData<RoomDetails | undefined>(
        ['rooms', roomId],
        (prev) => (prev ? { ...prev, seatCount: result.seatCount } : prev)
      );
    },
    onError: (error: any) =>
      Alert.alert(
        'Could not change seats',
        error?.response?.data?.message ??
          'Please remove guests from higher seats first.'
      ),
  });

  /* APPROVE */
  const approveMutation = useMutation({
    mutationFn: ({
      requestId,
      seatNumber,
    }: {
      requestId: string;
      seatNumber: number;
    }) => approveSeatRequest(roomId, requestId, seatNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] });
      queryClient.invalidateQueries({
        queryKey: ['rooms', roomId, 'seat-requests'],
      });
    },
    onError: (error: any) =>
      Alert.alert(
        'Could not approve',
        error?.response?.data?.message ?? 'Something went wrong'
      ),
  });

  /* REJECT */
  const rejectMutation = useMutation({
    mutationFn: (requestId: string) =>
      rejectSeatRequest(roomId, requestId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['rooms', roomId, 'seat-requests'],
      }),
  });

  /* REMOVE */
  const kickMutation = useMutation({
    mutationFn: (userId: string) => removeGuest(roomId, userId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] }),
    onError: (error: any) =>
      Alert.alert(
        'Could not remove',
        error?.response?.data?.message ?? 'Something went wrong'
      ),
  });

  /* THEME */
  const themeMutation = useMutation({
    mutationFn: (hex: string) => updateRoomTheme(roomId, hex),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] }),
    onError: (error: any) =>
      Alert.alert(
        'Could not change theme',
        error?.response?.data?.message ?? 'Something went wrong'
      ),
  });

  const modeMutation = useMutation({
    mutationFn: (mode: 'VIDEO' | 'AUDIO') => updateRoomMode(roomId, mode),
    onSuccess: (result) => {
      queryClient.setQueryData<RoomDetails | undefined>(
        ['rooms', roomId],
        (prev) => (prev ? { ...prev, mode: result.mode } : prev)
      );
      rejoin();
    },
    onError: (error: any) =>
      Alert.alert(
        'Could not switch live mode',
        error?.response?.data?.message ??
          error?.message ??
          'Please try again.'
      ),
  });

  /* MUTE / UNMUTE */
  const muteMutation = useMutation({
    mutationFn: (userId: string) => muteGuest(roomId, userId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] }),
    onError: (error: any) =>
      Alert.alert(
        'Could not mute',
        error?.response?.data?.message ?? 'Something went wrong'
      ),
  });

  const unmuteMutation = useMutation({
    mutationFn: (userId: string) => unmuteGuest(roomId, userId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] }),
    onError: (error: any) =>
      Alert.alert(
        'Could not unmute',
        error?.response?.data?.message ?? 'Something went wrong'
      ),
  });

  /* BAN */
  const banMutation = useMutation({
    mutationFn: (userId: string) => banGuest(roomId, userId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] }),
    onError: (error: any) =>
      Alert.alert(
        'Could not ban',
        error?.response?.data?.message ?? 'Something went wrong'
      ),
  });

  /* PERMISSIONS */
  const isHost = room?.hostId === user?.id;
  const isModerator =
    room?.moderatorIds?.includes(user?.id ?? '') ?? false;
  const canManageRoom = isHost || isModerator;

  /* SEAT VIEWS REF (for gift animation) */
  const seatViews = useRef(new Map<string, View>());
  const resolveGiftTarget = (event: { recipientId: string }) =>
    new Promise<{ x: number; y: number } | null>((resolve) => {
      const v = seatViews.current.get(event.recipientId);
      if (!v) return resolve(null);
      v.measureInWindow((x, y, w, h) =>
        resolve({ x: x + w / 2, y: y + h / 2 })
      );
    });

  /* HOST LEAVES → CLOSE ROOM */
  const roomClosedRef = useRef(false);
  const hostRef = useRef(false);
  hostRef.current = isHost;

  useEffect(() => {
    return navigation.addListener('beforeRemove', (e: any) => {
      if (!hostRef.current || roomClosedRef.current) return;
      e.preventDefault();
      Alert.alert(
        'Close this room?',
        'As the host, leaving closes the room for everyone in it.',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Close room',
            style: 'destructive',
            onPress: async () => {
              roomClosedRef.current = true;
              await closeRoom(roomId).catch(() => {});
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, roomId]);

  useEffect(
    () => () => {
      if (hostRef.current && !roomClosedRef.current)
        closeRoom(roomId).catch(() => {});
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roomId]
  );

  const mySeat = room?.seats.find((s) => s.userId === user?.id);

  /* DETECT REMOVED HOST SEAT */
  const wasSeatedRef = useRef(false);
  useEffect(() => {
    if (mySeat) {
      wasSeatedRef.current = true;
    } else if (wasSeatedRef.current && joinState?.role === 'host') {
      wasSeatedRef.current = false;
      Alert.alert(
        'Removed from seat',
        'You were removed from a seat in this room.'
      );
      rejoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mySeat]);

  /* CLOSE ROOM */
  const handleClose = () => {
    if (isHost) {
      Alert.alert(
        'Close this room?',
        'This ends the room for everyone in it.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Close room',
            style: 'destructive',
            onPress: async () => {
              roomClosedRef.current = true;
              await closeRoom(roomId).catch(() => {});
              goBackFromRoom();
            },
          },
        ]
      );
    } else {
      goBackFromRoom();
    }
  };

  /* LIKE */
  const handleLike = () => {
    setLikes((value) => value + 1);
    setIsLikes(true);
    setTimeout(() => setIsLikes(false), 450);
  };

  /* NEXT EMPTY SEAT */
  const findNextEmptySeat = (): number | null => {
    if (!room) return null;
    for (let i = 0; i < room.seatCount; i++) {
      if (!room.seats.some((seat) => seat.seatNumber === i)) return i;
    }
    return null;
  };

  /* ------------------------------------------------------------------ */
  /*  RENDERERS                                                          */
  /* ------------------------------------------------------------------ */

  const renderHostHero = (
    occupant: RoomSeatOccupant,
    width: number,
    height: number
  ) => {
    const remoteUid = userAccountToUid.get(occupant.userId);
    const showVideo =
      room?.mode === 'VIDEO' &&
      (occupant.userId === user?.id
        ? true
        : remoteUid != null && remoteUids.has(remoteUid));

    return (
      <Pressable
        key={`host-${occupant.seatNumber}`}
        collapsable={false}
        ref={(r) => {
          if (r) seatViews.current.set(occupant.userId, r as unknown as View);
          else seatViews.current.delete(occupant.userId);
        }}
                        style={[styles.seatTile, { width, height, borderRadius: 0 }]}
        onPress={() => {
          if (!canManageRoom) return;
          Alert.alert(
            occupant.displayName ?? 'Host',
            'Host is live. Use More for room controls.'
          );
        }}
      >
        {showVideo ? (
          <AgoraVideoView
            uid={occupant.userId === user?.id ? 0 : remoteUid}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={styles.audioCenter}>
            <Avatar
              name={occupant.displayName ?? 'Host'}
              size={Math.min(height * 0.45, 96)}
            />
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.82)']}
          style={styles.seatNameScrim}
        >
          <Text style={styles.seatNameText} numberOfLines={1}>
            {occupant.userId === user?.id
              ? 'You'
              : occupant.displayName ?? 'Host'}
          </Text>
        </LinearGradient>

        <View style={[styles.hostBadge, { backgroundColor: themeColor }]}>
          <Text style={styles.hostBadgeText}>HOST</Text>
        </View>
      </Pressable>
    );
  };

  const renderFilledSeat = (
    seatNumber: number,
    occupant: RoomSeatOccupant,
    width: number,
    height: number
  ) => {
    const isMe = occupant.userId === user?.id;
    const remoteUid = userAccountToUid.get(occupant.userId);
    const isHostSeat = occupant.userId === room?.hostId;

    const isPublishingVideo =
      room?.mode === 'VIDEO' &&
      (isMe ? true : remoteUid != null && remoteUids.has(remoteUid));

    const canModerate = canManageRoom && !isMe;

    const handleTap = () => {
      if (isMe) {
        if (isHostSeat) {
          Alert.alert('Host seat', 'The host seat is fixed.');
        } else {
          Alert.alert('Your seat', 'Leave this seat?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Leave seat',
              style: 'destructive',
              onPress: () => leaveSeatMutation.mutate(),
            },
          ]);
        }
        return;
      }
      if (!canModerate) return;

      const guestName = occupant.displayName ?? 'Guest';
      const isGuestMuted =
        room?.mutedUserIds?.includes(occupant.userId) ?? false;

      Alert.alert(guestName, 'Moderate this guest', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isGuestMuted ? 'Unmute' : 'Mute',
          onPress: () =>
            isGuestMuted
              ? unmuteMutation.mutate(occupant.userId)
              : muteMutation.mutate(occupant.userId),
        },
        {
          text: 'Remove or ban…',
          onPress: () =>
            Alert.alert(guestName, 'Choose an action', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove from seat',
                onPress: () => kickMutation.mutate(occupant.userId),
              },
              {
                text: 'Ban from room',
                style: 'destructive',
                onPress: () => banMutation.mutate(occupant.userId),
              },
            ]),
        },
      ]);
    };

    return (
      <Pressable
        key={`filled-${seatNumber}`}
        collapsable={false}
        ref={(r) => {
          if (r) seatViews.current.set(occupant.userId, r as unknown as View);
          else seatViews.current.delete(occupant.userId);
        }}
        
          style={[
          styles.seatTile,
          { width, height, borderRadius: 0 },
        ]}

        onPress={handleTap}
      >
        {isPublishingVideo ? (
          <AgoraVideoView
            uid={isMe ? 0 : remoteUid!}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={styles.audioCenter}>
            <Avatar
              name={occupant.displayName}
              size={Math.min(height * 0.5, 72)}
            />
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.82)']}
          style={styles.seatNameScrim}
        >
          <Text style={styles.seatNameText} numberOfLines={1}>
            {isMe ? 'You' : occupant.displayName ?? 'Guest'}
          </Text>
        </LinearGradient>

        {isMe && (
          <View style={[styles.liveBadge, { backgroundColor: themeColor }]}>
            <Text style={styles.liveBadgeText}>YOU</Text>
          </View>
        )}
      </Pressable>
    );
  };

  const renderEmptySeat = (
    seatNumber: number,
    width: number,
    height: number
  ) => {
    const isSeatLocked =
      room?.lockedSeatNumbers?.includes(seatNumber) ?? false;

    return (
      <Pressable
        key={`empty-${seatNumber}`}
         
                    style={[
            styles.seatBoard,
            { width, height, borderRadius: 0 },
          ]}
		  
        disabled={
          seatMutation.isPending ||
          lockSeatMutation.isPending ||
          switchSeatMutation.isPending ||
          seatCountMutation.isPending
        }
        onPress={() => {
          if (canManageRoom) {
            Alert.alert(
              `Seat ${seatNumber + 1}`,
              isSeatLocked
                ? 'This seat is locked.'
                : 'Choose what to do with this seat.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: isSeatLocked ? 'Unlock seat' : 'Lock seat',
                  onPress: () =>
                    lockSeatMutation.mutate({
                      seatNumber,
                      locked: !isSeatLocked,
                    }),
                },
                !isSeatLocked
                  ? {
                      text: 'Invite someone',
                      onPress: () => {
                        setManageTab('invite');
                        setIsManageSheetOpen(true);
                      },
                    }
                  : undefined,
              ].filter(Boolean) as any
            );
            return;
          }

          if (isSeatLocked) {
            Alert.alert('Seat locked', 'The host has locked this seat.');
            return;
          }

          if (mySeat) {
            Alert.alert(
              `Switch to seat ${seatNumber + 1}?`,
              'Your current seat will be released first.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Switch seat',
                  onPress: () => switchSeatMutation.mutate(seatNumber),
                },
              ]
            );
            return;
          }

          seatMutation.mutate(seatNumber);
        }}
      >
               <View
          style={[
            styles.seatInner,
            {
              borderRadius: 0,
              backgroundColor: '#1C1F2C',
            },
          ]}
        >
        
          <Text style={styles.seatNumber}>{seatNumber + 1}</Text>
          {isSeatLocked ? (
            <Ionicons name="lock-closed" size={25} color={themeColor} />
          ) : (
            <SofaIcon
              width={width * 0.5}
              height={height * 0.3}
              color="#B4B4BF"
            />
          )}
          <Text style={styles.tapToJoin}>
            {isSeatLocked
              ? 'Locked'
              : canManageRoom
              ? 'Tap to manage'
              : 'Tap to join'}
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderSeatGrid = () => {
  if (!room) return null;

  const hostSeat =
    room.seats.find((s) => s.userId === room.hostId) ?? null;

  const allSeatNumbers = Array.from({ length: seatCount }, (_, i) => i);

  /* ---------- NEW: hero-3-bottom layout (6-seat VIDEO) ---------- */
  if (layout.kind === 'hero-3-bottom' && hostSeat) {
    const hostSeatNumber = hostSeat.seatNumber;

    // Ordered guests (skip the host seat)
    const guestSeatNumbers = allSeatNumbers.filter(
      (n) => n !== hostSeatNumber
    );

    // First 2 guests go in the right column, the rest go in the bottom row
    const rightGuests = guestSeatNumbers.slice(0, 2);
    const bottomGuests = guestSeatNumbers.slice(2); // up to 3

    const renderSlot = (
      seatNumber: number,
      width: number,
      height: number
    ) => {
      const occupant =
        room.seats.find((s) => s.seatNumber === seatNumber) ?? null;
      return occupant
        ? renderFilledSeat(seatNumber, occupant, width, height)
        : renderEmptySeat(seatNumber, width, height);
    };

    return (
      <View style={styles.stage}>
        <View style={{ flex: 1, gap: GAP }}>
          {/* TOP BLOCK: host (left) + 2 guests (right) */}
          <View style={{ flexDirection: 'row', gap: GAP }}>
            <View
              style={{
                width: layout.hostWidth,
                height: layout.hostHeight,
              }}
            >
              {renderHostHero(
                hostSeat,
                layout.hostWidth,
                layout.hostHeight
              )}
            </View>

            <View
              style={{
                flex: 1,
                gap: GAP,
                justifyContent: 'space-between',
              }}
            >
              {rightGuests.map((n) =>
                renderSlot(n, layout.guestTileWidth, layout.guestTileHeight)
              )}
            </View>
          </View>

          {/* BOTTOM ROW: 3 guests equal width */}
          <View
            style={{
              flexDirection: 'row',
              gap: GAP,
              height: layout.bottomTileHeight,
            }}
          >
            {bottomGuests.map((n) =>
              renderSlot(
                n,
                layout.bottomTileWidth,
                layout.bottomTileHeight
              )
            )}
          </View>
        </View>
      </View>
    );
  }

  /* ---------- Existing behavior for hero / uniform ---------- */
  const useHero = layout.kind === 'hero' && !!hostSeat;
  const hostSeatNumber = useHero ? hostSeat!.seatNumber : -1;

  const gridSeatNumbers = allSeatNumbers.filter(
    (n) => n !== hostSeatNumber
  );

  return (
    <View style={[styles.stage, { height: stageHeight }]}>
      {useHero && (
        <View
          style={[
            styles.heroColumn,
            { width: layout.hostWidth, height: stageHeight },
          ]}
        >
          {renderHostHero(hostSeat!, layout.hostWidth, layout.hostHeight)}
        </View>
      )}

      <View
        style={[
          styles.tileGrid,
          {
            width: useHero
              ? roomWidth - layout.hostWidth - GAP
              : roomWidth,
            height: stageHeight,
          },
        ]}
      >
        {gridSeatNumbers.map((seatNumber) => {
          const occupant =
            room.seats.find((s) => s.seatNumber === seatNumber) ?? null;

          if (occupant) {
            return renderFilledSeat(
              seatNumber,
              occupant,
              layout.guestTileWidth,
              layout.guestTileHeight
            );
          }
          return renderEmptySeat(
            seatNumber,
            layout.guestTileWidth,
            layout.guestTileHeight
          );
        })}
      </View>
    </View>
  );
};
  /* ------------------------------------------------------------------ */
  /*  RENDER                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <View style={styles.root}>
      {/* BACKGROUND */}
      {isDefaultTheme ? (
        <GradientBackground style={StyleSheet.absoluteFill} />
      ) : (
        <LinearGradient
          colors={[themeColor, '#0F0F18']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* HEADER */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Avatar name={room?.title} size={36} />

        <View style={styles.hostText}>
          <Text style={styles.hostName} numberOfLines={1}>
            {room?.title ?? 'Party Room'}
          </Text>
          <Text style={styles.hostSub}>ID: {roomId.slice(0, 8)}</Text>
        </View>

        {/* LIKE */}
        <Pressable
          style={[
            styles.topIconButton,
            isLikes && { backgroundColor: themeColor },
          ]}
          onPress={handleLike}
        >
          <Ionicons name="heart" size={16} color="#FFF" />
          {likes > 0 && <Text style={styles.miniCount}>{likes}</Text>}
        </Pressable>

        {/* RANKING */}
        <Pressable
          style={styles.topIconButton}
          onPress={() => navigation.navigate('HonorRanking')}
        >
          <Ionicons name="trophy" size={16} color="#FFF" />
        </Pressable>

        {/* COINS */}
        <View style={styles.coinPill}>
          <Ionicons name="diamond" size={11} color="#FFD45A" />
          <Text style={styles.coinPillText}>
            {walletQuery.data?.coin ?? '—'}
          </Text>
        </View>

        {/* CLOSE */}
        <Pressable onPress={handleClose} style={styles.topIconButton}>
          <Ionicons name="close" size={20} color="#FFF" />
        </Pressable>
      </View>

      {/* INFO */}
      <View style={styles.infoRow}>
        <Pressable
          style={styles.infoPill}
          onPress={() =>
            Alert.alert(
              'Room Rules',
              'Be respectful — no harassment or hate speech.\n\nNo nudity or sexual content.\n\nNo scams or attempts to move payments outside the app.\n\nHosts and moderators may remove or ban guests who break these rules.'
            )
          }
        >
          <Ionicons name="book-outline" size={11} color="#FFF" />
          <Text style={styles.infoPillText}>Rules</Text>
        </Pressable>

        <Pressable
          style={styles.infoPill}
          onPress={() => navigation.navigate('HonorRanking')}
        >
          <Ionicons name="podium-outline" size={11} color="#FFD45A" />
          <Text style={styles.infoPillText}>
            Top{' '}
            {rankingQuery.isLoading
              ? '...'
              : topGiftToday.toLocaleString()}
          </Text>
        </Pressable>

        <View style={{ flex: 1 }} />

        <View style={[styles.themePill, { borderColor: `${themeColor}99` }]}>
          <View style={[styles.themeDot, { backgroundColor: themeColor }]} />
          <Text style={styles.infoPillText}>
            {room?.mode === 'AUDIO' ? 'Audio' : 'Live'}
          </Text>
        </View>
      </View>

      {/* SEATS */}
      {renderSeatGrid()}

      {/* CHAT */}
      <View style={styles.chatArea}>
        <View style={styles.sideTabs}>
          <View style={[styles.sideTab, { backgroundColor: themeColor }]}>
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
          <LiveChatFeed
            ref={chatFeedRef}
            messages={messages}
            sendMessage={sendMessage}
            fill
          />
        </View>
      </View>

      {/* BOTTOM LIVE CONTROLS */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable
          style={styles.bottomIcon}
          onPress={() => chatFeedRef.current?.focus()}
        >
          <View style={styles.bottomOrb}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color="#FFF"
            />
          </View>
          <Text style={styles.controlLabel}>Chat</Text>
        </Pressable>

        <Pressable
          style={styles.bottomIcon}
          onPress={() =>
            mySeat
              ? forcedMuted
                ? Alert.alert(
                    'You are muted',
                    'The host has muted you in this room.'
                  )
                : toggleMic()
              : Alert.alert(
                  'Join a seat',
                  'Tap an empty seat to join the mic first.'
                )
          }
        >
          <View style={styles.bottomOrb}>
            <Ionicons
              name={isMicMuted ? 'mic-off' : 'mic'}
              size={20}
              color={isMicMuted ? '#FF4D67' : '#FFF'}
            />
          </View>
          <Text style={styles.controlLabel}>Mic</Text>
        </Pressable>

        <Pressable
          style={styles.bottomIcon}
          onPress={() =>
            canManageRoom
              ? setIsManageSheetOpen(true)
              : mySeat
              ? Alert.alert('Seats', 'Tap an empty seat to change seats.')
              : Alert.alert('Seats', 'Tap an empty seat to join.')
          }
        >
          <View
            style={[
              styles.bottomOrb,
              { borderColor: themeColor, borderWidth: 1.5 },
            ]}
          >
            <Ionicons name="people-outline" size={20} color="#FFF" />
          </View>
          <Text style={styles.controlLabel}>Seats</Text>
          {!!seatRequestsQuery.data?.length && (
            <View style={styles.requestBadge}>
              <Text style={styles.requestBadgeText}>
                {seatRequestsQuery.data.length}
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={styles.bottomIcon}
          onPress={() => {
            const others = (room?.seats ?? []).filter(
              (seat) => seat.userId !== user?.id
            );
            if (!others.length)
              return Alert.alert(
                'No one to gift',
                'Wait for someone else to take a seat first.'
              );
            Alert.alert(
              'Send a gift to',
              undefined,
              others
                .map((seat) => ({
                  text: seat.displayName ?? 'Guest',
                  onPress: () => setGiftRecipient(seat),
                }))
                .concat([{ text: 'Cancel', style: 'cancel' } as any])
            );
          }}
        >
          <View
            style={[styles.bottomOrb, { backgroundColor: themeColor }]}
          >
            <Ionicons name="gift" size={18} color="#FFF" />
          </View>
          <Text style={styles.controlLabel}>Gift</Text>
        </Pressable>

        <Pressable
          style={styles.bottomIcon}
          onPress={() => setIsToolsOpen(true)}
        >
          <View style={styles.bottomOrb}>
            <Ionicons name="ellipsis-horizontal" size={21} color="#FFF" />
          </View>
          <Text style={styles.controlLabel}>More</Text>
        </Pressable>
      </View>

      {/* MANAGEMENT SHEET */}
      <Modal
        visible={isManageSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsManageSheetOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: insets.bottom + spacing.md },
            ]}
          >
            <View style={styles.tabRow}>
              <Pressable
                style={styles.tabButton}
                onPress={() => setManageTab('requests')}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    manageTab === 'requests' && styles.tabButtonTextActive,
                  ]}
                >
                  Requests
                  {seatRequestsQuery.data?.length
                    ? ` (${seatRequestsQuery.data.length})`
                    : ''}
                </Text>
                {manageTab === 'requests' && (
                  <View
                    style={[
                      styles.tabUnderline,
                      { backgroundColor: themeColor },
                    ]}
                  />
                )}
              </Pressable>

              <Pressable
                style={styles.tabButton}
                onPress={() => setManageTab('invite')}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    manageTab === 'invite' && styles.tabButtonTextActive,
                  ]}
                >
                  Invite
                </Text>
                {manageTab === 'invite' && (
                  <View
                    style={[
                      styles.tabUnderline,
                      { backgroundColor: themeColor },
                    ]}
                  />
                )}
              </Pressable>

              {isHost && (
                <Pressable
                  style={styles.tabButton}
                  onPress={() => setManageTab('theme')}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      manageTab === 'theme' && styles.tabButtonTextActive,
                    ]}
                  >
                    Theme
                  </Text>
                  {manageTab === 'theme' && (
                    <View
                      style={[
                        styles.tabUnderline,
                        { backgroundColor: themeColor },
                      ]}
                    />
                  )}
                </Pressable>
              )}

              {isHost && (
                <Pressable
                  style={styles.tabButton}
                  onPress={() => setManageTab('seats')}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      manageTab === 'seats' && styles.tabButtonTextActive,
                    ]}
                  >
                    Seats
                  </Text>
                  {manageTab === 'seats' && (
                    <View
                      style={[
                        styles.tabUnderline,
                        { backgroundColor: themeColor },
                      ]}
                    />
                  )}
                </Pressable>
              )}

              <View style={{ flex: 1 }} />

              <Pressable
                onPress={() => setIsManageSheetOpen(false)}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={colors.textPrimary}
                />
              </Pressable>
            </View>

            {manageTab === 'seats' && isHost && (
              <View style={styles.seatCountPanel}>
                <Text style={styles.seatCountTitle}>Number of seats</Text>
                <Text style={styles.seatCountHint}>
                  Choose 4–12 seats. Occupied seats must fit inside the new
                  limit.
                </Text>
                <View style={styles.seatCountOptions}>
                  {[4, 6, 8, 9, 12].map((count) => {
                    const active = seatCount === count;
                    return (
                      <Pressable
                        key={count}
                        disabled={seatCountMutation.isPending || active}
                        onPress={() => seatCountMutation.mutate(count)}
                        style={[
                          styles.seatCountOption,
                          active && {
                            backgroundColor: themeColor,
                            borderColor: themeColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.seatCountOptionText,
                            active && styles.seatCountOptionTextActive,
                          ]}
                        >
                          {count}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {manageTab === 'theme' && isHost && (
              <RoomThemeSwatches
                selected={themeColor}
                pending={themeMutation.isPending}
                onSelect={(hex) => themeMutation.mutate(hex)}
              />
            )}

            {manageTab === 'theme' || manageTab === 'seats' ? null : manageTab ===
              'requests' ? (
              <FlatList
                data={seatRequestsQuery.data ?? []}
                keyExtractor={(request) => request.id}
                ListEmptyComponent={
                  <Text style={styles.emptyRequestsText}>
                    No pending requests.
                  </Text>
                }
                renderItem={({ item }: { item: SeatRequestRow }) => (
                  <View style={styles.requestRow}>
                    <Text style={styles.requestName} numberOfLines={1}>
                      {item.displayName ?? 'Guest'}
                    </Text>

                    <View style={styles.requestActions}>
                      <Pressable
                        style={[
                          styles.requestApprove,
                          { backgroundColor: themeColor },
                        ]}
                        onPress={() => {
                          const seat = findNextEmptySeat();
                          if (seat == null) {
                            Alert.alert(
                              'Room full',
                              'No empty seats available.'
                            );
                            return;
                          }
                          approveMutation.mutate({
                            requestId: item.id,
                            seatNumber: seat,
                          });
                        }}
                      >
                        <Text style={styles.requestApproveText}>
                          Approve
                        </Text>
                      </Pressable>

                      <Pressable
                        style={styles.requestReject}
                        onPress={() => rejectMutation.mutate(item.id)}
                      >
                        <Text style={styles.requestRejectText}>Reject</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              />
            ) : (
              <FlatList
                data={followersQuery.data ?? []}
                keyExtractor={(follower) => follower.id}
                ListEmptyComponent={
                  <Text style={styles.emptyRequestsText}>
                    {followersQuery.isLoading
                      ? 'Loading...'
                      : "You don't have any followers to invite yet."}
                  </Text>
                }
                renderItem={({ item }) => (
                  <View style={styles.requestRow}>
                    <Text style={styles.requestName} numberOfLines={1}>
                      {item.displayName ?? 'User'}
                    </Text>

                    <Pressable
                      style={[
                        styles.requestApprove,
                        { backgroundColor: themeColor },
                      ]}
                      disabled={inviteMutation.isPending}
                      onPress={() => inviteMutation.mutate(item.id)}
                    >
                      <Text style={styles.requestApproveText}>Invite</Text>
                    </Pressable>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* GIFT FLY */}
      <GiftFlyOverlay
        events={giftEvents}
        meId={user?.id}
        bottomInset={insets.bottom}
        resolveTarget={resolveGiftTarget}
      />

      {/* GIFT SHEET */}
      {giftRecipient && (
        <GiftSheet
          visible={!!giftRecipient}
          onClose={() => setGiftRecipient(null)}
          recipientId={giftRecipient.userId}
          context="ROOM"
          contextId={roomId}
          recipientName={giftRecipient.displayName ?? 'Guest'}
        />
      )}

      {/* TOOLS / BEAUTY */}
      <LiveToolsSheet
        visible={isToolsOpen || isBeautySheetOpen}
        onClose={() => {
          setIsToolsOpen(false);
          setIsBeautySheetOpen(false);
        }}
        isHost={isHost}
        roomMode={room?.mode}
        onToggleRoomMode={
          isHost
            ? () =>
                modeMutation.mutate(
                  room?.mode === 'VIDEO' ? 'AUDIO' : 'VIDEO'
                )
            : undefined
        }
        onOpenPk={() => navigation.navigate('PkScreen')}
        sessionTitle={room?.title ?? 'Party Room'}
        switchCamera={switchCamera}
        isMicMuted={isMicMuted}
        toggleMic={toggleMic}
        beauty={beauty}
        setBeauty={setBeauty}
        background={background}
        setBackground={setBackground}
        faceShape={faceShape}
        setFaceShape={setFaceShape}
        initialPanel={isBeautySheetOpen ? 'beauty' : undefined}
      />

      {/* LIKE ANIMATION */}
      {isLikes && (
        <View pointerEvents="none" style={styles.likeBurst}>
          <Ionicons name="heart" size={42} color="#FF4D9D" />
          <Text style={styles.likeBurstText}>+1</Text>
        </View>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  STYLES                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },

  hostText: {
    flex: 1,
    marginLeft: 4,
  },

  hostName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },

  hostSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginTop: 2,
  },

  topIconButton: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
  },

  miniCount: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },

  coinPill: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 9,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },

  coinPillText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 11,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: 7,
    gap: 6,
  },

  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.42)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  infoPillText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },

  themePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  themeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  /* ---------- STAGE (hero + grid OR uniform grid) ---------- */
     stage: {
  flexDirection: 'row',
  paddingHorizontal: 0,
  gap: GAP,
  backgroundColor: '#111114',
  width: '100%',
  // no fixed height — the grid content defines it
  marginTop: 24, 
},

  heroColumn: {
    alignSelf: 'stretch',
  },

    tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
  },

  /* Shared seat tile used by host hero + filled seats */
    seatTile: {
  backgroundColor: '#111114',
  borderWidth: 0,
  borderRadius: 0,
  overflow: 'hidden',
  position: 'relative',
  alignItems: 'center',
  justifyContent: 'center',
},

      seatBoard: {
    backgroundColor: '#111114',
    borderWidth: 0,
    borderRadius: 0,
    padding: 1,             // was 3 — box touches its own edge
    alignItems: 'center',
    justifyContent: 'center',
  },

    seatInner: {
    flex: 1,
    width: '100%',
    borderRadius: 0,
    backgroundColor: '#111114',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  seatNumber: {
    position: 'absolute',
    top: 6,
    left: 8,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '700',
    zIndex: 2,
  },

  tapToJoin: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 9,
    marginTop: 5,
  },

  /* Center block used for audio-mode tiles (avatar only) */
  audioCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  seatNameScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },

  seatNameText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },

  liveBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 7,
  },

  liveBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
  },

  hostBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },

  hostBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },

  /* ---------- BOTTOM BAR ---------- */
  bottomOrb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6,10,22,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },

  requestBadge: {
    position: 'absolute',
    top: -2,
    right: 4,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#FF315F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#07101E',
  },

  requestBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },

 chatArea: {
  position: 'absolute',
  left: spacing.sm,
  right: spacing.sm,
  bottom: 110,             // ← was 76. Sits above the bottom bar.
  height: 120,             // ← slightly taller so it still feels usable
  flexDirection: 'row',
  paddingHorizontal: 0,
  zIndex: 30,
},

  sideTabs: {
    width: 42,
    gap: 2,
    justifyContent: 'flex-end',
    paddingBottom: spacing.sm,
  },

  sideTab: {
    paddingVertical: 10,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },

  sideTabText: {
    color: '#AAA',
    fontSize: 10,
  },

  sideTabTextActive: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },

  chatColumn: {
    flex: 1,
    marginLeft: 6,
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 7,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(3,7,18,0.86)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },

  bottomIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 39,
    height: 48,
    position: 'relative',
  },

  controlLabel: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },

  likeBurst: {
    position: 'absolute',
    top: '42%',
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 80,
  },

  likeBurstText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    marginTop: -7,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---------- MODAL ---------- */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },

  modalSheet: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.md,
    maxHeight: '75%',
    minHeight: '40%',
  },

  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  tabButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.sm,
  },

  tabButtonText: {
    ...type.body,
    color: colors.textMuted,
    fontWeight: '700',
  },

  tabButtonTextActive: {
    color: colors.textPrimary,
  },

  tabUnderline: {
    height: 2,
    marginTop: spacing.xs,
    borderRadius: 1,
  },

  emptyRequestsText: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  seatCountPanel: { paddingVertical: spacing.md },
  seatCountTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  seatCountHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  seatCountOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  seatCountOption: {
    minWidth: 58,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatCountOptionText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  seatCountOptionTextActive: { color: '#FFF' },

  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  requestName: {
    ...type.body,
    color: colors.textPrimary,
    flex: 1,
  },

  requestActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },

  requestApprove: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
  },

  requestApproveText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },

  requestReject: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  requestRejectText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 12,
  },
});