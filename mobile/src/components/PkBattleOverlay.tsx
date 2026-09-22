import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { PkBattle } from '../api/pk';
import { colors, radii, spacing } from '../theme';

// Adapted from a web (AI Studio) reference's visual design — the spring-
// animated clash bar, the center countdown badge, the settle-celebration
// banner — rebuilt with RN's Animated API (no motion/react here). Every
// number is real: scoreChallenger/scoreOpponent straight from the
// battle, the countdown computed from the real endsAt timestamp (not a
// separate local timer that could drift from the server), and the
// winner read from the real winnerId field rather than re-derived by
// comparing scores here (which is what the reference did, and which
// could genuinely disagree with the backend's own tie-break logic).
export function PkBattleOverlay({
  battle,
  hostName,
  opponentName,
}: {
  battle: PkBattle;
  hostName: string;
  opponentName: string;
}) {
  const myScore = Number(battle.scoreChallenger);
  const theirScore = Number(battle.scoreOpponent);
  const total = myScore + theirScore;
  const bluePercent = total === 0 ? 50 : Math.max(15, Math.min(85, (myScore / total) * 100));

  const blueWidth = useRef(new Animated.Value(bluePercent)).current;
  useEffect(() => {
    Animated.spring(blueWidth, { toValue: bluePercent, useNativeDriver: false, friction: 8 }).start();
  }, [bluePercent]);

  const [secondsLeft, setSecondsLeft] = useState(0);
  useEffect(() => {
    if (!battle.endsAt || battle.status !== 'ACTIVE') return;
    const tick = () => setSecondsLeft(Math.max(0, Math.floor((new Date(battle.endsAt!).getTime() - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [battle.endsAt, battle.status]);

  const formatTimer = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
  const isSettled = battle.status === 'SETTLED';

  // The real answer, not a re-derived guess — winnerId is null for a
  // real, honest draw, same as the backend's own settlement logic
  // decided, not whatever this screen would compute from scores alone.
  const winnerLabel = !battle.winnerId
    ? 'EPIC DRAW!'
    : battle.winnerId === battle.challengerId
      ? `${hostName.toUpperCase()} WINS!`
      : `${opponentName.toUpperCase()} WINS!`;

  return (
    <View style={styles.wrap}>
      <View style={styles.clashBar}>
        <Animated.View style={[styles.blueSide, { width: blueWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]}>
          <LinearGradient colors={['#00D2FF', '#0066FF']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <Text style={styles.scoreText}>{myScore.toLocaleString()}</Text>
        </Animated.View>
        <View style={styles.redSide}>
          <LinearGradient colors={['#D8004C', '#FF2A6D']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <Text style={styles.scoreText}>{theirScore.toLocaleString()}</Text>
        </View>
        <View style={styles.centerBadge}>
          <Text style={styles.centerBadgeText}>{isSettled ? 'FINAL' : formatTimer(secondsLeft)}</Text>
        </View>
      </View>

      <View style={styles.nameRow}>
        <Text style={styles.nameBlue} numberOfLines={1}>{hostName}</Text>
        <Text style={styles.statusLabel}>{isSettled ? 'Settle Phase' : 'Live PK Duel'}</Text>
        <Text style={styles.nameRed} numberOfLines={1}>{opponentName}</Text>
      </View>

      {isSettled && (
        <View style={styles.settleBanner}>
          <Text style={styles.settleBannerText}>🏆 {winnerLabel}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.sm, alignItems: 'center' },
  clashBar: {
    width: '100%',
    height: 30,
    borderRadius: radii.pill,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: '#000',
  },
  blueSide: { justifyContent: 'center', paddingLeft: spacing.sm, overflow: 'hidden' },
  redSide: { flex: 1, justifyContent: 'center', alignItems: 'flex-end', paddingRight: spacing.sm, overflow: 'hidden' },
  scoreText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  centerBadge: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -22,
    marginTop: -10,
    backgroundColor: colors.gold,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: '#FFF',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  centerBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: spacing.xs, paddingHorizontal: spacing.xs },
  nameBlue: { color: '#00D2FF', fontSize: 11, fontWeight: '800', maxWidth: 100 },
  nameRed: { color: '#FF2A6D', fontSize: 11, fontWeight: '800', maxWidth: 100 },
  statusLabel: { color: colors.gold, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  settleBanner: {
    marginTop: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  settleBannerText: { color: colors.gold, fontSize: 12, fontWeight: '900' },
});
