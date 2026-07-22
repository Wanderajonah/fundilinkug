import api from './api';

export const geocodeAddress = (address) =>
  api.get('/maps/geocode', { params: { address } });

export const reverseGeocode = (lat, lng) =>
  api.get('/maps/reverse', { params: { lat, lng } });

export const getNearbyFundis = ({ lat, lng, category, radiusKm }) =>
  api.get('/maps/nearby-fundis', { params: { lat, lng, category, radiusKm } });

export const getRoutePreview = ({ fromLat, fromLng, toLat, toLng }) =>
  api.get('/maps/route', { params: { fromLat, fromLng, toLat, toLng } });

export const updateUserLocation = (payload) => api.put('/users/location', payload);
