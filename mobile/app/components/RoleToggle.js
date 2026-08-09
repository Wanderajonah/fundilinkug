import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

export default function RoleToggle({
  value,
  onChange,
  variant = 'default',
  customerLabel = 'Client',
  fundiLabel = 'Fundi',
}) {
  const { t } = useLanguage();
  const segmented = variant === 'segmented';

  return (
    <View style={[styles.row, segmented && styles.rowSegmented]}>
      {['customer', 'fundi'].map((role) => {
        const on = value === role;
        const label = role === 'customer' ? t(customerLabel) : t(fundiLabel);
        return (
          <TouchableOpacity
            key={role}
            style={[
              styles.btn,
              segmented && styles.btnSegmented,
              on && (segmented ? styles.btnSegmentedOn : styles.btnOn),
            ]}
            onPress={() => onChange(role)}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.text,
                on && (segmented ? styles.textSegmentedOn : styles.textOn),
                segmented && !on && styles.textSegmentedOff,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  rowSegmented: {
    gap: 0,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: theme.radius.pill,
    padding: 3,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.input,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  btnSegmented: {
    height: 42,
    borderRadius: theme.radius.pill,
    backgroundColor: 'transparent',
  },
  btnOn: { backgroundColor: theme.colors.accent },
  btnSegmentedOn: { backgroundColor: theme.colors.accent },
  text: { color: theme.colors.muted, fontWeight: '700', fontSize: 15 },
  textOn: { color: theme.colors.textDark },
  textSegmentedOn: { color: theme.colors.textDark, fontSize: 14, fontWeight: '700' },
  textSegmentedOff: { color: theme.colors.muted, fontWeight: '600' },
});
