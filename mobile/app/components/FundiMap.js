import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapViewWrapper from './MapViewWrapper';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * Unified map for customer browse, set location, live tracking.
 * Metro resolves MapViewWrapper.web.js on web and MapViewWrapper.native.js on native.
 */
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
  const { t } = useLanguage();
  const loc = currentLocation || (region ? { lat: region.latitude, lng: region.longitude } : null);

  if (!loc) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>{t('Loading map…')}</Text>
      </View>
    );
  }

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
