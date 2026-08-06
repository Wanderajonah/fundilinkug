import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar, Animated } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import BrandLockup from '../components/BrandLockup';
import theme from '../theme';

export default function SplashScreen({ onFinish }) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => onFinish?.(), 2200);
    return () => clearTimeout(t);
  }, [onFinish, fade, scale]);

  return (
    <ScreenWrapper style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.black} />
      <View style={styles.center}>
        <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
          <BrandLockup size={150} wordmarkSize={35} />
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.black },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
