const mongoose = require("mongoose");

const fundiProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    skills: [{ type: String }],
    experience: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    jobsCompleted: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    verificationDocs: [{ type: String }],
    verificationNotes: { type: String, default: "" },
    requestedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    portfolioImages: [{ type: String }],
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null }
    },
    isAvailable: { type: Boolean, default: true },
    availableForNegotiation: { type: Boolean, default: false },
  },
  { timestamps: true }
);

fundiProfileSchema.index({ "currentLocation.lat": 1, "currentLocation.lng": 1 });

module.exports = mongoose.model("FundiProfile", fundiProfileSchema);
