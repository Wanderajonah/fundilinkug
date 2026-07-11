const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "UGX" },
    status: { type: String, enum: ["active", "frozen"], default: "active" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Wallet", walletSchema);
