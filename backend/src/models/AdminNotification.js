const mongoose = require("mongoose");

const adminNotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["verification_approved", "verification_rejected", "info"],
      required: true,
    },
    message: { type: String, required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

adminNotificationSchema.index({ read: 1, createdAt: -1 });

module.exports = mongoose.model("AdminNotification", adminNotificationSchema);
