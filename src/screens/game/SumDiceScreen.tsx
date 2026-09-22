import React from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { SumDiceGame } from '../../components/dice/SumDiceGame';
import { fetchWallet } from '../../api/feed';
import type { UserRoundRecord } from '../../components/dice/luckyNumberTypes';

interface SumDiceScreenProps {
  navigation?: any;
}

/**
 * SumDiceScreen (Lucky Number / Poppo Live 3-Dice Sum 0-27)
 *
 * Previously defaulted `balance` to a hardcoded 403029 — and since
 * React Navigation never actually passed a `balance` prop into this
 * screen (it only injects `navigation`/`route`), that hardcoded default
 * was the *only* balance this screen ever showed in the real app.
 * SumDiceGame now performs its own real bet placement and invalidates
 * this wallet query on success, so the balance shown here updates from
 * the same real wallet everywhere else in the app reads from.
 */
export function SumDiceScreen({ navigation }: SumDiceScreenProps) {
  // The phone's own top and bottom bars. React Native's built-in SafeAreaView does
  // nothing on Android, which is why the Place Bet button used to sit underneath the
  // phone's navigation buttons: the space is now measured and left free.
  const insets = useSafeAreaInsets();
  const walletQuery = useQuery({ queryKey: ['wallet'], queryFn: fetchWallet });
  const balance = Number(walletQuery.data?.coin ?? '0');

  const handleClose = () => {
    if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  const handleRecordResult = (record: UserRoundRecord) => {
    if (typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production') {
      console.log('[SumDice] Round settled:', record);
    }
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 10, paddingHorizontal: 8 }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <SumDiceGame
          balance={balance}
          onClose={handleClose}
          onRecordResult={handleRecordResult}
        />
      </View>
    </View>
  );
}

// Default export for Expo / React Navigation file routing
export default SumDiceScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D1440',
  },
  // The game sits inside a rounded frame with a margin round it, so it no longer
  // fills the whole phone edge to edge.
  container: {
    flex: 1,
    backgroundColor: '#0D1440',
    borderRadius: 20,
    overflow: 'hidden',
  },
});
