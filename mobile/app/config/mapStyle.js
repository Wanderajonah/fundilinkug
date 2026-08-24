/**
 * Map provider configuration.
 *   google             — development/testing with react-native-maps (needs a
 *                        Google Maps API key at build time).
 *   maplibre           — production, free vector tiles via CARTO.
 * Switch with EXPO_PUBLIC_MAP_PROVIDER=google|maplibre in mobile/.env.
 */
const explicitProvider = process.env.EXPO_PUBLIC_MAP_PROVIDER;
const isProductionBuild = process.env.EAS_BUILD_PROFILE === 'production';

export const MAP_PROVIDER =
  explicitProvider === 'google' || explicitProvider === 'maplibre'
    ? explicitProvider
    : isProductionBuild
      ? 'maplibre'
      : 'google';

// MapLibre — dark vector style. Override the style URL at build time with
// EXPO_PUBLIC_MAP_STYLE_URL (e.g. a self-hosted or commercial style).
export const DEFAULT_DARK_STYLE_URL =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export const DARK_MAP_STYLE_URL =
  process.env.EXPO_PUBLIC_MAP_STYLE_URL || DEFAULT_DARK_STYLE_URL;

// Google Maps — equivalent dark styling for customMapStyle.
export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1f1f1f' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e0e' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#242424' }] },
];

export const DEFAULT_REGION = {
  latitude: -1.286389,
  longitude: 36.817223,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

/**
 * Approximate a react-native-maps style region (lat/lng deltas) to a MapLibre
 * zoom level. heightPx defaults to a typical portrait map height.
 */
export function deltaToZoom(deltaLat, heightPx = 800) {
  const d = Math.max(0.000001, Number(deltaLat) || 0.06);
  return Math.round(Math.log2((heightPx * 360) / (d * 512)));
}

/**
 * Inverse of `deltaToZoom` — convert a MapLibre zoom level back to a
 * react-native-maps style latitude delta, for reporting region changes.
 */
export function zoomToDelta(zoom, heightPx = 800) {
  const z = Math.max(0, Number(zoom) || 0);
  return Math.max(0.000001, (heightPx * 360) / (2 ** z * 512));
}

/**
 * Build a GeoJSON Polygon circle around (lat, lng) for the search-radius
 * overlay. Approximate equirectangular projection is accurate enough at the
 * scales used here (tens of km).
 */
export function circlePolygonFeature(lat, lng, radiusKm, points = 64) {
  const latPerKm = 1 / 110.574;
  const lngPerKm = 1 / (111.32 * Math.cos((lat * Math.PI) / 180) || 111.32);
  const coords = [];
  for (let i = 0; i <= points; i += 1) {
    const theta = (i / points) * 2 * Math.PI;
    coords.push([
      lng + Math.cos(theta) * radiusKm * lngPerKm,
      lat + Math.sin(theta) * radiusKm * latPerKm,
    ]);
  }
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [coords] },
  };
}
