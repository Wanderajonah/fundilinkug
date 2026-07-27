import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../theme';

/**
 * @param {import('react-native-safe-area-context').Edge[]} [edges]
 *   Default: all edges so fixed footers and final buttons stay above phone
 *   navigation bars. Screens with custom bottom chrome can override edges.
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
