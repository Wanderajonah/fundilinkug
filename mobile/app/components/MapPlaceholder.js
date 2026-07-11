import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../theme';

/** Dark map-style panel for mock UI (web-safe) */
export default function MapPlaceholder({ height = 220, badge, pins = [] }) {
  return (
    <View style={[styles.map, { height }]}>
      <View style={styles.grid} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <View style={styles.centerPulse}>
        <View style={styles.pulseOuter} />
        <View style={styles.pulseInner} />
      </View>
      {pins.map((p, i) => (
        <View key={i} style={[styles.pin, { top: p.top, left: p.left, right: p.right }]}>
          <Text style={styles.pinText}>{p.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    borderRadius: theme.radius.lg,
    backgroundColor: '#0d0d0d',
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
    borderWidth: 1,
    borderColor: '#333',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    zIndex: 2,
  },
  badgeText: { color: theme.colors.textDark, fontWeight: '800', fontSize: 11 },
  centerPulse: {
    position: 'absolute',
    top: '42%',
    left: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,184,0,0.35)',
  },
  pulseInner: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.white,
  },
  pin: {
    position: 'absolute',
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 2,
  },
  pinText: { color: theme.colors.textDark, fontSize: 10, fontWeight: '800' },
});
