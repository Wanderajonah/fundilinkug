import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import theme from '../theme';

export default function PrimaryButton({ children, onPress, style, filled = true, disabled, gradient = false }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, friction: 8, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 8, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[styles.button, filled ? styles.filled : styles.outline, style, disabled && styles.disabled]}
        activeOpacity={0.85}
      >
        <Text style={[styles.text, filled ? styles.textFilled : styles.textOutline]}>{children}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: theme.radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  filled: { backgroundColor: theme.colors.accent },
  outline: {
    borderWidth: 2,
    borderColor: theme.colors.accent,
    backgroundColor: 'transparent',
  },
  disabled: { opacity: 0.5 },
  text: { fontWeight: '700', fontSize: 16 },
  textFilled: { color: theme.colors.textDark },
  textOutline: { color: theme.colors.accent },
});
