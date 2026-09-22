import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LiveViewer } from '../api/live';
import { Avatar } from './Avatar';
import { colors, radii, spacing, type } from '../theme';

interface Props {
  visible: boolean;
  viewer: LiveViewer | null;
  onClose: () => void;
  onGift: () => void;
  onMute: () => void;
  onKick: () => void;
  onBan: () => void;
  onBlock: () => void;
}

export function LiveViewerActionsSheet({ visible, viewer, onClose, onGift, onMute, onKick, onBan, onBlock }: Props) {
  const insets = useSafeAreaInsets();
  if (!visible || !viewer) return null;
  const confirm = (title: string, message: string, action: () => void) =>
    Alert.alert(title, message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', style: 'destructive', onPress: action }]);

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1100, elevation: 1100 }]}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]} onPress={e => e.stopPropagation()}>
          <View style={styles.grabber} />
          <View style={styles.profileRow}>
            <Avatar name={viewer.displayName} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{viewer.displayName ?? 'Anonymous'}</Text>
              <Text style={styles.sub}>Viewer in your live</Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}><Ionicons name="close" size={19} color={colors.textPrimary} /></Pressable>
          </View>

          <Action icon="gift-outline" label="Send Gift" onPress={onGift} />
          <Action icon="volume-mute-outline" label="Mute from Chat" onPress={() => confirm('Mute viewer?', 'They will not be able to send chat messages in this live until unmuted.', onMute)} />
          <Action icon="person-remove-outline" label="Kick from Live" onPress={() => confirm('Kick viewer?', 'They will be removed from this live but can join again.', onKick)} />
          <Action icon="ban-outline" label="Ban from Live" danger onPress={() => confirm('Ban viewer?', 'They will be removed now and blocked from rejoining this live.', onBan)} />
          <Action icon="hand-left-outline" label="Block User" danger onPress={() => confirm('Block user?', 'Blocking is persistent and also prevents normal social interaction with this user.', onBlock)} />
        </Pressable>
      </Pressable>
    </View>
  );
}

function Action({ icon, label, onPress, danger = false }: { icon: any; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable style={styles.action} onPress={onPress}>
      <View style={[styles.iconBox, danger && styles.dangerBox]}><Ionicons name={icon} size={20} color={danger ? '#FF5A6F' : colors.textPrimary} /></View>
      <Text style={[styles.actionText, danger && styles.dangerText]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surfaceRaised, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: spacing.md },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.md },
  name: { ...type.bodyStrong, color: colors.textPrimary },
  sub: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  dangerBox: { backgroundColor: 'rgba(255,90,111,0.12)' },
  actionText: { ...type.body, color: colors.textPrimary, flex: 1 },
  dangerText: { color: '#FF5A6F' },
});
