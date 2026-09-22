import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

export interface BackpackItem {
  id: string;
  name: string;
  category: string;
  equipped: boolean;
  expiresInDays?: number;
}

interface BackpackModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BackpackItem[];
  onEquip: (itemId: string) => void;
}

export const BackpackModal: React.FC<BackpackModalProps> = ({ isOpen, onClose, items, onEquip }) => {
  const { palette } = useTheme();
  const styles = makeStyles(palette);
  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="briefcase" size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>My Backpack</Text>
                <Text style={styles.headerSubtitle}>Avatar frames, ride mounts, chat bubbles</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={palette.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {items.length === 0 && (
              <Text style={styles.emptyText}>No items yet — items you earn or buy will show up here.</Text>
            )}
            {items.map((item) => (
              <View key={item.id} style={[styles.itemCard, item.equipped && styles.itemCardEquipped]}>
                <View style={styles.itemLeft}>
                  <LinearGradient colors={['#A855F7', '#EC4899']} style={styles.itemIcon}>
                    <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                  </LinearGradient>
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemCategory}>
                      {item.category.replace('_', ' ')}
                      {item.expiresInDays ? ` · ${item.expiresInDays}d left` : ''}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => onEquip(item.id)}
                  style={[styles.equipButton, item.equipped && styles.equipButtonActive]}
                >
                  <Text style={[styles.equipButtonText, item.equipped && styles.equipButtonTextActive]}>
                    {item.equipped ? 'Equipped' : 'Equip'}
                  </Text>
                </Pressable>
              </View>
            ))}
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
  headerIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#EC4899', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: palette.textPrimary },
  headerSubtitle: { fontSize: 11, color: palette.textSecondary, marginTop: 2 },
  body: { padding: 20, gap: 10 },
  emptyText: { fontSize: 12, color: palette.textMuted, textAlign: 'center', paddingVertical: 24 },
  itemCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.bg },
  itemCardEquipped: { borderColor: '#A855F7', backgroundColor: '#FAF5FF' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  itemIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 12, fontWeight: '800', color: palette.textPrimary },
  itemCategory: { fontSize: 10, fontWeight: '600', color: palette.textMuted, marginTop: 2, textTransform: 'uppercase' },
  equipButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#E2E8F0' },
  equipButtonActive: { backgroundColor: '#9333EA' },
  equipButtonText: { fontSize: 11, fontWeight: '800', color: '#475569' },
  equipButtonTextActive: { color: '#FFFFFF' },
});
