import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radii, spacing, type } from '../theme';
import type { AudioSeatOccupant } from './AudioSeatGrid';

export interface GiftItem {
  id: string;
  name: string;
  coins: number;
  emoji: string;
  badge?: string;
}

export const PARTY_GIFTS: GiftItem[] = [
  { id: 'rose', name: 'Ruby Rose', coins: 1, emoji: '🌹' },
  { id: 'heart', name: 'Love Heart', coins: 10, emoji: '💖' },
  { id: 'champagne', name: 'Champagne', coins: 66, emoji: '🍾', badge: 'POPULAR' },
  { id: 'ring', name: 'Diamond Ring', coins: 188, emoji: '💍' },
  { id: 'supercar', name: 'Cyber Car', coins: 520, emoji: '🏎️', badge: 'VIP' },
  { id: 'yacht', name: 'Sunset Yacht', coins: 1314, emoji: '🛥️' },
  { id: 'castle', name: 'Grand Castle', coins: 3344, emoji: '🏰', badge: 'LUCKY' },
  { id: 'rocket', name: 'Astro Rocket', coins: 9999, emoji: '🚀', badge: 'LEGEND' },
];

interface GiftSheetProps {
  visible: boolean;
  onClose: () => void;
  seats: AudioSeatOccupant[];
  userCoinBalance: number;
  onSendGift: (gift: GiftItem, recipientId: string | 'all', comboCount: number) => void;
  onRecharge?: () => void;
}

export function GiftSheet({
  visible,
  onClose,
  seats,
  userCoinBalance,
  onSendGift,
  onRecharge,
}: GiftSheetProps) {
  const [selectedGift, setSelectedGift] = useState<GiftItem>(PARTY_GIFTS[0]);
  const [targetRecipient, setTargetRecipient] = useState<string | 'all'>('all');
  const [comboCount, setComboCount] = useState<number>(1);
  const safeSeats = Array.isArray(seats) ? seats : [];

  const totalCost = selectedGift.coins * comboCount * (targetRecipient === 'all' ? Math.max(safeSeats.length, 1) : 1);
  const canAfford = userCoinBalance >= totalCost;

  const handleSend = () => {
    if (!canAfford) return;
    onSendGift(selectedGift, targetRecipient, comboCount);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header & Wallet */}
          <View style={styles.header}>
            <View style={styles.walletPill}>
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={styles.coinBalance}>{userCoinBalance.toLocaleString()}</Text>
              <Pressable onPress={onRecharge} style={styles.rechargeBtn}>
                <Ionicons name="add" size={14} color="#FFF" />
              </Pressable>
            </View>

            <Text style={styles.sheetTitle}>Party Gifts</Text>

            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Recipient Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recipientRow}
          >
            <Pressable
              style={[
                styles.recipientChip,
                targetRecipient === 'all' && styles.recipientChipActive,
              ]}
              onPress={() => setTargetRecipient('all')}
            >
              <Ionicons
                name="people"
                size={14}
                color={targetRecipient === 'all' ? '#FFF' : colors.primaryLight}
              />
              <Text
                style={[
                  styles.recipientText,
                  targetRecipient === 'all' && styles.recipientTextActive,
                ]}
              >
                All Mic Seats ({safeSeats.length})
              </Text>
            </Pressable>

            {safeSeats.map((seat) => {
              const isSelected = targetRecipient === seat.userId;
              return (
                <Pressable
                  key={seat.userId}
                  style={[
                    styles.recipientChip,
                    isSelected && styles.recipientChipActive,
                  ]}
                  onPress={() => setTargetRecipient(seat.userId)}
                >
                  <Text style={styles.seatNumTag}>#{seat.seatNumber + 1}</Text>
                  <Text
                    style={[
                      styles.recipientText,
                      isSelected && styles.recipientTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {seat.displayName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Gift Grid */}
          <View style={styles.giftGrid}>
            {PARTY_GIFTS.map((gift) => {
              const isSelected = selectedGift.id === gift.id;
              return (
                <Pressable
                  key={gift.id}
                  style={[
                    styles.giftCard,
                    isSelected && styles.giftCardActive,
                  ]}
                  onPress={() => setSelectedGift(gift)}
                >
                  {gift.badge && (
                    <View style={styles.giftBadge}>
                      <Text style={styles.giftBadgeText}>{gift.badge}</Text>
                    </View>
                  )}
                  <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                  <Text style={styles.giftName} numberOfLines={1}>
                    {gift.name}
                  </Text>
                  <View style={styles.costRow}>
                    <Text style={styles.costCoin}>🪙</Text>
                    <Text style={styles.costText}>{gift.coins}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Footer with Combos & Send Button */}
          <View style={styles.footer}>
            {/* Combo Multipliers */}
            <View style={styles.combosRow}>
              {[1, 10, 66, 99, 520].map((num) => (
                <Pressable
                  key={num}
                  style={[
                    styles.comboPill,
                    comboCount === num && styles.comboPillActive,
                  ]}
                  onPress={() => setComboCount(num)}
                >
                  <Text
                    style={[
                      styles.comboText,
                      comboCount === num && styles.comboTextActive,
                    ]}
                  >
                    x{num}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Send CTA */}
            <Pressable
              disabled={!canAfford}
              onPress={handleSend}
              style={[styles.sendBtn, !canAfford && { opacity: 0.5 }]}
            >
              <LinearGradient
                colors={canAfford ? gradients.hero : ['#4A3E6B', '#3A3258']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendGradient}
              >
                <Text style={styles.sendText}>
                  Send {totalCost > 0 ? `(${totalCost.toLocaleString()} 🪙)` : ''}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1E1438',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.25)',
  },
  coinIcon: {
    fontSize: 12,
  },
  coinBalance: {
    color: '#FFD166',
    fontSize: 12,
    fontWeight: '800',
  },
  rechargeBtn: {
    backgroundColor: colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  recipientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  recipientChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  seatNumTag: {
    color: '#FFD166',
    fontSize: 10,
    fontWeight: '800',
  },
  recipientText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  recipientTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  giftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.xs * 1.5,
    justifyContent: 'space-between',
  },
  giftCard: {
    width: '23%',
    aspectRatio: 0.88,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    position: 'relative',
  },
  giftCardActive: {
    borderColor: colors.primaryLight,
    backgroundColor: 'rgba(138, 79, 255, 0.18)',
  },
  giftBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.pink,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  giftBadgeText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '900',
  },
  giftEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  giftName: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  costCoin: {
    fontSize: 9,
  },
  costText: {
    color: '#FFD166',
    fontSize: 10,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  combosRow: {
    flexDirection: 'row',
    gap: 4,
  },
  comboPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: radii.sm,
  },
  comboPillActive: {
    backgroundColor: colors.primary,
  },
  comboText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  comboTextActive: {
    color: '#FFFFFF',
  },
  sendBtn: {
    flex: 1,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  sendGradient: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
