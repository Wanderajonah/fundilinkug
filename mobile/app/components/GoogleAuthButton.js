import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import theme from '../theme';

export default function GoogleAuthButton({ label, onPress, loading, disabled }) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
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
          <Text style={styles.text}>{label || 'Continue with Google'}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  disabled: { opacity: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { color: '#3C4043', fontWeight: '600', fontSize: 16 },
  googleIcon: { width: 22, height: 22 },
});

