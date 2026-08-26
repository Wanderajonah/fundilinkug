import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

export default function RoleCard({ icon, title, description, onPress, style }) {
  const { t } = useLanguage();
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={22} color={theme.colors.accent} />
      </View>
      <Text style={styles.title}>{t(title)}</Text>
      <Text style={styles.desc} numberOfLines={3}>{t(description)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.panel,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.elevation.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,184,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { color: theme.colors.white, fontWeight: '800', fontSize: 16, marginBottom: 6 },
  desc: { color: theme.colors.muted, fontSize: 12, lineHeight: 17 },
});
