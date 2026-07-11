const mongoose = require("mongoose");

const fundiProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    skills: [{ type: String }],
    experience: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    verified: { type: Boolean, default: false },
    portfolioImages: [{ type: String }],
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null }
    },
    isAvailable: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Index for geospatial queries
fundiProfileSchema.index({ "currentLocation.lat": 1, "currentLocation.lng": 1 });

module.exports = mongoose.model("FundiProfile", fundiProfileSchema);
