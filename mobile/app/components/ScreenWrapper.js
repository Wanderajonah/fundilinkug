import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../theme';

/**
 * @param {import('react-native-safe-area-context').Edge[]} [edges]
 *   Default: top + sides. Omit bottom so tab bars can apply their own inset.
 */
export default function ScreenWrapper({ children, style, edges = ['top', 'left', 'right'] }) {
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
