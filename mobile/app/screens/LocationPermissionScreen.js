import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Alert, Image, Platform } from 'react-native';
import { useLocation } from '../../context/LocationContext';
import theme from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import FundiMap from '../components/FundiMap';
import * as Linking from 'expo-linking';

function getBrandPrimaryColor() {
  // Use the existing brand primary across the app. Accent is amber.
  return theme.colors.accent;
}

export default function LocationPermissionScreen({
  onAllow,
  onManual,
  visibleReason,
}) {
  const { coords, captureCurrentLocation, loading } = useLocation();
  const [handling, setHandling] = useState(false);

  const handleEnable = async () => {
    try {
      setHandling(true);
      await captureCurrentLocation();
      onAllow?.();
    } catch (e) {
      Alert.alert('Permission needed', e?.message || 'Enable location to continue.');
    } finally {
      setHandling(false);
    }
  };

  const handleOpenSystemSettings = async () => {
    try {
      // Open system settings for location.
      if (Platform.OS === 'android') {
        await Linking.openURL('android-settings://android.settings.LOCATION_SOURCE_SETTINGS');
      } else {
        // iOS: open Settings -> Privacy & Security -> Location Services
        await Linking.openURL('app-settings:');
      }
    } catch {
      await Linking.openURL('app-settings:');
    }
    onManual?.();
  };

  const message = useMemo(() => {
    return visibleReason || 'Location access is required to find nearby Fundis and provide location-based services.';
  }, [visibleReason]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.black} />

      <FundiMap style={styles.map} currentLocation={coords} showRadiusCircle={false} />

      <View style={styles.card}>
        <View style={styles.artworkWrap}>
          <Image
            source={require('../../assets/Gemini_Generated_Image_za5na1za5na1za5n (6).png')}
            style={styles.artwork}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Enable Location</Text>
        <Text style={styles.sub}>{message}</Text>

        <PrimaryButton
          onPress={handling || loading ? undefined : handleEnable}
          style={[styles.primaryCta, { backgroundColor: getBrandPrimaryColor() }]}
          disabled={handling || loading}
        >
          {handling || loading ? 'Getting location…' : 'Enable Location'}
        </PrimaryButton>

        <PrimaryButton
          filled={false}
          onPress={handleOpenSystemSettings}
          style={styles.secondary}
        >
          Cancel
        </PrimaryButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.black },
  map: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 18,
    backgroundColor: theme.colors.panel,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  artworkWrap: { width: '100%', alignItems: 'center', marginBottom: 6 },
  artwork: { width: 160, height: 120 },
  title: { fontSize: 20, fontWeight: '800', color: theme.colors.white, marginTop: 6 },
  sub: { color: theme.colors.muted, textAlign: 'center', marginTop: 8, marginBottom: 14, fontSize: 14, lineHeight: 20 },
  primaryCta: { width: '100%', backgroundColor: theme.colors.accent, marginTop: 4 },
  secondary: { width: '100%', marginTop: 10, borderColor: theme.colors.border },
});

