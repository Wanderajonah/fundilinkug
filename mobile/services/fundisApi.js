import api from "./api";

export const getFundis = (params = {}) => api.get("/fundis", { params });

export const getNegotiableFundis = (params = {}) => api.get("/fundis/negotiable", { params });

export const getFundiById = (id) => api.get(`/fundis/${id}`);

export function mapFundiItem(item) {
  const user = item.userId || {};
  const skills = item.skills || [];
  return {
    id: user._id || item._id,
    _id: user._id || item._id,
    fundiProfileId: item._id,
    name: user.name || "Fundi",
    role: skills[0] || "Professional",
    rating: item.rating || 0,
    reviews: item.reviewCount || 0,
    reviewCount: item.reviewCount || 0,
    jobsCompleted: item.jobsCompleted ?? null,
    price: item.hourlyRate || Math.round((item.quoteAmount || 8000) / 1000),
    hourlyRate:
      item.hourlyRate ||
      `UGX ${Math.round((item.quoteAmount || 8000) / 1000)}K/hr`,
    skills,
    verified: item.verified,
    distanceKm: item.distanceKm,
    score: item.score,
    profilePhoto: user.profilePhoto || "",
    coverPhoto: user.coverPhoto || "",
    portfolioImages: item.portfolioImages || [],
    experience: item.experience || 0,
    location: user.locationLabel || user.address || "",
    isAvailable: item.isAvailable,
    availableForNegotiation: item.availableForNegotiation,
    userId: user,
  };
}
