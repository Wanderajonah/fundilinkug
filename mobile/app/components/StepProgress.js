import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

export default function StepProgress({ step, total, label }) {
  const { t } = useLanguage();
  const pct = (step / total) * 100;
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {t('Step {{current}} of {{total}} — {{label}}', {
          current: step,
          total,
          label: t(label),
        })}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  label: { color: theme.colors.muted, fontSize: 12, marginBottom: 8 },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.input,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: 2,
  },
});
