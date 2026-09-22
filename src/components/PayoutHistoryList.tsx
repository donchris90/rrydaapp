import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchMyWithdrawals, type WithdrawableWallet, type WithdrawalStatus } from '../api/creators';
import { useTheme } from '../context/ThemeContext';
import { formatMinor } from '../utils/money';

const STATUS_LABEL: Record<WithdrawalStatus, string> = {
  PENDING_REVIEW: 'Under review',
  APPROVED: 'Approved',
  PROCESSING: 'Processing',
  PAID: 'Paid',
  FAILED: 'Failed',
  REJECTED: 'Rejected',
};

function statusColor(status: WithdrawalStatus): string {
  if (status === 'PAID') return '#10B981';
  if (status === 'FAILED' || status === 'REJECTED') return '#EF4444';
  return '#F59E0B'; // in progress
}

// The requester's own payout history for one wallet. Shared by the creator
// payout box and the agency owner's, so both show the same statuses. Funds
// are reserved the moment a request is made, so a FAILED or REJECTED row
// means the coins were released back to the balance.
export function PayoutHistoryList({ walletType, limit = 10 }: { walletType: WithdrawableWallet; limit?: number }) {
  const { palette } = useTheme();
  const query = useQuery({
    queryKey: ['withdrawals', 'mine', walletType],
    queryFn: () => fetchMyWithdrawals({ walletType, limit }),
  });

  if (query.isLoading) return <ActivityIndicator color={palette.violet} />;
  if (query.isError) {
    return <Text style={[styles.note, { color: palette.textSecondary }]}>Could not load payout history.</Text>;
  }
  const rows = query.data ?? [];
  if (rows.length === 0) {
    return <Text style={[styles.note, { color: palette.textSecondary }]}>No payout requests yet.</Text>;
  }

  return (
    <View>
      {rows.map((w) => (
        <View key={w.id} style={[styles.row, { borderBottomColor: palette.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.amount, { color: palette.textPrimary }]}>
              {w.netMinor !== null ? formatMinor(w.netMinor, w.currencyCode) : `${w.amountCoins.toLocaleString('en-US')} coins`}
              {w.netMinor !== null ? ` (${w.amountCoins.toLocaleString('en-US')} coins)` : ''}
            </Text>
            <Text style={[styles.date, { color: palette.textMuted }]}>
              {new Date(w.requestedAt).toLocaleDateString()}
              {w.bankName ? ` • ${w.bankName} ••••${w.accountLast4}` : ''}
              {w.failureReason ? ` • ${w.failureReason}` : ''}
            </Text>
          </View>
          <Text style={[styles.status, { color: statusColor(w.status) }]}>{STATUS_LABEL[w.status]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: 11, lineHeight: 17 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1 },
  amount: { fontSize: 12, fontWeight: '800' },
  date: { fontSize: 9, marginTop: 2 },
  status: { fontSize: 10, fontWeight: '900' },
});
