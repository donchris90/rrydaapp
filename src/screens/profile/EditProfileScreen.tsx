import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { updateDisplayName, updateAvatarUrl } from '../../api/auth';
import { uploadImageToImgBB } from '../../api/imgbb';
import { useAuth } from '../../auth/AuthContext';
import { GradientBackground } from '../../components/GradientBackground';
import { GradientButton } from '../../components/GradientButton';
import { Avatar } from '../../components/Avatar';
import { colors, radii, spacing, type } from '../../theme';

// displayName and avatarUrl are the two fields a user can actually edit
// themselves — checked the real Prisma schema before building either:
// no bio field exists at all. email/phone/countryCode are identity
// fields, not self-editable; kycVerified/status/roles are admin-controlled.
export function EditProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () => updateDisplayName(displayName),
    onSuccess: async () => {
      await refreshUser();
      navigation.goBack();
    },
    onError: (error: any) => {
      Alert.alert('Could not save', error?.response?.data?.message ?? 'Something went wrong. Try again.');
    },
  });

  const handleChangeAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;

    setIsUploadingAvatar(true);
    try {
      const url = await uploadImageToImgBB(result.assets[0].base64);
      await updateAvatarUrl(url);
      await refreshUser();
    } catch (error: any) {
      Alert.alert('Could not update photo', error?.message ?? 'Something went wrong. Try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const trimmed = displayName.trim();
  const isValid = trimmed.length >= 2 && trimmed.length <= 40;

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Edit Profile</Text>
      </View>

      <Pressable style={styles.avatarWrap} onPress={handleChangeAvatar} disabled={isUploadingAvatar}>
        <Avatar name={displayName || user?.displayName || 'U'} imageUrl={user?.avatarUrl} size={80} />
        <View style={styles.avatarEditBadge}>
          {isUploadingAvatar ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="camera" size={14} color="#FFF" />
          )}
        </View>
      </Pressable>
      <Text style={styles.avatarHint}>Tap to change photo</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          placeholderTextColor={colors.textMuted}
          maxLength={40}
        />
        <Text style={styles.hint}>{trimmed.length}/40 · at least 2 characters</Text>

        <Text style={[styles.label, { marginTop: spacing.lg }]}>Email</Text>
        <View style={styles.readOnlyRow}>
          <Text style={styles.readOnlyValue}>{user?.email}</Text>
        </View>
        <Text style={styles.hint}>Email can't be changed here.</Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <GradientButton
          label={saveMutation.isPending ? 'Saving...' : 'Save changes'}
          onPress={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={!isValid || trimmed === user?.displayName}
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: { padding: spacing.xs },
  title: { ...type.h2, color: colors.textPrimary },
  avatarWrap: { alignItems: 'center', marginTop: spacing.sm, position: 'relative', alignSelf: 'center' },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarHint: { ...type.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
  },
  label: { ...type.caption, color: colors.textSecondary, fontWeight: '700' },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  hint: { ...type.caption, color: colors.textMuted, marginTop: spacing.xs },
  readOnlyRow: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  readOnlyValue: { ...type.body, color: colors.textMuted },
  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
});
