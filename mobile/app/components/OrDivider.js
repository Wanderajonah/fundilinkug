import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

export default function OrDivider() {
  const { t } = useLanguage();
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.text}>{t('or')}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  text: {
    color: theme.colors.muted,
    fontSize: 13,
    marginHorizontal: 14,
  },
});
