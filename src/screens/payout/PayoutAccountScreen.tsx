import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchBanks, fetchPayoutAccount, fetchPayoutProviders, resolvePayoutAccount, savePayoutAccount, type Bank } from '../../api/payouts';
import { useTheme } from '../../context/ThemeContext';
import { GradientButton } from '../../components/GradientButton';

// Where you get paid. Withdrawals are sent to the account saved here, and the
// account holder's name always comes from the bank's own lookup, never from
// what you type. Changing it needs your password and is limited to once a day.
export function PayoutAccountScreen() {
  const { palette } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const providers = useQuery({ queryKey: ['payout', 'providers'], queryFn: fetchPayoutProviders });
  const accountQuery = useQuery({ queryKey: ['payout', 'account'], queryFn: fetchPayoutAccount });
  const account = accountQuery.data;

  const [editing, setEditing] = useState(false);
  const [bank, setBank] = useState<Bank | null>(null);
  const [number, setNumber] = useState('');
  const [password, setPassword] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');

  const banksQuery = useQuery({ queryKey: ['payout', 'banks'], queryFn: fetchBanks, enabled: editing || (!account && !accountQuery.isLoading) });

  // Look the account up as soon as a bank and a full 10-digit number are entered.
  const resolve = useMutation({ mutationFn: () => resolvePayoutAccount(bank!.code, number) });
  useEffect(() => {
    resolve.reset();
    if (bank && /^\d{10}$/.test(number)) resolve.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bank?.code, number]);

  const save = useMutation({
    mutationFn: () => savePayoutAccount({ bankCode: bank!.code, accountNumber: number, password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout', 'account'] });
      setEditing(false);
      setBank(null);
      setNumber('');
      setPassword('');
      Alert.alert('Payout account saved', 'Withdrawals will be sent to this account.');
    },
    onError: (e: any) => Alert.alert("Couldn't save", e?.response?.data?.message ?? 'Please try again.'),
  });

  const filtered = useMemo(() => (banksQuery.data ?? []).filter((b) => b.name.toLowerCase().includes(search.trim().toLowerCase())), [banksQuery.data, search]);

  const canChangeAt = account ? new Date(account.canChangeAt) : null;
  const locked = !!canChangeAt && canChangeAt.getTime() > Date.now();
  const showForm = !account || editing;
  const ready = !!bank && /^\d{10}$/.test(number) && !!resolve.data && password.length > 0;

  const input = [styles.input, { color: palette.textPrimary, borderColor: palette.border, backgroundColor: palette.surfaceRaised }];
  const card = [styles.card, { backgroundColor: palette.card, borderColor: palette.border }];

  return (
    <View style={[styles.root, { backgroundColor: palette.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={palette.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: palette.textPrimary }]}>Payout account</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <View style={card}>
          <Text style={[styles.label, { color: palette.textSecondary }]}>Payout method</Text>
          <View style={styles.methods}>
            {(providers.data ?? []).map((p) => (
              <View key={p.id} style={[styles.method, { borderColor: p.available ? palette.violet : palette.border, opacity: p.available ? 1 : 0.55 }]}>
                <Text style={[styles.methodName, { color: palette.textPrimary }]}>{p.name}</Text>
                <Text style={[styles.hint, { color: palette.textSecondary }]}>{p.comingSoon ? 'Coming soon' : p.available ? p.description : 'Not available in your country'}</Text>
              </View>
            ))}
          </View>
        </View>

        {accountQuery.isLoading ? (
          <ActivityIndicator color={palette.violet} />
        ) : account && !editing ? (
          <View style={card}>
            <Text style={[styles.label, { color: palette.textSecondary }]}>Your account</Text>
            <Text style={[styles.bank, { color: palette.textPrimary }]}>{account.bankName}</Text>
            <Text style={[styles.hint, { color: palette.textSecondary }]}>••••{account.accountLast4} • {account.accountName}</Text>
            {locked ? (
              <Text style={[styles.hint, { color: palette.textMuted, marginTop: 10 }]}>
                For your security this can be changed again on {canChangeAt!.toLocaleString()}.
              </Text>
            ) : (
              <Text style={[styles.link, { color: palette.violet }]} onPress={() => setEditing(true)}>Change account</Text>
            )}
          </View>
        ) : null}

        {showForm && (
          <View style={card}>
            <Text style={[styles.label, { color: palette.textSecondary }]}>{account ? 'New account' : 'Add your bank account'}</Text>

            <Pressable onPress={() => setPickerOpen(true)} style={[input, styles.pick]}>
              <Text style={{ color: bank ? palette.textPrimary : palette.textMuted }}>{bank ? bank.name : 'Choose your bank'}</Text>
              <Ionicons name="chevron-down" size={16} color={palette.textMuted} />
            </Pressable>

            <TextInput value={number} onChangeText={(t) => setNumber(t.replace(/\D/g, '').slice(0, 10))} keyboardType="number-pad" placeholder="Account number (10 digits)" placeholderTextColor={palette.textMuted} style={input} />

            {resolve.isPending && <Text style={[styles.hint, { color: palette.textSecondary }]}>Checking the account…</Text>}
            {resolve.isError && <Text style={[styles.hint, { color: '#EF4444' }]}>{(resolve.error as any)?.response?.data?.message ?? 'Could not verify that account.'}</Text>}
            {resolve.data && (
              <View style={[styles.verified, { borderColor: '#10B981' }]}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={{ color: palette.textPrimary, fontWeight: '800', flex: 1 }}>{resolve.data.accountName}</Text>
              </View>
            )}
            {resolve.data && <Text style={[styles.hint, { color: palette.textSecondary }]}>Check this is your name. Payouts go to this account only.</Text>}

            <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Your password (to confirm)" placeholderTextColor={palette.textMuted} style={input} autoCapitalize="none" />

            <GradientButton label={save.isPending ? 'Saving...' : 'Save payout account'} loading={save.isPending} disabled={!ready} onPress={() => save.mutate()} />
            {account && <Text style={[styles.link, { color: palette.textSecondary }]} onPress={() => { setEditing(false); setPassword(''); }}>Cancel</Text>}
          </View>
        )}

        <Text style={[styles.hint, { color: palette.textMuted }]}>
          Your full account number is never stored in the app or on our servers; only the last 4 digits are kept. You'll get a notification whenever this account is added or changed.
        </Text>
      </ScrollView>

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={[styles.root, { backgroundColor: palette.background, paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Pressable onPress={() => setPickerOpen(false)} hitSlop={12}>
              <Ionicons name="close" size={24} color={palette.textPrimary} />
            </Pressable>
            <Text style={[styles.title, { color: palette.textPrimary }]}>Choose your bank</Text>
          </View>
          <TextInput value={search} onChangeText={setSearch} placeholder="Search banks" placeholderTextColor={palette.textMuted} style={[...input, { marginHorizontal: 16 }]} />
          {banksQuery.isLoading ? (
            <ActivityIndicator color={palette.violet} style={{ marginTop: 20 }} />
          ) : banksQuery.isError ? (
            <Text style={[styles.hint, { color: '#EF4444', padding: 16 }]}>{(banksQuery.error as any)?.response?.data?.message ?? 'Could not load banks.'}</Text>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(b) => b.code}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.bankRow, { borderBottomColor: palette.border }]}
                  onPress={() => {
                    setBank(item);
                    setPickerOpen(false);
                    setSearch('');
                  }}
                >
                  <Text style={{ color: palette.textPrimary, fontSize: 15 }}>{item.name}</Text>
                </Pressable>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  title: { fontSize: 20, fontWeight: '900' },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  label: { fontSize: 12, fontWeight: '800' },
  methods: { flexDirection: 'row', gap: 10 },
  method: { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 10 },
  methodName: { fontSize: 14, fontWeight: '900' },
  hint: { fontSize: 11, lineHeight: 16 },
  bank: { fontSize: 18, fontWeight: '900' },
  link: { fontSize: 13, fontWeight: '800', marginTop: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15 },
  pick: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 10 },
  bankRow: { paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth },
});
