import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { formatCoins } from '../../utils/formatters';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCoins?: string | number;
  onPurchase: (packageLabel: string) => void;
}

const COIN_PACKAGES = [
  { coins: 7000, price: '$0.99', bonus: 0, tag: 'Starter' },
  { coins: 36000, price: '$4.99', bonus: 1500, tag: 'Popular' },
  { coins: 75000, price: '$9.99', bonus: 4000, tag: 'Best Value' },
  { coins: 160000, price: '$19.99', bonus: 12000, tag: 'Top Spender' },
  { coins: 420000, price: '$49.99', bonus: 35000, tag: 'VIP Tier' },
  { coins: 900000, price: '$99.99', bonus: 90000, tag: 'Whale Deal' },
];

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, currentCoins, onPurchase }) => {
  const { palette } = useTheme();
  const styles = makeStyles(palette);
  const [selectedIdx, setSelectedIdx] = useState(1);
  const pkg = COIN_PACKAGES[selectedIdx];

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="cash" size={16} color="#B45309" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Coin Store</Text>
                <Text style={styles.headerSubtitle}>Current balance: {formatCoins(Number(currentCoins ?? 0))}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={palette.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.grid}>
              {COIN_PACKAGES.map((p, idx) => {
                const selected = selectedIdx === idx;
                return (
                  <Pressable
                    key={idx}
                    onPress={() => setSelectedIdx(idx)}
                    style={[styles.packageCard, selected && styles.packageCardSelected]}
                  >
                    {!!p.tag && (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{p.tag}</Text>
                      </View>
                    )}
                    <View style={styles.coinsRow}>
                      <Ionicons name="cash" size={14} color="#B45309" />
                      <Text style={styles.coinsText}>{formatCoins(p.coins)}</Text>
                    </View>
                    {p.bonus > 0 && (
                      <Text style={styles.bonusText}>+{formatCoins(p.bonus)} Bonus</Text>
                    )}
                    <Text style={styles.priceText}>{p.price}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={styles.purchaseButton} onPress={() => onPurchase(`${pkg.price} · ${formatCoins(pkg.coins)} coins`)}>
              <Text style={styles.purchaseButtonText}>Top Up {pkg.price}</Text>
            </Pressable>
            <Text style={styles.footnote}>Supports Paystack, Apple IAP, Google Play & local resellers.</Text>
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
  headerIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FDE68A', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: palette.textPrimary },
  headerSubtitle: { fontSize: 11, color: palette.textSecondary, marginTop: 2 },
  body: { padding: 20, gap: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  packageCard: { width: '47%', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.background },
  packageCardSelected: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  tag: { position: 'absolute', top: -8, right: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#F59E0B' },
  tagText: { fontSize: 8, fontWeight: '900', color: '#0F172A' },
  coinsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  coinsText: { fontSize: 15, fontWeight: '900', color: palette.textPrimary },
  bonusText: { fontSize: 10, fontWeight: '700', color: '#B45309', marginTop: 4 },
  priceText: { fontSize: 12, fontWeight: '800', color: palette.textSecondary, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: palette.border },
  purchaseButton: { paddingVertical: 14, borderRadius: 14, backgroundColor: '#F59E0B', alignItems: 'center' },
  purchaseButtonText: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  footnote: { fontSize: 10, textAlign: 'center', color: palette.textMuted },
});
