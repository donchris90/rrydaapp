import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchGiftCatalog, sendGift, type Gift } from '../api/gifts';
import { fetchWallet } from '../api/feed';
import { colors, radii, spacing, type } from '../theme';

// Category tabs from the reference. Every gift currently has a
// `category: string | null` — gifts with null fall under "All".
const TABS = ['New', 'Gift', 'Lucky', 'Fan Club', 'Privilege', 'Fun'] as const;
type Tab = typeof TABS[number];

// The reference shows "Still need 50 to light up" with a filled bar at the
// top of the panel. Backed here by a real number if the backend ever sends
// it — falls back to hiding the bar entirely rather than inventing a value.
interface Props {
  visible: boolean;
  onClose: () => void;
  recipientId: string;
  context: 'LIVE' | 'ROOM';
  contextId: string;
  recipientName?: string;
}

export function GiftSheet({
  visible,
  onClose,
  recipientId,
  context,
  contextId,
  recipientName,
}: Props) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('Gift');
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [quantity, setQuantity] = useState(1);

  const catalogQuery = useQuery({
    queryKey: ['gifts', 'catalog'],
    queryFn: fetchGiftCatalog,
    enabled: visible,
  });

  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: fetchWallet,
    enabled: visible,
  });

  const gifts = catalogQuery.data ?? [];

  // Filter by tab. Categories are free-form strings on the backend, so
  // this matches loosely rather than requiring exact equality.
  const visibleGifts = useMemo(() => {
    if (tab === 'New') return gifts.slice(0, 8);
    if (tab === 'Gift') return gifts;
    const needle = tab.toLowerCase();
    return gifts.filter((g) => (g.category ?? '').toLowerCase().includes(needle));
  }, [gifts, tab]);

  const coinBalance = walletQuery.data?.coin ? Number(walletQuery.data.coin) : 0;

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGift) throw new Error('No gift selected');
      // Send `quantity` separate gifts — the backend's sendGift endpoint
      // takes one giftId per call. Batching would need a new endpoint.
      for (let i = 0; i < quantity; i++) {
        await sendGift({
          recipientId,
          giftId: selectedGift.id,
          context,
          contextId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      const total = (selectedGift?.coinPrice ?? 0) * quantity;
      Alert.alert('Sent!', `${quantity} × ${selectedGift?.name} (${total} coins)`);
      setSelectedGift(null);
      setQuantity(1);
      onClose();
    },
    onError: (error: any) => {
      Alert.alert(
        'Could not send gift',
        error?.response?.data?.message ?? 'Something went wrong. Try again.'
      );
    },
  });

  const totalCost = (selectedGift?.coinPrice ?? 0) * quantity;
  const canSend = selectedGift != null && totalCost <= coinBalance && !sendMutation.isPending;

    if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.sm }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* ── HEADER ROW ────────────────────────────────── */}
          <View style={styles.headerRow}>
            {/* Balance pill (left) */}
            <Pressable style={styles.balancePill}>
              <View style={styles.coinDot} />
              <Text style={styles.balanceText}>{coinBalance.toLocaleString()}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textPrimary} />
            </Pressable>

            <View style={{ flex: 1 }} />

            {/* Gallery pill (right) */}
            <Pressable style={styles.galleryPill}>
              <Text style={styles.galleryPillText}>Gallery</Text>
            </Pressable>
          </View>

          {/* ── PROGRESS BAR (only if we have real progress to show) ── */}
          {selectedGift && (
            <View style={styles.progressRow}>
              <View style={styles.progressIconBox}>
                <Ionicons name="gift" size={16} color="#FF1493" />
              </View>
              <Text style={styles.progressText} numberOfLines={1}>
                {totalCost > coinBalance
                  ? `Still need ${(totalCost - coinBalance).toLocaleString()} to send`
                  : `Ready to send ${quantity} × ${selectedGift.name}`}
              </Text>
            </View>
          )}

          {/* ── CATEGORY TABS ─────────────────────────────── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsRow}
          >
            {TABS.map((t) => {
              const active = tab === t;
              return (
                <Pressable key={t} onPress={() => setTab(t)} style={styles.tabButton}>
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {t}
                  </Text>
                  {active && <View style={styles.tabUnderline} />}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* ── GIFT GRID ─────────────────────────────────── */}
          {catalogQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
          ) : visibleGifts.length === 0 ? (
            <Text style={styles.emptyText}>No gifts in this category yet.</Text>
          ) : (
            <FlatList
              data={visibleGifts}
              keyExtractor={(g) => g.id}
              numColumns={4}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              contentContainerStyle={{ paddingVertical: spacing.sm }}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 340 }}
              renderItem={({ item }) => {
                const isSelected = selectedGift?.id === item.id;
                return (
                  <Pressable
                    style={[styles.giftTile, isSelected && styles.giftTileSelected]}
                    onPress={() => {
                      setSelectedGift(item);
                      setQuantity(1);
                    }}
                  >
                    <View style={styles.giftIconBox}>
                      <Ionicons name="gift" size={30} color="#FF1493" />
                    </View>
                    <Text style={styles.giftName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.giftPriceRow}>
                      <View style={styles.coinDotSmall} />
                      <Text style={styles.giftPrice}>{item.coinPrice.toLocaleString()}</Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          )}

          {/* ── BOTTOM CONTROLS ───────────────────────────── */}
          <View style={styles.bottomRow}>
            {/* Quantity selector */}
            <View style={styles.quantityGroup}>
              {[1, 10, 50].map((q) => {
                const active = quantity === q;
                return (
                  <Pressable
                    key={q}
                    onPress={() => setQuantity(q)}
                    style={[styles.quantityChip, active && styles.quantityChipActive]}
                  >
                    <Text
                      style={[
                        styles.quantityText,
                        active && styles.quantityTextActive,
                      ]}
                    >
                      {q}
                    </Text>
                  </Pressable>
                );
              })}
              {/* Custom amount button — reference shows a small icon here */}
              <Pressable style={styles.quantityCustom} onPress={() => {
                Alert.prompt?.(
                  'Custom quantity',
                  'How many?',
                  (text) => {
                    const n = parseInt(text, 10);
                    if (!isNaN(n) && n > 0) setQuantity(n);
                  }
                );
              }}>
                <Ionicons name="pencil" size={14} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Send button */}
            <Pressable
              onPress={() => sendMutation.mutate()}
              disabled={!canSend}
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            >
              <LinearGradient
                colors={['#5B6BFF', '#3A4CF0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendGradient}
              >
                {sendMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.sendText}>Send</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F0F22',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    maxHeight: '85%',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  coinDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFC21F' },
  coinDotSmall: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFC21F' },
  balanceText: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  galleryPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#5B6BFF',
  },
  galleryPillText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  progressIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,20,147,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },

  tabsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
    paddingRight: spacing.lg,
  },
  tabButton: { alignItems: 'center', paddingVertical: 4 },
  tabText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  tabTextActive: { color: colors.textPrimary, fontWeight: '900' },
  tabUnderline: {
    marginTop: 4,
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },

  giftTile: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  giftTileSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(123,77,255,0.15)',
  },
  giftIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,20,147,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  giftName: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    maxWidth: '100%',
    textAlign: 'center',
  },
  giftPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  giftPrice: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
    fontSize: 13,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  quantityGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  quantityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  quantityChipActive: { backgroundColor: colors.primary },
  quantityText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  quantityTextActive: { color: '#FFF' },
  quantityCustom: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  sendButtonDisabled: { opacity: 0.45 },
  sendGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});