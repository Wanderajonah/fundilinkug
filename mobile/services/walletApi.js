import api from "./api";

export const getWallet = () => api.get("/wallet");

export const getTransactions = (params = {}) =>
  api.get("/wallet/transactions", { params });

export const deposit = (amount, paymentMethod = "mobile_money", phone = "") =>
  api.post("/wallet/deposit", { amount, paymentMethod, phone });

export const withdraw = (amount, paymentMethod = "mobile_money", phone = "") =>
  api.post("/wallet/withdraw", { amount, paymentMethod, phone });

export const payBooking = (bookingId) =>
  api.post("/wallet/pay", { bookingId });

export const transfer = (amount, recipientPhone) =>
  api.post("/wallet/transfer", { amount, recipientPhone });
