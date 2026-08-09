import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

export default function EmptyState({ icon = 'file-tray-outline', title, message, style }) {
  const { t } = useLanguage();
  return (
    <View style={[styles.wrap, style]}>
      <Ionicons name={icon} size={48} color={theme.colors.mutedDark} />
      <Text style={styles.title}>{t(title)}</Text>
      {message ? <Text style={styles.message}>{t(message)}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  title: {
    color: theme.colors.white,
    fontWeight: '800',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
});
