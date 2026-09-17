import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { GradientBackground } from '../../components/GradientBackground';
import { colors, spacing } from '../../theme';

/**
 * Crash screen UI preview.
 *
 * This screen is intentionally non-wagering: it uses local demo values so the
 * interface is useful even when the backend has no active Crash round. It does
 * not place entries, cash out, move coins, or pretend that demo values came
 * from the server.
 */

const DEMO_HISTORY = [2.14, 1.31, 4.72, 1.08, 3.26, 8.41, 1.67, 2.91, 1.22, 5.38];

function DemoChart({ width, height, multiplier }: { width: number; height: number; multiplier: number }) {
  const points = useMemo(() => {
    const count = 9;
    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1);
      const m = 1 + (multiplier - 1) * Math.pow(t, 1.45);
      return { x: 8 + t * (width - 16), y: height - 10 - ((m - 1) / Math.max(multiplier - 1, 1)) * (height - 25) };
    });
  }, [width, height, multiplier]);

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const fill = `${path} L ${points[points.length - 1].x.toFixed(1)} ${height - 10} L ${points[0].x.toFixed(1)} ${height - 10} Z`;
  const tip = points[points.length - 1];

  return (
    <Svg width={width} height={height}>
      <Path d={fill} fill="#1FD174" opacity={0.13} />
      <Path d={path} stroke="#1FD174" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={tip.x} cy={tip.y} r={7} fill="#FFF" />
      <Circle cx={tip.x} cy={tip.y} r={13} stroke="#1FD174" strokeWidth={2} fill="none" opacity={0.55} />
    </Svg>
  );
}

export function CrashScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(280, Math.min(width - 48, 520));
  const [multiplier, setMultiplier] = useState(2.36);

  useEffect(() => {
    const timer = setInterval(() => {
      setMultiplier((value) => {
        const next = value + 0.015 + value * 0.0025;
        return next >= 4.8 ? 2.05 : Number(next.toFixed(2));
      });
    }, 350);
    return () => clearInterval(timer);
  }, []);

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
            <Ionicons name="arrow-back" size={23} color="#F5F6F8" />
          </Pressable>
          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <Text style={styles.rocket}>🚀</Text>
              <Text style={styles.title}>Crash</Text>
            </View>
            <Text style={styles.subtitle}>Predict. Watch. Learn.</Text>
          </View>
          <Pressable style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={22} color="#B9B2D4" />
          </Pressable>
        </View>

        <View style={styles.demoBanner}>
          <Ionicons name="information-circle-outline" size={16} color="#1FD174" />
          <Text style={styles.demoBannerText}>DEMO PREVIEW · No wagers or balance changes</Text>
        </View>

        <View style={styles.liveCard}>
          <View style={styles.cardTop}>
            <View>
              <View style={styles.liveTitleRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTitle}>LIVE PREVIEW</Text>
              </View>
              <Text style={styles.roundText}>Sample Round #4827</Text>
            </View>
            <View style={styles.climbingPill}>
              <Ionicons name="trending-up" size={15} color="#07130D" />
              <Text style={styles.climbingText}>CLIMBING</Text>
            </View>
          </View>

          <View style={styles.multiplierBox}>
            <Text style={styles.multiplierLabel}>CURRENT MULTIPLIER</Text>
            <Text style={styles.multiplier}>{multiplier.toFixed(2)}x</Text>
          </View>

          <DemoChart width={chartWidth - 30} height={170} multiplier={multiplier} />

          <View style={styles.axisRow}>
            <Text style={styles.axis}>0s</Text>
            <Text style={styles.axis}>10s</Text>
            <Text style={styles.axis}>20s</Text>
            <Text style={styles.axis}>30s</Text>
            <Text style={styles.axis}>40s</Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.footerStat}>UI PREVIEW</Text>
            <Text style={styles.footerStat}>SAMPLE DATA</Text>
            <Text style={styles.footerStat}>NOT SERVER DATA</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Game Preview</Text>
          <Text style={styles.sectionHint}>UI only</Text>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.previewRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="eye-outline" size={20} color="#1FD174" />
            </View>
            <View style={styles.previewTextBlock}>
              <Text style={styles.previewTitle}>Watch the multiplier climb</Text>
              <Text style={styles.previewText}>This preview demonstrates the intended active-round layout without submitting a wager.</Text>
            </View>
          </View>

          <View style={styles.controlRow}>
            <View style={styles.controlBox}>
              <Text style={styles.controlLabel}>STAKE</Text>
              <Text style={styles.disabledValue}>Demo only</Text>
            </View>
            <View style={styles.controlBox}>
              <Text style={styles.controlLabel}>AUTO CASHOUT</Text>
              <Text style={styles.disabledValue}>Demo only</Text>
            </View>
          </View>

          <View style={styles.disabledButton}>
            <Ionicons name="lock-closed-outline" size={17} color="#858091" />
            <Text style={styles.disabledButtonText}>WAGERING DISABLED IN PREVIEW</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Game History</Text>
          <Text style={styles.sectionHint}>Sample</Text>
        </View>

        <View style={styles.historyCard}>
          <View style={styles.historyRow}>
            {DEMO_HISTORY.map((value, index) => (
              <View key={`${value}-${index}`} style={[styles.historyChip, value >= 2 ? styles.historyGood : styles.historyLow]}>
                <Text style={styles.historyText}>{value.toFixed(2)}x</Text>
              </View>
            ))}
          </View>
          <Text style={styles.historyNote}>Sample values are shown only to demonstrate the final UI layout.</Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: 12 },
  backButton: { padding: 8, marginRight: 8 },
  titleBlock: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rocket: { fontSize: 23 },
  title: { color: '#F7F5FA', fontSize: 22, fontWeight: '900', letterSpacing: 0.2 },
  subtitle: { color: '#A69DBD', fontSize: 11, marginTop: 1 },
  settingsButton: { width: 45, height: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  demoBanner: { marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(31,209,116,0.07)', borderWidth: 1, borderColor: 'rgba(31,209,116,0.18)' },
  demoBannerText: { color: '#A9B4AD', fontSize: 9, fontWeight: '800', letterSpacing: 0.2 },
  liveCard: { marginHorizontal: 12, backgroundColor: '#17142C', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.11)', overflow: 'hidden', paddingTop: 15 },
  cardTop: { paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#1FD174' },
  liveTitle: { color: '#1FD174', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  roundText: { color: '#777189', fontSize: 10, marginTop: 4 },
  climbingPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 18, backgroundColor: '#1FD174' },
  climbingText: { color: '#07130D', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  multiplierBox: { alignSelf: 'center', marginTop: 14, minWidth: 185, paddingHorizontal: 24, paddingVertical: 9, borderRadius: 17, borderWidth: 1, borderColor: '#1FD174', backgroundColor: 'rgba(31,209,116,0.06)', alignItems: 'center' },
  multiplierLabel: { color: '#B4ADBF', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  multiplier: { color: '#1FD174', fontSize: 46, lineHeight: 52, fontWeight: '900' },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, marginTop: -3 },
  axis: { color: '#777189', fontSize: 9 },
  cardFooter: { marginTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 15, paddingVertical: 10, flexDirection: 'row', gap: 14 },
  footerStat: { color: '#706A7F', fontSize: 8, fontWeight: '900' },
  sectionHeader: { marginHorizontal: 17, marginTop: 18, marginBottom: 9, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { color: '#F3F1F7', fontSize: 15, fontWeight: '900' },
  sectionHint: { color: '#716B7F', fontSize: 9, fontWeight: '800' },
  previewCard: { marginHorizontal: 12, padding: 14, backgroundColor: '#17142C', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(31,209,116,0.09)', alignItems: 'center', justifyContent: 'center' },
  previewTextBlock: { flex: 1 },
  previewTitle: { color: '#F0EEF4', fontSize: 12, fontWeight: '900' },
  previewText: { color: '#817A90', fontSize: 9, lineHeight: 14, marginTop: 3 },
  controlRow: { flexDirection: 'row', gap: 8, marginTop: 13 },
  controlBox: { flex: 1, padding: 11, borderRadius: 11, backgroundColor: '#0F0D1D', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  controlLabel: { color: '#777184', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  disabledValue: { color: '#A49EAE', fontSize: 11, fontWeight: '800', marginTop: 5 },
  disabledButton: { marginTop: 11, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, backgroundColor: '#292632' },
  disabledButtonText: { color: '#8B8594', fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },
  historyCard: { marginHorizontal: 12, padding: 13, backgroundColor: '#17142C', borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  historyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  historyChip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, borderWidth: 1 },
  historyGood: { backgroundColor: 'rgba(31,209,116,0.08)', borderColor: 'rgba(31,209,116,0.18)' },
  historyLow: { backgroundColor: 'rgba(245,73,91,0.08)', borderColor: 'rgba(245,73,91,0.14)' },
  historyText: { color: '#E9E7EE', fontSize: 10, fontWeight: '900' },
  historyNote: { color: '#6E687B', fontSize: 8, lineHeight: 12, marginTop: 10 },
});
