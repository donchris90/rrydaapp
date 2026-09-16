import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '../../components/GradientBackground';
import { FadeInUp } from '../../components/FadeInUp';
import { colors, radii, spacing, type } from '../../theme';

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: 'How do I buy coins?',
    answer: 'Go to Profile → Store, pick a package, and confirm the purchase. Coins are used for gifts and game entries.',
  },
  {
    question: 'How do gifts work?',
    answer:
      'While watching a live stream, tap the Gift icon, choose a gift, and send it. Part of the value goes to the host, and part supports the platform — the exact split is shown before you confirm.',
  },
  {
    question: 'How do I become a creator and withdraw earnings?',
    answer:
      'Go to Profile → Streamer Center and apply. An admin reviews applications before approval. Once approved, withdrawable earnings and withdrawal requests are shown on that same screen.',
  },
  {
    question: 'How do I go live?',
    answer: 'Tap the Go Live button in the bottom tab bar, give your stream a title, and tap Go Live to start broadcasting.',
  },
  {
    question: 'How do I report abusive behavior?',
    answer:
      "Use the moderation options available in a live room or chat to report or block a user. If something needs urgent attention, contact us directly using the email below.",
  },
  {
    question: 'How do I delete my account?',
    answer:
      "There's no self-service account deletion in the app yet. Email us using the address below and we'll handle the request directly.",
  },
];

// Genuinely different from most of this project's other screens — this
// one needs no API calls at all. It's real because every line here is
// actually true about how the app works today, not because it's wired
// to a backend. Where the app genuinely can't do something yet (account
// deletion), that's stated plainly rather than glossed over.
//
// The support email below is a placeholder — swap it for your real
// support address before shipping. I don't have a real one to put here.
export function HelpCenterScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Help Center</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {FAQ_ITEMS.map((item, i) => {
          const isExpanded = expandedIndex === i;
          return (
            <FadeInUp key={item.question} index={i} style={styles.faqCard}>
              <Pressable style={styles.faqHeader} onPress={() => setExpandedIndex(isExpanded ? null : i)}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
              </Pressable>
              {isExpanded && <Text style={styles.faqAnswer}>{item.answer}</Text>}
            </FadeInUp>
          );
        })}

        <FadeInUp index={FAQ_ITEMS.length} style={styles.contactCard}>
          <Ionicons name="mail-outline" size={22} color={colors.primary} />
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactBody}>Email our support team and we'll get back to you.</Text>
          <Pressable style={styles.emailButton} onPress={() => Linking.openURL('mailto:support@rydaapp.com')}>
            <Text style={styles.emailButtonText}>support@rydaapp.com</Text>
          </Pressable>
        </FadeInUp>
      </ScrollView>
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
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  faqCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  faqQuestion: { ...type.bodyStrong, color: colors.textPrimary, flex: 1 },
  faqAnswer: { ...type.body, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
  contactCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  contactTitle: { ...type.h2, color: colors.textPrimary, marginTop: spacing.sm },
  contactBody: { ...type.body, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  emailButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  emailButtonText: { ...type.bodyStrong, color: colors.primary },
});
