import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchIncomingPk } from '../../api/pk';
import type { AppStackParamList } from '../../navigation/types';
import { PkOpponentPicker } from '../../components/PkOpponentPicker';
import { IncomingChallengeRow } from '../../components/PkIncoming';
import { colors, spacing, type } from '../../theme';

// Start a PK battle: pick an opponent from Friends, Agency or Random — only people
// who are online right now — and challenge them. Challenges made to YOU show here
// (and pop up on screen wherever you are).
export function PkScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const insets = useSafeAreaInsets();
  const incomingQuery = useQuery({ queryKey: ['pk', 'incoming'], queryFn: fetchIncomingPk, refetchInterval: 8000 });
  const incoming = incomingQuery.data ?? [];

  return (
    <View style={styles.root}>
      <LinearGradient colors={[colors.bgElevated, colors.bgDeepest]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.topIcon} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>PK Battle</Text>
        <Pressable
          style={styles.topIcon}
          hitSlop={8}
          onPress={() => Alert.alert('About PK', 'PK is a live 1v1 battle. Gift more than your opponent before the timer ends to win. You can only challenge people who are online.')}
        >
          <Text style={styles.help}>?</Text>
        </Pressable>
        <Pressable style={styles.topIcon} hitSlop={8} onPress={() => navigation.navigate('PkHistory')}>
          <Ionicons name="time-outline" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={[styles.body, { paddingBottom: insets.bottom + spacing.md }]}>
        {incoming.length > 0 && (
          <View style={styles.incomingBox}>
            <Text style={styles.sectionLabel}>Challenging you</Text>
            {incoming.slice(0, 3).map((b) => (
              <IncomingChallengeRow key={b.id} battle={b} />
            ))}
          </View>
        )}
        <PkOpponentPicker />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeepest },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  topIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  title: { ...type.h2, color: colors.textPrimary, flex: 1 },
  help: { color: colors.textPrimary, fontWeight: '900', fontSize: 15 },
  body: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  incomingBox: { backgroundColor: 'rgba(255,46,126,0.12)', borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,46,126,0.4)' },
  sectionLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '800', marginBottom: 4 },
});
