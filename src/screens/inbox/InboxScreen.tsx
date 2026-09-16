import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientBackground } from '../../components/GradientBackground';
import { FadeInUp } from '../../components/FadeInUp';
import { colors, gradients, spacing, type } from '../../theme';

// GET /api/v1/notifications exists and works — this screen just isn't
// built yet. A straightforward next step (a FlatList + mark-as-read,
// same pattern as HomeScreen), left out of this first pass to keep scope
// to "prove the auth + navigation foundation works," not "build every
// screen at once."
export function InboxScreen() {
  return (
    <GradientBackground style={styles.container}>
      <FadeInUp index={0} style={styles.iconWrap}>
        <LinearGradient colors={gradients.gold} style={styles.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="chatbubble-ellipses" size={30} color={colors.textOnLight} />
        </LinearGradient>
      </FadeInUp>
      <FadeInUp index={1}>
        <Text style={styles.title}>No messages yet</Text>
        <Text style={styles.subtitle}>Notifications and chats will land here</Text>
      </FadeInUp>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  iconWrap: { marginBottom: spacing.lg },
  iconCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  title: { ...type.h1, color: colors.textPrimary, textAlign: 'center' },
  subtitle: { ...type.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, maxWidth: 260 },
});
