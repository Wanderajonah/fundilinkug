import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';

/**
 * Standard icon-only button (back arrows, settings, info, etc.).
 * size: 40x40 default, `sm` = 32x32. Variants: default (glass) | accent.
 */
export default function IconButton({
  name,
  onPress,
  color = theme.colors.white,
  size = 'md',
  variant = 'default',
  disabled,
  style,
  hitSlop = 8,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.9, friction: 8, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 8, useNativeDriver: true }).start();
  };

  const dim = size === 'sm' ? 32 : theme.buttons.iconBtn.size;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        hitSlop={hitSlop}
        activeOpacity={0.75}
        style={[
          styles.button,
          {
            width: dim,
            height: dim,
            borderRadius: size === 'sm' ? 10 : theme.buttons.iconBtn.radius,
          },
          variant === 'default' ? styles.default : styles.accent,
          disabled && styles.disabled,
        ]}
      >
        <Ionicons name={name} size={size === 'sm' ? 16 : 20} color={color} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  default: {
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  accent: {
    backgroundColor: theme.colors.accent,
    borderWidth: 1,
    borderColor: 'transparent',
    ...theme.elevation.sm,
  },
  disabled: { opacity: 0.4 },
});
