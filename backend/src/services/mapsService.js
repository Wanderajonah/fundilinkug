const { haversineDistanceKm, normalizeCoords } = require("../utils/geo");

const GOOGLE_BASE = "https://maps.googleapis.com/maps/api";

const getApiKey = () => process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_SERVER_KEY;

const extractAddressParts = (result) => {
  const find = (type) =>
    result.address_components?.find((c) => c.types?.includes(type))?.long_name || "";
  return {
    district:
      find("administrative_area_level_2") ||
      find("locality") ||
      find("sublocality") ||
      find("administrative_area_level_1"),
    country: find("country")
  };
};

const enrichGeocodeResult = (r, coords) => {
  const parts = extractAddressParts(r);
  return {
    formattedAddress: r.formatted_address,
    address: r.formatted_address,
    lat: coords.lat,
    lng: coords.lng,
    district: parts.district,
    country: parts.country,
    placeId: r.place_id,
    source: "google"
  };
};
const kampalaFallback = (lat, lng) => ({
  formattedAddress: "Kampala, Uganda",
  address: "Kampala, Uganda",
  district: "Kampala",
  country: "Uganda",
  lat: Number(lat) || -1.286389,
  lng: Number(lng) || 36.817223,
  placeId: null,
  source: "fallback"
});

const geocodeAddress = async (address) => {
  const key = getApiKey();
  if (!key) {
    return { ...kampalaFallback(), query: address, source: "fallback-no-key" };
  }

  const url = `${GOOGLE_BASE}/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" || !data.results?.[0]) {
    const err = new Error(data.error_message || "Address not found");
    err.statusCode = 404;
    throw err;
  }

  const r = data.results[0];
  return {
    formattedAddress: r.formatted_address,
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    placeId: r.place_id,
    source: "google"
  };
};

const reverseGeocode = async (lat, lng) => {
  const coords = normalizeCoords(lat, lng);
  const key = getApiKey();

  if (!key) {
    return kampalaFallback(coords.lat, coords.lng);
  }

  const url = `${GOOGLE_BASE}/geocode/json?latlng=${coords.lat},${coords.lng}&key=${key}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" || !data.results?.[0]) {
    return kampalaFallback(coords.lat, coords.lng);
  }

  const r = data.results[0];
  return enrichGeocodeResult(r, coords);
};

/** ETA in minutes from distance (rough urban speed ~25 km/h) */
const estimateEtaMinutes = (distanceKm) => Math.max(3, Math.round((distanceKm / 25) * 60));

const buildRouteSummary = (from, to) => {
  const distanceKm = Number(haversineDistanceKm(from, to).toFixed(2));
  return {
    distanceKm,
    etaMinutes: estimateEtaMinutes(distanceKm)
  };
};

module.exports = {
  geocodeAddress,
  reverseGeocode,
  buildRouteSummary,
  normalizeCoords
};
