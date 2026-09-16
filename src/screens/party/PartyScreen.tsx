import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, FlatList, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRoom, fetchOpenRooms, fetchMyInvites, fetchRoomDetails, acceptInvite, declineInvite, PartyRoom, type RoomInvite } from '../../api/rooms';
import { colors, gradients, glow, radii, spacing, type } from '../../theme';
import { GradientBackground } from '../../components/GradientBackground';
import { GradientButton } from '../../components/GradientButton';
import { PressableScale } from '../../components/PressableScale';
import { FadeInUp } from '../../components/FadeInUp';
import { LiveBadge } from '../../components/LiveBadge';
import { Avatar } from '../../components/Avatar';
import { SkeletonRow } from '../../components/Skeleton';
import type { AppStackParamList } from '../../navigation/types';

// Matches the reference app's Party list (title, host, live activity) as
// closely as the backend's current endpoint allows — GET /rooms doesn't
// return a live seat/member count yet (would need a join against
// RoomSeat), so this shows what's actually real: title, privacy, and
// declared seat capacity, not a fabricated "X people chatting" figure.
export function PartyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const roomsQuery = useQuery({ queryKey: ['rooms', 'open'], queryFn: fetchOpenRooms, refetchInterval: 8000 });

  const [isInvitesOpen, setIsInvitesOpen] = useState(false);
  const invitesQuery = useQuery({ queryKey: ['rooms', 'invites'], queryFn: fetchMyInvites, refetchInterval: 15000 });

  const acceptMutation = useMutation({
    mutationFn: async (invite: RoomInvite) => {
      // Need to know which seats are actually free right now to pick
      // one — the invite itself doesn't carry a seat number.
      const room = await fetchRoomDetails(invite.roomId);
      let seatNumber: number | null = null;
      for (let i = 0; i < room.seatCount; i++) {
        if (!room.seats.some((s) => s.seatNumber === i)) {
          seatNumber = i;
          break;
        }
      }
      if (seatNumber == null) throw new Error('That room is full now.');
      await acceptInvite(invite.roomId, seatNumber);
      return invite.roomId;
    },
    onSuccess: (roomId) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', 'invites'] });
      setIsInvitesOpen(false);
      navigation.navigate('Room', { roomId });
    },
    onError: (error: any) => {
      Alert.alert('Could not join', error?.response?.data?.message ?? error?.message ?? 'Something went wrong');
    },
  });

  const declineMutation = useMutation({
    mutationFn: (requestId: string) => declineInvite(requestId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', 'invites'] }),
  });

  const createMutation = useMutation({
    mutationFn: () => createRoom({ title: newTitle.trim(), privacy: 'PUBLIC', seatCount: 8 }),
    onSuccess: (room) => {
      setIsCreateOpen(false);
      setNewTitle('');
      queryClient.invalidateQueries({ queryKey: ['rooms', 'open'] });
      navigation.navigate('Room', { roomId: room.id });
    },
    onError: (error: any) => {
      Alert.alert('Could not create room', error?.response?.data?.message ?? 'Something went wrong');
    },
  });

  const renderRoom = ({ item, index }: { item: PartyRoom; index: number }) => (
    <FadeInUp index={index}>
      <PressableScale style={styles.roomCard} onPress={() => navigation.navigate('Room', { roomId: item.id })}>
        <Avatar name={item.title} size={48} />
        <View style={styles.roomInfo}>
          <Text style={styles.roomTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.roomMetaRow}>
            {item.privacy !== 'PUBLIC' && (
              <Ionicons name="lock-closed" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
            )}
            <Text style={styles.roomMeta}>{item.privacy.replace('_', ' ')}</Text>
            <Text style={styles.roomMeta}> · {item.seatCount} seats</Text>
          </View>
        </View>
        {item.status === 'OPEN' && <LiveBadge label={null} />}
      </PressableScale>
    </FadeInUp>
  );

  return (
    <GradientBackground>
      <View style={styles.header}>
        <FadeInUp index={0}>
          <Text style={styles.headerTitle}>Party</Text>
        </FadeInUp>
        <FadeInUp index={0}>
          <PressableScale onPress={() => navigation.navigate('PreRoom')}>
            <LinearGradient colors={gradients.gold} style={[styles.addButton, glow.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="add" size={24} color={colors.textOnLight} />
            </LinearGradient>
          </PressableScale>
        </FadeInUp>
      </View>

      {invitesQuery.data && invitesQuery.data.length > 0 && (
        <PressableScale style={styles.invitesBanner} onPress={() => setIsInvitesOpen(true)}>
          <Ionicons name="mail-unread" size={16} color={colors.textOnLight} />
          <Text style={styles.invitesBannerText}>
            {invitesQuery.data.length} room invite{invitesQuery.data.length === 1 ? '' : 's'} waiting
          </Text>
        </PressableScale>
      )}

      {roomsQuery.isLoading ? (
        <View style={styles.list}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      ) : (
        <FlatList
          data={roomsQuery.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderRoom}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <FadeInUp index={1}>
              <Text style={styles.empty}>No open rooms right now — start one!</Text>
            </FadeInUp>
          }
        />
      )}

      <CreateRoomModal
        visible={isCreateOpen}
        title={newTitle}
        onChangeTitle={setNewTitle}
        onCancel={() => setIsCreateOpen(false)}
        onCreate={() => createMutation.mutate()}
        isCreating={createMutation.isPending}
      />

      <Modal visible={isInvitesOpen} transparent animationType="slide" onRequestClose={() => setIsInvitesOpen(false)}>
        <View style={styles.inviteModalOverlay}>
          <View style={styles.inviteModalSheet}>
            <View style={styles.inviteModalHeader}>
              <Text style={styles.inviteModalTitle}>Room Invites</Text>
              <PressableScale onPress={() => setIsInvitesOpen(false)} style={styles.inviteModalCloseButton}>
                <Ionicons name="close" size={18} color={colors.textPrimary} />
              </PressableScale>
            </View>
            <FlatList
              data={invitesQuery.data ?? []}
              keyExtractor={(i) => i.requestId}
              ListEmptyComponent={<Text style={styles.emptyInvitesText}>No pending invites.</Text>}
              renderItem={({ item }: { item: RoomInvite }) => (
                <View style={styles.inviteRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inviteRoomTitle} numberOfLines={1}>{item.roomTitle}</Text>
                    <Text style={styles.inviteHostName}>Hosted by {item.hostDisplayName ?? 'someone'}</Text>
                  </View>
                  <View style={styles.inviteActions}>
                    <PressableScale
                      style={styles.inviteAccept}
                      onPress={() => acceptMutation.mutate(item)}
                    >
                      <Text style={styles.inviteAcceptText}>Join</Text>
                    </PressableScale>
                    <PressableScale style={styles.inviteDecline} onPress={() => declineMutation.mutate(item.requestId)}>
                      <Text style={styles.inviteDeclineText}>Decline</Text>
                    </PressableScale>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </GradientBackground>
  );
}

function CreateRoomModal({
  visible,
  title,
  onChangeTitle,
  onCancel,
  onCreate,
  isCreating,
}: {
  visible: boolean;
  title: string;
  onChangeTitle: (value: string) => void;
  onCancel: () => void;
  onCreate: () => void;
  isCreating: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, { toValue: visible ? 1 : 0, useNativeDriver: true, speed: 22, bounciness: 8 }).start();
  }, [visible, progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalCard, { opacity: progress, transform: [{ scale }] }]}>
          <Text style={styles.modalTitle}>New room</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Room title"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={onChangeTitle}
          />
          <View style={styles.modalActions}>
            <PressableScale style={styles.modalCancel} onPress={onCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </PressableScale>
            <GradientButton
              label={isCreating ? 'Creating…' : 'Create'}
              onPress={onCreate}
              disabled={!title.trim() || isCreating}
              loading={isCreating}
              style={styles.modalCreate}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: { ...type.display, color: colors.textPrimary },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roomInfo: { flex: 1 },
  roomTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  roomMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  roomMeta: { color: colors.textSecondary, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(8,4,20,0.75)', justifyContent: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: colors.surfaceRaised, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderLight },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: spacing.md },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    padding: spacing.sm,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm },
  modalCancel: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  modalCancelText: { color: colors.textSecondary, fontWeight: '600' },
  modalCreate: { flexGrow: 0, paddingHorizontal: spacing.sm },
  invitesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  invitesBannerText: { color: colors.textOnLight, fontWeight: '700', fontSize: 12 },
  inviteModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  inviteModalSheet: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.md,
    maxHeight: '60%',
  },
  inviteModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  inviteModalTitle: { ...type.h2, color: colors.textPrimary },
  inviteModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyInvitesText: { ...type.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  inviteRoomTitle: { ...type.body, color: colors.textPrimary, fontWeight: '700' },
  inviteHostName: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  inviteActions: { flexDirection: 'row', gap: spacing.xs },
  inviteAccept: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radii.sm, backgroundColor: colors.primary },
  inviteAcceptText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  inviteDecline: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radii.sm, backgroundColor: 'rgba(255,255,255,0.1)' },
  inviteDeclineText: { color: colors.textSecondary, fontWeight: '700', fontSize: 12 },
});
