import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { fetchAnnouncements } from '../api/announcements';
import { useTheme } from '../context/ThemeContext';

const SPEED_PX_PER_SEC = 55;
const GAP = '        •        ';

// A slim strip that scrolls announcements across the screen: admin messages, the
// biggest recent win, the biggest recent gift. It renders nothing when there is
// nothing to announce, so it never shows placeholder text.
export function AnnouncementBanner() {
  const { palette } = useTheme();
  const query = useQuery({ queryKey: ['announcements'], queryFn: fetchAnnouncements, refetchInterval: 60_000, staleTime: 30_000 });
  const items = query.data ?? [];
  const text = items.map((i) => i.text).join(GAP);

  const [containerW, setContainerW] = useState(0);
  const [textW, setTextW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  // scroll: from just off the right edge to fully off the left, forever
  useEffect(() => {
    if (!text || !containerW || !textW) return;
    x.setValue(containerW);
    const distance = containerW + textW;
    const loop = Animated.loop(Animated.timing(x, { toValue: -textW, duration: (distance / SPEED_PX_PER_SEC) * 1000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [text, containerW, textW, x]);

  // the megaphone flashes gently to draw the eye
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  if (!text) return null;

  return (
    <View style={[styles.wrap, { backgroundColor: palette.violet }]} accessibilityRole="text" accessibilityLabel={`Announcements: ${text}`}>
      <Animated.View style={{ opacity: pulse }}>
        <Ionicons name="megaphone" size={14} color="#FFF" />
      </Animated.View>
      <View style={styles.viewport} onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}>
        {/* The track is much wider than the screen, so the text inside keeps its
            natural width (and reports it) instead of being clipped to the screen. */}
        <Animated.View style={[styles.track, { transform: [{ translateX: x }] }]}>
          <Text numberOfLines={1} onLayout={(e) => setTextW(e.nativeEvent.layout.width)} style={styles.text}>
            {text}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 30 },
  viewport: { flex: 1, height: 30, overflow: 'hidden', justifyContent: 'center' },
  track: { position: 'absolute', left: 0, width: 6000, flexDirection: 'row', alignItems: 'center', height: 30 },
  text: { color: '#FFF', fontSize: 12, fontWeight: '800' },
});
