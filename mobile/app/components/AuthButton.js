import React from 'react';
import { View } from 'react-native';
import PrimaryButton from './PrimaryButton';
import GoogleAuthButton from './GoogleAuthButton';
import { useLanguage } from '../i18n/LanguageContext';

export default function AuthButton({
  variant = 'google',
  label,
  onPress,
  loading = false,
  disabled = false,
  style,
}) {
  const { t } = useLanguage();
  if (variant === 'google') {
    return (
      <View style={style}>
        <GoogleAuthButton
          label={t(label)}
          onPress={onPress}
          loading={loading}
          disabled={disabled}
        />
      </View>
    );
  }

  return (
    <PrimaryButton
      variant="primary"
      icon="call-outline"
      label={t(label)}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      style={style}
    >
      {t(label)}
    </PrimaryButton>
  );
}
