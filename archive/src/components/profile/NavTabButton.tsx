import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface NavTabButtonProps {
  id: string;
  label: string;
  isActive: boolean;
  onPress: () => void;
  children: React.ReactNode;
  activeDot?: boolean;
}

export const NavTabButton: React.FC<NavTabButtonProps> = ({
  label,
  isActive,
  onPress,
  children,
  activeDot = false,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      android_ripple={{
        color: 'rgba(123, 77, 255, 0.25)',
        borderless: true,
        radius: 28,
      }}
      style={({ pressed }) => [
        styles.tabBtn,
        pressed && Platform.OS === 'ios' && styles.pressedIos,
      ]}
    >
      <View style={styles.iconContainer}>
        {children}
        {activeDot && isActive && <View style={styles.dot} />}
      </View>
      <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  pressedIos: {
    opacity: 0.7,
    backgroundColor: 'rgba(123, 77, 255, 0.12)',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    bottom: -3,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FF2E7E',
  },
  label: {
    fontSize: 10,
    marginTop: 2,
  },
  labelActive: {
    fontWeight: '800',
    color: '#FF2E7E',
  },
  labelInactive: {
    fontWeight: '600',
    color: '#9490A6',
  },
});
