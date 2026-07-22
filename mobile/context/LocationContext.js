import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Location from 'expo-location';
import { reverseGeocode, updateUserLocation } from '../services/mapsApi';
import { DEFAULT_REGION } from '../app/config/mapStyle';
import LocationPermissionDialog from '../app/components/LocationPermissionDialog';
import { useLocationServiceManager } from '../app/services/LocationServiceManager';

const LocationContext = createContext(null);

const MIN_SYNC_DISTANCE_M = 80;

function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function LocationProvider({ children }) {
  const [coords, setCoords] = useState({
    lat: DEFAULT_REGION.latitude,
    lng: DEFAULT_REGION.longitude,
  });
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [country, setCountry] = useState('');
  const [radiusKm, setRadiusKm] = useState(10);
  const [loading, setLoading] = useState(false);
  const [locationRevision, setLocationRevision] = useState(0);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);

  const authTokenRef = useRef('');
  const watchRef = useRef(null);
  const lastSavedRef = useRef({ lat: 0, lng: 0 });

  // dialog flow: never log out; just resolve whether we managed to get location.
  const loginResolverRef = useRef(null);


  const syncAddressFromCoords = useCallback(async (lat, lng) => {
    try {
      const { data } = await reverseGeocode(lat, lng);
      const formatted = data.formattedAddress || data.address || '';
      setAddress(formatted);
      setDistrict(data.district || '');
      setCountry(data.country || '');
      return data;
    } catch {
      return null;
    }
  }, []);

  const saveToBackend = useCallback(
    async (lat, lng, geo = {}) => {
      if (!authTokenRef.current) return;
      try {
        await updateUserLocation({
          lat,
          lng,
          locationLabel: geo.formattedAddress || geo.address || address,
          address: geo.address || geo.formattedAddress || address,
          district: geo.district || district,
          country: geo.country || country,
          searchRadiusKm: radiusKm,
        });
        lastSavedRef.current = { lat, lng };
      } catch {
        /* non-blocking */
      }
    },
    [address, district, country, radiusKm]
  );

  const applyCoords = useCallback(
    async (lat, lng, { syncBackend = true, bumpRevision = true } = {}) => {
      setCoords({ lat, lng });
      const geo = await syncAddressFromCoords(lat, lng);
      if (syncBackend && authTokenRef.current) {
        const moved =
          distanceMeters(lat, lng, lastSavedRef.current.lat, lastSavedRef.current.lng) >=
          MIN_SYNC_DISTANCE_M;
        if (moved || !lastSavedRef.current.lat) {
          await saveToBackend(lat, lng, geo || {});
        }
      }
      if (bumpRevision) setLocationRevision((v) => v + 1);
      return geo;
    },
    [syncAddressFromCoords, saveToBackend]
  );

  const captureCurrentLocation = useCallback(async () => {
    setLoading(true);
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        throw new Error('Location services are disabled');
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      await applyCoords(lat, lng);
      return { lat, lng };
    } finally {
      setLoading(false);
    }
  }, [applyCoords]);

  const persistCurrentLocation = useCallback(async () => {
    await saveToBackend(coords.lat, coords.lng, {
      formattedAddress: address,
      address,
      district,
      country,
    });
  }, [coords.lat, coords.lng, address, district, country, saveToBackend]);

  const setManualLocation = useCallback(
    async (lat, lng, label) => {
      if (label) setAddress(label);
      await applyCoords(lat, lng);
    },
    [applyCoords]
  );

  const stopWatching = useCallback(() => {
    watchRef.current?.remove?.();
    watchRef.current = null;
  }, []);

  const startWatching = useCallback(async () => {
    if (!authTokenRef.current || watchRef.current) return;
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) return;
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return;

      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: MIN_SYNC_DISTANCE_M,
          timeInterval: 30000,
        },
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          applyCoords(lat, lng, { syncBackend: true, bumpRevision: true });
        }
      );
    } catch {
      /* ignore watch failures */
    }
  }, [applyCoords]);

  const setAuthTokenForSync = useCallback(
    (token) => {
      authTokenRef.current = token || '';
      if (token) {
        startWatching();
      } else {
        stopWatching();
      }
    },
    [startWatching, stopWatching]
  );

  const resolveLoginFlow = useCallback((success) => {
    const resolver = loginResolverRef.current;
    loginResolverRef.current = null;
    setDialogVisible(false);
    setDialogLoading(false);
    resolver?.(success);
  }, []);

  const ensureLocationForLogin = useCallback(async () => {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    const { status } = await Location.getForegroundPermissionsAsync();

    if (servicesEnabled && status === 'granted') {
      try {
        await captureCurrentLocation();
        await startWatching();
        return true;
      } catch {
        /* fall through to dialog */
      }
    }

    return new Promise((resolve) => {
      loginResolverRef.current = resolve;
      setDialogVisible(true);
    });
  }, [captureCurrentLocation, startWatching]);

  const handleDialogEnable = useCallback(async () => {
    // CRITICAL UX BUG FIX:
    // Never log out / reset auth here. "Enable Location" should open system
    // settings. After user returns, ensureLocationForLogin will re-check.
    setDialogLoading(true);
    try {
      // Best-effort open settings, then we just resolve false so callers can
      // remain signed in and re-show dialog.
      // LocationProvider already renders this dialog; we keep auth intact.
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (servicesEnabled) {
        const ok = await captureCurrentLocation();
        await startWatching();
        resolveLoginFlow(!!ok);
      } else {
        // Attempt to open OS location settings.
        // Android and iOS deep links differ.
        if (Platform.OS === 'android') {
          // eslint-disable-next-line global-require
          const Linking = require('expo-linking');
          await Linking.openURL(
            'android-settings://android.settings.LOCATION_SOURCE_SETTINGS'
          );
        } else {
          const Linking = require('expo-linking');
          await Linking.openURL('app-settings:');
        }
        // user will return; dialog will be re-checked via ensureLocationForLogin
        resolveLoginFlow(false);
      }
    } catch {
      resolveLoginFlow(false);
    } finally {
      setDialogLoading(false);
    }
  }, [captureCurrentLocation, startWatching, resolveLoginFlow]);


  const handleDialogCancel = useCallback(() => {
    resolveLoginFlow(false);
  }, [resolveLoginFlow]);

  useEffect(() => () => stopWatching(), [stopWatching]);

  const value = useMemo(
    () => ({
      coords,
      address,
      district,
      country,
      radiusKm,
      setRadiusKm,
      loading,
      locationRevision,
      captureCurrentLocation,
      setManualLocation,
      syncAddressFromCoords,
      saveToBackend: persistCurrentLocation,
      ensureLocationForLogin,
      setAuthTokenForSync,
      region: {
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      },
    }),
    [
      coords,
      address,
      district,
      country,
      radiusKm,
      loading,
      locationRevision,
      captureCurrentLocation,
      setManualLocation,
      syncAddressFromCoords,
      persistCurrentLocation,
      ensureLocationForLogin,
      setAuthTokenForSync,
    ]
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
      <LocationPermissionDialog
        visible={dialogVisible}
        loading={dialogLoading}
        onEnable={handleDialogEnable}
        onCancel={handleDialogCancel}
      />
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
