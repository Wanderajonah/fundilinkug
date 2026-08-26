const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    email: { type: String, lowercase: true, sparse: true, unique: true },
    phone: { type: String, sparse: true, unique: true },
    password: { type: String },
    role: { type: String, enum: ["customer", "fundi", "admin"], required: true },
    fundiEnabled: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    dateOfBirth: { type: Date },
    profilePhoto: { type: String, default: "" },
    coverPhoto: { type: String, default: "" },
    googleId: { type: String, sparse: true, unique: true },
    onboardingComplete: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    socketId: { type: String, default: null },
    location: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    locationLabel: { type: String, default: "" },
    address: { type: String, default: "" },
    district: { type: String, default: "" },
    country: { type: String, default: "" },
    searchRadiusKm: { type: Number, default: 10 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
