import { describeApiError } from '../../api/errors';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { GradientBackground } from '../../components/GradientBackground';
import { GradientButton } from '../../components/GradientButton';
import { PressableScale } from '../../components/PressableScale';
import { FadeInUp } from '../../components/FadeInUp';
import { colors, gradients, radii, spacing, type } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [displayName, setDisplayName] = useState('');
  // Plain text input for now, defaulted to NG — a real country picker
  // backed by GET /api/v1/regions (the public, unauthenticated bootstrap
  // endpoint built specifically for this) is the natural next step, not
  // built here to keep this first pass focused on the auth flow itself.
  const [countryCode, setCountryCode] = useState('NG');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    setError(null);
    if (password.length < 10) {
      setError('Password must be at least 10 characters');
      return;
    }
    setIsSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        countryCode: countryCode.trim().toUpperCase(),
        displayName: displayName.trim() || undefined,
        referralCode: referralCode.trim() || undefined,
      });
    } catch (e: any) {
      setError(describeApiError(e, 'Registration failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <FadeInUp index={0} style={styles.brandBlock}>
            <LinearGradient colors={gradients.gold} style={styles.logo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.logoMark}>✦</Text>
            </LinearGradient>
            <Text style={styles.brand}>Create account</Text>
            <Text style={styles.brandSubtitle}>Join the party — stream, chat, and play</Text>
          </FadeInUp>

          <FadeInUp index={1} style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isSubmitting}
            />
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password (min. 10 characters)"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                editable={!isSubmitting}
              />
              <Pressable
                onPress={() => setIsPasswordVisible((v) => !v)}
                hitSlop={8}
                style={styles.eyeButton}
                accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
              >
                <Ionicons name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Display name (optional)"
              placeholderTextColor={colors.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
              editable={!isSubmitting}
            />
            <TextInput
              style={styles.input}
              placeholder="Country code (e.g. NG)"
              placeholderTextColor={colors.textMuted}
              value={countryCode}
              onChangeText={setCountryCode}
              autoCapitalize="characters"
              maxLength={2}
              editable={!isSubmitting}
            />
            <TextInput
              style={styles.input}
              placeholder="Referral code (optional)"
              placeholderTextColor={colors.textMuted}
              value={referralCode}
              onChangeText={setReferralCode}
              autoCapitalize="characters"
              editable={!isSubmitting}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <GradientButton label="Create account" onPress={handleRegister} loading={isSubmitting} variant="gold" style={styles.submit} />

            <PressableScale onPress={() => navigation.navigate('Login')} disabled={isSubmitting} style={styles.linkWrap}>
              <Text style={styles.link}>Already have an account? <Text style={styles.linkStrong}>Log in</Text></Text>
            </PressableScale>
          </FadeInUp>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  brandBlock: { alignItems: 'center', marginBottom: spacing.xl },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoMark: { fontSize: 28, color: colors.textOnLight },
  brand: { ...type.display, color: colors.textPrimary, textAlign: 'center' },
  brandSubtitle: { ...type.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, maxWidth: 260 },
  card: {
    backgroundColor: colors.surfaceGlass,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  passwordInput: {
    flex: 1,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  eyeButton: { paddingHorizontal: spacing.md },
  submit: { marginTop: spacing.xs },
  error: { color: colors.danger, marginBottom: spacing.md, fontSize: 13 },
  linkWrap: { marginTop: spacing.lg, alignItems: 'center' },
  link: { color: colors.textSecondary, textAlign: 'center' },
  linkStrong: { color: colors.gold, fontWeight: '700' },
});
