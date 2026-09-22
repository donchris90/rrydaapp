import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

interface VipDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel?: number;
  onUpgrade: () => void;
}

const VIP_TIERS = [
  { level: 1, name: 'Bronze Knight', coinsReq: '50,000', perk: 'Exclusive Bronze Entry Badge & Custom Chat Color' },
  { level: 2, name: 'Silver Baron', coinsReq: '150,000', perk: 'Stealth Browsing & Special Gift Animation' },
  { level: 3, name: 'Golden Lord', coinsReq: '500,000', perk: 'Phantom Golden Pegasus Ride Mount & Priority Mic' },
  { level: 4, name: 'Platinum Duke', coinsReq: '1,500,000', perk: 'Full Room Banner Announcement on Enter' },
  { level: 5, name: 'Diamond Monarch', coinsReq: '5,000,000', perk: 'Custom 3D Avatar Halo & Dedicated Concierge' },
];

export const VipDetailsModal: React.FC<VipDetailsModalProps> = ({ isOpen, onClose, currentLevel = 0, onUpgrade }) => {
  const { palette } = useTheme();
  const styles = makeStyles(palette);
  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="ribbon" size={18} color="#FBBF24" />
              </View>
              <View>
                <Text style={styles.headerTitle}>VIP Honor Tiers</Text>
                <Text style={styles.headerSubtitle}>
                  Current: {currentLevel > 0 ? `VIP ${currentLevel}` : 'Standard Member'}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={palette.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.intro}>Spend coins across gifts and games to climb the VIP ladder and unlock perks:</Text>
            {VIP_TIERS.map((tier) => {
              const active = currentLevel === tier.level;
              return (
                <View key={tier.level} style={[styles.tierCard, active && styles.tierCardActive]}>
                  <View style={[styles.tierBadge, active && styles.tierBadgeActive]}>
                    <Text style={[styles.tierBadgeText, active && styles.tierBadgeTextActive]}>VIP {tier.level}</Text>
                  </View>
                  <View style={styles.tierInfo}>
                    <Text style={styles.tierName}>{tier.name}</Text>
                    <Text style={styles.tierPerk}>{tier.perk}</Text>
                    <Text style={styles.tierReq}>Req: {tier.coinsReq} Coins spent</Text>
                  </View>
                  {active && (
                    <View style={styles.checkCircle}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              );
            })}

            <Pressable style={styles.upgradeButton} onPress={onUpgrade}>
              <Text style={styles.upgradeButtonText}>Get VIP & Unlock Perks</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (palette: typeof colors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: palette.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: palette.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  headerIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: palette.textPrimary },
  headerSubtitle: { fontSize: 11, fontWeight: '700', color: '#B45309', marginTop: 2 },
  body: { padding: 20, gap: 12 },
  intro: { fontSize: 12, color: palette.textSecondary },
  tierCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.background, gap: 10 },
  tierCardActive: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, backgroundColor: '#E2E8F0' },
  tierBadgeActive: { backgroundColor: '#F59E0B' },
  tierBadgeText: { fontSize: 11, fontWeight: '900', color: '#475569' },
  tierBadgeTextActive: { color: '#0F172A' },
  tierInfo: { flex: 1 },
  tierName: { fontSize: 13, fontWeight: '800', color: palette.textPrimary },
  tierPerk: { fontSize: 11, color: palette.textSecondary, marginTop: 2 },
  tierReq: { fontSize: 10, fontWeight: '700', color: '#B45309', marginTop: 4 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  upgradeButton: { marginTop: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F59E0B', alignItems: 'center' },
  upgradeButtonText: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
});
