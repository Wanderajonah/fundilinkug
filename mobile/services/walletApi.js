import api from "./api";

// Wallet/money operations hit several remote-DB round trips server-side;
// give them a more generous timeout than the 10s default.
const MONEY_TIMEOUT = 30000;

export const getWallet = () => api.get("/wallet");

export const getTransactions = (params = {}) =>
  api.get("/wallet/transactions", { params });

export const deposit = (amount, paymentMethod = "mobile_money", phone = "") =>
  api.post("/wallet/deposit", { amount, paymentMethod, phone }, { timeout: MONEY_TIMEOUT });

export const withdraw = (amount, paymentMethod = "mobile_money", phone = "") =>
  api.post("/wallet/withdraw", { amount, paymentMethod, phone }, { timeout: MONEY_TIMEOUT });

export const payBooking = (bookingId) =>
  api.post("/wallet/pay", { bookingId }, { timeout: MONEY_TIMEOUT });

export const holdEscrow = (bookingId) =>
  api.post("/wallet/hold", { bookingId }, { timeout: MONEY_TIMEOUT });

export const releaseEscrow = (bookingId) =>
  api.post("/wallet/release", { bookingId }, { timeout: MONEY_TIMEOUT });

export const refundEscrow = (bookingId) =>
  api.post("/wallet/refund", { bookingId }, { timeout: MONEY_TIMEOUT });

export const transfer = (amount, recipientPhone) =>
  api.post("/wallet/transfer", { amount, recipientPhone }, { timeout: MONEY_TIMEOUT });
