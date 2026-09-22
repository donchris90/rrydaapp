import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { fetchPayoutAccount, fetchPayoutConfig, fetchPayoutQuote } from '../api/payouts';
import { requestWithdrawal, type WithdrawableWallet } from '../api/creators';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { formatMinor } from '../utils/money';
import { GradientButton } from './GradientButton';

// Withdrawing earnings, for both the creator wallet and an agency owner's. Every
// number shown here is the ADMIN's setting (what 100 coins pay, the minimum,
// the fee) or the server's own calculation — nothing is computed or assumed
// on the phone, and the payout goes to the saved payout account.
export function WithdrawPanel({ walletType, balanceCoins }: { walletType: WithdrawableWallet; balanceCoins: string | number }) {
  const { palette } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState(0);

  const configQuery = useQuery({ queryKey: ['payout', 'config'], queryFn: fetchPayoutConfig });
  const accountQuery = useQuery({ queryKey: ['payout', 'account'], queryFn: fetchPayoutAccount });
  const config = configQuery.data;

  const coins = Number(text);
  const validCoins = Number.isInteger(coins) && coins > 0;
  useEffect(() => {
    const t = setTimeout(() => setDebounced(validCoins ? coins : 0), 350);
    return () => clearTimeout(t);
  }, [text, validCoins, coins]);

  const quoteQuery = useQuery({
    queryKey: ['payout', 'quote', debounced],
    queryFn: () => fetchPayoutQuote(debounced),
    enabled: debounced > 0 && !!config?.available,
    retry: false,
  });

  const withdraw = useMutation({
    mutationFn: (amount: number) => requestWithdrawal(amount, config && config.available ? config.currencyCode : 'NGN', Crypto.randomUUID(), walletType),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['creators', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['agencies', 'me', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      Alert.alert('Withdrawal requested', 'It will be reviewed, then sent to your payout account. You can follow it in Payout history.');
    },
    onError: (e: any) => Alert.alert('Could not withdraw', e?.response?.data?.message ?? 'Please try again.'),
  });

  const box = [styles.input, { color: palette.textPrimary, borderColor: palette.border, backgroundColor: palette.surfaceRaised }];
  const muted = { color: palette.textSecondary };

  if (configQuery.isLoading || accountQuery.isLoading) return <ActivityIndicator color={palette.violet} />;
  if (configQuery.isError) return <Text style={[styles.note, muted]}>Could not load payout settings. Pull to refresh and try again.</Text>;
  if (!config || !config.available) {
    return <Text style={[styles.note, muted]}>Withdrawals are not open in your country yet. You'll be able to cash out here once they are.</Text>;
  }

  const account = accountQuery.data;
  const fee = [config.feeBps > 0 ? `${config.feeBps / 100}%` : null, config.feeFlatMinor > 0 ? formatMinor(config.feeFlatMinor, config.currencyCode) : null].filter(Boolean).join(' + ');
  const quote = quoteQuery.data;

  const needsKyc = config.requireKyc && !user?.kycVerified;

  const confirm = () => {
    if (needsKyc) return navigation.navigate('Authentication');
    if (!validCoins) return Alert.alert('Enter an amount', 'Enter a whole number of coins.');
    if (!account) return navigation.navigate('PayoutAccount');
    Alert.alert(
      'Withdraw?',
      `${coins.toLocaleString('en-US')} coins${quote ? ` → you receive ${formatMinor(quote.netMinor, config.currencyCode)}` : ''}\nto ${account.bankName} ••••${account.accountLast4} (${account.accountName})`,
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Withdraw', onPress: () => withdraw.mutate(coins) }],
    );
  };

  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.note, muted]}>Withdrawable balance: {Number(balanceCoins).toLocaleString('en-US')} coins</Text>
      <Text style={[styles.note, muted]}>
        100 coins = {formatMinor(config.minorPer100Coins, config.currencyCode)} • Minimum {config.minWithdrawalCoins.toLocaleString('en-US')} coins
        {config.maxWithdrawalCoins ? ` • Maximum ${config.maxWithdrawalCoins.toLocaleString('en-US')}` : ''}
        {fee ? ` • Fee ${fee}` : ' • No fee'}
      </Text>

      {needsKyc && (
        <View style={[styles.accountRow, { borderColor: '#F59E0B' }]}>
          <Text style={[styles.note, { flex: 1, color: palette.textPrimary }]}>Verify your identity before you can withdraw.</Text>
          <Text style={[styles.link, { color: palette.violet }]} onPress={() => navigation.navigate('Authentication')}>Verify</Text>
        </View>
      )}

      {account ? (
        <View style={styles.accountRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.accountText, { color: palette.textPrimary }]}>{account.bankName} ••••{account.accountLast4}</Text>
            <Text style={[styles.note, muted]}>{account.accountName}</Text>
          </View>
          <Text style={[styles.link, { color: palette.violet }]} onPress={() => navigation.navigate('PayoutAccount')}>Change</Text>
        </View>
      ) : (
        <View style={[styles.accountRow, { borderColor: palette.violet }]}>
          <Text style={[styles.note, { flex: 1, color: palette.textPrimary }]}>Add the bank account you want to be paid into.</Text>
          <Text style={[styles.link, { color: palette.violet }]} onPress={() => navigation.navigate('PayoutAccount')}>Add account</Text>
        </View>
      )}

      <TextInput value={text} onChangeText={setText} keyboardType="number-pad" placeholder="Amount (coins)" placeholderTextColor={palette.textMuted} style={box} />
      {debounced > 0 && (
        <Text style={[styles.note, { color: quoteQuery.isError ? '#EF4444' : palette.textPrimary }]}>
          {quoteQuery.isLoading
            ? 'Calculating…'
            : quote
              ? `You receive ${formatMinor(quote.netMinor, quote.currencyCode)} (${formatMinor(quote.grossMinor, quote.currencyCode)} minus ${formatMinor(quote.feeMinor, quote.currencyCode)} fee)`
              : 'Could not calculate that amount.'}
        </Text>
      )}
      <GradientButton
        label={withdraw.isPending ? 'Requesting...' : needsKyc ? 'Verify identity first' : account ? 'Withdraw' : 'Add payout account first'}
        loading={withdraw.isPending}
        onPress={confirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: 11, lineHeight: 17 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(120,120,140,0.25)', borderRadius: 12, padding: 10 },
  accountText: { fontSize: 13, fontWeight: '800' },
  link: { fontSize: 12, fontWeight: '800' },
});
