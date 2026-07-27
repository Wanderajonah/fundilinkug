const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fundiId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    category: { type: String, required: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "ACCEPTED",
        "ON_THE_WAY",
        "ARRIVED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "DISPUTED"
      ],
      default: "PENDING"
    },
    cancelledBy: {
      type: String,
      enum: ["CLIENT", "FUNDI", "SYSTEM"],
      default: null
    },
    cancellationReason: { type: String, default: null },
    disputeReason: { type: String, default: null },
    notifiedFundis: [{
      fundiId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      notifiedAt: { type: Date },
      notificationChannels: [{ type: String }] // "socket", "sms"
    }],
    currentFundiIndex: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    onTheWayAt: { type: Date, default: null },
    arrivedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    fundiLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null }
    },
    images: [{ type: String }],
    estimatedDuration: { type: Number, default: 60 }, // minutes
    actualDuration: { type: Number, default: null },
    proposedPrice: { type: Number, default: null },
    proposedBy: { type: String, enum: ["CLIENT", "FUNDI"], default: null },
    clientPriceAgreed: { type: Boolean, default: false },
    fundiPriceAgreed: { type: Boolean, default: false },
    agreedPrice: { type: Number, default: null },
    priceAgreed: { type: Boolean, default: false },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "held", "released", "refunded"],
      default: "unpaid"
    },
    escrowHeldAt: { type: Date, default: null },
    escrowReleasedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Index for geospatial queries on Fundi location
bookingSchema.index({ "fundiLocation.lat": 1, "fundiLocation.lng": 1 });
// Index for client bookings
bookingSchema.index({ clientId: 1, createdAt: -1 });
// Index for fundi bookings
bookingSchema.index({ fundiId: 1, createdAt: -1 });
// Index for expiry timer
bookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Booking", bookingSchema);
