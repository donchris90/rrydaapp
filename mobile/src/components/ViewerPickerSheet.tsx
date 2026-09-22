import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LiveViewer } from '../api/live';
import { Avatar } from './Avatar';
import { colors, radii, spacing, type } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  viewers: LiveViewer[] | undefined;
  isLoading: boolean;
  onSelect: (viewer: LiveViewer) => void;
}

// Host-side picker. The host taps Gift in their own live session, sees
// who's watching, and picks one to send to. Sending to yourself is not
// exposed — filtering is the caller's job (a host isn't in their own
// viewer list from the backend).
export function ViewerPickerSheet({
  visible,
  onClose,
  viewers,
  isLoading,
  onSelect,
}: Props) {
  const insets = useSafeAreaInsets();

    if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000 }]} pointerEvents="box-none">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.grabber} />

          <View style={styles.header}>
            <Text style={styles.title}>Live viewers</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            {viewers && viewers.length > 0
              ? `${viewers.length} viewer${viewers.length === 1 ? '' : 's'} watching`
              : 'No viewers are currently watching'}
          </Text>

          {isLoading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginVertical: spacing.xl }}
            />
          ) : !viewers || viewers.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name="people-outline"
                size={36}
                color={colors.textMuted}
              />
              <Text style={styles.emptyTitle}>No viewers yet</Text>
              <Text style={styles.emptySub}>
                Viewers will appear here while they are watching your live.
              </Text>
            </View>
          ) : (
            <FlatList
              data={viewers}
              keyExtractor={(v) => v.userId}
              style={{ maxHeight: 380 }}
              contentContainerStyle={{ paddingTop: spacing.sm }}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.viewerRow}
                  onPress={() => onSelect(item)}
                >
                  <Avatar name={item.displayName} size={40} />
                  <View style={styles.viewerText}>
                    <Text style={styles.viewerName} numberOfLines={1}>
                      {item.displayName ?? 'Anonymous'}
                    </Text>
                    <Text style={styles.viewerSub}>
                      Joined {new Date(item.joinedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={styles.giftChip}>
                    <Ionicons name="gift" size={14} color={colors.pink} />
                    <Text style={styles.giftChipText}>Manage</Text>
                  </View>
                </Pressable>
              )}
            />
          )}
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    maxHeight: '80%',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { ...type.h2, color: colors.textPrimary },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.sm,
  },

  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
  },
  viewerText: { flex: 1 },
  viewerName: { ...type.bodyStrong, color: colors.textPrimary },
  viewerSub: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
  giftChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  giftChipText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
  },

  emptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyTitle: {
    ...type.bodyStrong,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  emptySub: {
    ...type.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
});