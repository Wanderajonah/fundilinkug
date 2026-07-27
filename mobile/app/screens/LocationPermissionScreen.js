import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Alert, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocation } from '../../context/LocationContext';
import theme from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import FundiMap from '../components/FundiMap';
import * as Linking from 'expo-linking';

export default function LocationPermissionScreen({
  onAllow,
  onManual,
  visibleReason,
}) {
  const insets = useSafeAreaInsets();
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

      <View style={[styles.card, { bottom: Math.max(insets.bottom + 12, 18) }]}>
        <View style={styles.artworkWrap}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.artwork}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Enable Location</Text>
        <Text style={styles.sub}>{message}</Text>

        <PrimaryButton
          onPress={handling || loading ? undefined : handleEnable}
          style={styles.primaryCta}
          disabled={handling || loading}
        >
          {handling || loading ? 'Getting location…' : 'Enable Location'}
        </PrimaryButton>

        <TouchableOpacity style={styles.cancelBtn} onPress={handleOpenSystemSettings} activeOpacity={0.7}>
          <Text style={styles.cancelLabel}>Cancel</Text>
        </TouchableOpacity>
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
  primaryCta: { width: '100%', marginTop: 4 },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  cancelLabel: { color: theme.colors.muted, fontWeight: '700', fontSize: 15 },
});
