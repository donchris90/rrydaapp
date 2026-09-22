import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radii, spacing, type } from '../theme';
import type { AudioSeatOccupant } from './AudioSeatGrid';

export interface PendingSeatRequest {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  requestedAt: string;
}

interface SeatManagementSheetProps {
  visible: boolean;
  onClose: () => void;
  seatCount: number;
  onSelectSeatCount: (count: number) => void;
  selectedLayout?: 'grid' | 'spotlight' | 'circle';
  onSelectLayout?: (layout: 'grid' | 'spotlight' | 'circle') => void;
  requests: PendingSeatRequest[];
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  seats: AudioSeatOccupant[];
  onMuteOccupant: (userId: string) => void;
  onKickOccupant: (userId: string) => void;
  allSeatsLocked: boolean;
  onToggleLockAll: (locked: boolean) => void;
  autoApprove: boolean;
  onToggleAutoApprove: (auto: boolean) => void;
}

export function SeatManagementSheet({
  visible,
  onClose,
  seatCount,
  onSelectSeatCount,
  selectedLayout = 'grid',
  onSelectLayout,
  requests,
  onApproveRequest,
  onRejectRequest,
  seats,
  onMuteOccupant,
  onKickOccupant,
  allSeatsLocked,
  onToggleLockAll,
  autoApprove,
  onToggleAutoApprove,
}: SeatManagementSheetProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'occupants' | 'layout'>('requests');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Ionicons name="settings-outline" size={18} color={colors.primaryLight} />
              <Text style={styles.headerTitle}>Host Room Management</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Quick Room Toggles */}
          <View style={styles.togglesCard}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextWrap}>
                <Text style={styles.toggleLabel}>Lock All Empty Seats</Text>
                <Text style={styles.toggleSub}>Guests must request to sit</Text>
              </View>
              <Switch
                value={allSeatsLocked}
                onValueChange={onToggleLockAll}
                trackColor={{ false: '#3A2E59', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={[styles.toggleRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }]}>
              <View style={styles.toggleTextWrap}>
                <Text style={styles.toggleLabel}>Auto-Approve Requests</Text>
                <Text style={styles.toggleSub}>Admit guests automatically</Text>
              </View>
              <Switch
                value={autoApprove}
                onValueChange={onToggleAutoApprove}
                trackColor={{ false: '#3A2E59', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tabBtn, activeTab === 'requests' && styles.tabBtnActive]}
              onPress={() => setActiveTab('requests')}
            >
              <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
                Requests ({requests.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, activeTab === 'occupants' && styles.tabBtnActive]}
              onPress={() => setActiveTab('occupants')}
            >
              <Text style={[styles.tabText, activeTab === 'occupants' && styles.tabTextActive]}>
                Occupants ({seats.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, activeTab === 'layout' && styles.tabBtnActive]}
              onPress={() => setActiveTab('layout')}
            >
              <Text style={[styles.tabText, activeTab === 'layout' && styles.tabTextActive]}>
                Layout ({seatCount} Seats)
              </Text>
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.contentBody}>
            {activeTab === 'requests' && (
              <FlatList
                data={requests}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  <View style={styles.emptyWrap}>
                    <Ionicons name="chatbubbles-outline" size={32} color={colors.textMuted} />
                    <Text style={styles.emptyText}>No pending seat requests</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={styles.requestItem}>
                    <View style={styles.itemLeft}>
                      <View style={styles.avatarMini}>
                        <Text style={styles.avatarMiniText}>
                          {item.displayName[0]?.toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.itemName}>{item.displayName}</Text>
                        <Text style={styles.itemTime}>{item.requestedAt}</Text>
                      </View>
                    </View>
                    <View style={styles.requestActions}>
                      <Pressable
                        style={styles.approveBtn}
                        onPress={() => onApproveRequest(item.id)}
                      >
                        <Text style={styles.approveText}>Approve</Text>
                      </Pressable>
                      <Pressable
                        style={styles.rejectBtn}
                        onPress={() => onRejectRequest(item.id)}
                      >
                        <Text style={styles.rejectText}>Reject</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              />
            )}

            {activeTab === 'occupants' && (
              <FlatList
                data={seats}
                keyExtractor={(item) => item.userId}
                ListEmptyComponent={
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>No occupants seated yet</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={styles.occupantItem}>
                    <View style={styles.itemLeft}>
                      <View style={styles.seatNumBadge}>
                        <Text style={styles.seatNumText}>{item.seatNumber + 1}</Text>
                      </View>
                      <View>
                        <View style={styles.nameBadgeRow}>
                          <Text style={styles.itemName}>{item.displayName}</Text>
                          {item.isHost && (
                            <View style={styles.hostBadge}>
                              <Text style={styles.hostBadgeText}>HOST</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.itemSub}>🪙 {item.giftScore ?? 0} coins</Text>
                      </View>
                    </View>
                    {!item.isHost && (
                      <View style={styles.occupantActions}>
                        <Pressable
                          style={styles.muteBtn}
                          onPress={() => onMuteOccupant(item.userId)}
                        >
                          <Ionicons
                            name={item.isMuted ? 'mic' : 'mic-off'}
                            size={16}
                            color={item.isMuted ? colors.success : colors.danger}
                          />
                        </Pressable>
                        <Pressable
                          style={styles.kickBtn}
                          onPress={() => onKickOccupant(item.userId)}
                        >
                          <Text style={styles.kickText}>Remove</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}
              />
            )}

            {activeTab === 'layout' && (
              <View style={styles.layoutWrap}>
                <Text style={styles.sectionSubtitle}>
                  Stage Layout Style:
                </Text>
                <View style={[styles.layoutGrid, { marginBottom: spacing.md }]}>
                  {[
                    { id: 'grid' as const, name: 'Grid (Matrix)', icon: 'grid-outline' },
                    { id: 'spotlight' as const, name: 'Spotlight (Hero)', icon: 'sparkles-outline' },
                    { id: 'circle' as const, name: 'Circle (Lounge)', icon: 'disc-outline' },
                  ].map((l) => {
                    const isSelected = selectedLayout === l.id;
                    return (
                      <Pressable
                        key={l.id}
                        style={[
                          styles.layoutCard,
                          isSelected && styles.layoutCardActive,
                        ]}
                        onPress={() => onSelectLayout?.(l.id)}
                      >
                        <Ionicons
                          name={l.icon as any}
                          size={20}
                          color={isSelected ? colors.primaryLight : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.layoutCount,
                            isSelected && styles.layoutCountActive,
                          ]}
                        >
                          {l.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.sectionSubtitle}>
                  Seat Capacity:
                </Text>
                <View style={styles.layoutGrid}>
                  {[4, 6, 8, 9, 12].map((count) => {
                    const isSelected = seatCount === count;
                    return (
                      <Pressable
                        key={count}
                        style={[
                          styles.layoutCard,
                          isSelected && styles.layoutCardActive,
                        ]}
                        onPress={() => onSelectSeatCount(count)}
                      >
                        <Ionicons
                          name="grid-outline"
                          size={22}
                          color={isSelected ? colors.primaryLight : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.layoutCount,
                            isSelected && styles.layoutCountActive,
                          ]}
                        >
                          {count} Seats
                        </Text>
                        <Text style={styles.layoutDesc}>
                          {count === 4 && '2 × 2 Grid'}
                          {count === 6 && '3 × 2 Grid'}
                          {count === 8 && '4 × 2 Classic'}
                          {count === 9 && '3 × 3 King Grid'}
                          {count === 12 && '4 × 3 Grand Room'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
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
  sheetContainer: {
    backgroundColor: '#1E1438',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    maxHeight: '75%',
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  togglesCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  toggleTextWrap: {
    flex: 1,
  },
  toggleLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  toggleSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radii.md,
    padding: 3,
    marginBottom: spacing.sm,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  contentBody: {
    paddingHorizontal: spacing.md,
    minHeight: 220,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  itemName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  itemTime: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  approveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  approveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  rejectText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  occupantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  seatNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatNumText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '800',
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hostBadge: {
    backgroundColor: colors.gold,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.xs,
  },
  hostBadgeText: {
    color: '#3B2400',
    fontSize: 9,
    fontWeight: '800',
  },
  itemSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  occupantActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  muteBtn: {
    padding: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  kickBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
  },
  kickText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  layoutWrap: {
    paddingVertical: spacing.sm,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  layoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  layoutCard: {
    width: '31%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 4,
  },
  layoutCardActive: {
    borderColor: colors.primaryLight,
    backgroundColor: 'rgba(138, 79, 255, 0.18)',
  },
  layoutCount: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  layoutCountActive: {
    color: '#FFFFFF',
  },
  layoutDesc: {
    color: colors.textMuted,
    fontSize: 10,
  },
});
