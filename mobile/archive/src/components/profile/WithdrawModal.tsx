import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { formatCoins } from '../../utils/formatters';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableEarnings?: string | number;
  onWithdraw: (amountDiamonds: number, destination: string) => void;
}

const PRESET_AMOUNTS = [50000, 100000, 250000];
const MIN_CASHOUT = 50000;

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, availableEarnings, onWithdraw }) => {
  const { palette } = useTheme();
  const styles = makeStyles(palette);
  const [amount, setAmount] = useState(PRESET_AMOUNTS[0]);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const availableEarningsNum = Number(availableEarnings ?? 0);
  const estimatedUsd = (amount / 1000).toFixed(2);

  const handleSubmit = () => {
    if (amount < MIN_CASHOUT) {
      setError(`Minimum cashout is ${formatCoins(MIN_CASHOUT)} Diamonds ($${(MIN_CASHOUT / 1000).toFixed(2)}).`);
      return;
    }
    if (availableEarnings !== undefined && amount > availableEarningsNum) {
      setError('Insufficient creator earnings balance for this amount.');
      return;
    }
    if (!bankName.trim() || !accountNumber.trim()) {
      setError('Enter a payout account before requesting a cashout.');
      return;
    }
    setError(null);
    onWithdraw(amount, `${bankName.trim()} · ${accountNumber.trim()}`);
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="diamond" size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Creator Cashout</Text>
                <Text style={styles.headerSubtitle}>Available: {formatCoins(availableEarningsNum)} Diamonds</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={palette.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#BE123C" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Text style={styles.label}>Select Cashout Amount</Text>
            <View style={styles.presetRow}>
              {PRESET_AMOUNTS.map((amt) => {
                const selected = amount === amt;
                return (
                  <Pressable
                    key={amt}
                    onPress={() => setAmount(amt)}
                    style={[styles.presetButton, selected && styles.presetButtonSelected]}
                  >
                    <Text style={[styles.presetAmount, selected && styles.presetAmountSelected]}>{formatCoins(amt)}</Text>
                    <Text style={styles.presetUsd}>≈ ${(amt / 1000).toFixed(0)}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.payoutRow}>
              <Text style={styles.payoutLabel}>Estimated Payout</Text>
              <Text style={styles.payoutValue}>${estimatedUsd} USD</Text>
            </View>

            <Text style={styles.label}>Bank / Payout Account</Text>
            <TextInput
              value={bankName}
              onChangeText={setBankName}
              placeholder="Bank or payout provider name"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
            />
            <TextInput
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Account / IBAN number"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
            />

            <Pressable style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Confirm Cashout</Text>
              <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (palette: typeof colors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: palette.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: palette.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  headerIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#EC4899', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: palette.textPrimary },
  headerSubtitle: { fontSize: 11, color: palette.textSecondary, marginTop: 2 },
  body: { padding: 20, gap: 12 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: '#FFF1F2' },
  errorText: { flex: 1, fontSize: 12, color: '#9F1239', fontWeight: '600' },
  label: { fontSize: 12, fontWeight: '800', color: palette.textSecondary, marginTop: 4 },
  presetRow: { flexDirection: 'row', gap: 8 },
  presetButton: { flex: 1, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: palette.border, alignItems: 'center' },
  presetButtonSelected: { borderColor: '#EC4899', backgroundColor: '#FDF2F8' },
  presetAmount: { fontSize: 12, fontWeight: '800', color: palette.textPrimary },
  presetAmountSelected: { color: '#DB2777' },
  presetUsd: { fontSize: 10, color: palette.textMuted, marginTop: 2 },
  payoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, backgroundColor: palette.background },
  payoutLabel: { fontSize: 12, color: palette.textSecondary, fontWeight: '600' },
  payoutValue: { fontSize: 16, fontWeight: '900', color: palette.textPrimary },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.background, color: palette.textPrimary, fontSize: 13 },
  submitButton: { flexDirection: 'row', gap: 8, marginTop: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: '#DB2777', alignItems: 'center', justifyContent: 'center' },
  submitButtonText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
});
