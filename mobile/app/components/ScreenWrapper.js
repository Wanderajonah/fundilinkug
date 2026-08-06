import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../theme';

/**
 * @param {import('react-native-safe-area-context').Edge[]} [edges]
 *   Default: all edges so every screen gets a dark bottom safe-area inset.
 *   Pass edges without 'bottom' (e.g. ['top','left','right']) on screens that
 *   sit above the bottom navigation bar, which applies its own inset.
 */
export default function ScreenWrapper({ children, style, edges = ['top', 'left', 'right', 'bottom'] }) {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
});
