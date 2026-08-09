import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

export default function n({ icon, label, onPress, style }) {
  const { t } = useLanguage();
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={22} color={theme.colors.accent} />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {t(label)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 88,
    backgroundColor: theme.colors.panel,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.elevation.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,184,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
