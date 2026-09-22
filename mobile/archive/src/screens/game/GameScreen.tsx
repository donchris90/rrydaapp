import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Three real games exist on the backend (Lucky Number, Sum Dice, Crash),
// all tested end to end. This screen is the actual next piece of frontend
// work worth doing — Sum Dice's UI in particular is already fully spec'd
// from the reference-app video analysis (the S/B/E/O grid, live pool
// totals, streak stats), so it's more "translate what's already known"
// than open design work.
export function GameScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game Center</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 8 },
});
