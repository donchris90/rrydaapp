import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

export type GenericInfoType = 'rules' | 'help' | null;

interface GenericInfoModalProps {
  type: GenericInfoType;
  onClose: () => void;
}

const TITLES: Record<Exclude<GenericInfoType, null>, string> = {
  rules: 'Community Standards & Conduct',
  help: 'Help Center & Support',
};

export const GenericInfoModal: React.FC<GenericInfoModalProps> = ({ type, onClose }) => {
  const { palette } = useTheme();
  const styles = makeStyles(palette);
  return (
    <Modal visible={!!type} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{type ? TITLES[type] : ''}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={palette.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {type === 'rules' && (
              <View style={{ gap: 10 }}>
                <Text style={styles.ruleText}>
                  <Text style={styles.ruleBold}>Respectful Interaction: </Text>
                  Harassment, hate speech, or abuse will lead to a permanent room ban.
                </Text>
                <Text style={styles.ruleText}>
                  <Text style={styles.ruleBold}>Strict Adult Standards: </Text>
                  No nudity, sexual exploitation, or suggestive live broadcasting.
                </Text>
                <Text style={styles.ruleText}>
                  <Text style={styles.ruleBold}>Financial Safety: </Text>
                  Attempts to transact outside the app ledger are strictly prohibited.
                </Text>
                <Text style={styles.ruleText}>
                  <Text style={styles.ruleBold}>Provably Fair Games: </Text>
                  All round outcomes are cryptographically signed and immutable.
                </Text>
              </View>
            )}

            {type === 'help' && (
              <View style={{ gap: 12 }}>
                <Text style={styles.helpText}>
                  Have questions about coins, cashout delays, or host verification? Our support team is here to help.
                </Text>
                <View style={styles.supportBox}>
                  <Text style={styles.supportBoxText}>Live support agent available — average response time under 2 minutes.</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (palette: typeof colors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: palette.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: palette.border },
  headerTitle: { fontSize: 15, fontWeight: '800', color: palette.textPrimary, flex: 1, marginRight: 8 },
  body: { padding: 20 },
  ruleText: { fontSize: 12, color: palette.textSecondary, lineHeight: 18 },
  ruleBold: { fontWeight: '800', color: palette.textPrimary },
  helpText: { fontSize: 12, color: palette.textSecondary, lineHeight: 18 },
  supportBox: { padding: 12, borderRadius: 14, backgroundColor: '#ECFDF5' },
  supportBoxText: { fontSize: 12, color: '#065F46', fontWeight: '600' },
});
