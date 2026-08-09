import api from "./api";

export const getProfile = () => api.get("/users/profile");

export const updateProfile = (payload) => api.put("/users/update", payload);

export const updateUserLocation = (payload) =>
  api.put("/users/location", payload);

// Upload profile picture
export const uploadProfilePicture = (formData) => {
  return api.post("/users/profile-picture", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const uploadCoverPicture = (formData) => {
  return api.post("/users/cover-picture", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Upload portfolio images (fundi)
export const uploadPortfolioImages = (formData) => {
  return api.post("/users/portfolio/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Delete a portfolio image by its stored URL (fundi)
export const deletePortfolioImage = (imageUrl) => {
  return api.delete("/users/portfolio/image", { data: { imageUrl } });
};

// Fundi-specific location update for current GPS location
export const updateFundiLocation = (lat, lng) =>
  api.put("/bookings/fundi/location", { lat, lng });

// Update fundi availability status
export const updateFundiAvailability = (isAvailable) =>
  api.put("/bookings/fundi/availability", { isAvailable });

// Submit identity verification documents (fundi)
export const requestVerification = (formData) => {
  return api.post("/users/verification-request", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
