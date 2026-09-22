import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const formatTimer = (seconds: number) => `${String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, '0')}:${String(Math.max(0, seconds) % 60).padStart(2, '0')}`;
const compact = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K` : String(n));

interface Props {
  // Distance from the top of the screen (below the header).
  top: number;
  hostName: string;
  opponentName: string;
  hostScore: number;
  opponentScore: number;
  timeLeft: number; // seconds
  // The two videos, each drawn to fill its half of the box.
  left: React.ReactNode;
  right: React.ReactNode;
}

// The PK battle as a BOX: a score bar, then the two hosts side by side, with the
// timer between them — sitting under the header while the rest of the screen (the
// comments, the bottom bar) stays usable below it. It used to take over the whole
// screen. Layout follows the reference: bar on top, two portrait panes, name and
// score on each.
export function PkBox({ top, hostName, opponentName, hostScore, opponentScore, timeLeft, left, right }: Props) {
  const { width } = useWindowDimensions();
  const paneHeight = Math.round(width * 0.62);
  const total = hostScore + opponentScore;
  const hostShare = total === 0 ? 0.5 : Math.max(0.08, Math.min(0.92, hostScore / total));

  return (
    <View style={[styles.box, { top }]} pointerEvents="box-none">
      {/* Tug-of-war bar */}
      <View style={styles.bar}>
        <View style={[styles.barHost, { flex: hostShare }]} />
        <View style={[styles.barOpponent, { flex: 1 - hostShare }]} />
        <Text style={[styles.barScore, { left: 8 }]}>{compact(hostScore)}</Text>
        <Text style={[styles.barScore, { right: 8 }]}>{compact(opponentScore)}</Text>
      </View>

      <View style={[styles.panes, { height: paneHeight }]}>
        <View style={styles.pane}>
          {left}
          <View style={styles.tag}>
            <Text style={styles.tagName} numberOfLines={1}>
              {hostName}
            </Text>
            <Text style={styles.tagScore}>{compact(hostScore)}</Text>
          </View>
        </View>
        <View style={styles.gap} />
        <View style={styles.pane}>
          {right}
          <View style={styles.tag}>
            <Text style={styles.tagName} numberOfLines={1}>
              {opponentName}
            </Text>
            <Text style={styles.tagScore}>{compact(opponentScore)}</Text>
          </View>
        </View>
        <View style={styles.timerWrap} pointerEvents="none">
          <View style={styles.timer}>
            <Text style={styles.timerPk}>PK</Text>
            <Text style={styles.timerText}>{formatTimer(timeLeft)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', left: 0, right: 0, zIndex: 5 },
  bar: { height: 26, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0E0A1A' },
  barHost: { height: '100%', backgroundColor: '#FF2E7E' },
  barOpponent: { height: '100%', backgroundColor: '#2E90FF' },
  barScore: { position: 'absolute', color: '#FFF', fontSize: 12, fontWeight: '900' },
  panes: { flexDirection: 'row', backgroundColor: '#0E0A1A' },
  pane: { flex: 1, overflow: 'hidden', backgroundColor: '#1B1430' },
  gap: { width: 2, backgroundColor: '#0E0A1A' },
  tag: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(0,0,0,0.42)' },
  tagName: { color: '#FFF', fontSize: 12, fontWeight: '800', flex: 1, marginRight: 6 },
  tagScore: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  timerWrap: { position: 'absolute', top: 6, left: 0, right: 0, alignItems: 'center' },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  timerPk: { color: '#FFC24B', fontWeight: '900', fontStyle: 'italic', fontSize: 12 },
  timerText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
});
