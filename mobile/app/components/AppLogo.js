import React from 'react';
import { Image, StyleSheet } from 'react-native';

export default function AppLogo({ size = 88 }) {
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={[styles.image, { width: size, height: size }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
