import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
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
  inviteToSeat,
  type RoomSeatOccupant,
  type SeatRequestRow,
} from '../../api/rooms';
import { fetchFollowersList } from '../../api/social';
import { useAuth } from '../../auth/AuthContext';
import { usePartyRoomEngine } from '../../live/usePartyRoomEngine';
import { useLiveChat } from '../../live/useLiveChat';
import { LiveChatFeed, type LiveChatFeedHandle } from '../../components/LiveChatFeed';
import { GiftSheet } from '../../components/GiftSheet';
import { LiveToolsSheet } from '../../components/LiveToolsSheet';
import { fetchWallet } from '../../api/feed';
import { fetchHonorRanking } from '../../api/ranking';
import { AgoraVideoView } from '../../components/AgoraVideoView';
import { Avatar } from '../../components/Avatar';
import { SofaIcon } from '../../components/SofaIcon';
import { colors, radii, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

type RoomRouteProp = RouteProp<AppStackParamList, 'Room'>;

// Exact grid dimensions per seat count. Not "at most N columns" — the
// exact number of columns each layout should use, so the rows always
// come out even.
//
//   2 seats  → 1 row × 2 cols
//   4 seats  → 2 rows × 2 cols
//   6 seats  → 2 rows × 3 cols
//   8 seats  → 2 rows × 4 cols
//   9 seats  → 3 rows × 3 cols
//   12 seats → 3 rows × 4 cols
//
// Falls back to a computed grid for any seat count not in this list.
function gridForSeatCount(seatCount: number): { cols: number; rows: number } {
  switch (seatCount) {
    case 2:  return { cols: 2, rows: 1 };
    case 4:  return { cols: 2, rows: 2 };
    case 6:  return { cols: 3, rows: 2 };
    case 8:  return { cols: 4, rows: 2 };
    case 9:  return { cols: 3, rows: 3 };
    case 12: return { cols: 4, rows: 3 };
    default: {
      // Generic fallback for any other seat count — pick the column
      // count that gives the most square-ish overall grid.
      const cols = Math.ceil(Math.sqrt(seatCount));
      const rows = Math.ceil(seatCount / cols);
      return { cols, rows };
    }
  }
}

export function RoomScreen() {
  const navigation = useNavigation();
  const route = useRoute<RoomRouteProp>();
  const { roomId, initialVideoEnabled } = route.params;
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [joinState, setJoinState] = useState<{
    token: string;
    role: 'host' | 'audience';
    channel: string;
  } | null>(null);

  const joinMutation = useMutation({
    mutationFn: () => joinRoom(roomId),
    onSuccess: (result) => {
      setJoinState({
        token: result.token,
        role: result.role,
        channel: result.room.providerChannel,
      });
    },
    onError: (error: any) => {
      Alert.alert(
        'Could not join room',
        error?.response?.data?.message ?? 'Something went wrong'
      );
      navigation.goBack();
    },
  });

  React.useEffect(() => {
    joinMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const roomQuery = useQuery({
    queryKey: ['rooms', roomId],
    queryFn: () => fetchRoomDetails(roomId),
    refetchInterval: 4000,
    enabled: !!joinState,
  });

  // Real wallet balance and real top-gift-today figure — replacing what
  // were previously hardcoded "0" and "30,000,000" display values with
  // actual data from endpoints that already existed elsewhere in this
  // app (fetchWallet backs the coin purchase flow; fetchHonorRanking
  // backs HonorRankingScreen), just never wired into this screen.
  const walletQuery = useQuery({ queryKey: ['wallet'], queryFn: fetchWallet });
  const rankingQuery = useQuery({ queryKey: ['gifts', 'ranking', 'today'], queryFn: () => fetchHonorRanking('today') });
  const topGiftToday = rankingQuery.data?.[0]?.honorScore ?? 0;

  const [isManageSheetOpen, setIsManageSheetOpen] = useState(false);
  const [manageTab, setManageTab] = useState<'requests' | 'invite'>('requests');
  const seatRequestsQuery = useQuery({
    queryKey: ['rooms', roomId, 'seat-requests'],
    queryFn: () => fetchSeatRequests(roomId),
    refetchInterval: 4000,
  });

  const followersQuery = useQuery({
    queryKey: ['social', 'followers'],
    queryFn: fetchFollowersList,
    enabled: isManageSheetOpen && manageTab === 'invite',
  });
  const inviteMutation = useMutation({
    mutationFn: (userId: string) => inviteToSeat(roomId, userId),
    onSuccess: () => Alert.alert('Invited', 'They can accept from their Party tab.'),
    onError: (error: any) =>
      Alert.alert('Could not invite', error?.response?.data?.message ?? 'Something went wrong'),
  });

  const [publishVideo] = useState(initialVideoEnabled ?? true);

  const {
    isJoined,
    remoteUids,
    uidToUserAccount,
    error,
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
  });

  const userAccountToUid = new Map<string, number>();
  uidToUserAccount.forEach((account, uid) => userAccountToUid.set(account, uid));

  const rejoin = () => {
    setJoinState(null);
    joinMutation.mutate();
  };

  const room = roomQuery.data;

  const { messages, sendMessage } = useLiveChat('ROOM', roomId);
  const chatFeedRef = useRef<LiveChatFeedHandle>(null);
  const [giftRecipient, setGiftRecipient] = useState<RoomSeatOccupant | null>(null);
  const [isBeautySheetOpen, setIsBeautySheetOpen] = useState(false);

  // ── Responsive seat sizing ──────────────────────────────────────
  const seatCount = room?.seatCount ?? 8;
  const { cols, rows } = gridForSeatCount(seatCount);

  const H_PADDING = spacing.sm * 2;
  const GAP = spacing.xs;
  const gridWidth = screenWidth - H_PADDING;
  const tileWidth = (gridWidth - GAP * (cols - 1)) / cols;
  const tileHeight = tileWidth * 1.15;

  const seatMutation = useMutation({
    mutationFn: (seatNumber: number) => requestSeat(roomId, seatNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] });
      rejoin();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? 'Could not take that seat';
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

  const leaveSeatMutation = useMutation({
    mutationFn: () => leaveSeat(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] });
      rejoin();
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ requestId, seatNumber }: { requestId: string; seatNumber: number }) =>
      approveSeatRequest(roomId, requestId, seatNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId, 'seat-requests'] });
    },
    onError: (error: any) =>
      Alert.alert('Could not approve', error?.response?.data?.message ?? 'Something went wrong'),
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => rejectSeatRequest(roomId, requestId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId, 'seat-requests'] }),
  });

  const kickMutation = useMutation({
    mutationFn: (userId: string) => removeGuest(roomId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', roomId] }),
    onError: (error: any) =>
      Alert.alert('Could not remove', error?.response?.data?.message ?? 'Something went wrong'),
  });

  const banMutation = useMutation({
    mutationFn: (userId: string) => banGuest(roomId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', roomId] }),
    onError: (error: any) =>
      Alert.alert('Could not ban', error?.response?.data?.message ?? 'Something went wrong'),
  });

  const isHost = room?.hostId === user?.id;
  const isModerator = room?.moderatorIds?.includes(user?.id ?? '') ?? false;
  const canManageRoom = isHost || isModerator;
  const mySeat = room?.seats.find((s) => s.userId === user?.id);

  const wasSeatedRef = React.useRef(false);
  React.useEffect(() => {
    if (mySeat) {
      wasSeatedRef.current = true;
    } else if (wasSeatedRef.current && joinState?.role === 'host') {
      wasSeatedRef.current = false;
      Alert.alert('Removed from seat', 'You were removed from a seat in this room.');
      rejoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mySeat]);

  const handleClose = () => {
    if (isHost) {
      Alert.alert('Close this room?', 'This ends the room for everyone in it.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close room',
          style: 'destructive',
          onPress: async () => {
            await closeRoom(roomId).catch(() => {});
            navigation.goBack();
          },
        },
      ]);
    } else {
      navigation.goBack();
    }
  };

  const findNextEmptySeat = (): number | null => {
    if (!room) return null;
    for (let i = 0; i < room.seatCount; i++) {
      if (!room.seats.some((s) => s.seatNumber === i)) return i;
    }
    return null;
  };

  const renderEmptySeat = (seatNumber: number) => (
    <Pressable
      key={`empty-${seatNumber}`}
      style={[
        styles.seatBoard,
        { width: tileWidth, height: tileHeight, borderRadius: radii.md },
      ]}
      disabled={seatMutation.isPending || !!mySeat}
      onPress={() => seatMutation.mutate(seatNumber)}
    >
      <View style={[styles.seatInner, { borderRadius: radii.md - 3 }]}>
        <Text style={styles.seatNumber}>{seatNumber + 1}</Text>
        <SofaIcon
          width={tileWidth * 0.55}
          height={tileHeight * 0.35}
          color="#B4B4BF"
        />
      </View>
    </Pressable>
  );

  const renderFilledSeat = (seatNumber: number, occupant: RoomSeatOccupant) => {
    const isMe = occupant.userId === user?.id;
    const remoteUid = userAccountToUid.get(occupant.userId);
    const isPublishingVideo = isMe ? true : remoteUid != null && remoteUids.has(remoteUid);
    const canModerate = canManageRoom && !isMe;

    const handleTap = () => {
      if (!canModerate) return;
      Alert.alert(occupant.displayName ?? 'Guest', 'Moderate this guest', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove from seat', onPress: () => kickMutation.mutate(occupant.userId) },
        {
          text: 'Ban from room',
          style: 'destructive',
          onPress: () => banMutation.mutate(occupant.userId),
        },
      ]);
    };

    return (
      <Pressable
        key={`filled-${seatNumber}`}
        style={[
          styles.seatFilled,
          { width: tileWidth, height: tileHeight, borderRadius: radii.md },
        ]}
        disabled={!canModerate}
        onPress={handleTap}
      >
        {isPublishingVideo ? (
          <AgoraVideoView
            uid={isMe ? 0 : remoteUid!}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <Avatar name={occupant.displayName} size={Math.min(tileHeight * 0.6, 72)} />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={styles.seatNameScrim}
        >
          <Text style={styles.seatNameText} numberOfLines={1}>
            {isMe ? 'You' : occupant.displayName ?? 'Guest'}
          </Text>
        </LinearGradient>
      </Pressable>
    );
  };

  // Explicit rows — this is the fix. Instead of flexWrap on a single
  // container (which wraps unpredictably when children have pixel
  // widths plus gaps), we build one View per row, each with exactly
  // `cols` children. No wrapping logic, no rounding errors — the grid
  // always has exactly the shape gridForSeatCount() declares.
  const renderSeatGrid = () => {
    const rowsArray: React.ReactNode[] = [];
    for (let r = 0; r < rows; r++) {
      const cells: React.ReactNode[] = [];
      for (let c = 0; c < cols; c++) {
        const seatIndex = r * cols + c;
        if (seatIndex >= seatCount) {
          // Fill any trailing cell with an invisible spacer so the
          // row doesn't stretch to center the last real seat.
          cells.push(
            <View key={`spacer-${seatIndex}`} style={{ width: tileWidth, height: tileHeight }} />
          );
        } else {
          const occupant = room?.seats.find((s) => s.seatNumber === seatIndex);
          cells.push(
            occupant ? renderFilledSeat(seatIndex, occupant) : renderEmptySeat(seatIndex)
          );
        }
      }
      rowsArray.push(
        <View
          key={`row-${r}`}
          style={{
            flexDirection: 'row',
            gap: GAP,
            marginBottom: r < rows - 1 ? GAP : 0,
          }}
        >
          {cells}
        </View>
      );
    }
    return <View style={{ paddingHorizontal: spacing.sm }}>{rowsArray}</View>;
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#3E2E6E', '#1E1440']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Avatar name={room?.title} size={36} />
        <View style={styles.hostText}>
          <Text style={styles.hostName} numberOfLines={1}>
            {room?.title ?? 'Room'}
          </Text>
          <Text style={styles.hostSub}>ID: {roomId.slice(0, 8)}</Text>
        </View>
        <Pressable style={styles.topIconButton}>
          <Ionicons name="heart" size={16} color="#FFF" />
        </Pressable>
        <Pressable style={styles.topIconButton}>
          <Ionicons name="trophy" size={16} color="#FFF" />
        </Pressable>
        <View style={styles.coinPill}>
          <Text style={styles.coinPillText}>{walletQuery.data?.coin ?? '—'}</Text>
        </View>
        <Pressable onPress={handleClose} style={styles.topIconButton}>
          <Ionicons name="close" size={20} color="#FFF" />
        </Pressable>
      </View>

      {/* Stats row — Hour/PK-count/16.48% removed: no backend data exists
          for any of them, and I don't know what the percentage was even
          meant to represent, so I'm not inventing a number for it. Rule
          now opens real static content instead of doing nothing. */}
      <View style={styles.statsRow}>
        <Pressable
          style={styles.ruleBadge}
          onPress={() =>
            Alert.alert(
              'Room Rules',
              'Be respectful — no harassment or hate speech.\n\nNo nudity or sexual content.\n\nNo scams or attempts to move payments outside the app.\n\nHosts and moderators may remove or ban guests who break these rules.',
            )
          }
        >
          <Ionicons name="book-outline" size={11} color="#FFF" />
          <Text style={styles.ruleText}>Rule</Text>
        </Pressable>
      </View>

      {/* Ranking row — real figure now, not a hardcoded "30,000,000".
          The Gift Gallery badge that used to sit here is removed for the
          same reason as the stats above: no backend feature exists for
          it anywhere in this app. */}
      <View style={styles.teamRow}>
        <View style={{ flex: 1 }} />
        <LinearGradient
          colors={['#FFC24B', '#E66B08']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.luckyRankBadge}
        >
          <Text style={styles.luckyRankTitle}>Top Gift Today</Text>
          <Text style={styles.luckyRankSub}>{rankingQuery.isLoading ? '...' : topGiftToday.toLocaleString()}</Text>
        </LinearGradient>
      </View>

      {/* Seat grid — explicit rows */}
      {renderSeatGrid()}

      {/* Chat */}
      <View style={styles.chatArea}>
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
          <LiveChatFeed ref={chatFeedRef} messages={messages} sendMessage={sendMessage} fill />
        </View>
      </View>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 6 }]}>
        <Pressable style={styles.bottomIcon} onPress={() => chatFeedRef.current?.focus()}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FFF" />
        </Pressable>
        {mySeat && (
          <Pressable style={styles.bottomIcon} onPress={toggleMic}>
            <Ionicons
              name={isMicMuted ? 'mic-off-outline' : 'mic-outline'}
              size={24}
              color={isMicMuted ? '#FF4D4D' : '#FFF'}
            />
          </Pressable>
        )}
        {mySeat && (
          <Pressable style={styles.bottomIcon} onPress={() => setIsBeautySheetOpen(true)}>
            <Ionicons name="sparkles-outline" size={24} color="#FFF" />
          </Pressable>
        )}
        <Pressable
          style={styles.bottomIcon}
          onPress={() => {
            if (mySeat) switchCamera();
            else Alert.alert('Join a seat', 'Tap an empty seat to join the mic first.');
          }}
        >
          <Ionicons name="camera-reverse-outline" size={24} color="#FFF" />
        </Pressable>
        <Pressable style={styles.bottomIcon}>
          <Ionicons name="search-outline" size={24} color="#FFF" />
        </Pressable>
        <Pressable style={styles.bottomIcon} onPress={() => navigation.navigate('PkScreen')}>
          <Text style={styles.pkLabel}>PK</Text>
        </Pressable>

        <Pressable style={styles.bottomIcon} onPress={() => navigation.navigate('GameCenter')}>
          <View style={styles.gameCircle}>
            <Ionicons name="game-controller" size={18} color="#FFF" />
          </View>
        </Pressable>

        <Pressable
          style={styles.bottomIcon}
          onPress={() => {
            const others = (room?.seats ?? []).filter((s) => s.userId !== user?.id);
            if (others.length === 0) {
              Alert.alert('No one to gift', 'Wait for someone else to take a seat first.');
              return;
            }
            Alert.alert(
              'Send a gift to',
              undefined,
              others
                .map((s) => ({
                  text: s.displayName ?? 'Guest',
                  onPress: () => setGiftRecipient(s),
                }))
                .concat([{ text: 'Cancel', style: 'cancel' } as any])
            );
          }}
        >
          <View style={styles.giftCircle}>
            <Ionicons name="gift" size={16} color="#FFF" />
          </View>
        </Pressable>

        {canManageRoom && (
          <Pressable style={styles.bottomIcon} onPress={() => setIsManageSheetOpen(true)}>
            <Ionicons name="people-outline" size={24} color="#FFF" />
            {seatRequestsQuery.data && seatRequestsQuery.data.length > 0 && (
              <View style={styles.notificationDot} />
            )}
          </Pressable>
        )}
      </View>

      {/* Manage sheet */}
      <Modal
        visible={isManageSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsManageSheetOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.tabRow}>
              <Pressable style={styles.tabButton} onPress={() => setManageTab('requests')}>
                <Text
                  style={[
                    styles.tabButtonText,
                    manageTab === 'requests' && styles.tabButtonTextActive,
                  ]}
                >
                  Requests
                  {seatRequestsQuery.data && seatRequestsQuery.data.length > 0
                    ? ` (${seatRequestsQuery.data.length})`
                    : ''}
                </Text>
                {manageTab === 'requests' && <View style={styles.tabUnderline} />}
              </Pressable>
              <Pressable style={styles.tabButton} onPress={() => setManageTab('invite')}>
                <Text
                  style={[
                    styles.tabButtonText,
                    manageTab === 'invite' && styles.tabButtonTextActive,
                  ]}
                >
                  Invite
                </Text>
                {manageTab === 'invite' && <View style={styles.tabUnderline} />}
              </Pressable>
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => setIsManageSheetOpen(false)} style={styles.closeButton}>
                <Ionicons name="close" size={18} color={colors.textPrimary} />
              </Pressable>
            </View>

            {manageTab === 'requests' ? (
              <FlatList
                data={seatRequestsQuery.data ?? []}
                keyExtractor={(r) => r.id}
                ListEmptyComponent={
                  <Text style={styles.emptyRequestsText}>No pending requests.</Text>
                }
                renderItem={({ item }: { item: SeatRequestRow }) => (
                  <View style={styles.requestRow}>
                    <Text style={styles.requestName} numberOfLines={1}>
                      {item.displayName ?? 'Guest'}
                    </Text>
                    <View style={styles.requestActions}>
                      <Pressable
                        style={styles.requestApprove}
                        onPress={() => {
                          const seat = findNextEmptySeat();
                          if (seat == null) {
                            Alert.alert('Room full', 'No empty seats available.');
                            return;
                          }
                          approveMutation.mutate({ requestId: item.id, seatNumber: seat });
                        }}
                      >
                        <Text style={styles.requestApproveText}>Approve</Text>
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
                keyExtractor={(f) => f.id}
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
                      style={styles.requestApprove}
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

      <LiveToolsSheet
        visible={isBeautySheetOpen}
        onClose={() => setIsBeautySheetOpen(false)}
        isHost
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
        initialPanel="beauty"
      />
    </View>
  );
}

const SIDEBAR_W = 42;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1E1440' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  hostText: { flex: 1, marginLeft: 4 },
  hostName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  hostSub: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 },
  topIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinPill: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinPillText: { color: '#FFF', fontWeight: '800', fontSize: 12 },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingBottom: 6,
  },
  hourBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  hourText: { color: '#FFD700', fontSize: 11, fontWeight: '800' },
  pkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#00C853',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pkBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  percentText: { color: '#00E676', fontSize: 12, fontWeight: '800' },
  ruleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ruleText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  teamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,140,0,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  teamLabel: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  teamScore: { color: '#FFF', fontSize: 9 },
  luckyRankBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  luckyRankTitle: { color: '#5A3800', fontSize: 10, fontWeight: '900' },
  luckyRankSub: { color: '#5A3800', fontSize: 9, fontWeight: '700' },

  seatBoard: {
    backgroundColor: '#4A4A55',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatInner: {
    flex: 1,
    width: '100%',
    backgroundColor: '#6E6E7A',
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
    zIndex: 1,
  },

  seatFilled: {
    backgroundColor: '#2A1A4A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  seatNameScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  seatNameText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  chatArea: {
    flex: 1,
    flexDirection: 'row',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  sideTabs: {
    width: SIDEBAR_W,
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
  sideTabActive: { backgroundColor: '#6B4EFF' },
  sideTabText: { color: '#AAA', fontSize: 10 },
  sideTabTextActive: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  chatColumn: { flex: 1, marginLeft: 6 },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomIcon: { alignItems: 'center', justifyContent: 'center', width: 44, height: 44 },
  pkLabel: { color: '#FFD700', fontWeight: '900', fontSize: 17, letterSpacing: 0.5 },
  giftCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FF1493',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#7B4DFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4D4D',
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  emptyRequestsText: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  requestName: { ...type.body, color: colors.textPrimary, flex: 1 },
  requestActions: { flexDirection: 'row', gap: spacing.xs },
  requestApprove: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
  },
  requestApproveText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  requestReject: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  requestRejectText: { color: colors.textSecondary, fontWeight: '700', fontSize: 12 },
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
  tabButtonText: { ...type.body, color: colors.textMuted, fontWeight: '700' },
  tabButtonTextActive: { color: colors.textPrimary },
  tabUnderline: {
    height: 2,
    backgroundColor: colors.primary,
    marginTop: spacing.xs,
    borderRadius: 1,
  },
});