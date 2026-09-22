import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface AchievementBadge {
  id: string;
  name: string;
  tier: string;
  rarity: string;
  icon: string;
  colors: readonly [string, string];
  levelBadge?: string;
  description: string;
  unlockCondition: string;
  privilege: string;
}

const BADGES: AchievementBadge[] = [
  {
    id: 'top-gifter',
    name: 'Top Gifter',
    tier: 'Diamond Tier',
    rarity: 'Legendary',
    icon: 'crown',
    colors: ['#F59E0B', '#D97706'],
    levelBadge: 'Lv.5',
    description: 'Awarded to top patrons who gifted 500,000+ Diamonds in PK battles.',
    unlockCondition: '500K+ Diamonds gifted',
    privilege: 'Golden avatar halo & custom entrance chime',
  },
  {
    id: 'verified-creator',
    name: 'Verified Creator',
    tier: 'Official Talent',
    rarity: 'Epic',
    icon: 'shield-check',
    colors: ['#3B82F6', '#6366F1'],
    levelBadge: 'PRO',
    description: 'Officially verified creator partner under Crown Talent Agency.',
    unlockCondition: 'Passed KYC identity verification & Charm Level 40+',
    privilege: 'Official verification badge & priority live discovery',
  },
  {
    id: 'veteran-user',
    name: 'Veteran User',
    tier: '3+ Yrs Pioneer',
    rarity: 'Special',
    icon: 'timer-sand',
    colors: ['#A855F7', '#EC4899'],
    levelBadge: '3 YRS',
    description: 'Pioneering community anchor with 1,200+ stream hours logged.',
    unlockCondition: 'Active 1,000+ days & 1,200+ stream hours',
    privilege: 'Exclusive veteran frame & legacy profile badge',
  },
  {
    id: 'pk-warrior',
    name: 'PK Warrior',
    tier: 'Battle Master',
    rarity: 'Epic',
    icon: 'sword-cross',
    colors: ['#F43F5E', '#EA580C'],
    levelBadge: '148 W',
    description: 'Dominant live match battle combatant with 148 PK victories.',
    unlockCondition: 'Won 100+ Live Host PK battles',
    privilege: 'Custom PK entry thunder effect',
  },
];

export const UserBadges: React.FC = () => {
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);

  const handlePress = (badge: AchievementBadge) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedBadge(badge);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="ribbon" size={16} color="#F59E0B" />
          <Text style={styles.title}>User Badges</Text>
          <View style={styles.countPill}>
            <Text style={styles.countText}>{BADGES.length} Unlocked</Text>
          </View>
        </View>
        <Text style={styles.hintText}>Tap for details</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {BADGES.map((badge) => (
          <TouchableOpacity
            key={badge.id}
            onPress={() => handlePress(badge)}
            style={styles.badgeItem}
            activeOpacity={0.8}
          >
            {badge.levelBadge && (
              <View style={styles.levelPill}>
                <Text style={styles.levelText}>{badge.levelBadge}</Text>
              </View>
            )}
            <LinearGradient colors={badge.colors} style={styles.iconCircle}>
              <MaterialCommunityIcons name={badge.icon as any} size={22} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.badgeName} numberOfLines={1}>
              {badge.name}
            </Text>
            <Text style={styles.badgeTier} numberOfLines={1}>
              {badge.tier}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tooltip Modal Popover */}
      {selectedBadge && (
        <Modal
          visible={!!selectedBadge}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedBadge(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedBadge(null)}
          >
            <View style={styles.popoverCard}>
              <View style={styles.popoverHeader}>
                <LinearGradient colors={selectedBadge.colors} style={styles.popoverIcon}>
                  <MaterialCommunityIcons name={selectedBadge.icon as any} size={20} color="#FFFFFF" />
                </LinearGradient>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.popoverTitle}>{selectedBadge.name}</Text>
                  <Text style={styles.popoverSub}>{selectedBadge.tier} • {selectedBadge.rarity}</Text>
                </View>
              </View>
              <Text style={styles.popoverDesc}>{selectedBadge.description}</Text>
              <View style={styles.popoverFooter}>
                <Text style={styles.footerText}>
                  <Text style={{ fontWeight: '700' }}>Requirement: </Text>
                  {selectedBadge.unlockCondition}
                </Text>
                <Text style={[styles.footerText, { marginTop: 4 }]}>
                  <Text style={{ fontWeight: '700' }}>Perk: </Text>
                  {selectedBadge.privilege}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFEDF6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#221F33',
  },
  countPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  hintText: {
    fontSize: 11,
    color: '#9490A6',
    fontWeight: '600',
  },
  scrollContainer: {
    gap: 10,
    paddingVertical: 2,
  },
  badgeItem: {
    width: 82,
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#F9F7FD',
    borderWidth: 1,
    borderColor: '#ECE7F8',
    position: 'relative',
  },
  levelPill: {
    position: 'absolute',
    top: -4,
    right: 4,
    backgroundColor: '#FF2E7E',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#221F33',
    textAlign: 'center',
  },
  badgeTier: {
    fontSize: 9,
    color: '#9490A6',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popoverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    maxWidth: 320,
  },
  popoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  popoverIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popoverTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#221F33',
  },
  popoverSub: {
    fontSize: 11,
    color: '#9490A6',
  },
  popoverDesc: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 17,
  },
  popoverFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerText: {
    fontSize: 11,
    color: '#6B7280',
  },
});
