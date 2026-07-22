import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../theme';

export default function AppLogo({ size = 88 }) {
  const fontSize = Math.round(size * 0.48);
  const borderRadius = size * 0.24;
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius }]}>
      <Text style={[styles.letter, { fontSize }]}>F</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.elevation.md,
  },
  letter: {
    color: theme.colors.textDark,
    fontWeight: '900',
  },
});
