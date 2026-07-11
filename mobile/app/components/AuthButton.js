import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GoogleAuthButton from './GoogleAuthButton';

import theme from '../theme';

export default function AuthButton({
  variant = 'google',
  label,
  onPress,
  loading = false,
  disabled = false,
  style,
}) {
  if (variant === 'google') {
    return (
      <View style={style}>
        <GoogleAuthButton
          label={label}
          onPress={onPress}
          loading={loading}
          disabled={disabled}
        />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.base,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.textDark} />
      ) : (
        <View style={styles.row}>
          <Ionicons name="call-outline" size={18} color={theme.colors.textDark} />
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: theme.colors.accent,
  },
  disabled: { opacity: 0.55 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 16, fontWeight: '700', color: theme.colors.textDark },
});

