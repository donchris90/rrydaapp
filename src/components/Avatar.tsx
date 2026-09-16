import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme';

// imageUrl is optional and defaults to undefined, so every existing call
// site (none of which ever had a real photo to pass) keeps rendering the
// initials fallback exactly as before. Falls back to initials again if
// the image fails to load (a broken/expired ImgBB link, offline, etc.)
// rather than showing a blank box.
export function Avatar({
  name,
  size = 48,
  ring = true,
  imageUrl,
}: {
  name: string | null | undefined;
  size?: number;
  ring?: boolean;
  imageUrl?: string | null;
}) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();
  const ringWidth = ring ? 2.5 : 0;
  const innerSize = size - ringWidth * 2;

  const inner =
    imageUrl && !imageFailed ? (
      <Image
        source={{ uri: imageUrl }}
        onError={() => setImageFailed(true)}
        style={{ width: innerSize, height: innerSize, borderRadius: innerSize / 2 }}
      />
    ) : (
      <View
        style={[
          styles.inner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: colors.surfaceRaised,
          },
        ]}
      >
        <Text style={[styles.initial, { fontSize: innerSize * 0.42 }]}>{initial}</Text>
      </View>
    );

  if (!ring) {
    return <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>{inner}</View>;
  }

  return (
    <LinearGradient
      colors={gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {inner}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  inner: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.textPrimary, fontWeight: '800' },
});
