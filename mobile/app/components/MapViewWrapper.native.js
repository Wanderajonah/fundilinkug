import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { MAP_PROVIDER } from '../config/mapStyle';

/**
 * Native map wrapper that avoids loading the map implementation until after
 * the app has mounted. This prevents Expo Go / incomplete dev clients from
 * crashing on missing native modules such as MLRNCameraModule.
 */
export default function MapViewWrapper(props) {
  const { t } = useLanguage();
  const [ResolvedView, setResolvedView] = useState(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadView() {
      try {
        const ViewComponent = MAP_PROVIDER === 'google'
          ? (await import('./GoogleMapView')).default
          : (await import('./MapLibreView')).default;
        if (!cancelled) setResolvedView(() => ViewComponent);
        return;
      } catch {
        try {
          const ViewComponent = MAP_PROVIDER === 'google'
            ? (await import('./MapLibreView')).default
            : (await import('./GoogleMapView')).default;
          if (!cancelled) setResolvedView(() => ViewComponent);
          return;
        } catch {
          if (!cancelled) setMapError(true);
        }
      }
    }

    loadView();

    return () => {
      cancelled = true;
    };
  }, []);

  if (mapError || !ResolvedView) {
    return (
      <View style={[styles.fallback, props.style]}>
        <Text style={styles.fallbackText}>
          {mapError ? t('Map unavailable') : t('Loading map…')}
        </Text>
      </View>
    );
  }

  return <ResolvedView {...props} />;
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
