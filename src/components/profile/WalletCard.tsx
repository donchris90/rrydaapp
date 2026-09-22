import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

interface WalletCardProps {
  // Coin amounts as strings (BigInt on the backend), undefined while loading.
  coin?: string;
  bonus?: string;
  earnings?: string;
  // Earnings only exist for approved creators.
  showEarnings: boolean;
  onBuyCoins: () => void;
  onCashOut: () => void;
}

const fmt = (v?: string) => (v === undefined ? '—' : Number(v).toLocaleString('en-US'));

// The signed-in account's real wallet balances. (This card used to show two
// fixed numbers, 84,520 coins and 342,500 in earnings with a made-up dollar
// conversion, to every user.)
export const WalletCard: React.FC<WalletCardProps> = ({ coin, bonus, earnings, showEarnings, onBuyCoins, onCashOut }) => {
  const { palette } = useTheme();
  const s = makeStyles();
  return (
    <View style={s.container}>
      <LinearGradient colors={palette.coinsGradient} style={s.card}>
        <View style={s.header}>
          <View style={s.titleRow}>
            <View style={[s.icon, { backgroundColor: 'rgba(180,83,9,0.15)' }]}>
              <Ionicons name="cash" size={14} color="#B45309" />
            </View>
            <Text style={[s.title, { color: '#92400E' }]}>My Coins</Text>
          </View>
          <Pressable onPress={onBuyCoins} style={s.action}>
            <Ionicons name="add" size={12} color="#FDE047" />
            <Text style={[s.actionText, { color: '#FDE047' }]}>Buy</Text>
          </Pressable>
        </View>
        <Text style={s.balance}>{fmt(coin)}</Text>
        {bonus !== undefined && Number(bonus) > 0 && <Text style={[s.sub, { color: '#92400E' }]}>+ {fmt(bonus)} bonus coins</Text>}
      </LinearGradient>

      {showEarnings && (
        <LinearGradient colors={palette.earningsGradient} style={s.card}>
          <View style={s.header}>
            <View style={s.titleRow}>
              <View style={[s.icon, { backgroundColor: 'rgba(190,24,93,0.15)' }]}>
                <Ionicons name="diamond" size={14} color="#BE185D" />
              </View>
              <Text style={[s.title, { color: '#9D174D' }]}>Earnings</Text>
            </View>
            <Pressable onPress={onCashOut} style={s.action}>
              <Ionicons name="arrow-up-outline" size={12} color="#F472B6" />
              <Text style={[s.actionText, { color: '#F472B6' }]}>Cash out</Text>
            </Pressable>
          </View>
          <Text style={s.balance}>{fmt(earnings)}</Text>
          <Text style={[s.sub, { color: '#9D174D' }]}>coins</Text>
        </LinearGradient>
      )}
    </View>
  );
};

const makeStyles = () =>
  StyleSheet.create({
    container: { flexDirection: 'row', gap: 10 },
    card: { flex: 1, borderRadius: 20, padding: 14, justifyContent: 'space-between', minHeight: 110, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    icon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 12, fontWeight: '800' },
    action: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
    actionText: { fontSize: 10, fontWeight: '800' },
    balance: { fontSize: 22, fontWeight: '900', color: '#1F1B2E', marginTop: 6 },
    sub: { fontSize: 10, fontWeight: '700' },
  });
