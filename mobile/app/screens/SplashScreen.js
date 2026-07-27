import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import AppLogo from '../components/AppLogo';
import theme from '../theme';

export default function SplashScreen({ onFinish }) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]),
      Animated.timing(taglineFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => onFinish?.(), 2200);
    return () => clearTimeout(t);
  }, [onFinish, fade, scale, taglineFade]);

  return (
    <ScreenWrapper style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.black} />
      <View style={styles.center}>
        <Animated.View style={[styles.ring, { opacity: fade, transform: [{ scale }] }]}>
          <AppLogo size={80} />
        </Animated.View>
        <Animated.Text style={[styles.brand, { opacity: fade }]}>FundiLink</Animated.Text>
        <Animated.Text style={[styles.tagline, { opacity: taglineFade }]}>Find. Book. Done.</Animated.Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.black },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  ring: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.panel,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.elevation.lg,
  },
  brand: { color: theme.colors.white, fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { marginTop: 8, color: theme.colors.muted, fontSize: 15, fontWeight: '600' },
});
