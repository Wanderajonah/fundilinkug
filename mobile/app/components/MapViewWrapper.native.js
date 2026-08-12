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
  const cameraRef = useRef(null);
  const interactingRef = useRef(false);
  const appliedRef = useRef(null);
  const prevRequestRef = useRef(null);
  const desiredRef = useRef({ center: [0, 0], zoom: 0 });

  const lat = region?.latitude ?? currentLocation?.lat ?? DEFAULT_REGION.latitude;
  const lng = region?.longitude ?? currentLocation?.lng ?? DEFAULT_REGION.longitude;
  const zoom = deltaToZoom(region?.latitudeDelta ?? DEFAULT_REGION.latitudeDelta);

  const applyCamera = useCallback((target, animated) => {
    const cam = cameraRef.current;
    if (!cam) return;
    if (animated) {
      cam.easeTo({ center: target.center, zoom: target.zoom, duration: 300 });
    } else {
      cam.jumpTo({ center: target.center, zoom: target.zoom });
    }
    appliedRef.current = target;
  }, []);

  // Position the camera once the map view has loaded.
  const handleMapReady = useCallback(() => {
    applyCamera(desiredRef.current, false);
  }, [applyCamera]);

  useEffect(() => {
    handleMapReady();
  }, [handleMapReady]);

  // Follow genuine region changes from the parent (search / geolocation / new
  // location) but never fight the user's own pan/zoom gestures.
  useEffect(() => {
    const prev = prevRequestRef.current;
    const request = { center: [lng, lat], zoom };
    const isNew =
      !prev ||
      Math.abs(prev.center[0] - lng) > 1e-7 ||
      Math.abs(prev.center[1] - lat) > 1e-7 ||
      Math.abs(prev.zoom - zoom) > 0.01;
    prevRequestRef.current = request;
    desiredRef.current = request;
    if (isNew && !interactingRef.current && appliedRef.current) {
      applyCamera(request, true);
    }
  }, [lng, lat, zoom, applyCamera]);

  const handleRegionIsChanging = useCallback(() => {
    interactingRef.current = true;
  }, []);

  const handleRegionDidChange = useCallback(
    (e) => {
      const wasInteracting = interactingRef.current;
      interactingRef.current = false;
      const [clng, clat] = e.nativeEvent?.center || [];
      const z = e.nativeEvent?.zoom;
      if (clat == null || clng == null || z == null) return;
      if (wasInteracting || !appliedRef.current) {
        appliedRef.current = { center: [clng, clat], zoom: z };
      }
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
      onDidFinishLoadingMap={handleMapReady}
      onRegionIsChanging={handleRegionIsChanging}
      onRegionDidChange={handleRegionDidChange}
      onPress={handlePress}
      dragPan
      touchZoom
      doubleTapZoom
      doubleTapHoldZoom
      touchRotate
      touchPitch
    >
      <Camera ref={cameraRef} />

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
