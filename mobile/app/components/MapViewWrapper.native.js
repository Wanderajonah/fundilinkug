import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Map,
  Camera,
  Marker,
  GeoJSONSource,
  Layer,
} from '@maplibre/maplibre-react-native';
import {
  DARK_MAP_STYLE_URL,
  DEFAULT_REGION,
  deltaToZoom,
  zoomToDelta,
  circlePolygonFeature,
} from '../config/mapStyle';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

export default function MapViewWrapper({
  style,
  region,
  currentLocation,
  fundis = [],
  destination,
  showRadiusCircle = false,
  radiusKm = 10,
  onRegionChange,
  onPressCoordinate,
}) {
  const { t } = useLanguage();
  const [mapError, setMapError] = useState(false);
  const prevCameraKey = useRef('');

  const lat = region?.latitude ?? currentLocation?.lat ?? DEFAULT_REGION.latitude;
  const lng = region?.longitude ?? currentLocation?.lng ?? DEFAULT_REGION.longitude;
  const zoom = deltaToZoom(region?.latitudeDelta ?? DEFAULT_REGION.latitudeDelta);

  const cameraKey = `${lng.toFixed(6)},${lat.toFixed(6)},${zoom}`;
  const [camera, setCamera] = useState(() => ({ center: [lng, lat], zoom }));

  useEffect(() => {
    if (prevCameraKey.current !== cameraKey) {
      prevCameraKey.current = cameraKey;
      setCamera({ center: [lng, lat], zoom });
    }
  }, [cameraKey, lng, lat, zoom]);

  const handleRegionDidChange = useCallback(
    (e) => {
      const [clng, clat] = e.nativeEvent?.center || [];
      const z = e.nativeEvent?.zoom;
      if (clat == null || clng == null || z == null) return;
      const d = zoomToDelta(z);
      onRegionChange?.({ lat: clat, lng: clng, latitudeDelta: d, longitudeDelta: d });
    },
    [onRegionChange],
  );

  const handlePress = useCallback(
    (e) => {
      const [plng, plat] = e.nativeEvent?.lngLat || [];
      if (plat == null || plng == null) return;
      onPressCoordinate?.({ lat: plat, lng: plng });
    },
    [onPressCoordinate],
  );

  if (mapError) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>{t('Map unavailable')}</Text>
      </View>
    );
  }

  return (
    <Map
      style={style}
      mapStyle={DARK_MAP_STYLE_URL}
      onDidFailLoadingMap={() => setMapError(true)}
      onRegionDidChange={handleRegionDidChange}
      onPress={handlePress}
    >
      <Camera center={camera.center} zoom={camera.zoom} duration={300} />

      {showRadiusCircle ? (
        <GeoJSONSource
          id="searchRadius"
          data={circlePolygonFeature(lat, lng, radiusKm)}
        >
          <Layer
            id="searchRadiusFill"
            type="fill"
            paint={{
              fillColor: 'rgba(255,184,0,0.12)',
              fillOutlineColor: 'rgba(255,184,0,0.6)',
            }}
          />
        </GeoJSONSource>
      ) : null}

      <Marker id="you" lngLat={[lng, lat]} anchor="center">
        <View style={styles.youPin} />
      </Marker>

      {destination ? (
        <Marker
          id="destination"
          lngLat={[destination.lng, destination.lat]}
          anchor="center"
        >
          <View style={styles.destPin} />
        </Marker>
      ) : null}

      {fundis.map((f, index) => {
        const uid = f.userId;
        const loc = uid?.location;
        if (!loc?.lat) return null;
        const key = f._id || uid._id || `fundi-${index}`;
        return (
          <Marker key={key} id={String(key)} lngLat={[loc.lng, loc.lat]} anchor="center">
            <View style={styles.fundiPin} />
          </Marker>
        );
      })}
    </Map>
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
  youPin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.accent,
    borderWidth: 3,
    borderColor: '#000000',
  },
  fundiPin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  destPin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});
