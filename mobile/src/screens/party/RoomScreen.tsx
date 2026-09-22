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

function gridForSeatCount(
  seatCount: number
): { cols: number; rows: number } {
  switch (seatCount) {
    case 2:
      return { cols: 2, rows: 1 };

    case 4:
      return { cols: 2, rows: 2 };

    case 6:
      return { cols: 3, rows: 2 };

    case 8:
      return { cols: 4, rows: 2 };

    case 9:
      return { cols: 3, rows: 3 };

    case 12:
      return { cols: 4, rows: 3 };

    default: {
      const cols = Math.ceil(Math.sqrt(seatCount));

      return {
        cols,
        rows: Math.ceil(seatCount / cols),
      };
    }
  }
}

export function RoomScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RoomRouteProp>();

  const {
    roomId,
    initialVideoEnabled,
  } = route.params;

  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [joinState, setJoinState] = useState<{
    token: string;
    role: 'host' | 'audience';
    channel: string;
  } | null>(null);

  // True while the host/a moderator has this user muted (seeded from the
  // join response, then kept current by 'room:moderation' events).
  const [forcedMuted, setForcedMuted] = useState(false);

  const [isManageSheetOpen, setIsManageSheetOpen] =
    useState(false);

  const [manageTab, setManageTab] =
    useState<'requests' | 'invite' | 'theme'>('requests');

  const [isToolsOpen, setIsToolsOpen] =
    useState(false);

  const [isBeautySheetOpen, setIsBeautySheetOpen] =
    useState(false);

  const [likes, setLikes] = useState(0);
  const [isLikes, setIsLikes] = useState(false);

  const [giftRecipient, setGiftRecipient] =
    useState<RoomSeatOccupant | null>(null);

  /*
   * SAFE BACK NAVIGATION
   *
   * Prevents:
   * "The action 'GO_BACK' was not handled by any navigator."
   */
  const goBackFromRoom = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  /*
   * JOIN ROOM
   */
  const joinMutation = useMutation({
    mutationFn: () => joinRoom(roomId),

    onSuccess: (result) => {
      setForcedMuted(!!result.muted);
      setJoinState({
        token: result.token,
        role: result.role,
        channel: result.room.providerChannel,
      });
    },

    onError: (error: any) => {
      // The real reason: what the server said, or that it could not be reached.
      Alert.alert('Could not join room', describeApiError(error, 'Something went wrong'));

      goBackFromRoom();
    },
  });

  useEffect(() => {
    joinMutation.mutate();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  /*
   * ROOM DATA
   */
  const roomQuery = useQuery({
    queryKey: ['rooms', roomId],

    queryFn: () => fetchRoomDetails(roomId),

    refetchInterval: 4000,

    enabled: !!joinState,
  });

  const room = roomQuery.data;

  /*
   * WALLET
   */
  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: fetchWallet,
  });

  /*
   * RANKING
   */
  const rankingQuery = useQuery({
    queryKey: ['gifts', 'ranking', 'today'],

    queryFn: () =>
      fetchHonorRanking('today'),
  });

  const topGiftToday =
    rankingQuery.data?.[0]?.honorScore ?? 0;

  /*
   * SEAT REQUESTS
   */
  const seatRequestsQuery = useQuery({
    queryKey: [
      'rooms',
      roomId,
      'seat-requests',
    ],

    queryFn: () =>
      fetchSeatRequests(roomId),

    refetchInterval: 4000,

    enabled: !!joinState,
  });

  /*
   * FOLLOWERS
   */
  const followersQuery = useQuery({
    queryKey: [
      'social',
      'followers',
    ],

    queryFn: fetchFollowersList,

    enabled:
      isManageSheetOpen &&
      manageTab === 'invite',
  });

  /*
   * INVITE
   */
  const inviteMutation = useMutation({
    mutationFn: (userId: string) =>
      inviteToSeat(roomId, userId),

    onSuccess: () => {
      Alert.alert(
        'Invited',
        'They can accept from their Party tab.'
      );
    },

    onError: (error: any) =>
      Alert.alert(
        'Could not invite',
        error?.response?.data?.message ??
          'Something went wrong'
      ),
  });

  const lockSeatMutation = useMutation({
    mutationFn: ({ seatNumber, locked }: { seatNumber: number; locked: boolean }) =>
      locked ? lockRoomSeat(roomId, seatNumber) : unlockRoomSeat(roomId, seatNumber),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', roomId] }),
    onError: (error: any) => Alert.alert('Could not change seat lock', error?.response?.data?.message ?? 'Please try again.'),
  });

  /*
   * PARTY ENGINE
   */
  const publishVideo =
    initialVideoEnabled ?? true;

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
    channelId:
      joinState?.channel ?? '',

    token:
      joinState?.token ?? '',

    userAccount:
      user?.id ?? '',

    role:
      joinState?.role ?? 'audience',

    publishVideo,

    forcedMuted,
  });

  /*
   * UID MAP
   */
  const userAccountToUid =
    new Map<string, number>();

  uidToUserAccount.forEach(
    (account, uid) => {
      userAccountToUid.set(
        account,
        uid
      );
    }
  );

  /*
   * REJOIN
   */
  const rejoin = () => {
    setJoinState(null);

    joinMutation.mutate();
  };

  /*
   * THEME
   */
  const themeColor =
    room?.themeColor ?? colors.primary;

  const isDefaultTheme =
    !room?.themeColor ||
    room.themeColor.toLowerCase() ===
      colors.primary.toLowerCase();

  /*
   * CHAT
   */
  /*
   * MODERATION EVENTS (room:moderation)
   *
   * Every event refreshes room details so seats / muted state update for
   * everyone at once. Events aimed at *this* user are then enforced:
   * MUTE / UNMUTE re-fetch a token (a muted seat-holder gets a
   * subscribe-only one, so it holds at the RTC layer, not just in the UI),
   * BAN leaves the room. KICK is picked up by the seat-removed effect.
   */
  const handleModerationEvent = (event: RoomModerationEvent) => {
    queryClient.invalidateQueries({
      queryKey: ['rooms', roomId],
    });

    if (event.targetUserId !== user?.id) return;

    switch (event.action) {
      case 'MUTE':
        setForcedMuted(true);

        Alert.alert(
          'You were muted',
          'The host muted you in this room.'
        );

        if (joinState?.role === 'host') {
          rejoin();
        }

        break;

      case 'UNMUTE':
        setForcedMuted(false);

        Alert.alert(
          'You were unmuted',
          'Tap the mic when you want to speak.'
        );

        if (mySeat) {
          rejoin();
        }

        break;

      case 'BAN':
        Alert.alert(
          'Removed from room',
          'You were banned from this room.'
        );

        goBackFromRoom();

        break;

      default:
        break;
    }
  };

  const {
    messages,
    sendMessage,
    giftEvents,
  } = useLiveChat(
    'ROOM',
    roomId,
    {
      onModeration: handleModerationEvent,

      // Host re-themed the room: patch it into the cached room details so
      // every screen colour derived from it changes immediately.
      onRoomTheme: (event) =>
        queryClient.setQueryData<
          RoomDetails | undefined
        >(
          ['rooms', roomId],
          (prev) =>
            prev
              ? {
                  ...prev,
                  themeColor:
                    event.themeColor,
                }
              : prev
        ),
    }
  );

  const chatFeedRef =
    useRef<LiveChatFeedHandle>(null);

  /*
   * GRID
   */
  const seatCount =
    room?.seatCount ?? 8;

  const {
    cols,
    rows,
  } =
    gridForSeatCount(seatCount);

  const H_PADDING =
    spacing.sm * 2;

  const GAP =
    spacing.xs;

  const gridWidth =
    screenWidth - H_PADDING;

  const tileWidth =
    (
      gridWidth -
      GAP * (cols - 1)
    ) / cols;

  const tileHeight =
    tileWidth * 1.15;

  /*
   * SEAT REQUEST
   */
  const seatMutation = useMutation({
    mutationFn: (
      seatNumber: number
    ) =>
      requestSeat(
        roomId,
        seatNumber
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'rooms',
          roomId,
        ],
      });

      rejoin();
    },

    onError: (error: any) => {
      const message =
        error?.response?.data?.message ??
        'Could not take that seat';

      if (
        room?.privacy !== 'PUBLIC'
      ) {
        Alert.alert(
          'Request sent',
          'A pending request was created — the host needs to approve it before you get a seat.'
        );
      } else {
        Alert.alert(
          'Could not take seat',
          message
        );
      }
    },
  });

  /*
   * LEAVE SEAT
   */
  const leaveSeatMutation =
    useMutation({
      mutationFn: () =>
        leaveSeat(roomId),

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            'rooms',
            roomId,
          ],
        });

        rejoin();
      },
    });

  /*
   * APPROVE
   */
  const approveMutation =
    useMutation({
      mutationFn: ({
        requestId,
        seatNumber,
      }: {
        requestId: string;
        seatNumber: number;
      }) =>
        approveSeatRequest(
          roomId,
          requestId,
          seatNumber
        ),

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            'rooms',
            roomId,
          ],
        });

        queryClient.invalidateQueries({
          queryKey: [
            'rooms',
            roomId,
            'seat-requests',
          ],
        });
      },

      onError: (error: any) =>
        Alert.alert(
          'Could not approve',
          error?.response?.data?.message ??
            'Something went wrong'
        ),
    });

  /*
   * REJECT
   */
  const rejectMutation =
    useMutation({
      mutationFn: (
        requestId: string
      ) =>
        rejectSeatRequest(
          roomId,
          requestId
        ),

      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: [
            'rooms',
            roomId,
            'seat-requests',
          ],
        }),
    });

  /*
   * REMOVE
   */
  const kickMutation =
    useMutation({
      mutationFn: (
        userId: string
      ) =>
        removeGuest(
          roomId,
          userId
        ),

      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: [
            'rooms',
            roomId,
          ],
        }),

      onError: (error: any) =>
        Alert.alert(
          'Could not remove',
          error?.response?.data?.message ??
            'Something went wrong'
        ),
    });

  /*
   * THEME (host only — the backend enforces it too)
   */
  const themeMutation =
    useMutation({
      mutationFn: (
        hex: string
      ) =>
        updateRoomTheme(
          roomId,
          hex
        ),

      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: [
            'rooms',
            roomId,
          ],
        }),

      onError: (error: any) =>
        Alert.alert(
          'Could not change theme',
          error?.response?.data?.message ??
            'Something went wrong'
        ),
    });

  /*
   * MUTE / UNMUTE
   */
  const muteMutation =
    useMutation({
      mutationFn: (
        userId: string
      ) =>
        muteGuest(
          roomId,
          userId
        ),

      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: [
            'rooms',
            roomId,
          ],
        }),

      onError: (error: any) =>
        Alert.alert(
          'Could not mute',
          error?.response?.data?.message ??
            'Something went wrong'
        ),
    });

  const unmuteMutation =
    useMutation({
      mutationFn: (
        userId: string
      ) =>
        unmuteGuest(
          roomId,
          userId
        ),

      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: [
            'rooms',
            roomId,
          ],
        }),

      onError: (error: any) =>
        Alert.alert(
          'Could not unmute',
          error?.response?.data?.message ??
            'Something went wrong'
        ),
    });

  /*
   * BAN
   */
  const banMutation =
    useMutation({
      mutationFn: (
        userId: string
      ) =>
        banGuest(
          roomId,
          userId
        ),

      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: [
            'rooms',
            roomId,
          ],
        }),

      onError: (error: any) =>
        Alert.alert(
          'Could not ban',
          error?.response?.data?.message ??
            'Something went wrong'
        ),
    });

  /*
   * ROOM PERMISSIONS
   */
  const isHost =
    room?.hostId === user?.id;

  // Where each seated person is on screen, for the flying-gift animation.
  const seatViews = useRef(new Map<string, View>());
  const resolveGiftTarget = (event: { recipientId: string }) =>
    new Promise<{ x: number; y: number } | null>((resolve) => {
      const v = seatViews.current.get(event.recipientId);
      if (!v) return resolve(null);
      v.measureInWindow((x, y, w, h) => resolve({ x: x + w / 2, y: y + h / 2 }));
    });

  const isModerator =
    room?.moderatorIds?.includes(
      user?.id ?? ''
    ) ?? false;

  const canManageRoom =
    isHost || isModerator;

  // Leaving by any route other than "Close room" (Android back, swipe-back, the
  // app closing) used to leave the room OPEN for everyone. The host is now asked
  // first, and if the screen is torn down anyway the room is closed on the way out
  // (and if even that fails, the backend closes it once the host has been gone
  // ~90 seconds).
  const roomClosedRef = useRef(false);
  const hostRef = useRef(false);
  hostRef.current = isHost;
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e: any) => {
      if (!hostRef.current || roomClosedRef.current) return;
      e.preventDefault();
      Alert.alert('Close this room?', 'As the host, leaving closes the room for everyone in it.', [
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
      ]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, roomId]);
  useEffect(
    () => () => {
      if (hostRef.current && !roomClosedRef.current) closeRoom(roomId).catch(() => {});
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roomId],
  );

  const mySeat =
    room?.seats.find(
      (s) =>
        s.userId === user?.id
    );

  /*
   * DETECT REMOVED HOST SEAT
   */
  const wasSeatedRef =
    useRef(false);

  useEffect(() => {
    if (mySeat) {
      wasSeatedRef.current =
        true;
    } else if (
      wasSeatedRef.current &&
      joinState?.role === 'host'
    ) {
      wasSeatedRef.current =
        false;

      Alert.alert(
        'Removed from seat',
        'You were removed from a seat in this room.'
      );

      rejoin();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mySeat]);

  /*
   * CLOSE ROOM
   */
  const handleClose = () => {
    if (isHost) {
      Alert.alert(
        'Close this room?',
        'This ends the room for everyone in it.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },

          {
            text: 'Close room',
            style: 'destructive',

            onPress: async () => {
              roomClosedRef.current = true;
              await closeRoom(
                roomId
              ).catch(() => {});

              goBackFromRoom();
            },
          },
        ]
      );
    } else {
      goBackFromRoom();
    }
  };

  /*
   * LIKE
   */
  const handleLike = () => {
    setLikes(
      (value) =>
        value + 1
    );

    setIsLikes(true);

    setTimeout(
      () =>
        setIsLikes(false),
      450
    );
  };

  /*
   * SOUND EFFECTS
   */
  const handleSounds = () => {
    Alert.alert(
      'Soundboard',
      'Choose a sound effect.',
      [
        {
          text: 'Applause',
          onPress: () =>
            Alert.alert(
              'Soundboard',
              'Applause effect triggered.'
            ),
        },

        {
          text: 'Cheer',
          onPress: () =>
            Alert.alert(
              'Soundboard',
              'Cheer effect triggered.'
            ),
        },

        {
          text: 'Drum Roll',
          onPress: () =>
            Alert.alert(
              'Soundboard',
              'Drum roll effect triggered.'
            ),
        },

        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  /*
   * NEXT EMPTY SEAT
   */
  const findNextEmptySeat =
    (): number | null => {
      if (!room) {
        return null;
      }

      for (
        let i = 0;
        i < room.seatCount;
        i++
      ) {
        if (
          !room.seats.some(
            (seat) =>
              seat.seatNumber === i
          )
        ) {
          return i;
        }
      }

      return null;
    };

  /*
   * EMPTY SEAT
   */
  const renderEmptySeat = (
    seatNumber: number
  ) => {
    const isSeatLocked = room?.lockedSeatNumbers?.includes(seatNumber) ?? false;
    const onEmptySeatPress = () => {
      if (canManageRoom) {
        Alert.alert(
          `Seat ${seatNumber + 1}`,
          isSeatLocked ? 'This seat is locked.' : 'Choose what to do with this seat.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: isSeatLocked ? 'Unlock seat' : 'Lock seat',
              onPress: () => lockSeatMutation.mutate({ seatNumber, locked: !isSeatLocked }),
            },
            !isSeatLocked ? {
              text: 'Invite someone',
              onPress: () => { setManageTab('invite'); setIsManageSheetOpen(true); },
            } : undefined,
          ].filter(Boolean) as any,
        );
        return;
      }
      if (isSeatLocked) {
        Alert.alert('Seat locked', 'The host has locked this seat.');
        return;
      }
      seatMutation.mutate(seatNumber);
    };

    return (
    <Pressable
      key={`empty-${seatNumber}`}
      style={[
        styles.seatBoard,

        {
          width: tileWidth,
          height: tileHeight,

          borderRadius:
            radii.md,

          borderColor:
            `${themeColor}55`,
        },
      ]}
      disabled={seatMutation.isPending || lockSeatMutation.isPending || !!mySeat}
      onPress={onEmptySeatPress}
    >
      <View
        style={[
          styles.seatInner,

          {
            borderRadius:
              radii.md - 3,

            backgroundColor:
              `${themeColor}22`,
          },
        ]}
      >
        <Text
          style={styles.seatNumber}
        >
          {seatNumber + 1}
        </Text>

        {isSeatLocked ? (
          <Ionicons name="lock-closed" size={30} color={themeColor} />
        ) : (
          <SofaIcon
            width={tileWidth * 0.62}
            height={tileHeight * 0.34}
            color="#B4B4BF"
          />
        )}

        <Text style={styles.tapToJoin}>
          {isSeatLocked ? 'Locked' : canManageRoom ? 'Tap to manage' : 'Tap to join'}
        </Text>
      </View>
    </Pressable>
  );
  };

  /*
   * FILLED SEAT
   */
  const renderFilledSeat = (
    seatNumber: number,
    occupant: RoomSeatOccupant
  ) => {
    const isMe =
      occupant.userId ===
      user?.id;

    const remoteUid =
      userAccountToUid.get(
        occupant.userId
      );

    const isPublishingVideo =
      isMe
        ? true
        : remoteUid != null &&
          remoteUids.has(
            remoteUid
          );

    const canModerate =
      canManageRoom &&
      !isMe;

    const handleTap = () => {
      if (!canModerate) {
        return;
      }

      const guestName =
        occupant.displayName ??
        'Guest';

      const isGuestMuted =
        room?.mutedUserIds?.includes(
          occupant.userId
        ) ?? false;

      // Android alerts show at most 3 buttons, so remove/ban live one
      // level down.
      Alert.alert(
        guestName,

        'Moderate this guest',

        [
          {
            text: 'Cancel',
            style: 'cancel',
          },

          {
            text: isGuestMuted
              ? 'Unmute'
              : 'Mute',

            onPress: () =>
              isGuestMuted
                ? unmuteMutation.mutate(
                    occupant.userId
                  )
                : muteMutation.mutate(
                    occupant.userId
                  ),
          },

          {
            text: 'Remove or ban…',

            onPress: () =>
              Alert.alert(
                guestName,

                'Choose an action',

                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },

                  {
                    text: 'Remove from seat',

                    onPress: () =>
                      kickMutation.mutate(
                        occupant.userId
                      ),
                  },

                  {
                    text: 'Ban from room',

                    style: 'destructive',

                    onPress: () =>
                      banMutation.mutate(
                        occupant.userId
                      ),
                  },
                ]
              ),
          },
        ]
      );
    };

    return (
      <Pressable
        key={`filled-${seatNumber}`}
        // remembered so a gift can fly to this seat
        collapsable={false}
        ref={(r) => {
          if (r) seatViews.current.set(occupant.userId, r as unknown as View);
          else seatViews.current.delete(occupant.userId);
        }}
        style={[
          styles.seatFilled,

          {
            width:
              tileWidth,

            height:
              tileHeight,

            borderRadius:
              radii.md,

            borderColor:
              isMe
                ? themeColor
                : 'rgba(255,255,255,0.10)',
          },
        ]}
        disabled={!canModerate}
        onPress={handleTap}
      >
        {isPublishingVideo ? (
          <AgoraVideoView
            uid={
              isMe
                ? 0
                : remoteUid!
            }
            style={
              StyleSheet.absoluteFill
            }
          />
        ) : (
          <Avatar
            name={
              occupant.displayName
            }
            size={Math.min(
              tileHeight * 0.6,
              72
            )}
          />
        )}

        <LinearGradient
          colors={[
            'transparent',
            'rgba(0,0,0,0.82)',
          ]}
          style={
            styles.seatNameScrim
          }
        >
          <Text
            style={
              styles.seatNameText
            }
            numberOfLines={1}
          >
            {isMe
              ? 'You'
              : occupant.displayName ??
                'Guest'}
          </Text>
        </LinearGradient>

        {isMe && (
          <View
            style={[
              styles.liveBadge,
              {
                backgroundColor:
                  themeColor,
              },
            ]}
          >
            <Text
              style={
                styles.liveBadgeText
              }
            >
              YOU
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  /*
   * SEAT GRID
   */
  const renderSeatGrid = () => {
    const rowsArray: React.ReactNode[] =
      [];

    for (
      let r = 0;
      r < rows;
      r++
    ) {
      const cells: React.ReactNode[] =
        [];

      for (
        let c = 0;
        c < cols;
        c++
      ) {
        const seatIndex =
          r * cols + c;

        if (
          seatIndex >=
          seatCount
        ) {
          cells.push(
            <View
              key={`spacer-${seatIndex}`}
              style={{
                width:
                  tileWidth,

                height:
                  tileHeight,
              }}
            />
          );
        } else {
          const occupant =
            room?.seats.find(
              (seat) =>
                seat.seatNumber ===
                seatIndex
            );

          cells.push(
            occupant
              ? renderFilledSeat(
                  seatIndex,
                  occupant
                )
              : renderEmptySeat(
                  seatIndex
                )
          );
        }
      }

      rowsArray.push(
        <View
          key={`row-${r}`}
          style={{
            flexDirection:
              'row',

            gap: GAP,

            marginBottom:
              r < rows - 1
                ? GAP
                : 0,
          }}
        >
          {cells}
        </View>
      );
    }

    return (
      <View
        style={{
          paddingHorizontal:
            spacing.sm,
        }}
      >
        {rowsArray}
      </View>
    );
  };

  return (
    <View style={styles.root}>

      {/* BACKGROUND */}
      {isDefaultTheme ? (
        <GradientBackground
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <LinearGradient
          colors={[
            themeColor,
            '#0F0F18',
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 0,
            y: 1,
          }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* HEADER */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop:
              insets.top + 6,
          },
        ]}
      >
        <Avatar
          name={room?.title}
          size={36}
        />

        <View
          style={
            styles.hostText
          }
        >
          <Text
            style={
              styles.hostName
            }
            numberOfLines={1}
          >
            {room?.title ??
              'Party Room'}
          </Text>

          <Text
            style={
              styles.hostSub
            }
          >
            ID: {roomId.slice(0, 8)}
          </Text>
        </View>

        {/* LIKE */}
        <Pressable
          style={[
            styles.topIconButton,

            isLikes && {
              backgroundColor:
                themeColor,
            },
          ]}
          onPress={handleLike}
        >
          <Ionicons
            name="heart"
            size={16}
            color="#FFF"
          />

          {likes > 0 && (
            <Text
              style={
                styles.miniCount
              }
            >
              {likes}
            </Text>
          )}
        </Pressable>

        {/* RANKING */}
        <Pressable
          style={
            styles.topIconButton
          }
          onPress={() =>
            navigation.navigate(
              'HonorRanking'
            )
          }
        >
          <Ionicons
            name="trophy"
            size={16}
            color="#FFF"
          />
        </Pressable>

        {/* COINS */}
        <View
          style={
            styles.coinPill
          }
        >
          <Ionicons
            name="diamond"
            size={11}
            color="#FFD45A"
          />

          <Text
            style={
              styles.coinPillText
            }
          >
            {
              walletQuery.data
                ?.coin ?? '—'
            }
          </Text>
        </View>

        {/* CLOSE */}
        <Pressable
          onPress={handleClose}
          style={
            styles.topIconButton
          }
        >
          <Ionicons
            name="close"
            size={20}
            color="#FFF"
          />
        </Pressable>
      </View>

      {/* INFO */}
      <View
        style={
          styles.infoRow
        }
      >
        <Pressable
          style={
            styles.infoPill
          }
          onPress={() =>
            Alert.alert(
              'Room Rules',
              'Be respectful — no harassment or hate speech.\n\nNo nudity or sexual content.\n\nNo scams or attempts to move payments outside the app.\n\nHosts and moderators may remove or ban guests who break these rules.'
            )
          }
        >
          <Ionicons
            name="book-outline"
            size={11}
            color="#FFF"
          />

          <Text
            style={
              styles.infoPillText
            }
          >
            Rules
          </Text>
        </Pressable>

        <Pressable
          style={
            styles.infoPill
          }
          onPress={() =>
            navigation.navigate(
              'HonorRanking'
            )
          }
        >
          <Ionicons
            name="podium-outline"
            size={11}
            color="#FFD45A"
          />

          <Text
            style={
              styles.infoPillText
            }
          >
            Top{' '}
            {rankingQuery.isLoading
              ? '...'
              : topGiftToday.toLocaleString()}
          </Text>
        </Pressable>

        <View
          style={{
            flex: 1,
          }}
        />

        <View
          style={[
            styles.themePill,
            {
              borderColor:
                `${themeColor}99`,
            },
          ]}
        >
          <View
            style={[
              styles.themeDot,
              {
                backgroundColor:
                  themeColor,
              },
            ]}
          />

          <Text
            style={
              styles.infoPillText
            }
          >
            Live
          </Text>
        </View>
      </View>

      {/* SEATS */}
      {renderSeatGrid()}

      {/* CHAT */}
      <View
        style={
          styles.chatArea
        }
      >
        <View
          style={
            styles.sideTabs
          }
        >
          <View
            style={[
              styles.sideTab,
              {
                backgroundColor:
                  themeColor,
              },
            ]}
          >
            <Text
              style={
                styles.sideTabTextActive
              }
            >
              All
            </Text>
          </View>

          <View
            style={
              styles.sideTab
            }
          >
            <Text
              style={
                styles.sideTabText
              }
            >
              Room
            </Text>
          </View>

          <View
            style={
              styles.sideTab
            }
          >
            <Text
              style={
                styles.sideTabText
              }
            >
              Chat
            </Text>
          </View>
        </View>

        <View
          style={
            styles.chatColumn
          }
        >
          <LiveChatFeed
            ref={
              chatFeedRef
            }
            messages={
              messages
            }
            sendMessage={
              sendMessage
            }
            fill
          />
        </View>
      </View>

      {/* BOTTOM LIVE CONTROLS */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom:
              insets.bottom + 6,
          },
        ]}
      >
        {/* CHAT */}
        <Pressable
          style={
            styles.bottomIcon
          }
          onPress={() =>
            chatFeedRef.current?.focus()
          }
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={23}
            color="#FFF"
          />

          <Text
            style={
              styles.controlLabel
            }
          >
            Chat
          </Text>
        </Pressable>

        {/* MIC */}
        {mySeat && (
          <Pressable
            style={
              styles.bottomIcon
            }
            onPress={
              forcedMuted
                ? () =>
                    Alert.alert(
                      'You are muted',
                      'The host has muted you in this room.'
                    )
                : toggleMic
            }
          >
            <Ionicons
              name={
                isMicMuted
                  ? 'mic-off'
                  : 'mic'
              }
              size={22}
              color={
                isMicMuted
                  ? '#FF4D67'
                  : '#3DF5A0'
              }
            />

            <Text
              style={
                styles.controlLabel
              }
            >
              {isMicMuted
                ? 'Muted'
                : 'Mic'}
            </Text>
          </Pressable>
        )}

        {/* BEAUTY */}
        {mySeat && (
          <Pressable
            style={
              styles.bottomIcon
            }
            onPress={() =>
              setIsBeautySheetOpen(
                true
              )
            }
          >
            <Ionicons
              name="sparkles"
              size={22}
              color={
                themeColor
              }
            />

            <Text
              style={
                styles.controlLabel
              }
            >
              Beauty
            </Text>
          </Pressable>
        )}

        {/* CAMERA */}
        <Pressable
          style={
            styles.bottomIcon
          }
          onPress={() => {
            if (mySeat) {
              switchCamera();
            } else {
              Alert.alert(
                'Join a seat',
                'Tap an empty seat to join the mic first.'
              );
            }
          }}
        >
          <Ionicons
            name="camera-reverse-outline"
            size={22}
            color="#FFF"
          />

          <Text
            style={
              styles.controlLabel
            }
          >
            Camera
          </Text>
        </Pressable>

        {/* SOUNDS */}
        <Pressable
          style={
            styles.bottomIcon
          }
          onPress={
            handleSounds
          }
        >
          <Ionicons
            name="musical-notes-outline"
            size={22}
            color="#00E5FF"
          />

          <Text
            style={
              styles.controlLabel
            }
          >
            Sounds
          </Text>
        </Pressable>

        {/* PK */}
        <Pressable
          style={
            styles.bottomIcon
          }
          onPress={() =>
            navigation.navigate(
              'PkScreen'
            )
          }
        >
          <View
            style={[
              styles.controlOrb,
              {
                borderColor:
                  '#FFC24B',
              },
            ]}
          >
            <Ionicons
              name="flash"
              size={15}
              color="#FFC24B"
            />
          </View>

          <Text
            style={
              styles.controlLabel
            }
          >
            PK
          </Text>
        </Pressable>

        {/* GAMES */}
        <Pressable
          style={
            styles.bottomIcon
          }
          onPress={() =>
            navigation.navigate(
              'GameCenter'
            )
          }
        >
          <View
            style={[
              styles.controlOrb,
              {
                backgroundColor:
                  themeColor,
              },
            ]}
          >
            <Ionicons
              name="game-controller"
              size={16}
              color="#FFF"
            />
          </View>

          <Text
            style={
              styles.controlLabel
            }
          >
            Games
          </Text>
        </Pressable>

        {/* GIFTS */}
        <Pressable
          style={
            styles.bottomIcon
          }
          onPress={() => {
            const others =
              (
                room?.seats ??
                []
              ).filter(
                (seat) =>
                  seat.userId !==
                  user?.id
              );

            if (
              others.length ===
              0
            ) {
              Alert.alert(
                'No one to gift',
                'Wait for someone else to take a seat first.'
              );

              return;
            }

            Alert.alert(
              'Send a gift to',
              undefined,

              others
                .map(
                  (seat) => ({
                    text:
                      seat.displayName ??
                      'Guest',

                    onPress: () =>
                      setGiftRecipient(
                        seat
                      ),
                  })
                )

                .concat([
                  {
                    text:
                      'Cancel',
                    style:
                      'cancel',
                  } as any,
                ])
            );
          }}
        >
          <View
            style={[
              styles.controlOrb,
              {
                backgroundColor:
                  themeColor,
              },
            ]}
          >
            <Ionicons
              name="gift"
              size={15}
              color="#FFF"
            />
          </View>

          <Text
            style={
              styles.controlLabel
            }
          >
            Gift
          </Text>
        </Pressable>

        {/* TOOLS */}
        <Pressable
          style={
            styles.bottomIcon
          }
          onPress={() =>
            setIsToolsOpen(
              true
            )
          }
        >
          <Ionicons
            name="grid-outline"
            size={22}
            color="#FFF"
          />

          <Text
            style={
              styles.controlLabel
            }
          >
            Tools
          </Text>
        </Pressable>

        {/* MANAGE */}
        {canManageRoom && (
          <Pressable
            style={
              styles.bottomIcon
            }
            onPress={() =>
              setIsManageSheetOpen(
                true
              )
            }
          >
            <Ionicons
              name="people-outline"
              size={22}
              color="#FFF"
            />

            <Text
              style={
                styles.controlLabel
              }
            >
              Manage
            </Text>

            {seatRequestsQuery
              .data &&
              seatRequestsQuery
                .data.length >
                0 && (
                <View
                  style={
                    styles.notificationDot
                  }
                />
              )}
          </Pressable>
        )}
      </View>

      {/* MANAGEMENT SHEET */}
      <Modal
        visible={
          isManageSheetOpen
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setIsManageSheetOpen(
            false
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={[
              styles.modalSheet,
              {
                paddingBottom:
                  insets.bottom +
                  spacing.md,
              },
            ]}
          >
            <View
              style={
                styles.tabRow
              }
            >
              <Pressable
                style={
                  styles.tabButton
                }
                onPress={() =>
                  setManageTab(
                    'requests'
                  )
                }
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    manageTab ===
                      'requests' &&
                      styles.tabButtonTextActive,
                  ]}
                >
                  Requests
                  {seatRequestsQuery
                    .data
                    ?.length
                    ? ` (${seatRequestsQuery.data.length})`
                    : ''}
                </Text>

                {manageTab ===
                  'requests' && (
                  <View
                    style={[
                      styles.tabUnderline,
                      {
                        backgroundColor:
                          themeColor,
                      },
                    ]}
                  />
                )}
              </Pressable>

              <Pressable
                style={
                  styles.tabButton
                }
                onPress={() =>
                  setManageTab(
                    'invite'
                  )
                }
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    manageTab ===
                      'invite' &&
                      styles.tabButtonTextActive,
                  ]}
                >
                  Invite
                </Text>

                {manageTab ===
                  'invite' && (
                  <View
                    style={[
                      styles.tabUnderline,
                      {
                        backgroundColor:
                          themeColor,
                      },
                    ]}
                  />
                )}
              </Pressable>

              {isHost && (
                <Pressable
                  style={
                    styles.tabButton
                  }
                  onPress={() =>
                    setManageTab(
                      'theme'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      manageTab ===
                        'theme' &&
                        styles.tabButtonTextActive,
                    ]}
                  >
                    Theme
                  </Text>

                  {manageTab ===
                    'theme' && (
                    <View
                      style={[
                        styles.tabUnderline,
                        {
                          backgroundColor:
                            themeColor,
                        },
                      ]}
                    />
                  )}
                </Pressable>
              )}

              <View
                style={{
                  flex: 1,
                }}
              />

              <Pressable
                onPress={() =>
                  setIsManageSheetOpen(
                    false
                  )
                }
                style={
                  styles.closeButton
                }
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={
                    colors.textPrimary
                  }
                />
              </Pressable>
            </View>

            {manageTab ===
              'theme' && isHost && (
              <RoomThemeSwatches
                selected={
                  themeColor
                }
                pending={
                  themeMutation.isPending
                }
                onSelect={(hex) =>
                  themeMutation.mutate(
                    hex
                  )
                }
              />
            )}

            {manageTab ===
            'theme' ? null : manageTab ===
            'requests' ? (
              <FlatList
                data={
                  seatRequestsQuery.data ??
                  []
                }
                keyExtractor={(
                  request
                ) =>
                  request.id
                }
                ListEmptyComponent={
                  <Text
                    style={
                      styles.emptyRequestsText
                    }
                  >
                    No pending
                    requests.
                  </Text>
                }
                renderItem={({
                  item,
                }: {
                  item: SeatRequestRow;
                }) => (
                  <View
                    style={
                      styles.requestRow
                    }
                  >
                    <Text
                      style={
                        styles.requestName
                      }
                      numberOfLines={
                        1
                      }
                    >
                      {item.displayName ??
                        'Guest'}
                    </Text>

                    <View
                      style={
                        styles.requestActions
                      }
                    >
                      <Pressable
                        style={[
                          styles.requestApprove,
                          {
                            backgroundColor:
                              themeColor,
                          },
                        ]}
                        onPress={() => {
                          const seat =
                            findNextEmptySeat();

                          if (
                            seat ==
                            null
                          ) {
                            Alert.alert(
                              'Room full',
                              'No empty seats available.'
                            );

                            return;
                          }

                          approveMutation.mutate(
                            {
                              requestId:
                                item.id,

                              seatNumber:
                                seat,
                            }
                          );
                        }}
                      >
                        <Text
                          style={
                            styles.requestApproveText
                          }
                        >
                          Approve
                        </Text>
                      </Pressable>

                      <Pressable
                        style={
                          styles.requestReject
                        }
                        onPress={() =>
                          rejectMutation.mutate(
                            item.id
                          )
                        }
                      >
                        <Text
                          style={
                            styles.requestRejectText
                          }
                        >
                          Reject
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              />
            ) : (
              <FlatList
                data={
                  followersQuery.data ??
                  []
                }
                keyExtractor={(
                  follower
                ) =>
                  follower.id
                }
                ListEmptyComponent={
                  <Text
                    style={
                      styles.emptyRequestsText
                    }
                  >
                    {followersQuery.isLoading
                      ? 'Loading...'
                      : "You don't have any followers to invite yet."}
                  </Text>
                }
                renderItem={({
                  item,
                }) => (
                  <View
                    style={
                      styles.requestRow
                    }
                  >
                    <Text
                      style={
                        styles.requestName
                      }
                      numberOfLines={
                        1
                      }
                    >
                      {item.displayName ??
                        'User'}
                    </Text>

                    <Pressable
                      style={[
                        styles.requestApprove,
                        {
                          backgroundColor:
                            themeColor,
                        },
                      ]}
                      disabled={
                        inviteMutation.isPending
                      }
                      onPress={() =>
                        inviteMutation.mutate(
                          item.id
                        )
                      }
                    >
                      <Text
                        style={
                          styles.requestApproveText
                        }
                      >
                        Invite
                      </Text>
                    </Pressable>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* A sent gift flies to the receiver's seat — visible to everyone in the room */}
      <GiftFlyOverlay events={giftEvents} meId={user?.id} bottomInset={insets.bottom} resolveTarget={resolveGiftTarget} />

      {/* GIFT */}
      {giftRecipient && (
        <GiftSheet
          visible={
            !!giftRecipient
          }
          onClose={() =>
            setGiftRecipient(
              null
            )
          }
          recipientId={
            giftRecipient.userId
          }
          context="ROOM"
          contextId={roomId}
          recipientName={
            giftRecipient.displayName ??
            'Guest'
          }
        />
      )}

      {/* TOOLS / BEAUTY */}
      <LiveToolsSheet
        visible={
          isToolsOpen ||
          isBeautySheetOpen
        }
        onClose={() => {
          setIsToolsOpen(
            false
          );

          setIsBeautySheetOpen(
            false
          );
        }}
        isHost={isHost}
        sessionTitle={
          room?.title ??
          'Party Room'
        }
        switchCamera={
          switchCamera
        }
        isMicMuted={
          isMicMuted
        }
        toggleMic={
          toggleMic
        }
        beauty={beauty}
        setBeauty={
          setBeauty
        }
        background={
          background
        }
        setBackground={
          setBackground
        }
        faceShape={
          faceShape
        }
        setFaceShape={
          setFaceShape
        }
        initialPanel={
          isBeautySheetOpen
            ? 'beauty'
            : undefined
        }
      />

      {/* LIKE ANIMATION */}
      {isLikes && (
        <View
          pointerEvents="none"
          style={
            styles.likeBurst
          }
        >
          <Ionicons
            name="heart"
            size={42}
            color="#FF4D9D"
          />

          <Text
            style={
              styles.likeBurstText
            }
          >
            +1
          </Text>
        </View>
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    root: {
      flex: 1,
    },

    topBar: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 8,

      paddingHorizontal:
        spacing.sm,

      paddingBottom:
        spacing.sm,
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
      color:
        'rgba(255,255,255,0.5)',

      fontSize: 10,

      marginTop: 2,
    },

    topIconButton: {
      minWidth: 34,
      height: 34,

      paddingHorizontal: 8,

      borderRadius: 17,

      backgroundColor:
        'rgba(0,0,0,0.4)',

      alignItems:
        'center',

      justifyContent:
        'center',

      flexDirection:
        'row',

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

      backgroundColor:
        'rgba(0,0,0,0.4)',

      alignItems:
        'center',

      justifyContent:
        'center',

      flexDirection:
        'row',

      gap: 4,
    },

    coinPillText: {
      color: '#FFF',
      fontWeight: '800',
      fontSize: 11,
    },

    infoRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        spacing.sm,

      paddingBottom: 7,

      gap: 6,
    },

    infoPill: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 4,

      backgroundColor:
        'rgba(0,0,0,0.42)',

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
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 5,

      backgroundColor:
        'rgba(0,0,0,0.42)',

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

    seatBoard: {
      backgroundColor:
        'rgba(255,255,255,0.06)',

      borderWidth: 1,

      padding: 3,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    seatInner: {
      flex: 1,

      width: '100%',

      alignItems:
        'center',

      justifyContent:
        'center',

      overflow: 'hidden',
    },

    seatNumber: {
      position:
        'absolute',

      top: 6,
      left: 8,

      color:
        'rgba(255,255,255,0.55)',

      fontSize: 11,

      fontWeight: '700',

      zIndex: 2,
    },

    tapToJoin: {
      color:
        'rgba(255,255,255,0.45)',

      fontSize: 9,

      marginTop: 5,
    },

    seatFilled: {
      backgroundColor:
        'rgba(255,255,255,0.04)',

      borderWidth: 1.5,

      alignItems:
        'center',

      justifyContent:
        'center',

      overflow: 'hidden',
    },

    seatNameScrim: {
      position:
        'absolute',

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
      position:
        'absolute',

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

    chatArea: {
      flex: 1,

      flexDirection:
        'row',

      marginTop:
        spacing.sm,

      paddingHorizontal:
        spacing.sm,
    },

    sideTabs: {
      width: 42,

      gap: 2,

      justifyContent:
        'flex-end',

      paddingBottom:
        spacing.sm,
    },

    sideTab: {
      paddingVertical: 10,

      borderTopRightRadius: 8,

      borderBottomRightRadius: 8,

      backgroundColor:
        'rgba(255,255,255,0.08)',

      alignItems:
        'center',
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
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-around',

      paddingTop: 6,

      paddingHorizontal: 3,

      backgroundColor:
        'rgba(0,0,0,0.62)',

      borderTopWidth: 1,

      borderTopColor:
        'rgba(255,255,255,0.08)',
    },

    bottomIcon: {
      alignItems:
        'center',

      justifyContent:
        'center',

      minWidth: 39,

      height: 48,

      position:
        'relative',
    },

    controlLabel: {
      color:
        'rgba(255,255,255,0.82)',

      fontSize: 8,

      fontWeight: '600',

      marginTop: 2,
    },

    controlOrb: {
      width: 29,
      height: 29,

      borderRadius: 15,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderWidth: 1.5,
    },

    notificationDot: {
      position:
        'absolute',

      top: 3,
      right: 1,

      width: 9,
      height: 9,

      borderRadius: 5,

      backgroundColor:
        '#FF4D4D',
    },

    likeBurst: {
      position:
        'absolute',

      top: '42%',

      alignSelf:
        'center',

      alignItems:
        'center',

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

      borderRadius:
        radii.pill,

      backgroundColor:
        colors.surfaceRaised,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    modalOverlay: {
      flex: 1,

      backgroundColor:
        'rgba(0,0,0,0.6)',

      justifyContent:
        'flex-end',
    },

    modalSheet: {
      backgroundColor:
        colors.surfaceRaised,

      borderTopLeftRadius:
        radii.xl,

      borderTopRightRadius:
        radii.xl,

      padding:
        spacing.md,

      maxHeight: '75%',

      minHeight: '40%',
    },

    tabRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginBottom:
        spacing.sm,

      borderBottomWidth: 1,

      borderBottomColor:
        colors.borderLight,
    },

    tabButton: {
      paddingVertical:
        spacing.sm,

      paddingHorizontal:
        spacing.sm,

      marginRight:
        spacing.sm,
    },

    tabButtonText: {
      ...type.body,

      color:
        colors.textMuted,

      fontWeight:
        '700',
    },

    tabButtonTextActive: {
      color:
        colors.textPrimary,
    },

    tabUnderline: {
      height: 2,

      marginTop:
        spacing.xs,

      borderRadius: 1,
    },

    emptyRequestsText: {
      ...type.body,

      color:
        colors.textSecondary,

      textAlign:
        'center',

      paddingVertical:
        spacing.lg,
    },

    requestRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      paddingVertical:
        spacing.sm,

      borderBottomWidth: 1,

      borderBottomColor:
        colors.borderLight,
    },

    requestName: {
      ...type.body,

      color:
        colors.textPrimary,

      flex: 1,
    },

    requestActions: {
      flexDirection:
        'row',

      gap:
        spacing.xs,
    },

    requestApprove: {
      paddingHorizontal:
        spacing.sm,

      paddingVertical: 6,

      borderRadius:
        radii.sm,
    },

    requestApproveText: {
      color: '#FFF',
      fontWeight: '700',
      fontSize: 12,
    },

    requestReject: {
      paddingHorizontal:
        spacing.sm,

      paddingVertical: 6,

      borderRadius:
        radii.sm,

      backgroundColor:
        'rgba(255,255,255,0.1)',
    },

    requestRejectText: {
      color:
        colors.textSecondary,

      fontWeight:
        '700',

      fontSize: 12,
    },
  });