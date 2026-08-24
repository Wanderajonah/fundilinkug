const mongoose = require("mongoose");

const platformSettingsSchema = new mongoose.Schema(
  {
    adminName: { type: String, default: "Admin User" },
    adminEmail: { type: String, default: "admin@fundilink.com" },
    adminRole: { type: String, default: "Super Admin" },
    commissionRate: { type: Number, default: 0 },
    clientFeeRate: { type: Number, default: 5 },
    minJobAmount: { type: Number, default: 500 },
    serviceRadius: { type: Number, default: 25 },
    autoApprovalFundis: { type: String, default: "10 successful jobs" },
    disputeResolution: { type: String, default: "48 hours" },
    notifications: [
      { label: { type: String }, enabled: { type: Boolean, default: true } },
    ],
    paymentIntegrations: [
      {
        name: { type: String },
        status: { type: String, default: "Active" },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("PlatformSettings", platformSettingsSchema);
