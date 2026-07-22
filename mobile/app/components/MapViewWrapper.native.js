import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DARK_MAP_STYLE, DEFAULT_REGION } from '../config/mapStyle';
import theme from '../theme';

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
  const [MapComponents, setMapComponents] = useState(null);
  const [mapError, setMapError] = useState(false);
  const mapRef = useRef(null);

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
    return () => { cancelled = true; };
  }, []);

  const lat = currentLocation?.lat ?? DEFAULT_REGION.latitude;
  const lng = currentLocation?.lng ?? DEFAULT_REGION.longitude;

  if (mapError || !MapComponents) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>
          {mapError ? 'Map unavailable' : 'Loading map…'}
        </Text>
      </View>
    );
  }

  const { default: MapView, Marker, Circle, PROVIDER_GOOGLE } = MapComponents;

  const mapRegion = region || {
    latitude: lat,
    longitude: lng,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  };

  return (
    <MapView
      ref={mapRef}
      style={style}
      provider={PROVIDER_GOOGLE}
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
        const { latitude, longitude } = e.nativeEvent.coordinate;
        onPressCoordinate?.({ lat: latitude, lng: longitude });
      }}
    >
      <Marker
        coordinate={{ latitude: lat, longitude: lng }}
        title="You"
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
          coordinate={{ latitude: destination.lat, longitude: destination.lng }}
          title={destination.title || 'Destination'}
          pinColor="#EF4444"
        />
      ) : null}

      {fundis.map((f) => {
        const uid = f.userId;
        if (!uid?.location?.lat) return null;
        return (
          <Marker
            key={f._id || uid._id}
            coordinate={{ latitude: uid.location.lat, longitude: uid.location.lng }}
            title={uid.name}
            description={`${(f.skills || []).join(', ')} · ${f.distanceKm?.toFixed?.(1) || '?'} km · ★${f.rating || '-'}`}
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
