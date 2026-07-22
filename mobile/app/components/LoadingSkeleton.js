import React from 'react';
import { View, StyleSheet } from 'react-native';
import theme from '../theme';

function Block({ width = '100%', height = 14, style }) {
  return <View style={[styles.block, { width, height }, style]} />;
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar} />
        <View style={{ flex: 1, gap: 8 }}>
          <Block width="60%" height={12} />
          <Block width="40%" height={10} />
        </View>
      </View>
      {Array.from({ length: lines }).map((_, i) => (
        <Block key={i} width={`${90 - i * 10}%`} height={10} style={{ marginTop: 10 }} />
      ))}
    </View>
  );
}

export default function LoadingSkeleton({ count = 3 }) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  card: {
    backgroundColor: theme.colors.input,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  block: {
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
