import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';


const TRUNCATE_LIMIT = 110;

interface BioCardProps {
  bio: string;
  // May be async. If it rejects the card stays in edit mode with the draft
  // intact — the caller is responsible for telling the user what went wrong.
  onSaveBio: (newBio: string) => void | Promise<void>;
}

export const BioCard: React.FC<BioCardProps> = ({ bio, onSaveBio }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftBio, setDraftBio] = useState(bio);
  const [isSaving, setIsSaving] = useState(false);

  const isLong = bio.length > TRUNCATE_LIMIT || bio.includes('\n');
  const displayText = isLong && !isExpanded ? `${bio.slice(0, TRUNCATE_LIMIT).trim()}...` : bio;

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const handleSave = async () => {
    if (isSaving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    try {
      await onSaveBio(draftBio.trim());
      setIsEditing(false);
    } catch {
      // Stay in edit mode so nothing typed is lost.
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(bio);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="chatbox-ellipses-outline" size={16} color="#FF2E7E" />
          <Text style={styles.title}>Bio & Status</Text>
        </View>

        <View style={styles.actions}>
          {bio && !isEditing && (
            <TouchableOpacity onPress={handleCopy} style={styles.iconBtn}>
              <Ionicons name="copy-outline" size={14} color="#9490A6" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Always start an edit from the saved bio, and drop unsaved
              // text on cancel.
              setDraftBio(bio);
              setIsEditing(!isEditing);
            }}
            disabled={isSaving}
            style={styles.editBtn}
          >
            <Ionicons name={isEditing ? 'close' : 'pencil'} size={12} color="#FF2E7E" />
            <Text style={styles.editText}>{isEditing ? 'Cancel' : bio ? 'Edit' : 'Add Bio'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!isEditing ? (
        <View>
          <Text style={styles.bioText}>{displayText || 'No bio yet. Tap Edit to add a status!'}</Text>
          {isLong && (
            <TouchableOpacity onPress={toggleExpand} style={styles.readMoreBtn}>
              <Text style={styles.readMoreText}>{isExpanded ? 'Show Less' : 'Read More'}</Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="#FF2E7E"
              />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.editContainer}>
          <TextInput
            value={draftBio}
            onChangeText={setDraftBio}
            maxLength={220}
            multiline
            numberOfLines={3}
            placeholder="Share your stream schedule or PK battle motto..."
            style={styles.input}
          />
          <TouchableOpacity onPress={handleSave} disabled={isSaving} style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}>
            <Text style={styles.saveText}>{isSaving ? 'Saving...' : 'Save Bio'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, marginVertical: 6, borderWidth: 1, borderColor: '#EFEDF6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 13, fontWeight: '800', color: '#221F33' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { padding: 4 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F5F3FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  editText: { fontSize: 11, fontWeight: '700', color: '#FF2E7E' },
  bioText: { fontSize: 13, color: '#475569', lineHeight: 18 },
  readMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, alignSelf: 'flex-start' },
  readMoreText: { fontSize: 12, fontWeight: '700', color: '#FF2E7E' },
  editContainer: { gap: 8 },
  input: { borderWidth: 1, borderColor: '#DDD6FE', borderRadius: 14, padding: 10, fontSize: 13, minHeight: 70, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#FF2E7E', borderRadius: 12, paddingVertical: 8, alignItems: 'center' },
  saveText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
});
