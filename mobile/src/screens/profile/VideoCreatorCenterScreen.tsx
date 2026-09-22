import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applyToBeCreator } from '../../api/creators';
import { deleteVideo, fetchMyVideos, updateVideo, uploadAndPublish, type OwnVideo } from '../../api/videos';
import { useAuth } from '../../auth/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { GradientButton } from '../../components/GradientButton';
import type { AppStackParamList } from '../../navigation/types';

type Tab = 'videos' | 'analytics';

// The editor is either publishing a freshly picked file or editing the
// metadata of a video that is already live.
type Draft =
  | { mode: 'create'; asset: ImagePicker.ImagePickerAsset }
  | { mode: 'edit'; video: OwnVideo };

const ACCENT = '#F59E0B';
const TABS: { id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'videos', label: 'My Videos', icon: 'videocam-outline' },
  { id: 'analytics', label: 'Analytics', icon: 'bar-chart-outline' },
];

// Mirrors the backend default (MAX_VIDEO_BYTES). Only a fast pre-check: the
// backend stays authoritative, and this avoids reading a huge file into
// memory (uploadAndPublish loads it as a Blob) just to be told it's too big.
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const DAY_MS = 24 * 60 * 60 * 1000;

const fmt = (n: number) => n.toLocaleString('en-US');
const compact = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  return fmt(n);
};
const fmtDuration = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtMb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;

function errorMessage(e: any): string {
  const m = e?.response?.data?.message ?? e?.message;
  if (Array.isArray(m)) return m.join('\n');
  return typeof m === 'string' && m ? m : 'Please try again.';
}

export function VideoCreatorCenterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const insets = useSafeAreaInsets();
  const { palette, isMidnight } = useTheme();
  const { user } = useAuth();
  const qc = useQueryClient();

  const isCreator = user?.roles?.some((r) => r.role === 'CREATOR') ?? false;
  const [tab, setTab] = useState<Tab>('videos');

  // Editor form state. `draft` being non-null is what shows the modal.
  const [draft, setDraft] = useState<Draft | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [tag, setTag] = useState('');

  // Same query key CreatorCenterScreen uses, so both screens share one cache
  // entry and a publish/edit/delete in either refreshes the other.
  const videosQuery = useQuery({ queryKey: ['videos', 'mine'], queryFn: fetchMyVideos, enabled: isCreator });
  const data = videosQuery.data;

  const closeEditor = () => setDraft(null);
  const afterChange = (heading: string, body: string) => {
    qc.invalidateQueries({ queryKey: ['videos'] }); // also refreshes the public feed
    closeEditor();
    Alert.alert(heading, body);
  };

  const publishMutation = useMutation({
    mutationFn: (d: Extract<Draft, { mode: 'create' }>) =>
      uploadAndPublish({
        asset: d.asset,
        title: title.trim(),
        caption: caption.trim(),
        tag: tag.trim().replace(/^#+/, ''),
      }),
    onSuccess: () => {
      setTab('videos');
      afterChange('Published', 'Your short is live.');
    },
    onError: (e) => Alert.alert('Could not publish', errorMessage(e)),
  });

  const updateMutation = useMutation({
    mutationFn: (d: Extract<Draft, { mode: 'edit' }>) =>
      updateVideo(d.video.id, {
        title: title.trim(),
        caption: caption.trim(),
        tag: tag.trim().replace(/^#+/, ''),
      }),
    onSuccess: () => afterChange('Saved', 'Your changes were saved.'),
    onError: (e) => Alert.alert('Could not save', errorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVideo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['videos'] }),
    onError: (e) => Alert.alert('Could not delete', errorMessage(e)),
  });

  const applyMutation = useMutation({
    mutationFn: applyToBeCreator,
    onSuccess: () => Alert.alert('Application submitted', "We'll let you know once it has been reviewed."),
    onError: (e) => Alert.alert('Could not apply', errorMessage(e)),
  });

  const busy = publishMutation.isPending || updateMutation.isPending;

  const openCreate = async () => {
    // No permission prompt: the system photo picker used by
    // launchImageLibraryAsync doesn't need library access.
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], allowsEditing: false, quality: 1 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.fileSize != null && asset.fileSize > MAX_VIDEO_BYTES) {
      Alert.alert('Video is too large', `Choose a video under ${Math.floor(MAX_VIDEO_BYTES / (1024 * 1024))} MB.`);
      return;
    }
    setTitle('');
    setCaption('');
    setTag('');
    setDraft({ mode: 'create', asset });
  };

  const openEdit = (video: OwnVideo) => {
    setTitle(video.title);
    setCaption(video.caption ?? '');
    setTag(video.tag ?? '');
    setDraft({ mode: 'edit', video });
  };

  const submit = () => {
    if (!draft || busy) return;
    if (!title.trim()) {
      Alert.alert('Add a title', 'Give your short a title before publishing.');
      return;
    }
    if (draft.mode === 'create') publishMutation.mutate(draft);
    else updateMutation.mutate(draft);
  };

  const confirmDelete = (video: OwnVideo) =>
    Alert.alert('Delete video?', 'This removes it from your profile and the feed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(video.id) },
    ]);

  const heroBg = isMidnight ? '#3A2A19' : '#FFF3DF';
  const cardStyle = [s.card, { backgroundColor: palette.surface, borderColor: palette.border }];

  // ── derived numbers (everything comes from GET /videos/mine) ──
  const totals = data?.totals;
  const videos = data?.videos ?? [];
  const views = totals?.views ?? 0;
  const likes = totals?.likes ?? 0;
  const count = totals?.videos ?? 0;
  const avgViews = count > 0 ? Math.round(views / count) : 0;
  const likeRate = views > 0 ? `${((likes / views) * 100).toFixed(1)}%` : '—';
  const topVideos = [...videos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);

  const stat = (n: number) => (data ? compact(n) : '—');

  // ── sections ──

  const renderGate = () => (
    <View style={cardStyle}>
      <Text style={[s.cardTitle, { color: palette.textPrimary }]}>Creator access required</Text>
      <Text style={[s.body, { color: palette.textSecondary }]}>
        Publishing shorts is limited to approved creators. Apply and we'll review your account.
      </Text>
      <GradientButton label="Apply to be a creator" onPress={() => applyMutation.mutate()} loading={applyMutation.isPending} />
    </View>
  );

  const renderVideoRow = (v: OwnVideo) => (
    <View key={v.id} style={[s.videoRow, { borderBottomColor: palette.border }]}>
      <Pressable
        onPress={() => navigation.navigate('VideoFeed', { videoId: v.id })}
        style={s.videoMain}
        accessibilityRole="button"
        accessibilityLabel={`Play ${v.title}`}
      >
        <View style={[s.thumb, { backgroundColor: heroBg }]}>
          <Ionicons name="play" size={18} color={ACCENT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.rowTitle, { color: palette.textPrimary }]} numberOfLines={1}>
            {v.title}
          </Text>
          <Text style={[s.rowSub, { color: palette.textMuted }]} numberOfLines={1}>
            {fmt(v.viewCount)} views · {fmt(v.likeCount)} likes
            {v.durationSeconds != null ? ` · ${fmtDuration(v.durationSeconds)}` : ''} · {fmtDate(v.createdAt)}
          </Text>
        </View>
      </Pressable>
      <Pressable onPress={() => openEdit(v)} hitSlop={8} style={s.iconBtn} accessibilityRole="button" accessibilityLabel={`Edit ${v.title}`}>
        <Ionicons name="create-outline" size={19} color={palette.violet} />
      </Pressable>
      <Pressable
        onPress={() => confirmDelete(v)}
        disabled={deleteMutation.isPending}
        hitSlop={8}
        style={s.iconBtn}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${v.title}`}
      >
        <Ionicons name="trash-outline" size={19} color={palette.danger} />
      </Pressable>
    </View>
  );

  const renderLibrary = () => {
    if (videosQuery.isLoading) return <ActivityIndicator color={ACCENT} style={{ paddingVertical: 20 }} />;
    if (videosQuery.isError) {
      return (
        <View style={{ gap: 10 }}>
          <Text style={[s.body, { color: palette.textMuted }]}>Could not load your videos.</Text>
          <Pressable onPress={() => videosQuery.refetch()} accessibilityRole="button">
            <Text style={[s.link, { color: palette.violet }]}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    if (videos.length === 0) {
      return <Text style={[s.body, { color: palette.textMuted }]}>No shorts yet — publish your first one below.</Text>;
    }
    return <View>{videos.map(renderVideoRow)}</View>;
  };

  const renderVideosTab = () => (
    <>
      <View style={[s.hero, { backgroundColor: heroBg }]}>
        <Ionicons name="videocam" size={27} color={ACCENT} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[s.heroTitle, { color: palette.textPrimary }]}>Shorts Monetization</Text>
          <Text style={[s.body, { color: palette.textSecondary }]}>
            Create, publish and manage short-form videos from the profile creator flow.
          </Text>
        </View>
      </View>

      <View style={s.metrics}>
        {[
          { label: 'Views', value: stat(views), icon: 'eye-outline' as const },
          { label: 'Likes', value: stat(likes), icon: 'heart-outline' as const },
          { label: 'Videos', value: stat(count), icon: 'film-outline' as const },
        ].map((m) => (
          <View key={m.label} style={[s.metric, { backgroundColor: palette.surface }]}>
            <Ionicons name={m.icon} size={17} color={ACCENT} />
            <Text style={[s.metricValue, { color: palette.textPrimary }]}>{m.value}</Text>
            <Text style={[s.metricLabel, { color: palette.textMuted }]}>{m.label}</Text>
          </View>
        ))}
      </View>

      <View style={cardStyle}>
        <Text style={[s.cardTitle, { color: palette.textPrimary }]}>Published Short Clips</Text>
        {renderLibrary()}
        <GradientButton label="Create a short" onPress={openCreate} />
      </View>
    </>
  );

  const renderAnalyticsTab = () => {
    if (videosQuery.isLoading) return <ActivityIndicator color={ACCENT} style={{ paddingVertical: 30 }} />;
    if (videosQuery.isError) {
      return (
        <View style={cardStyle}>
          <Text style={[s.body, { color: palette.textMuted }]}>Could not load your analytics.</Text>
          <Pressable onPress={() => videosQuery.refetch()} accessibilityRole="button">
            <Text style={[s.link, { color: palette.violet }]}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    const rows: [string, string][] = [
      ['Total views', fmt(views)],
      ['Total likes', fmt(likes)],
      ['Published shorts', fmt(count)],
      ['Average views per short', fmt(avgViews)],
      ['Likes per view', likeRate],
    ];
    return (
      <>
        <View style={cardStyle}>
          <Text style={[s.cardTitle, { color: palette.textPrimary }]}>Creator Analytics</Text>
          {rows.map(([label, value], i) => (
            <View key={label} style={[s.row, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={[s.body, { color: palette.textSecondary }]}>{label}</Text>
              <Text style={[s.value, { color: palette.textPrimary }]}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={cardStyle}>
          <Text style={[s.cardTitle, { color: palette.textPrimary }]}>Top shorts</Text>
          {topVideos.length === 0 ? (
            <Text style={[s.body, { color: palette.textMuted }]}>Publish a short to see how it performs.</Text>
          ) : (
            topVideos.map((v, i) => (
              <Pressable
                key={v.id}
                onPress={() => navigation.navigate('VideoFeed', { videoId: v.id })}
                style={[s.row, i === topVideos.length - 1 && { borderBottomWidth: 0 }]}
                accessibilityRole="button"
              >
                <Text style={[s.rank, { color: ACCENT }]}>{i + 1}</Text>
                <Text style={[s.body, { color: palette.textPrimary, flex: 1 }]} numberOfLines={1}>
                  {v.title}
                </Text>
                <Text style={[s.rowSub, { color: palette.textMuted }]}>
                  {fmt(v.viewCount)} views · {fmt(v.likeCount)} likes
                </Text>
              </Pressable>
            ))
          )}
          {count > videos.length && (
            <Text style={[s.note, { color: palette.textMuted }]}>Ranked from your {videos.length} most recent shorts.</Text>
          )}
        </View>

        <Text style={[s.note, { color: palette.textMuted }]}>
          Views exclude your own plays. Comments and tips aren't tracked for shorts yet.
        </Text>
      </>
    );
  };

  // ── editor modal ──

  const renderEditor = () => {
    if (!draft) return null;
    const creating = draft.mode === 'create';
    const asset = creating ? draft.asset : null;
    const input = [s.input, { color: palette.textPrimary, backgroundColor: palette.surfaceRaised, borderColor: palette.border }];
    return (
      <Modal visible animationType="slide" onRequestClose={() => !busy && closeEditor()}>
        <KeyboardAvoidingView
          style={[s.fill, { backgroundColor: palette.background, paddingTop: insets.top }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[s.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
            <Pressable onPress={closeEditor} disabled={busy} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={busy ? palette.textMuted : palette.textPrimary} />
            </Pressable>
            <Text style={[s.title, { color: palette.textPrimary }]}>{creating ? 'New short' : 'Edit short'}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 30 }]} keyboardShouldPersistTaps="handled">
            {asset && (
              <View style={[s.fileCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <View style={[s.thumb, { backgroundColor: heroBg }]}>
                  <Ionicons name="film" size={20} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.rowTitle, { color: palette.textPrimary }]} numberOfLines={1}>
                    {asset.fileName ?? 'Selected video'}
                  </Text>
                  <Text style={[s.rowSub, { color: palette.textMuted }]}>
                    {[
                      asset.duration != null ? fmtDuration(Math.round(asset.duration / 1000)) : null, // picker reports ms
                      asset.fileSize != null ? fmtMb(asset.fileSize) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Ready to upload'}
                  </Text>
                </View>
              </View>
            )}

            <View style={{ gap: 6 }}>
              <Text style={[s.label, { color: palette.textSecondary }]}>Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                editable={!busy}
                placeholder="Give your short a title"
                placeholderTextColor={palette.textMuted}
                style={input}
              />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={[s.label, { color: palette.textSecondary }]}>Caption (optional)</Text>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                maxLength={500}
                editable={!busy}
                multiline
                placeholder="Say something about it"
                placeholderTextColor={palette.textMuted}
                style={[...input, s.multiline]}
              />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={[s.label, { color: palette.textSecondary }]}>Tag (optional)</Text>
              <TextInput
                value={tag}
                onChangeText={setTag}
                maxLength={40}
                editable={!busy}
                autoCapitalize="none"
                placeholder="#dance"
                placeholderTextColor={palette.textMuted}
                style={input}
              />
            </View>

            <GradientButton
              label={creating ? 'Publish' : 'Save changes'}
              onPress={submit}
              loading={busy}
              disabled={!title.trim()}
            />
            {publishMutation.isPending && (
              <Text style={[s.note, { color: palette.textMuted, textAlign: 'center' }]}>
                Uploading — keep the app open until this finishes.
              </Text>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  return (
    <View style={[s.fill, { backgroundColor: palette.background, paddingTop: insets.top }]}>
      <View style={[s.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={palette.textPrimary} />
        </Pressable>
        <Text style={[s.title, { color: palette.textPrimary }]}>Video Creator Center</Text>
        <Ionicons name="bulb-outline" size={21} color={ACCENT} />
      </View>

      {isCreator && (
        <View style={[s.tabs, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
          {TABS.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[s.tab, tab === t.id && { borderBottomColor: ACCENT }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t.id }}
            >
              <Ionicons name={t.icon} size={15} color={tab === t.id ? ACCENT : palette.textMuted} />
              <Text style={[s.tabText, { color: tab === t.id ? ACCENT : palette.textMuted }]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 30 }]}
        refreshControl={
          isCreator ? (
            <RefreshControl refreshing={videosQuery.isRefetching} onRefresh={() => videosQuery.refetch()} tintColor={ACCENT} />
          ) : undefined
        }
      >
        {!isCreator && renderGate()}
        {isCreator && tab === 'videos' && renderVideosTab()}
        {isCreator && tab === 'analytics' && renderAnalyticsTab()}
      </ScrollView>

      {renderEditor()}
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  header: { height: 56, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: '900' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 11, fontWeight: '800' },
  content: { padding: 14, gap: 12 },
  hero: { padding: 15, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  heroTitle: { fontSize: 17, fontWeight: '900' },
  body: { fontSize: 13, lineHeight: 18 },
  note: { fontSize: 11, lineHeight: 16 },
  link: { fontSize: 13, fontWeight: '800' },
  metrics: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, borderRadius: 17, padding: 12, alignItems: 'center', gap: 4 },
  metricValue: { fontSize: 18, fontWeight: '900' },
  metricLabel: { fontSize: 10, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 20, padding: 15, gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '900' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(127,127,127,.12)' },
  value: { fontSize: 15, fontWeight: '900' },
  rank: { fontSize: 14, fontWeight: '900', width: 16 },
  videoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  videoMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '800' },
  rowSub: { fontSize: 11, marginTop: 2 },
  iconBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  task: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  circle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  bar: { height: 5, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 3, backgroundColor: ACCENT },
  fileCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 1 },
  label: { fontSize: 12, fontWeight: '800' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  multiline: { minHeight: 84, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
