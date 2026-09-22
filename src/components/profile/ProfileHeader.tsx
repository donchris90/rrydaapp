import React, { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { fetchMyAgency } from '../../api/agencies';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../Avatar';
import { countryCodeToFlag } from '../../utils/country';

interface ProfileHeaderProps {
  onOpenEdit: () => void;
  onOpenKyc: () => void;
}

// Identity card for the signed-in account. Everything shown is read from the
// account or the agency endpoint. (An earlier version showed one fixed
// fictional profile to every user: a stock photo, "Elena Star", VIP 3, Lv.28
// and Lv.42, a made-up ID and agency, and a made-up profile link.) There is no
// VIP or level system on the backend, so none is shown.
export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onOpenEdit, onOpenKyc }) => {
  const { palette } = useTheme();
  const { user } = useAuth();
  const agency = useQuery({ queryKey: ['agencies', 'me'], queryFn: fetchMyAgency });
  const [copied, setCopied] = useState(false);
  const s = makeStyles(palette);

  const displayName = user?.displayName?.trim() || user?.email || 'Guest';
  const shortId = (user?.id ?? '').slice(0, 8).toUpperCase();
  const isCreator = user?.roles?.some((r) => r.role === 'CREATOR') ?? false;

  const copyId = async () => {
    await Clipboard.setStringAsync(shortId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Shares the account's real referral code — the same one the Invite screen uses.
  const shareInvite = async () => {
    if (!user?.referralCode) return;
    try {
      await Share.share({ message: `Join me on Rryda! Use my invite code ${user.referralCode} when you sign up.` });
    } catch {
      /* the share sheet was dismissed */
    }
  };

  return (
    <Pressable onPress={onOpenEdit} style={s.card}>
      <View style={s.row}>
        <Avatar name={displayName} size={64} imageUrl={user?.avatarUrl} />
        <View style={{ flex: 1 }}>
          <View style={s.nameRow}>
            <Text style={s.name} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={s.flag}>{countryCodeToFlag(user?.countryCode)}</Text>
          </View>

          <View style={s.chips}>
            <Pressable onPress={onOpenKyc} style={[s.chip, { backgroundColor: user?.kycVerified ? 'rgba(16,185,129,0.15)' : palette.surfaceRaised }]}>
              <Ionicons name={user?.kycVerified ? 'shield-checkmark' : 'shield-outline'} size={11} color={user?.kycVerified ? '#10B981' : palette.textMuted} />
              <Text style={[s.chipText, { color: user?.kycVerified ? '#10B981' : palette.textSecondary }]}>{user?.kycVerified ? 'Verified' : 'Not verified'}</Text>
            </Pressable>
            {isCreator && (
              <View style={[s.chip, { backgroundColor: 'rgba(123,66,246,0.15)' }]}>
                <Text style={[s.chipText, { color: palette.violet }]}>Creator</Text>
              </View>
            )}
            {agency.data && (
              <View style={[s.chip, { backgroundColor: palette.surfaceRaised }]}>
                <Text style={[s.chipText, { color: palette.textSecondary }]}>{agency.data.agencyName}</Text>
              </View>
            )}
          </View>

          <Pressable onPress={copyId} style={s.idRow}>
            <Text style={s.idText}>ID: {shortId}</Text>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={12} color={copied ? '#10B981' : palette.textMuted} />
          </Pressable>
        </View>

        <View style={{ alignItems: 'center', gap: 10 }}>
          {!!user?.referralCode && (
            <Pressable onPress={shareInvite} style={s.iconBtn} accessibilityLabel="Share your invite code">
              <Ionicons name="share-social-outline" size={16} color={palette.primary} />
            </Pressable>
          )}
          <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
        </View>
      </View>
    </Pressable>
  );
};

const makeStyles = (p: ReturnType<typeof useTheme>['palette']) =>
  StyleSheet.create({
    card: { backgroundColor: p.card, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: p.border },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    name: { flexShrink: 1, fontSize: 18, fontWeight: '900', color: p.textPrimary },
    flag: { fontSize: 16 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
    chipText: { fontSize: 10, fontWeight: '800' },
    idRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
    idText: { fontSize: 11, color: p.textMuted },
    iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: p.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  });
