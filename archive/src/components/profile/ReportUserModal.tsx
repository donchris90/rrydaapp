import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, TextInput, Modal, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

export interface ReportReason {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export const LIVE_STREAM_REPORT_REASONS: ReportReason[] = [
  { id: 'harassment', title: 'Harassment or Cyberbullying', description: 'Targeted attacks, threats, insults, or hateful slurs during live stream or chat.', severity: 'high' },
  { id: 'nudity_explicit', title: 'Nudity or Sexual Content', description: 'Explicit body exposure, sexually suggestive acts, or non-consensual imagery.', severity: 'high' },
  { id: 'fraud_scam', title: 'Fraud, Scams or Fake Gifts', description: 'Soliciting unauthorized off-platform payments, fake giveaways, or coin phishing.', severity: 'high' },
  { id: 'violence_threats', title: 'Violence, Weapons, or Self-Harm', description: 'Brandishing weapons, promoting physical harm, or dangerous self-injury.', severity: 'high' },
  { id: 'hate_speech', title: 'Hate Speech & Discrimination', description: 'Attacking race, ethnicity, religion, disability, sexual orientation, or gender.', severity: 'high' },
  { id: 'underage', title: 'Underage User or Child Safety Concern', description: 'Broadcaster or participant appears to be under the minimum live-streaming age.', severity: 'high' },
  { id: 'spam_impersonation', title: 'Impersonation or Commercial Spam', description: 'Pretending to be another verified creator, agency, or celebrity, or bot spamming.', severity: 'medium' },
  { id: 'copyright_piracy', title: 'Unauthorized Re-broadcast / Copyright', description: 'Streaming copyrighted movies, TV sports, or other creators without consent.', severity: 'low' },
];

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserName: string;
  targetUserId: string;
  onSubmit: (reasonId: string, details: string) => void;
}

export const ReportUserModal: React.FC<ReportUserModalProps> = ({ isOpen, onClose, targetUserName, targetUserId, onSubmit }) => {
  const { palette } = useTheme();
  const styles = makeStyles(palette);
  const [selectedReasonId, setSelectedReasonId] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleClose = () => {
    setSelectedReasonId('');
    setDetails('');
    setSubmitted(false);
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedReasonId) return;
    onSubmit(selectedReasonId, details);
    setSubmitted(true);
  };

  return (
    <Modal visible={isOpen} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="flag" size={16} color="#E11D48" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Report User</Text>
                <Text style={styles.headerSubtitle}>Trust & Safety Protection</Text>
              </View>
            </View>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={palette.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {submitted ? (
              <View style={styles.successBox}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={40} color="#10B981" />
                </View>
                <Text style={styles.successTitle}>Report Submitted</Text>
                <Text style={styles.successText}>
                  Thanks for helping keep the community safe. Our moderation team will review this shortly.
                </Text>
                <Pressable style={styles.doneButton} onPress={handleClose}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.targetRow}>
                  <View style={styles.targetAvatar}>
                    <Text style={styles.targetAvatarText}>{targetUserName.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.targetName}>{targetUserName}</Text>
                    <Text style={styles.targetId}>User ID: {targetUserId}</Text>
                  </View>
                  <View style={styles.targetPill}>
                    <Text style={styles.targetPillText}>Report Target</Text>
                  </View>
                </View>

                <Text style={styles.label}>Select Violation Category</Text>
                {LIVE_STREAM_REPORT_REASONS.map((reason) => {
                  const selected = selectedReasonId === reason.id;
                  return (
                    <Pressable
                      key={reason.id}
                      onPress={() => setSelectedReasonId(reason.id)}
                      style={[styles.reasonCard, selected && styles.reasonCardSelected]}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={styles.reasonTitleRow}>
                          <Text style={styles.reasonTitle}>{reason.title}</Text>
                          {reason.severity === 'high' && (
                            <View style={styles.severityBadge}>
                              <Text style={styles.severityBadgeText}>High</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.reasonDescription}>{reason.description}</Text>
                      </View>
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected && <View style={styles.radioDot} />}
                      </View>
                    </Pressable>
                  );
                })}

                <Text style={styles.label}>Additional context (optional)</Text>
                <TextInput
                  value={details}
                  onChangeText={setDetails}
                  placeholder="Describe what happened..."
                  placeholderTextColor={palette.textMuted}
                  multiline
                  numberOfLines={3}
                  maxLength={300}
                  style={styles.textArea}
                />

                <View style={styles.advisory}>
                  <Ionicons name="information-circle" size={16} color="#B45309" />
                  <Text style={styles.advisoryText}>
                    False reporting or abuse of this tool may lead to account penalties.
                  </Text>
                </View>

                <View style={styles.actionRow}>
                  <Pressable style={styles.cancelButton} onPress={handleClose}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.submitButton, !selectedReasonId && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={!selectedReasonId}
                  >
                    <Text style={styles.submitButtonText}>Submit Report</Text>
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (palette: typeof colors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 420, maxHeight: '88%', backgroundColor: palette.card, borderRadius: 24, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFE4E6', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 14, fontWeight: '900', color: palette.textPrimary },
  headerSubtitle: { fontSize: 10, color: palette.textMuted, marginTop: 1 },
  body: { padding: 18, gap: 10 },
  successBox: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  successIcon: { marginBottom: 4 },
  successTitle: { fontSize: 15, fontWeight: '900', color: palette.textPrimary },
  successText: { fontSize: 12, color: palette.textSecondary, textAlign: 'center', paddingHorizontal: 12 },
  doneButton: { marginTop: 10, width: '100%', paddingVertical: 12, borderRadius: 14, backgroundColor: '#0F172A', alignItems: 'center' },
  doneButtonText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, backgroundColor: palette.bg },
  targetAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  targetAvatarText: { fontSize: 14, fontWeight: '800', color: '#7C3AED' },
  targetName: { fontSize: 12, fontWeight: '800', color: palette.textPrimary },
  targetId: { fontSize: 10, color: palette.textMuted, marginTop: 1 },
  targetPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: '#FFF1F2' },
  targetPillText: { fontSize: 9, fontWeight: '800', color: '#E11D48' },
  label: { fontSize: 11, fontWeight: '800', color: palette.textSecondary, marginTop: 6 },
  reasonCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card },
  reasonCardSelected: { borderColor: '#9333EA', backgroundColor: '#FAF5FF' },
  reasonTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  reasonTitle: { fontSize: 12, fontWeight: '800', color: palette.textPrimary },
  severityBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, backgroundColor: '#FFE4E6' },
  severityBadgeText: { fontSize: 8, fontWeight: '800', color: '#E11D48' },
  reasonDescription: { fontSize: 10, color: palette.textSecondary, marginTop: 3, lineHeight: 14 },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  radioSelected: { borderColor: '#9333EA', backgroundColor: '#9333EA' },
  radioDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  textArea: { minHeight: 64, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.bg, color: palette.textPrimary, fontSize: 12, textAlignVertical: 'top' },
  advisory: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: 12, backgroundColor: '#FFFBEB' },
  advisoryText: { flex: 1, fontSize: 10, color: '#92400E', lineHeight: 14 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: palette.bg, alignItems: 'center' },
  cancelButtonText: { fontSize: 12, fontWeight: '800', color: palette.textSecondary },
  submitButton: { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: '#DC2626', alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
});
