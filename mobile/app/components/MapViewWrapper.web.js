import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

/** Web fallback — MapLibre GL JS is not wired up; render a static preview */
export default function MapViewWrapper({
  style,
  currentLocation,
  fundis = [],
  destination,
  showRadiusCircle = false,
  radiusKm = 10,
  onPressCoordinate,
}) {
  const { t } = useLanguage();
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
      <Text style={styles.title}>{t('Map preview')}</Text>
      <Text style={styles.meta}>
        {t('You: {{lat}}, {{lng}}', { lat: currentLocation.lat.toFixed(4), lng: currentLocation.lng.toFixed(4) })}
      </Text>
      {showRadiusCircle ? (
        <Text style={styles.meta}>{t('Search radius: {{distance}} km', { distance: radiusKm })}</Text>
      ) : null}
      {destination ? (
        <Text style={styles.meta}>
          {t('Destination: {{lat}}, {{lng}}', { lat: destination.lat.toFixed(4), lng: destination.lng.toFixed(4) })}
        </Text>
      ) : null}
      <Text style={styles.meta}>{t('{{count}} fundis shown', { count: fundis.length })}</Text>
      <Text style={styles.hint}>{t('Install the Android/iOS app for the live map.')}</Text>
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
