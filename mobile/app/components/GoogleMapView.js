import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DARK_MAP_STYLE, DEFAULT_REGION } from '../config/mapStyle';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * Google Maps view (react-native-maps) — used when
 * EXPO_PUBLIC_MAP_PROVIDER=google. Lazily imported so a dev build without the
 * native module degrades to the "Map unavailable" fallback instead of crashing.
 */
export default function GoogleMapView({
  style,
  region,
  currentLocation,
  fundis = [],
  destination,
  showRadiusCircle = false,
  radiusKm = 10,
  onRegionChange,
  onPressCoordinate,
  userLabel = 'You',
  userSubtitle = 'Customer',
}) {
  const [MapComponents, setMapComponents] = useState(null);
  const [mapError, setMapError] = useState(false);
  const mapRef = useRef(null);
  const { t } = useLanguage();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const maps = await import('react-native-maps');
        if (!cancelled) setMapComponents(() => maps);
      } catch {
        if (!cancelled) setMapError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const lat = currentLocation?.lat ?? region?.latitude ?? DEFAULT_REGION.latitude;
  const lng = currentLocation?.lng ?? region?.longitude ?? DEFAULT_REGION.longitude;

  if (mapError || !MapComponents) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>
          {mapError ? t('Map unavailable') : t('Loading map…')}
        </Text>
      </View>
    );
  }

  const { default: MapView, Marker, Circle } = MapComponents;

  const mapRegion = region || {
    latitude: lat,
    longitude: lng,
    latitudeDelta: DEFAULT_REGION.latitudeDelta,
    longitudeDelta: DEFAULT_REGION.longitudeDelta,
  };

  return (
    <MapView
      ref={mapRef}
      style={style}
      customMapStyle={DARK_MAP_STYLE}
      initialRegion={mapRegion}
      region={mapRegion}
      showsUserLocation
      showsMyLocationButton={false}
      onRegionChangeComplete={(r) => {
        onRegionChange?.({
          lat: r.latitude,
          lng: r.longitude,
          latitudeDelta: r.latitudeDelta,
          longitudeDelta: r.longitudeDelta,
        });
      }}
      onPress={(e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate || {};
        if (latitude == null || longitude == null) return;
        onPressCoordinate?.({ lat: latitude, lng: longitude });
      }}
    >
      <Marker
        coordinate={{ latitude: lat, longitude: lng }}
        title={t(userLabel)}
        description={t(userSubtitle)}
        pinColor={theme.colors.accent}
      />

      {showRadiusCircle ? (
        <Circle
          center={{ latitude: lat, longitude: lng }}
          radius={radiusKm * 1000}
          strokeColor="rgba(255,184,0,0.6)"
          fillColor="rgba(255,184,0,0.12)"
        />
      ) : null}

      {destination ? (
        <Marker
          coordinate={{
            latitude: destination.lat,
            longitude: destination.lng,
          }}
          title={destination.title || t('Destination')}
          description={destination.role ? t(destination.role) : undefined}
          pinColor={theme.colors.red}
        />
      ) : null}

      {fundis.map((f, index) => {
        const uid = f.userId;
        const loc = uid?.location;
        if (!loc?.lat) return null;
        const key = f._id || uid._id || `fundi-${index}`;
        const skills = (f.skills || []).filter(Boolean);
        const rating = f.rating > 0 ? ` · ★${f.rating.toFixed(1)}` : '';
        return (
          <Marker
            key={key}
            coordinate={{ latitude: loc.lat, longitude: loc.lng }}
            title={uid?.name || t('Fundi')}
            description={`${skills.length ? skills.join(', ') : t('Fundi')}${rating}`}
            pinColor={theme.colors.green}
          />
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: theme.colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.lg,
  },
  fallbackText: { color: theme.colors.muted },
});
