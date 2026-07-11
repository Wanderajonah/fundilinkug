const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
  type: { type: String, enum: ["booking", "support"], default: "booking" },
  lastMessage: { type: String, default: "" },
  lastSenderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  lastMessageAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

conversationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

conversationSchema.index({ participants: 1 });
conversationSchema.index({ bookingId: 1 });
conversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
