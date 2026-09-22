import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface VipPrivilegeBannerProps {
  vipLevel?: number;
  onPress: () => void;
}

export const VipPrivilegeBanner: React.FC<VipPrivilegeBannerProps> = ({ vipLevel = 0, onPress }) => {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <LinearGradient
        colors={['#F59E0B', '#FBBF24', '#FDE047']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.row}>
        <View style={styles.leftGroup}>
          <View style={styles.iconBox}>
            <Ionicons name="ribbon" size={18} color="#FBBF24" />
          </View>
          <View style={styles.textGroup}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {vipLevel > 0 ? `VIP ${vipLevel} Active` : 'Join VIP'}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>VIP</Text>
              </View>
            </View>
            <Text style={styles.subtitle} numberOfLines={1}>Get VIP & Enjoy Privileges</Text>
          </View>
        </View>
        <View style={styles.detailsGroup}>
          <Text style={styles.detailsText}>Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#0F172A" />
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { borderRadius: 16, padding: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leftGroup: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  iconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  textGroup: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  title: { fontSize: 13, fontWeight: '800', color: '#0F172A', flexShrink: 1 },
  badge: { marginLeft: 6, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, backgroundColor: '#0F172A' },
  badgeText: { fontSize: 9, fontWeight: '900', color: '#FCD34D', letterSpacing: 0.5 },
  subtitle: { fontSize: 11, color: 'rgba(15,23,42,0.75)', fontWeight: '500', marginTop: 2 },
  detailsGroup: { flexDirection: 'row', alignItems: 'center' },
  detailsText: { fontSize: 12, fontWeight: '700', color: '#0F172A', marginRight: 2 },
});
