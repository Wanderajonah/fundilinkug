const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    purpose: { type: String, enum: ["register", "login"], required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

otpSchema.index({ phone: 1, purpose: 1 }, { unique: true });

module.exports = mongoose.model("Otp", otpSchema);
