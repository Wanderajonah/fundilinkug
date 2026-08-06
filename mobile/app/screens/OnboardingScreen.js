import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import BrandLockup from '../components/BrandLockup';
import RoleCard from '../components/RoleCard';
import theme from '../theme';

const HERO_VIDEO = require('../../assets/hero-bg.mp4');

export default function OnboardingScreen({ onSelectRole, onSignIn, onSkip }) {
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  const player = useVideoPlayer(HERO_VIDEO);

  useEffect(() => {
    if (player) {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  }, [player]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={styles.hero}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
        <View style={styles.heroOverlay} />
        <View style={[styles.heroContent, { paddingTop: insets.top + 16 }]}>
          <BrandLockup size={150} />
          <Text style={styles.tagline}>Trusted Fundis. On Demand.</Text>
        </View>
      </View>

      <Animated.View
        style={[
          styles.body,
          { paddingBottom: Math.max(insets.bottom, 16), opacity: fade, transform: [{ translateY: slide }] },
        ]}
      >
        <Text style={styles.bodyTitle}>Welcome</Text>
        <Text style={styles.bodySub}>How would you like to use FundiLink?</Text>
        <View style={styles.cardsRow}>
          <RoleCard
            icon="search-outline"
            title="Find a Fundi"
            description="I'm looking for skilled professionals to work with."
            onPress={() => onSelectRole?.('customer')}
            style={{ marginRight: 10 }}
          />
          <RoleCard
            icon="construct-outline"
            title="I am a Fundi"
            description="I'd like to offer my services."
            onPress={() => onSelectRole?.('fundi')}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={onSkip} hitSlop={12}>
            <Text style={styles.footerLink}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSignIn} hitSlop={12}>
            <Text style={styles.footerLinkBold}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.black },
  hero: { flex: 1, justifyContent: 'flex-end' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  heroContent: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  tagline: {
    color: theme.colors.white,
    fontSize: 17,
    fontWeight: '600',
    marginTop: 14,
    textAlign: 'center',
    opacity: 0.9,
  },
  body: {
    backgroundColor: theme.colors.black,
    paddingHorizontal: 20,
    paddingTop: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
  },
  bodyTitle: {
    color: theme.colors.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  bodySub: {
    color: theme.colors.muted,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
  },
  cardsRow: { flexDirection: 'row', marginBottom: 20 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  footerLink: { color: theme.colors.muted, fontSize: 15, fontWeight: '600' },
  footerLinkBold: { color: theme.colors.accent, fontSize: 15, fontWeight: '800' },
});
