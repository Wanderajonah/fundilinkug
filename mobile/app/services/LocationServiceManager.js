import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AppState, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { reverseGeocode, updateUserLocation } from '../../services/mapsApi';

// Reusable manager (logic lives here). Hook-like API so it can be used in both
// Client and Fundi flows.
export function useLocationServiceManager({ authToken, coordsRef, setCoords }) {
  const [locationStatus, setLocationStatus] = useState({
    servicesEnabled: false,
    permissionGranted: false,
    lastError: null,
  });

  const appStateRef = useRef(AppState.currentState);

  const syncAddressFromCoords = useCallback(async (lat, lng) => {
    try {
      const { data } = await reverseGeocode(lat, lng);
      const formatted = data.formattedAddress || data.address || '';
      return {
        formattedAddress: formatted,
        address: data.address || data.formattedAddress || formatted,
        district: data.district || '',
        country: data.country || '',
      };
    } catch {
      return null;
    }
  }, []);

  const fetchAndUpdateUserLocation = useCallback(
    async ({ radiusKm = 10 } = {}) => {
      // Must be called only when location services + permission are enabled.
      if (!authToken) return { updated: false, lat: null, lng: null };

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLocationStatus((s) => ({ ...s, servicesEnabled: false }));
        throw new Error('Location services are disabled');
      }

      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus((s) => ({ ...s, permissionGranted: false }));
        throw new Error('Location permission not granted');
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      if (coordsRef) coordsRef.current = { lat, lng };
      setCoords?.({ lat, lng });

      const geo = await syncAddressFromCoords(lat, lng);
      try {
        await updateUserLocation({
          lat,
          lng,
          locationLabel: geo?.formattedAddress || '',
          address: geo?.address || '',
          district: geo?.district || '',
          country: geo?.country || '',
          searchRadiusKm: radiusKm,
        });
      } catch (e) {
        // non-blocking for UX; location can still be used locally
      }

      return { updated: true, lat, lng };
    },
    [authToken, coordsRef, setCoords, syncAddressFromCoords]
  );

  const checkEnabled = useCallback(async () => {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      const { status } = await Location.getForegroundPermissionsAsync();
      const permissionGranted = status === 'granted';
      setLocationStatus({ servicesEnabled, permissionGranted, lastError: null });
      return { servicesEnabled, permissionGranted };
    } catch (e) {
      setLocationStatus((s) => ({ ...s, lastError: e }));
      return { servicesEnabled: false, permissionGranted: false };
    }
  }, []);

  const openSystemLocationSettings = useCallback(async () => {
    // Android: Settings -> Location
    // iOS: Settings -> Privacy & Security -> Location Services
    // Expo can only reliably deep link on iOS with specific URL schemes.
    // We'll try both, then fall back to general app settings.
    try {
      if (Platform.OS === 'android') {
        // Expo's Linking: use intent URI
        await Linking.openURL('android-settings://android.settings.LOCATION_SOURCE_SETTINGS');
        return;
      }

      // iOS: best-effort deep link to Settings
      // Note: this is not officially guaranteed for all iOS versions, but works on most.
      await Linking.openURL('app-settings:');
    } catch {
      // fallback
      await Linking.openURL('app-settings:');
    }
  }, []);

  const requestPermissionIfNeeded = useCallback(async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') return true;

    const res = await Location.requestForegroundPermissionsAsync();
    const ok = res.status === 'granted';
    setLocationStatus((s) => ({ ...s, permissionGranted: ok }));
    return ok;
  }, []);

  const recheckOnResume = useCallback(async () => {
    await checkEnabled();
    const { servicesEnabled, permissionGranted } = await checkEnabled();
    if (!servicesEnabled) return { ok: false, reason: 'services_disabled' };
    if (!permissionGranted) {
      const granted = await requestPermissionIfNeeded();
      if (!granted) return { ok: false, reason: 'permission_denied' };
    }

    try {
      await fetchAndUpdateUserLocation();
      return { ok: true };
    } catch (e) {
      setLocationStatus((s) => ({ ...s, lastError: e }));
      return { ok: false, reason: 'fetch_failed' };
    }
  }, [checkEnabled, fetchAndUpdateUserLocation, requestPermissionIfNeeded]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (prev.match(/inactive|background/) && nextState === 'active') {
        // when user returns from system settings
        await recheckOnResume();
      }
    });
    return () => sub.remove();
  }, [recheckOnResume]);

  const value = useMemo(
    () => ({
      locationStatus,
      checkEnabled,
      openSystemLocationSettings,
      requestPermissionIfNeeded,
      fetchAndUpdateUserLocation,
      recheckOnResume,
    }),
    [
      locationStatus,
      checkEnabled,
      openSystemLocationSettings,
      requestPermissionIfNeeded,
      fetchAndUpdateUserLocation,
      recheckOnResume,
    ]
  );

  return value;
}

