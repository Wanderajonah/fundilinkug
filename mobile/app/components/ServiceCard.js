import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import theme from '../theme';
import { initials } from '../utils/ratings';

export default function ServiceCard({ item, onPress, onBook }) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials(item.name)}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {item.role} · {item.rating ? `${item.rating}★` : 'New'}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.skills?.[0] || 'Professional'}
          {item.verified ? ' · Verified' : ''}
        </Text>
      </View>
      <TouchableOpacity style={styles.bookBtn} onPress={() => onBook?.(item)} activeOpacity={0.9}>
        <Text style={styles.bookText}>Book Fundi</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.panel,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.elevation.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,184,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.15)',
  },
  avatarText: { color: theme.colors.white, fontWeight: '800', fontSize: 16 },
  body: { flex: 1, paddingRight: 8 },
  name: { color: theme.colors.white, fontSize: 15, fontWeight: '800' },
  sub: { marginTop: 4, color: theme.colors.muted, fontSize: 12 },
  meta: { marginTop: 4, color: theme.colors.mutedDark, fontSize: 11 },
  bookBtn: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    ...theme.elevation.sm,
  },
  bookText: { color: theme.colors.textDark, fontWeight: '800', fontSize: 13 },
});
