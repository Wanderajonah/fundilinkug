import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';

const TILE = 120;

export default function OnboardingGraphic({ variant }) {
  return (
    <View style={styles.tile}>
      {variant === 'artisans' && (
        <View style={styles.innerCircle}>
          <Ionicons name="checkmark" size={36} color={theme.colors.accent} />
        </View>
      )}
      {variant === 'book' && (
        <View style={styles.dotsWrap}>
          {[
            { top: 18, left: 28 },
            { top: 38, left: 48 },
            { top: 58, left: 68 },
          ].map((pos, i) => (
            <View key={i} style={[styles.dot, pos]} />
          ))}
        </View>
      )}
      {variant === 'pay' && (
        <View style={styles.innerCircle}>
          <Ionicons name="shield-checkmark" size={34} color={theme.colors.accent} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: 18,
    backgroundColor: theme.colors.panel,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  innerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245,158,11,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsWrap: { width: 90, height: 90 },
  dot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.accent,
  },
});
