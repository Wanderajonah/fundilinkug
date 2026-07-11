const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fundiId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    description: { type: String, required: true },
    category: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    imageUrl: { type: String, default: "" },
    quoteAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["open", "quoted", "accepted", "in_progress", "completed", "cancelled"],
      default: "open"
    },
    address: { type: String, default: "" },
    amount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
