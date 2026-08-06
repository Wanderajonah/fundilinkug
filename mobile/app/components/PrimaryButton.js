import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';

/**
 * App-wide button. Variants: primary | secondary | outline | ghost | destructive | google.
 * Legacy `filled` prop maps to primary/outline. Supports loading, left/right icon,
 * size (sm | md | lg) and a spring press animation.
 */
export default function PrimaryButton({
  children,
  onPress,
  style,
  filled = true,
  disabled,
  gradient = false,
  variant,
  loading = false,
  icon,
  iconRight,
  iconColor,
  size = 'lg',
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const resolvedVariant =
    variant || (filled ? 'primary' : 'outline');
  const v = theme.buttons.variants[resolvedVariant] || theme.buttons.variants.primary;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, friction: 8, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 8, useNativeDriver: true }).start();
  };

  const isBusy = loading;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.button,
          {
            height: theme.buttons.height[size],
            borderRadius: theme.buttons.radius[size],
          },
          {
            backgroundColor: v.backgroundColor,
            borderColor: v.borderColor,
          },
          disabled && styles.disabled,
          style,
        ]}
        activeOpacity={0.85}
      >
        {isBusy ? (
          <ActivityIndicator color={v.text} />
        ) : (
          <View style={styles.row}>
            {icon ? (
              <Ionicons
                name={icon}
                size={size === 'sm' ? 15 : 18}
                color={iconColor || v.text}
                style={styles.iconLeft}
              />
            ) : null}
            <Text
              style={[
                styles.text,
                { color: v.text, fontSize: theme.buttons.fontSize[size] },
              ]}
            >
              {children}
            </Text>
            {iconRight ? (
              <Ionicons
                name={iconRight}
                size={size === 'sm' ? 15 : 18}
                color={iconColor || v.text}
                style={styles.iconRight}
              />
            ) : null}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    ...theme.elevation.sm,
  },
  disabled: { opacity: 0.45 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '700' },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
});
