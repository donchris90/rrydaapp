import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, FlatList, Pressable, Share, StyleSheet, Text, View, type ViewToken } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { fetchVideo, fetchVideoFeed, likeVideo, recordVideoView, shareVideo, unlikeVideo, type FeedTab, type FeedVideo } from '../../api/videos';
import { followUser } from '../../api/social';
import type { AppStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { useProfileSheet } from '../../context/ProfileSheetContext';
import { Avatar } from '../../components/Avatar';
import { GiftSheet } from '../../components/GiftSheet';
import { VideoCommentsSheet } from '../../components/VideoCommentsSheet';

const PAGE_SIZE = 20;

const TABS: { key: FeedTab; label: string }[] = [
  { key: 'following', label: 'Following' },
  { key: 'popular', label: 'Popular' },
  { key: 'hot', label: 'Hot' },
];

const count = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 10_000 ? `${(n / 1_000).toFixed(0)}K` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n));

// The Explore feed: one full-screen video at a time, swipe up for the next, and it
// keeps loading more as you go. Three tabs — Following, Popular, Hot — a search
// button and a camera button on top, and on each video: like, comments, gift
// (a tip to the creator), share, the creator with a Follow button, the caption and
// the music line, with a thin progress bar along the bottom.
//
// Only the visible video (and its neighbours, so a swipe starts instantly) gets a
// player; the rest render empty, which keeps memory flat however long the list grows.
// `embedded` is used when this is a bottom-tab screen (Explore) rather than a pushed
// screen: there is nothing to go back to, so no back button, and pages are sized to
// the space the tab leaves (measured), so the tab bar never covers anything.
export function VideoFeedScreen({ embedded = false }: { embedded?: boolean }) {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AppStackParamList, 'VideoFeed'>>();
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);
  const isFocused = useIsFocused();
  const startVideoId = route.params?.videoId;
  const { user } = useAuth();
  const isCreator = user?.roles?.some((r) => r.role === 'CREATOR') ?? false;
  const [activeIndex, setActiveIndex] = useState(0);
  const [tab, setTab] = useState<FeedTab>('popular');

  const feedQuery = useInfiniteQuery({
    queryKey: ['videos', 'feed', tab],
    initialPageParam: (tab === 'following' ? undefined : 0) as string | number | undefined,
    queryFn: ({ pageParam }) =>
      tab === 'following' ? fetchVideoFeed({ limit: PAGE_SIZE, tab, before: pageParam as string | undefined }) : fetchVideoFeed({ limit: PAGE_SIZE, tab, offset: pageParam as number }),
    // A short page means we've reached the end. Following pages by time; the ranked tabs by position.
    getNextPageParam: (lastPage, allPages) => (lastPage.length === PAGE_SIZE ? (tab === 'following' ? lastPage[lastPage.length - 1].createdAt : allPages.length * PAGE_SIZE) : undefined),
  });

  // Opened from "My Videos" or a search result: show that video first.
  const startQuery = useQuery({ queryKey: ['videos', 'one', startVideoId], queryFn: () => fetchVideo(startVideoId!), enabled: !!startVideoId });

  const videos = useMemo(() => {
    const feed = feedQuery.data?.pages.flat() ?? [];
    const first = startQuery.data;
    return first ? [first, ...feed.filter((v) => v.id !== first.id)] : feed;
  }, [feedQuery.data, startQuery.data]);

  const listRef = useRef<FlatList<FeedVideo>>(null);
  const changeTab = (next: FeedTab) => {
    if (next === tab) return;
    setTab(next);
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setActiveIndex(first.index);
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  const renderItem = useCallback(
    ({ item, index }: { item: FeedVideo; index: number }) => (
      <VideoPage video={item} height={height} bottomInset={embedded ? 0 : insets.bottom} active={isFocused && index === activeIndex} near={Math.abs(index - activeIndex) <= 1} />
    ),
    [height, insets.bottom, isFocused, activeIndex, embedded],
  );

  const loading = feedQuery.isLoading || (!!startVideoId && startQuery.isLoading);

  const onCamera = () => {
    if (isCreator) return navigation.navigate('VideoCamera');
    Alert.alert('Post a video', 'Only approved creators can post videos. Apply in Creator Center.', [
      { text: 'Not now', style: 'cancel' },
      { text: 'Apply', onPress: () => navigation.navigate('CreatorCenter') },
    ]);
  };

  return (
    <View style={styles.root} onLayout={(e) => setHeight(Math.round(e.nativeEvent.layout.height))}>
      {height === 0 || loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#FFF" />
        </View>
      ) : feedQuery.isError && videos.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.message}>Could not load videos.</Text>
          <Pressable onPress={() => feedQuery.refetch()} style={styles.retry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : videos.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name={tab === 'following' ? 'people-outline' : 'film-outline'} size={40} color="rgba(255,255,255,0.6)" />
          <Text style={styles.message}>{tab === 'following' ? 'Follow creators to see their videos here.' : 'No videos yet.'}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={videos}
          keyExtractor={(v) => v.id}
          renderItem={renderItem}
          pagingEnabled
          snapToInterval={height}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={() => {
            if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) feedQuery.fetchNextPage();
          }}
          onEndReachedThreshold={1.5}
          windowSize={3}
          removeClippedSubviews
        />
      )}

      {/* Top bar: tabs in the middle, search and camera on the right */}
      <View style={[styles.topBar, { top: insets.top + 6 }]} pointerEvents="box-none">
        {embedded ? (
          <View style={styles.tabs}>
            {TABS.map((t) => (
              <Pressable key={t.key} onPress={() => changeTab(t.key)} hitSlop={8}>
                <Text style={[styles.tab, tab === t.key && styles.tabActive]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Pressable onPress={() => (navigation.canGoBack() ? navigation.goBack() : undefined)} hitSlop={12} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </Pressable>
        )}
        <View style={styles.topRight}>
          <Pressable onPress={() => navigation.navigate('VideoSearch')} hitSlop={10} style={styles.iconBtn} accessibilityLabel="Search videos">
            <Ionicons name="search" size={24} color="#FFF" />
          </Pressable>
          <Pressable onPress={onCamera} hitSlop={10} style={styles.iconBtn} accessibilityLabel="Post a video">
            <Ionicons name="camera-outline" size={26} color="#FFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function VideoPage({ video, height, bottomInset, active, near }: { video: FeedVideo; height: number; bottomInset: number; active: boolean; near: boolean }) {
  const { user: me } = useAuth();
  const profileSheet = useProfileSheet();
  const [liked, setLiked] = useState(video.likedByMe);
  const [likeCount, setLikeCount] = useState(video.likeCount);
  const [commentCount, setCommentCount] = useState(video.commentCount);
  const [shareCount, setShareCount] = useState(video.shareCount);
  const [following, setFollowing] = useState(video.creator.followedByMe);
  const [pending, setPending] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const viewRecorded = useRef(false);

  const isMine = video.creator.id === me?.id;
  // A tip is a gift to the video's creator. You can't tip yourself, and creators can switch tips off.
  const canTip = video.allowGifts !== false && !isMine;
  const creatorName = video.creator.displayName ?? 'creator';

  // Count a view once per time this page is shown; the backend also dedupes per viewer.
  useEffect(() => {
    if (active && !viewRecorded.current) {
      viewRecorded.current = true;
      recordVideoView(video.id).catch(() => {});
    }
  }, [active, video.id]);

  // Optimistic: flip immediately, reconcile with the server's answer, roll back on failure.
  const toggleLike = async () => {
    if (pending) return;
    const wasLiked = liked;
    setPending(true);
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    try {
      const result = wasLiked ? await unlikeVideo(video.id) : await likeVideo(video.id);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
    } finally {
      setPending(false);
    }
  };

  const onShare = async () => {
    try {
      const result = await Share.share({ message: `${video.title} — a video by ${creatorName} on RRYDA\n${video.videoUrl}` });
      if (result.action === Share.sharedAction) shareVideo(video.id).then((r) => setShareCount(r.shareCount)).catch(() => {});
    } catch {
      /* the person closed the share sheet */
    }
  };

  const onFollow = async () => {
    setFollowing(true);
    try {
      await followUser(video.creator.id);
    } catch {
      setFollowing(false);
      Alert.alert('Could not follow', 'Please try again.');
    }
  };

  // The little record on the right slowly spins while the video plays.
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [active, spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={[styles.page, { height }]}>
      {near && <Surface url={video.videoUrl} active={active} bottomInset={bottomInset} />}

      <View style={[styles.rail, { bottom: bottomInset + 70 }]}>
        <Pressable onPress={toggleLike} hitSlop={10} style={styles.railButton} accessibilityLabel="Like">
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={34} color={liked ? '#FF2E7E' : '#FFF'} />
          <Text style={styles.railCount}>{count(likeCount)}</Text>
        </Pressable>
        <Pressable onPress={() => setCommentsOpen(true)} hitSlop={10} style={styles.railButton} accessibilityLabel="Comments">
          <Ionicons name="chatbubble-ellipses" size={32} color="#FFF" />
          <Text style={styles.railCount}>{count(commentCount)}</Text>
        </Pressable>
        <Pressable onPress={() => (canTip ? setTipOpen(true) : Alert.alert(isMine ? "It's your video" : 'Tips are off', isMine ? "You can't send a gift to yourself." : 'The creator has turned tips off for this video.'))} hitSlop={10} style={styles.railButton} accessibilityLabel="Send a gift">
          <Ionicons name="gift" size={32} color="#FFD86B" />
          <Text style={styles.railCount}>{count(video.giftCount)}</Text>
        </Pressable>
        <Pressable onPress={onShare} hitSlop={10} style={styles.railButton} accessibilityLabel="Share">
          <Ionicons name="arrow-redo" size={32} color="#FFF" />
          <Text style={styles.railCount}>{count(shareCount)}</Text>
        </Pressable>
        <Animated.View style={[styles.disc, { transform: [{ rotate }] }]}>
          <Avatar name={creatorName} size={26} imageUrl={video.creator.avatarUrl} ring={false} />
        </Animated.View>
      </View>

      <View style={[styles.info, { bottom: bottomInset + 22 }]}>
        <View style={styles.creatorRow}>
          <Pressable onPress={() => profileSheet.open(video.creator.id)}>
            <Avatar name={creatorName} size={44} imageUrl={video.creator.avatarUrl} ring />
          </Pressable>
          <Pressable onPress={() => profileSheet.open(video.creator.id)} style={{ flexShrink: 1 }}>
            <Text style={styles.creator} numberOfLines={1}>
              {creatorName}
            </Text>
          </Pressable>
          {!isMine && !following && (
            <Pressable style={styles.followBtn} onPress={onFollow}>
              <Text style={styles.followText}>Follow</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>
        {video.caption ? (
          <Text style={styles.caption} numberOfLines={3}>
            {video.caption}
          </Text>
        ) : null}
        {video.tag ? <Text style={styles.tag}>{video.tag.startsWith('#') ? video.tag : `#${video.tag}`}</Text> : null}
        <View style={styles.musicRow}>
          <Ionicons name="musical-notes" size={13} color="#FFF" />
          <Text style={styles.music} numberOfLines={1}>
            {video.musicTitle?.trim() ? video.musicTitle : `Original sound - ${creatorName}`}
          </Text>
        </View>
      </View>

      <VideoCommentsSheet videoId={video.id} visible={commentsOpen} onClose={() => setCommentsOpen(false)} isOwner={isMine} onCountChange={(d) => setCommentCount((c) => Math.max(0, c + d))} />
      {canTip && <GiftSheet visible={tipOpen} onClose={() => setTipOpen(false)} recipientId={video.creator.id} context="VIDEO" contextId={video.id} recipientName={creatorName} />}
    </View>
  );
}

// The actual player, with a thin progress bar along the bottom. Split from VideoPage
// so the hook only runs for pages that are on (or next to) the screen.
function Surface({ url, active, bottomInset }: { url: string; active: boolean; bottomInset: number }) {
  const unplayable = url.startsWith('mock://');
  const player = useVideoPlayer(unplayable ? null : url, (p) => {
    p.loop = true;
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (unplayable) return;
    if (active) player.play();
    else player.pause();
  }, [active, player, unplayable]);

  useEffect(() => {
    if (unplayable || !active) return;
    const t = setInterval(() => {
      const d = player.duration;
      if (d > 0) setProgress(Math.min(1, player.currentTime / d));
    }, 250);
    return () => clearInterval(t);
  }, [active, player, unplayable]);

  if (unplayable) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Ionicons name="cloud-offline-outline" size={40} color="rgba(255,255,255,0.6)" />
        <Text style={styles.message}>This video can't be played.</Text>
      </View>
    );
  }

  return (
    <>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => (player.playing ? player.pause() : player.play())}>
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      </Pressable>
      <View style={[styles.progressTrack, { bottom: bottomInset }]} pointerEvents="none">
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  message: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center' },
  retry: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)' },
  retryText: { color: '#FFF', fontWeight: '700' },
  topBar: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, zIndex: 10 },
  tabs: { flexDirection: 'row', alignItems: 'baseline', gap: 18 },
  tab: { color: 'rgba(255,255,255,0.65)', fontSize: 17, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
  tabActive: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  page: { backgroundColor: '#000', justifyContent: 'flex-end' },
  rail: { position: 'absolute', right: 10, alignItems: 'center', gap: 20 },
  railButton: { alignItems: 'center', gap: 2 },
  railCount: { color: '#FFF', fontSize: 12, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3 },
  disc: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#222', borderWidth: 6, borderColor: '#111', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  info: { position: 'absolute', left: 14, right: 80, gap: 6 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  creator: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  followBtn: { backgroundColor: '#5B5BFF', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6 },
  followText: { color: '#FFF', fontWeight: '900', fontSize: 13 },
  title: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  caption: { color: 'rgba(255,255,255,0.88)', fontSize: 13 },
  tag: { color: '#7DD3FC', fontSize: 13, fontWeight: '700' },
  musicRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  music: { color: '#FFF', fontSize: 13, flexShrink: 1 },
  progressTrack: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
  progressFill: { height: 2, backgroundColor: '#FFF' },
});
