const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    fundiId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    photoUrls: [{ type: String }],
    service: { type: String, default: "" },
    amount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

reviewSchema.index({ jobId: 1, customerId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Review", reviewSchema);
