import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchLiveNow } from '../api/live';
import { acceptPk, challengePk, fetchIncomingPk } from '../api/pk';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from './Avatar';
import { PkOpponentPicker } from './PkOpponentPicker';
import { IncomingChallengeRow } from './PkIncoming';
import { PressableScale } from './PressableScale';
import { colors, radii, spacing, type } from '../theme';

// The PK "who do I battle" sheet: challenges waiting for you (accept) and
// live hosts you can challenge. This is the only place a challenge can be
// accepted, so it must be reachable from wherever a host is broadcasting.
//
// No matchmaking/random-opponent queue exists on the backend — only a
// direct "challenge this specific person" flow is real (see api/pk.ts).
// Battle state itself (countdown, scores, result) is not held here: it
// arrives over the socket / the active-battle query on the screen that
// opened this.
export function PkChallengeSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const incomingQuery = useQuery({
    queryKey: ['pk', 'incoming'],
    queryFn: fetchIncomingPk,
    enabled: visible,
    refetchInterval: visible ? 5000 : false,
  });

  const incoming = incomingQuery.data ?? [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>PK</Text>

          {incoming.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Challenging you</Text>
              {incoming.map((b) => (
                <IncomingChallengeRow key={b.id} battle={b} onDone={onClose} />
              ))}
            </>
          )}

          <Text style={styles.sectionLabel}>Challenge someone who is online</Text>
          <View style={{ height: 360 }}>
            <PkOpponentPicker onChallenged={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.md,
    maxHeight: '70%',
  },
  sheetTitle: { ...type.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  sectionLabel: { ...type.caption, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xs },
  incomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  incomingText: { ...type.body, color: colors.textPrimary, flex: 1 },
  acceptButton: { backgroundColor: colors.pink, borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: spacing.md },
  acceptButtonText: { ...type.caption, color: colors.textPrimary, fontWeight: '800' },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  hostName: { ...type.body, color: colors.textPrimary, flex: 1 },
  emptyText: { color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },
});
