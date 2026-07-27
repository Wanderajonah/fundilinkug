import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import theme from '../theme';

export default function PhoneInput({
  label = 'Phone number',
  value,
  onChangeText,
  placeholder = '7XX XXX XXX',
  focused,
  onFocus,
  onBlur,
}) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.row, focused && styles.rowFocused]}>
        <View style={styles.codeWrap}>
          <Text style={styles.codeNum}>+256</Text>
        </View>
        <View style={styles.divider} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.mutedDark}
          value={value}
          onChangeText={onChangeText}
          keyboardType="phone-pad"
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    backgroundColor: theme.colors.input,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  rowFocused: { borderColor: theme.colors.accent },
  codeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeNum: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.border,
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    color: theme.colors.white,
    fontSize: 15,
    paddingVertical: 0,
  },
});
