import React from 'react';
import { View } from 'react-native';
import PrimaryButton from './PrimaryButton';
import GoogleAuthButton from './GoogleAuthButton';

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
    <PrimaryButton
      variant="primary"
      icon="call-outline"
      label={label}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      style={style}
    >
      {label}
    </PrimaryButton>
  );
}
