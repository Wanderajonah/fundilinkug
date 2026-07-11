const { haversineDistanceKm } = require("../utils/geo");

const toPlain = (item) => (typeof item.toObject === "function" ? item.toObject() : { ...item });

const getRecommendations = (customerLocation, fundis, limit = 5) => {
  const enriched = fundis.map((item) => {
    const plain = toPlain(item);
    const distanceKm =
      plain.distanceKm ??
      haversineDistanceKm(customerLocation, plain.userId?.location || { lat: 0, lng: 0 });
    return { ...plain, distanceKm };
  });

  const maxDistance = Math.max(...enriched.map((f) => f.distanceKm), 1);

  const scored = enriched.map((fundi) => {
    const rating = Math.max(0, Math.min(5, fundi.rating || 0));
    const proximity = Math.max(0, 1 - fundi.distanceKm / maxDistance) * 5;
    const score = Number((0.6 * rating + 0.4 * proximity).toFixed(2));
    return { ...fundi, score, proximity: Number(proximity.toFixed(2)) };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
};

module.exports = { getRecommendations };
