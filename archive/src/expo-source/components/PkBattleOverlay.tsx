import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface PkBattleOverlayProps {
  hostScore: number;
  opponentScore: number;
  timeLeft: number; // in seconds
  hostName: string;
  opponentName: string;
  hostAvatar?: string;
  opponentAvatar?: string;
  hostMvpAvatar?: string;
  opponentMvpAvatar?: string;
  onEndPk?: () => void;
}

export function PkBattleOverlay({
  hostScore,
  opponentScore,
  timeLeft,
  hostName,
  opponentName,
  hostAvatar,
  opponentAvatar,
  hostMvpAvatar,
  opponentMvpAvatar,
  onEndPk,
}: PkBattleOverlayProps) {
  const total = hostScore + opponentScore;
  const hostRatio = total === 0 ? 0.5 : Math.max(0.1, Math.min(0.9, hostScore / total));
  const hostWidthPercent = `${Math.round(hostRatio * 100)}%` as const;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.container}>
      {/* Top Tug-of-War Score Bar */}
      <View style={styles.scoreBarContainer}>
        {/* Host Side Details */}
        <View style={styles.sideInfoLeft}>
          <View style={styles.mvpAvatarWrap}>
            {hostMvpAvatar ? (
              <Image source={{ uri: hostMvpAvatar }} style={styles.mvpAvatar} />
            ) : (
              <View style={[styles.mvpAvatar, styles.placeholderMvp]}>
                <Ionicons name="person" size={12} color="#FFF" />
              </View>
            )}
            <View style={styles.crownBadgeLeft}>
              <Ionicons name="trophy" size={9} color="#FFD700" />
            </View>
          </View>
          <View>
            <Text style={styles.scoreTextLeft}>{hostScore.toLocaleString()}</Text>
            <Text style={styles.teamLabelLeft} numberOfLines={1}>{hostName}</Text>
          </View>
        </View>

        {/* Center Battle Timer & VS */}
        <View style={styles.centerBadge}>
          <Animated.View style={[styles.vsCircle, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={['#FF007A', '#7928CA']}
              style={styles.vsGradient}
            >
              <Text style={styles.vsText}>VS</Text>
            </LinearGradient>
          </Animated.View>
          <View style={styles.timerPill}>
            <Ionicons name="flame" size={11} color="#FF5252" />
            <Text style={styles.timerText}>{formatTimer(timeLeft)}</Text>
          </View>
        </View>

        {/* Opponent Side Details */}
        <View style={styles.sideInfoRight}>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.scoreTextRight}>{opponentScore.toLocaleString()}</Text>
            <Text style={styles.teamLabelRight} numberOfLines={1}>{opponentName}</Text>
          </View>
          <View style={styles.mvpAvatarWrap}>
            {opponentMvpAvatar ? (
              <Image source={{ uri: opponentMvpAvatar }} style={styles.mvpAvatar} />
            ) : (
              <View style={[styles.mvpAvatar, styles.placeholderMvp]}>
                <Ionicons name="person" size={12} color="#FFF" />
              </View>
            )}
            <View style={styles.crownBadgeRight}>
              <Ionicons name="trophy" size={9} color="#FFD700" />
            </View>
          </View>
        </View>
      </View>

      {/* Progress Bar Track */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressLeft, { width: hostWidthPercent }]}>
          <LinearGradient
            colors={['#2575FC', '#6A11CB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <View style={[styles.progressRight, { flex: 1 }]}>
          <LinearGradient
            colors={['#FF0844', '#FFB199']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
        {/* Tug divider indicator */}
        <View style={[styles.tugDivider, { left: hostWidthPercent }]}>
          <View style={styles.tugInner} />
        </View>
      </View>

      {/* Quick PK Control Pill */}
      {onEndPk && (
        <Pressable onPress={onEndPk} style={styles.endPkPill}>
          <Ionicons name="close-circle" size={12} color="#FFF" />
          <Text style={styles.endPkText}>Exit PK</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    marginTop: 4,
    zIndex: 40,
  },
  scoreBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(18, 12, 38, 0.75)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  sideInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sideInfoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    flex: 1,
  },
  mvpAvatarWrap: {
    position: 'relative',
  },
  mvpAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#FFD700',
  },
  placeholderMvp: {
    backgroundColor: '#33275A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownBadgeLeft: {
    position: 'absolute',
    top: -5,
    left: -4,
    backgroundColor: '#1A1332',
    borderRadius: 6,
    padding: 1,
  },
  crownBadgeRight: {
    position: 'absolute',
    top: -5,
    right: -4,
    backgroundColor: '#1A1332',
    borderRadius: 6,
    padding: 1,
  },
  scoreTextLeft: {
    color: '#4FACFE',
    fontSize: 14,
    fontWeight: '900',
  },
  teamLabelLeft: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    fontWeight: '600',
    maxWidth: 70,
  },
  scoreTextRight: {
    color: '#FF416C',
    fontSize: 14,
    fontWeight: '900',
  },
  teamLabelRight: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    fontWeight: '600',
    maxWidth: 70,
  },
  centerBadge: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  vsCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  vsGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
    fontStyle: 'italic',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 3,
  },
  timerText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 6,
    backgroundColor: '#1F173B',
    position: 'relative',
  },
  progressLeft: {
    height: '100%',
  },
  progressRight: {
    height: '100%',
  },
  tugDivider: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    width: 4,
    marginLeft: -2,
    backgroundColor: '#FFF',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFF',
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
  tugInner: {
    width: 2,
    height: '100%',
    backgroundColor: '#FFD700',
  },
  endPkPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 73, 91, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
  },
  endPkText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
