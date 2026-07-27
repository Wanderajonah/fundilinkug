import React from 'react';
import { Image } from 'react-native';

export default function AppLogo({ size = 88 }) {
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
