import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import Constants from 'expo-constants';
import theme from '../theme';

let isExpoGo = false;
try {
  isExpoGo =
    Platform.OS !== 'web' &&
    (Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient');
} catch {}

export default function FundiMap({
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
  const loc = currentLocation || (region ? { lat: region.latitude, lng: region.longitude } : null);

  if (!loc) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>Loading map…</Text>
      </View>
    );
  }

  const MapViewWrapper = isExpoGo
    ? require('./MapViewWrapper.web').default
    : require('./MapViewWrapper').default;

  return (
    <MapViewWrapper
      style={style}
      region={region}
      currentLocation={loc}
      fundis={fundis}
      destination={destination}
      showRadiusCircle={showRadiusCircle}
      radiusKm={radiusKm}
      onRegionChange={onRegionChange}
      onPressCoordinate={onPressCoordinate}
    />
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
