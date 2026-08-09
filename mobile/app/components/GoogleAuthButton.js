import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

export default function GoogleAuthButton({ label, onPress, loading, disabled }) {
  const { t } = useLanguage();
  const v = theme.buttons.variants.google;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          height: theme.buttons.height.lg,
          borderRadius: theme.buttons.radius.lg,
          backgroundColor: v.backgroundColor,
          borderColor: v.borderColor,
        },
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.accent} />
      ) : (
        <View style={styles.row}>
          <Image
            source={require('../../assets/search.png')}
            style={styles.googleIcon}
            resizeMode="contain"
          />
          <Text style={styles.text}>{label ? t(label) : t('Continue with Google')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    ...theme.elevation.sm,
  },
  disabled: { opacity: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { color: '#3C4043', fontWeight: '600', fontSize: 16 },
  googleIcon: { width: 22, height: 22 },
});
