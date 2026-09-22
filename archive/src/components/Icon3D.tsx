import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  circleSize?: number;
  colors?: [string, string, ...string[]];
  iconColor?: string;
  glowColor?: string;
  style?: ViewStyle;
};

// Fakes a 3D extruded icon: outer glow -> base gradient -> inset highlight.
export function Icon3D({
  name,
  size = 20,
  circleSize = 44,
  colors: grad = ['#FFD86B', '#FF9A00', '#B34700'],
  iconColor = '#FFF',
  glowColor,
  style,
}: Props) {
  const radius = circleSize / 2;
  return (
    <View
      style={[
        styles.wrap,
        {
          width: circleSize,
          height: circleSize,
          borderRadius: radius,
          shadowColor: glowColor ?? grad[1],
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.6,
          shadowRadius: 6,
          elevation: 8,
        },
        style,
      ]}
    >
      {/* Base gradient disc */}
      <LinearGradient
        colors={grad}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />

      {/* Top highlight — simulates the lit face of the 3D extrusion */}
      <LinearGradient
        colors={['rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />

      {/* Bottom shadow — simulates the underside */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']}
        start={{ x: 0.5, y: 0.55 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />

      {/* Inner rim */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.25)',
          },
        ]}
      />

      {/* Icon glyph */}
      <View style={styles.center}>
        <Ionicons name={name} size={size} color={iconColor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});