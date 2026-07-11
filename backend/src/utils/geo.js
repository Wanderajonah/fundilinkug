const toRad = (value) => (value * Math.PI) / 180;

const haversineDistanceKm = (a, b) => {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const aa =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
};

const normalizeCoords = (lat, lng) => ({
  lat: Number(lat),
  lng: Number(lng)
});

const filterByRadius = (origin, items, radiusKm, getLocation) => {
  return items
    .map((item) => {
      const loc = getLocation(item);
      if (!loc || loc.lat == null || loc.lng == null) return null;
      const distanceKm = haversineDistanceKm(origin, loc);
      if (distanceKm > radiusKm) return null;
      return { item, distanceKm };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm);
};

module.exports = { haversineDistanceKm, normalizeCoords, filterByRadius };
