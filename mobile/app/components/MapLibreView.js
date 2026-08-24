import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

export default function MapLibreView({
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
  const { t } = useLanguage();
  const [mapError, setMapError] = useState(false);
  const [selected, setSelected] = useState(null);
  const markerPressAtRef = useRef(0);
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
      // A marker tap also surfaces here on some platforms — don't instantly
      // dismiss the tooltip the marker just opened.
      if (Date.now() - markerPressAtRef.current < 350) return;
      setSelected(null);
      onPressCoordinate?.({ lat: plat, lng: plng });
    },
    [onPressCoordinate],
  );

  const selectMarker = useCallback((key) => {
    markerPressAtRef.current = Date.now();
    setSelected((current) => (current === key ? null : key));
  }, []);

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

      <Marker id="you" lngLat={[lng, lat]} anchor="bottom" onPress={() => selectMarker('you')}>
        <View style={styles.pinWrap}>
          {selected === 'you' ? (
            <View style={styles.callout}>
              <Text style={styles.calloutName}>{t(userLabel)}</Text>
              <Text style={styles.calloutRole}>
                {t(userSubtitle)} · <Ionicons name="navigate" size={9} color={theme.colors.accent} />
              </Text>
            </View>
          ) : null}
          <Ionicons name="location-sharp" size={34} color={theme.colors.accent} />
        </View>
      </Marker>

      {destination ? (
        <Marker
          id="destination"
          lngLat={[destination.lng, destination.lat]}
          anchor="bottom"
          onPress={() => selectMarker('destination')}
        >
          <View style={styles.pinWrap}>
            {selected === 'destination' ? (
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{t(destination.title || 'Destination')}</Text>
                {destination.role ? (
                  <Text style={styles.calloutRole}>{t(destination.role)}</Text>
                ) : null}
              </View>
            ) : null}
            <Ionicons name="location-sharp" size={34} color={theme.colors.red} />
          </View>
        </Marker>
      ) : null}

      {fundis.map((f, index) => {
        const uid = f.userId;
        const loc = uid?.location;
        if (!loc?.lat) return null;
        const key = f._id || uid._id || `fundi-${index}`;
        const name = uid?.name || t('Fundi');
        const skills = (f.skills || []).filter(Boolean);
        const role = skills.length ? `${t('Fundi')} · ${skills.join(', ')}` : t('Fundi');
        return (
          <Marker
            key={key}
            id={String(key)}
            lngLat={[loc.lng, loc.lat]}
            anchor="bottom"
            onPress={() => selectMarker(key)}
          >
            <View style={styles.pinWrap}>
              {selected === key ? (
                <View style={styles.callout}>
                  <View style={styles.calloutRow}>
                    <Text style={styles.calloutName} numberOfLines={1}>
                      {name}
                    </Text>
                    {f.verified ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={theme.colors.green}
                        style={styles.calloutCheck}
                      />
                    ) : null}
                  </View>
                  <Text style={styles.calloutRole} numberOfLines={1}>
                    {role}
                  </Text>
                  {f.rating > 0 ? (
                    <View style={styles.calloutMetaRow}>
                      <Ionicons name="star" size={10} color={theme.colors.accent} />
                      <Text style={styles.calloutMeta}>{f.rating.toFixed(1)}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              <Ionicons name="location-sharp" size={30} color={theme.colors.green} />
            </View>
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
  pinWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  callout: {
    backgroundColor: theme.colors.panel,
    borderColor: theme.colors.borderLight,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 2,
    minWidth: 120,
    maxWidth: 190,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  calloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutName: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  calloutCheck: { marginLeft: 4 },
  calloutRole: {
    color: theme.colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  calloutMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  calloutMeta: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
});
