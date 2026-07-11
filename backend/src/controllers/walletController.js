const crypto = require("crypto");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const Booking = require("../models/Booking");

const generateRef = (prefix) =>
  `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await Wallet.create({ userId, balance: 0, currency: "UGX" });
  }
  return wallet;
};

const getWallet = async (req, res, next) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    return res.json({ success: true, wallet });
  } catch (error) {
    return next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const filter = { userId: req.user._id };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("relatedBooking", "category status agreedPrice")
      .populate("relatedUser", "name");

    const total = await Transaction.countDocuments(filter);

    return res.json({
      success: true,
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    return next(error);
  }
};

const deposit = async (req, res, next) => {
  try {
    const { amount, paymentMethod = "mobile_money", phone } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const wallet = await getOrCreateWallet(req.user._id);

    if (wallet.status === "frozen") {
      return res.status(403).json({ success: false, message: "Wallet is frozen" });
    }

    const reference = generateRef("DEP");

    const transaction = await Transaction.create({
      walletId: wallet._id,
      userId: req.user._id,
      type: "deposit",
      amount,
      currency: wallet.currency,
      reference,
      description: `Deposit of ${wallet.currency} ${amount.toLocaleString()}`,
      status: "completed",
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance + amount,
      paymentMethod,
      metadata: { phone },
    });

    wallet.balance += amount;
    await wallet.save();

    return res.json({
      success: true,
      transaction,
      balance: wallet.balance,
    });
  } catch (error) {
    return next(error);
  }
};

const withdraw = async (req, res, next) => {
  try {
    const { amount, paymentMethod = "mobile_money", phone } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const wallet = await getOrCreateWallet(req.user._id);

    if (wallet.status === "frozen") {
      return res.status(403).json({ success: false, message: "Wallet is frozen" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    const reference = generateRef("WTH");

    const transaction = await Transaction.create({
      walletId: wallet._id,
      userId: req.user._id,
      type: "withdrawal",
      amount,
      currency: wallet.currency,
      reference,
      description: `Withdrawal of ${wallet.currency} ${amount.toLocaleString()}`,
      status: "completed",
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance - amount,
      paymentMethod,
      metadata: { phone },
    });

    wallet.balance -= amount;
    await wallet.save();

    return res.json({
      success: true,
      transaction,
      balance: wallet.balance,
    });
  } catch (error) {
    return next(error);
  }
};

const payBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: "Booking ID required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your booking" });
    }

    if (booking.status !== "COMPLETED") {
      return res.status(400).json({ success: false, message: "Booking not yet completed" });
    }

    if (!booking.agreedPrice || !booking.priceAgreed) {
      return res.status(400).json({ success: false, message: "No agreed price set" });
    }

    const amount = booking.agreedPrice;

    const wallet = await getOrCreateWallet(req.user._id);

    if (wallet.status === "frozen") {
      return res.status(403).json({ success: false, message: "Wallet is frozen" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Need UGX ${amount.toLocaleString()}`,
      });
    }

    const fundiWallet = await getOrCreateWallet(booking.fundiId);

    const reference = generateRef("PAY");

    const clientTransaction = await Transaction.create({
      walletId: wallet._id,
      userId: req.user._id,
      type: "payment",
      amount,
      currency: wallet.currency,
      reference,
      description: `Payment for booking #${bookingId}`,
      status: "completed",
      relatedBooking: bookingId,
      relatedUser: booking.fundiId,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance - amount,
      paymentMethod: "wallet",
    });

    const fundiTransaction = await Transaction.create({
      walletId: fundiWallet._id,
      userId: booking.fundiId,
      type: "payment_received",
      amount,
      currency: fundiWallet.currency,
      reference: generateRef("REC"),
      description: `Payment received for booking #${bookingId}`,
      status: "completed",
      relatedBooking: bookingId,
      relatedUser: req.user._id,
      balanceBefore: fundiWallet.balance,
      balanceAfter: fundiWallet.balance + amount,
    });

    wallet.balance -= amount;
    fundiWallet.balance += amount;

    await Promise.all([wallet.save(), fundiWallet.save()]);

    return res.json({
      success: true,
      transaction: clientTransaction,
      balance: wallet.balance,
      message: "Payment successful",
    });
  } catch (error) {
    return next(error);
  }
};

const transfer = async (req, res, next) => {
  try {
    const { amount, recipientPhone } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    if (!recipientPhone) {
      return res.status(400).json({ success: false, message: "Recipient phone required" });
    }

    const User = require("../models/User");
    const recipient = await User.findOne({ phone: recipientPhone });
    if (!recipient) {
      return res.status(404).json({ success: false, message: "Recipient not found" });
    }

    if (recipient._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot transfer to yourself" });
    }

    const wallet = await getOrCreateWallet(req.user._id);

    if (wallet.status === "frozen") {
      return res.status(403).json({ success: false, message: "Wallet is frozen" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    const recipientWallet = await getOrCreateWallet(recipient._id);

    const reference = generateRef("TRF");

    const senderTx = await Transaction.create({
      walletId: wallet._id,
      userId: req.user._id,
      type: "transfer_out",
      amount,
      currency: wallet.currency,
      reference,
      description: `Transfer to ${recipient.name || recipientPhone}`,
      status: "completed",
      relatedUser: recipient._id,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance - amount,
    });

    const recipientTx = await Transaction.create({
      walletId: recipientWallet._id,
      userId: recipient._id,
      type: "transfer_in",
      amount,
      currency: recipientWallet.currency,
      reference: generateRef("TRF"),
      description: `Transfer from ${req.user.name || req.user.phone}`,
      status: "completed",
      relatedUser: req.user._id,
      balanceBefore: recipientWallet.balance,
      balanceAfter: recipientWallet.balance + amount,
    });

    wallet.balance -= amount;
    recipientWallet.balance += amount;

    await Promise.all([wallet.save(), recipientWallet.save()]);

    return res.json({
      success: true,
      transaction: senderTx,
      balance: wallet.balance,
      message: "Transfer successful",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getWallet,
  getTransactions,
  deposit,
  withdraw,
  payBooking,
  transfer,
  getOrCreateWallet,
};
