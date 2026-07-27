import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
} from '@maplibre/maplibre-react-native';
import { DEFAULT_REGION } from '../config/mapStyle';
import theme from '../theme';

const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
};

function coordinateFromLatLng(lat, lng) {
  return [lng, lat];
}

function createCircleFeature(lat, lng, radiusKm) {
  const steps = 64;
  const earthRadiusKm = 6371;
  const distance = radiusKm / earthRadiusKm;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const coordinates = [];

  for (let i = 0; i <= steps; i += 1) {
    const bearing = (2 * Math.PI * i) / steps;
    const pointLat = Math.asin(
      Math.sin(latRad) * Math.cos(distance) +
        Math.cos(latRad) * Math.sin(distance) * Math.cos(bearing),
    );
    const pointLng =
      lngRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(distance) * Math.cos(latRad),
        Math.cos(distance) - Math.sin(latRad) * Math.sin(pointLat),
      );

    coordinates.push([
      (pointLng * 180) / Math.PI,
      (pointLat * 180) / Math.PI,
    ]);
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
    properties: {},
  };
}

function Pin({ label, color = theme.colors.accent }) {
  return (
    <View style={styles.pinWrap}>
      <View style={[styles.pin, { backgroundColor: color }]}>
        <Text style={styles.pinText}>{label}</Text>
      </View>
      <View style={[styles.pinStem, { borderTopColor: color }]} />
    </View>
  );
}

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
  const lat = currentLocation?.lat ?? DEFAULT_REGION.latitude;
  const lng = currentLocation?.lng ?? DEFAULT_REGION.longitude;
  const center = region
    ? coordinateFromLatLng(region.latitude, region.longitude)
    : coordinateFromLatLng(lat, lng);

  const radiusFeature = useMemo(
    () => createCircleFeature(lat, lng, radiusKm),
    [lat, lng, radiusKm],
  );

  return (
    <Map
      style={style}
      mapStyle={MAP_STYLE}
      compass={false}
      logo={false}
      attribution
      onPress={(e) => {
        const [pressLng, pressLat] = e.nativeEvent.lngLat || [];
        if (typeof pressLat === 'number' && typeof pressLng === 'number') {
          onPressCoordinate?.({ lat: pressLat, lng: pressLng });
        }
      }}
      onRegionDidChange={(e) => {
        const [nextLng, nextLat] = e.nativeEvent.center || [];
        if (typeof nextLat === 'number' && typeof nextLng === 'number') {
          onRegionChange?.({
            lat: nextLat,
            lng: nextLng,
            latitudeDelta: region?.latitudeDelta || 0.06,
            longitudeDelta: region?.longitudeDelta || 0.06,
          });
        }
      }}
    >
      <Camera center={center} zoom={13} duration={0} />

      {showRadiusCircle ? (
        <GeoJSONSource id="search-radius-source" data={radiusFeature}>
          <Layer
            id="search-radius-fill"
            type="fill"
            style={{ fillColor: 'rgba(255,184,0,0.12)' }}
          />
          <Layer
            id="search-radius-line"
            type="line"
            style={{
              lineColor: 'rgba(255,184,0,0.75)',
              lineWidth: 2,
            }}
          />
        </GeoJSONSource>
      ) : null}

      <Marker id="current-location" lngLat={coordinateFromLatLng(lat, lng)}>
        <Pin label="You" />
      </Marker>

      {destination ? (
        <Marker
          id="destination"
          lngLat={coordinateFromLatLng(destination.lat, destination.lng)}
        >
          <Pin label="Job" color="#EF4444" />
        </Marker>
      ) : null}

      {fundis.map((f) => {
        const uid = f.userId;
        if (!uid?.location?.lat || !uid?.location?.lng) return null;
        return (
          <Marker
            key={f._id || uid._id}
            id={String(f._id || uid._id)}
            lngLat={coordinateFromLatLng(uid.location.lat, uid.location.lng)}
          >
            <Pin label={uid.name?.charAt(0)?.toUpperCase() || 'F'} color="#22C55E" />
          </Marker>
        );
      })}
    </Map>
  );
}

const styles = StyleSheet.create({
  pinWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    minWidth: 34,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: theme.colors.black,
  },
  pinText: {
    color: theme.colors.black,
    fontSize: 10,
    fontWeight: '900',
  },
  pinStem: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
