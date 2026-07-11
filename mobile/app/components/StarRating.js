import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import { ratingLabel } from '../utils/ratings';

export default function StarRating({
  value = 0,
  onChange,
  size = 36,
  showLabel = true,
  disabled = false,
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= value;
          return (
            <TouchableOpacity
              key={star}
              disabled={disabled || !onChange}
              onPress={() => onChange?.(star)}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <Ionicons
                name={filled ? 'star' : 'star-outline'}
                size={size}
                color={filled ? theme.colors.accent : theme.colors.mutedDark}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      {showLabel ? (
        <Text style={[styles.label, value > 0 && styles.labelActive]}>
          {value > 0 ? ratingLabel(value) : 'Tap a star to rate'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  row: { flexDirection: 'row', gap: 8 },
  label: { marginTop: 10, color: theme.colors.mutedDark, fontSize: 13 },
  labelActive: { color: theme.colors.accent, fontWeight: '700' },
});
