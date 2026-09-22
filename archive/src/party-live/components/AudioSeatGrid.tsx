import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SofaIcon } from './SofaIcon';
import { colors, gradients, radii, spacing, type } from '../theme';

export interface AudioSeatOccupant {
  seatNumber: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  isHost?: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
  isVideoEnabled?: boolean; // Video Party mode toggle
  cameraFacing?: 'front' | 'back';
  videoStreamUrl?: string;
  giftScore?: number;
  level?: number;
}

export type SeatLayoutType = 'grid' | 'spotlight' | 'circle';

interface AudioSeatGridProps {
  seatCount: number;
  seats: AudioSeatOccupant[];
  currentUserId?: string;
  isHostUser?: boolean;
  roomMode?: 'video' | 'voice';
  layoutType?: SeatLayoutType;
  lockedSeats?: Set<number>;
  screenWidth: number;
  onSelectEmptySeat: (seatNumber: number) => void;
  onSelectOccupant: (occupant: AudioSeatOccupant) => void;
  onToggleSeatVideo?: (seatNumber: number) => void;
}

export function gridForSeatCount(count: number): { cols: number; rows: number } {
  switch (count) {
    case 2:
      return { cols: 2, rows: 1 };
    case 4:
      return { cols: 2, rows: 2 };
    case 6:
      return { cols: 3, rows: 2 };
    case 8:
      return { cols: 4, rows: 2 };
    case 9:
      return { cols: 3, rows: 3 };
    case 12:
      return { cols: 4, rows: 3 };
    default: {
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      return { cols, rows };
    }
  }
}

/**
 * Animated Pulse Ring for speaking audio indicator in pure React Native
 */
function SpeakingRing({ size, color }: { size: number; color: string }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.1,
            duration: 750,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.8,
            duration: 650,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim, opacityAnim]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.speakingPulse,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          transform: [{ scale: pulseAnim }],
          opacity: opacityAnim,
        },
      ]}
    />
  );
}

export function AudioSeatGrid({
  seatCount,
  seats,
  currentUserId,
  isHostUser,
  roomMode = 'voice',
  layoutType = 'grid',
  lockedSeats = new Set(),
  screenWidth,
  onSelectEmptySeat,
  onSelectOccupant,
  onToggleSeatVideo,
}: AudioSeatGridProps) {
  const { cols, rows } = gridForSeatCount(seatCount);
  const horizontalPadding = spacing.sm * 2;
  const gap = spacing.xs;
  const availableWidth = screenWidth - horizontalPadding;
  const tileWidth = Math.floor((availableWidth - (cols - 1) * gap) / cols);
  
  // In video mode, make tiles slightly taller for camera aspect ratio (e.g. 4:3 or 1:1)
  const isVideoRoom = roomMode === 'video';
  const tileHeight = isVideoRoom ? Math.floor(tileWidth * 1.22) : Math.floor(tileWidth * 1.05);

  const renderEmptySeat = (seatNumber: number) => {
    const isLocked = lockedSeats.has(seatNumber);
    return (
      <Pressable
        key={`empty-${seatNumber}`}
        style={[
          styles.emptyTile,
          { width: tileWidth, height: tileHeight },
          isLocked && styles.lockedTile,
        ]}
        onPress={() => onSelectEmptySeat(seatNumber)}
      >
        <View style={styles.seatNumberBadge}>
          <Text style={styles.seatNumberText}>{seatNumber + 1}</Text>
        </View>

        {isLocked ? (
          <View style={styles.lockWrap}>
            <Ionicons name="lock-closed" size={tileWidth * 0.28} color={colors.textMuted} />
            <Text style={styles.emptyLabel}>Locked</Text>
          </View>
        ) : (
          <View style={styles.emptyContent}>
            <SofaIcon
              width={Math.floor(tileWidth * 0.48)}
              height={Math.floor(tileHeight * 0.32)}
              color="rgba(198, 186, 232, 0.4)"
            />
            <Text style={styles.emptyLabel}>
              {isVideoRoom ? 'Join Cam' : 'Sit Down'}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  const renderOccupiedSeat = (occupant: AudioSeatOccupant) => {
    const isMe = occupant.userId === currentUserId;
    const isSpeaking = occupant.isSpeaking && !occupant.isMuted;
    const hasVideo = occupant.isVideoEnabled && isVideoRoom;
    const avatarSize = Math.min(tileWidth * 0.52, 54);

    return (
      <Pressable
        key={`occupied-${occupant.seatNumber}`}
        style={[
          styles.occupiedTile,
          { width: tileWidth, height: tileHeight },
          isSpeaking && styles.occupiedTileSpeaking,
          hasVideo && styles.occupiedTileVideo,
        ]}
        onPress={() => onSelectOccupant(occupant)}
      >
        {/* VIDEO MODE: Live Video Stream Surface */}
        {hasVideo ? (
          <View style={StyleSheet.absoluteFill}>
            {/* Agora Video View Hook or Simulated Video Surface */}
            <LinearGradient
              colors={['#2D1B54', '#150A2E', '#090414']}
              style={StyleSheet.absoluteFill}
            />
            {/* Camera View Representation */}
            <View style={styles.videoStreamContainer}>
              <Ionicons
                name="videocam"
                size={22}
                color="rgba(255,255,255,0.25)"
              />
              <Text style={styles.videoStreamTag}>
                {isMe ? 'Your Live Camera' : 'Live Video'}
              </Text>
            </View>

            {/* Speaking border glow on video */}
            {isSpeaking && (
              <View style={[StyleSheet.absoluteFill, styles.videoSpeakingGlow]} />
            )}
          </View>
        ) : (
          /* AUDIO MODE: Plush Avatar with Speaking Ripple */
          <View style={styles.avatarSection}>
            {isSpeaking && (
              <SpeakingRing size={avatarSize + 12} color={colors.audioWave} />
            )}

            <View
              style={[
                styles.avatarCircle,
                { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
              ]}
            >
              <LinearGradient
                colors={
                  occupant.isHost
                    ? gradients.hostCrown
                    : isMe
                    ? gradients.hero
                    : ['#4E387E', '#2D1B54']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.avatarInitials}>
                {occupant.displayName ? occupant.displayName.slice(0, 2).toUpperCase() : 'U'}
              </Text>
            </View>
          </View>
        )}

        {/* Seat Number Tag */}
        <View style={styles.seatNumberOccupied}>
          <Text style={styles.seatNumOccupiedText}>{occupant.seatNumber + 1}</Text>
        </View>

        {/* Host Crown */}
        {occupant.isHost && (
          <View style={styles.hostCrownBadge}>
            <Ionicons name="star" size={10} color="#3B2400" />
          </View>
        )}

        {/* Video Icon Badge if in Video Room */}
        {isVideoRoom && (
          <View
            style={[
              styles.videoStatusBadge,
              occupant.isVideoEnabled ? styles.videoBadgeActive : styles.videoBadgeOff,
            ]}
          >
            <Ionicons
              name={occupant.isVideoEnabled ? 'videocam' : 'videocam-off'}
              size={10}
              color="#FFF"
            />
          </View>
        )}

        {/* Mic Muted Badge */}
        {occupant.isMuted && (
          <View style={styles.mutedBadge}>
            <Ionicons name="mic-off" size={10} color="#FFFFFF" />
          </View>
        )}

        {/* Bottom Scrim with Name & Gift Coins */}
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.85)']}
          style={styles.nameScrim}
        >
          <Text style={styles.displayNameText} numberOfLines={1}>
            {isMe ? 'You' : occupant.displayName}
          </Text>

          {occupant.giftScore != null && occupant.giftScore > 0 && (
            <View style={styles.giftScoreRow}>
              <Text style={styles.giftCoinIcon}>🪙</Text>
              <Text style={styles.giftScoreText}>{occupant.giftScore}</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    );
  };

  // Spotlight layout branch: Hero seat #0 on top, gallery below
  if (layoutType === 'spotlight') {
    const heroOcc = seats.find((s) => s.seatNumber === 0);
    const subCols = 4;
    const subTileWidth = Math.floor((availableWidth - (subCols - 1) * gap) / subCols);
    const subTileHeight = isVideoRoom ? Math.floor(subTileWidth * 1.22) : Math.floor(subTileWidth * 1.05);

    return (
      <View style={styles.container}>
        <View style={styles.gridWrapper}>
          {/* Hero Spotlight Stage Card */}
          <View style={{ width: availableWidth, height: isVideoRoom ? 130 : 110, marginBottom: gap }}>
            {heroOcc ? renderOccupiedSeat(heroOcc) : renderEmptySeat(0)}
          </View>

          {/* Sub-seats Grid */}
          <View style={[styles.gridRow, { gap, flexWrap: 'wrap', width: availableWidth }]}>
            {Array.from({ length: seatCount - 1 }).map((_, idx) => {
              const seatIndex = idx + 1;
              const occ = seats.find((s) => s.seatNumber === seatIndex);
              return (
                <View key={`spotlight-sub-${seatIndex}`} style={{ width: subTileWidth, height: subTileHeight }}>
                  {occ ? renderOccupiedSeat(occ) : renderEmptySeat(seatIndex)}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  const rowsElements: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const cells: React.ReactNode[] = [];
    for (let c = 0; c < cols; c++) {
      const seatIndex = r * cols + c;
      if (seatIndex < seatCount) {
        const occupant = seats.find((s) => s.seatNumber === seatIndex);
        cells.push(
          occupant ? renderOccupiedSeat(occupant) : renderEmptySeat(seatIndex)
        );
      } else {
        cells.push(
          <View
            key={`spacer-${seatIndex}`}
            style={{ width: tileWidth, height: tileHeight }}
          />
        );
      }
    }

    rowsElements.push(
      <View
        key={`row-${r}`}
        style={[
          styles.gridRow,
          {
            gap,
            marginBottom: r < rows - 1 ? gap : 0,
          },
        ]}
      >
        {cells}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.gridWrapper}>{rowsElements}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    marginVertical: spacing.xs,
  },
  gridWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTile: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  lockedTile: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  seatNumberBadge: {
    position: 'absolute',
    top: 3,
    left: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  seatNumberText: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '700',
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  lockWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  emptyLabel: {
    color: 'rgba(198, 186, 232, 0.55)',
    fontSize: 9,
    fontWeight: '600',
  },
  occupiedTile: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  occupiedTileSpeaking: {
    borderColor: colors.audioWave,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
  },
  occupiedTileVideo: {
    borderColor: 'rgba(138, 79, 255, 0.4)',
  },
  videoStreamContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  videoStreamTag: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '600',
  },
  videoSpeakingGlow: {
    borderWidth: 2,
    borderColor: colors.audioWave,
    borderRadius: radii.md,
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: -8,
  },
  speakingPulse: {
    position: 'absolute',
    borderWidth: 2,
  },
  avatarCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  seatNumberOccupied: {
    position: 'absolute',
    top: 3,
    left: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  seatNumOccupiedText: {
    color: colors.primaryLight,
    fontSize: 8,
    fontWeight: '800',
  },
  hostCrownBadge: {
    position: 'absolute',
    top: 2,
    alignSelf: 'center',
    backgroundColor: colors.gold,
    borderRadius: radii.xs,
    paddingHorizontal: 4,
    paddingVertical: 1,
    zIndex: 6,
  },
  videoStatusBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  videoBadgeActive: {
    backgroundColor: colors.primary,
  },
  videoBadgeOff: {
    backgroundColor: 'rgba(239, 68, 68, 0.65)',
  },
  mutedBadge: {
    position: 'absolute',
    bottom: 22,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  nameScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    paddingBottom: 3,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  displayNameText: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  giftScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 1,
  },
  giftCoinIcon: {
    fontSize: 7,
  },
  giftScoreText: {
    color: colors.gold,
    fontSize: 8,
    fontWeight: '800',
  },
});
