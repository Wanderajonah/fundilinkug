import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import theme from '../theme';

export default function HomeSection({ title, actionLabel = 'See all', onAction, children, style }) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onAction ? (
          <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.action}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { color: theme.colors.white, fontSize: 17, fontWeight: '800' },
  action: { color: theme.colors.accent, fontWeight: '700', fontSize: 13 },
});
