import { describeApiError } from '../../api/errors';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      // No manual navigation needed — RootNavigator switches to MainTabs
      // automatically once AuthContext's isAuthenticated flips to true.
    } catch (e: any) {
      // Backend returns a constant-shape 401 whether the email exists or
      // not (see auth.service.ts) — deliberately don't try to distinguish
      // "wrong password" from "no such account" here either.
      setError(describeApiError(e, 'Invalid email or password'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <FadeInUp index={0} style={styles.brandBlock}>
            <LinearGradient colors={gradients.hero} style={styles.logo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.logoMark}>✦</Text>
            </LinearGradient>
            <Text style={styles.brand}>Welcome back</Text>
            <Text style={styles.brandSubtitle}>Go live, join a party room, and play together</Text>
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
                placeholder="Password"
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

            {error && <Text style={styles.error}>{error}</Text>}

            <GradientButton label="Log in" onPress={handleLogin} loading={isSubmitting} style={styles.submit} />

            <PressableScale onPress={() => navigation.navigate('Register')} disabled={isSubmitting} style={styles.linkWrap}>
              <Text style={styles.link}>Don't have an account? <Text style={styles.linkStrong}>Register</Text></Text>
            </PressableScale>
          </FadeInUp>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  brandBlock: { alignItems: 'center', marginBottom: spacing.xl },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoMark: { fontSize: 28, color: colors.textPrimary },
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
  linkStrong: { color: colors.pink, fontWeight: '700' },
});
