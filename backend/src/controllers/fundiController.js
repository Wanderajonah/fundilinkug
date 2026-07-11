const FundiProfile = require("../models/FundiProfile");
const { getRecommendations } = require("../services/recommendationService");
const { filterByRadius, normalizeCoords } = require("../utils/geo");

const getFundis = async (req, res, next) => {
  try {
    const { category, lat, lng, radiusKm = 20 } = req.query;
    const query = category && category !== "all" ? { skills: { $in: [category] } } : {};
    let fundis = await FundiProfile.find(query)
      .populate({
        path: "userId",
        match: { "location.lat": { $ne: 0 }, "location.lng": { $ne: 0 } },
        select: "-password",
      });

    if (lat && lng) {
      const origin = normalizeCoords(lat, lng);
      const radius = Math.min(50, Math.max(1, Number(radiusKm)));
      const inRadius = filterByRadius(origin, fundis, radius, (f) => f.userId?.location);
      fundis = inRadius.map(({ item, distanceKm }) => {
        const plain = item.toObject();
        plain.distanceKm = Number(distanceKm.toFixed(2));
        return plain;
      });
      const recommendations = getRecommendations(origin, fundis, 5);
      return res.json(recommendations);
    }

    return res.json(fundis);
  } catch (error) {
    return next(error);
  }
};

const getFundiById = async (req, res, next) => {
  try {
    const fundi = await FundiProfile.findById(req.params.id).populate("userId", "-password");
    if (!fundi) return res.status(404).json({ message: "Fundi not found" });
    return res.json(fundi);
  } catch (error) {
    return next(error);
  }
};

module.exports = { getFundis, getFundiById };
