import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import theme from '../theme';

/** Web fallback — react-native-maps is native-only */
export default function MapViewWrapper({
  style,
  currentLocation,
  fundis = [],
  destination,
  showRadiusCircle = false,
  radiusKm = 10,
  onPressCoordinate,
}) {
  return (
    <TouchableOpacity
      style={[styles.wrap, style]}
      activeOpacity={onPressCoordinate ? 0.9 : 1}
      onPress={() =>
        onPressCoordinate?.({
          lat: currentLocation.lat + 0.002,
          lng: currentLocation.lng + 0.002,
        })
      }
    >
      <Text style={styles.title}>Map preview</Text>
      <Text style={styles.meta}>
        You: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
      </Text>
      {showRadiusCircle ? (
        <Text style={styles.meta}>Search radius: {radiusKm} km</Text>
      ) : null}
      {destination ? (
        <Text style={styles.meta}>
          Destination: {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
        </Text>
      ) : null}
      <Text style={styles.meta}>{fundis.length} fundis shown</Text>
      <Text style={styles.hint}>Use Expo Go on Android/iOS for live Google Maps.</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.panel,
    borderRadius: theme.radius.lg,
    padding: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: { color: theme.colors.white, fontWeight: '800', marginBottom: 8 },
  meta: { color: theme.colors.muted, fontSize: 12, marginBottom: 4 },
  hint: { color: theme.colors.accent, fontSize: 11, marginTop: 8 },
});
