import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

interface SectionListProps {
  onOpenBackpack: () => void;
  onOpenStreamerCenter: () => void;
  onOpenVideoCreator: () => void;
  onOpenHelpCenter: () => void;
  onOpenWatchHistory: () => void;
  onOpenAgency: () => void;
  onOpenPayoutAccount: () => void;
  onOpenKyc: () => void;
  onOpenBlocked: () => void;
  onLogout: () => void;
  // Real account state for the two rows that show a status.
  kycVerified: boolean;
  agencyName?: string | null;
}

// Every row opens a real screen, and every badge is real state. Removed:
// Builder Center, Level Privileges and Achievement Poster (no such features),
// App Language and Follow Us (no destination), and the invented badges
// ("3 equipped", "Lv.28", "Crown Talent", and "Approved" shown to everyone).
export const SectionList: React.FC<SectionListProps> = (props) => {
  const { palette } = useTheme();
  const styles = makeStyles(palette);
  const creatorGroup: { label: string; sub?: string; icon: string; color: string; action: () => void }[] = [
    { label: 'Streamer Center', sub: 'Earnings, missions and payouts', icon: 'tv-outline', color: palette.chipPurple, action: props.onOpenStreamerCenter },
    { label: 'Video Creator Center', sub: 'Upload and manage your videos', icon: 'bulb-outline', color: palette.chipOrange, action: props.onOpenVideoCreator },
  ];

  const accountGroup: {
    label: string;
    badge?: string;
    badgeColor?: string;
    badgeTextColor?: string;
    icon: string;
    color: string;
    action: () => void;
  }[] = [
    { label: 'My Backpack', icon: 'briefcase-outline', color: palette.chipPink, action: props.onOpenBackpack },
    { label: 'Help Center', icon: 'headset-outline', color: palette.chipTeal, action: props.onOpenHelpCenter },
    { label: 'Watch History', icon: 'time-outline', color: palette.chipBlue, action: props.onOpenWatchHistory },
    { label: 'Payout account', icon: 'card-outline', color: palette.chipGreen, action: props.onOpenPayoutAccount },
    { label: 'My Agency', badge: props.agencyName ?? undefined, icon: 'business-outline', color: palette.chipPurple, action: props.onOpenAgency },
    {
      label: 'Identity Verification',
      badge: props.kycVerified ? 'Verified' : 'Not verified',
      badgeColor: props.kycVerified ? '#ECFDF5' : undefined,
      badgeTextColor: props.kycVerified ? '#059669' : undefined,
      icon: 'shield-checkmark-outline',
      color: palette.chipGreen,
      action: props.onOpenKyc,
    },
    { label: 'Blocked Users', icon: 'ban-outline', color: palette.chipRed, action: props.onOpenBlocked },
  ];

  return (
    <View style={styles.container}>
      {/* Creator Center Group */}
      <View style={styles.card}>
        {creatorGroup.map((item, idx) => (
          <Pressable
            key={idx}
            onPress={item.action}
            style={[styles.row, idx > 0 && styles.borderTop]}
          >
            <View style={styles.left}>
              <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.itemTitle}>{item.label}</Text>
                {item.sub && <Text style={styles.itemSub}>{item.sub}</Text>}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#B4B0C4" />
          </Pressable>
        ))}
      </View>

      {/* Account Settings Group */}
      <View style={styles.card}>
        {accountGroup.map((item, idx) => (
          <Pressable
            key={idx}
            onPress={item.action}
            style={[styles.row, idx > 0 && styles.borderTop]}
          >
            <View style={styles.left}>
              <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.itemTitle}>{item.label}</Text>
            </View>

            <View style={styles.right}>
              {item.badge && (
                <View
                  style={[
                    styles.badgeChip,
                    item.badgeColor ? { backgroundColor: item.badgeColor } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      item.badgeTextColor ? { color: item.badgeTextColor } : null,
                    ]}
                  >
                    {item.badge}
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color="#B4B0C4" />
            </View>
          </Pressable>
        ))}
      </View>

      {/* Log Out Button */}
      <Pressable onPress={props.onLogout} style={styles.logoutBtn}>
        <Ionicons name="log-out-outline" size={18} color="#E11D48" />
        <Text style={styles.logoutText}>Log Out of RRyda</Text>
      </Pressable>
    </View>
  );
};

const makeStyles = (palette: typeof colors) => StyleSheet.create({
  container: {
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#EFEDF6',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#EFEDF6',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#221F33',
  },
  itemSub: {
    fontSize: 10,
    color: '#9490A6',
    marginTop: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  logoutBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  logoutText: {
    color: '#E11D48',
    fontSize: 13,
    fontWeight: '800',
  },
});
