require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const FundiProfile = require("../models/FundiProfile");
const Job = require("../models/Job");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const PlatformSettings = require("../models/PlatformSettings");
const AdminNotification = require("../models/AdminNotification");

const CATEGORIES = [
  "plumbing", "electrical", "carpentry", "masonry", "painting",
  "cleaning", "mechanical", "welding", "gardening", "tiling"
];

const FIRST_NAMES = ["James", "Mary", "John", "Sarah", "Peter", "Esther", "David", "Grace", "Samuel", "Ruth",
  "Joseph", "Deborah", "Daniel", "Martha", "Isaac", "Rebecca", "Simon", "Agnes", "Paul", "Naomi"];
const LAST_NAMES = ["Mukasa", "Nakato", "Ssali", "Nambi", "Kintu", "Nakibuule", "Wasswa", "Nalule", "Kato", "Nansubuga"];

const FUNDI_SKILLS = {
  plumbing: ["plumbing", "pipe fitting", "water heater installation"],
  electrical: ["electrical", "wiring", "lighting installation"],
  carpentry: ["carpentry", "furniture making", "cabinet installation"],
  masonry: ["masonry", "bricklaying", "concrete work"],
  painting: ["painting", "wall finishing", "decorative painting"],
  cleaning: ["cleaning", "deep cleaning", "sanitization"],
  mechanical: ["mechanical", "engine repair", "auto maintenance"],
  welding: ["welding", "metal fabrication", "gate installation"],
  gardening: ["gardening", "landscaping", "lawn mowing"],
  tiling: ["tiling", "floor installation", "wall tiling"],
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

const seed = async () => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Clear existing data
  await Promise.all([
    User.deleteMany({ role: { $ne: "admin" } }),
    FundiProfile.deleteMany({}),
    Job.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
    Transaction.deleteMany({}),
    Wallet.deleteMany({}),
    AdminNotification.deleteMany({}),
  ]);

  const password = await bcrypt.hash("password123", 10);

  // === CREATE CUSTOMERS (20 spread over 6 months) ===
  const customerIds = [];
  for (let i = 0; i < 20; i++) {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const user = await User.create({
      name,
      email: `customer${i}@example.com`,
      phone: `256700${100010 + i}`,
      password,
      role: "customer",
      phoneVerified: true,
      district: pick(["Kampala", "Wakiso", "Entebbe", "Mukono", "Jinja"]),
      createdAt: daysAgo(randomInt(1, 180)),
    });
    customerIds.push(user._id);
  }

  // === CREATE FUNDIS (15 spread over 6 months) ===
  const fundiData = [];
  for (let i = 0; i < 15; i++) {
    const cat = pick(CATEGORIES);
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const monthsAgo = randomInt(1, 180);
    const statusRoll = Math.random();
    const vStatus = statusRoll < 0.6 ? "verified" : statusRoll < 0.85 ? "pending" : "rejected";
    const user = await User.create({
      name,
      email: `fundi${i}@fundi.com`,
      phone: `256700${200010 + i}`,
      password,
      role: "fundi",
      phoneVerified: true,
      district: pick(["Kampala", "Wakiso", "Entebbe", "Mukono", "Jinja"]),
      createdAt: daysAgo(monthsAgo),
    });
    fundiData.push({ id: user._id, category: cat, createdAt: daysAgo(monthsAgo), status: vStatus });
  }

  for (const f of fundiData) {
    await FundiProfile.create({
      userId: f.id,
      skills: FUNDI_SKILLS[f.category] || [f.category],
      experience: randomInt(1, 15),
      rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      verified: f.status === "verified",
      verificationStatus: f.status,
      requestedAt: f.createdAt,
      reviewedAt: f.status !== "pending" ? daysAgo(randomInt(0, 5)) : null,
      isAvailable: true,
    });

    await Wallet.create({
      userId: f.id,
      balance: randomInt(10000, 200000),
      heldBalance: randomInt(0, 50000),
      currency: "UGX",
    });
  }

  for (const c of customerIds) {
    await Wallet.create({
      userId: c,
      balance: randomInt(50000, 500000),
      heldBalance: 0,
      currency: "UGX",
    });
  }

  // === CREATE JOBS (100 spread over 6 months) ===
  const jobIds = [];
  for (let i = 0; i < 100; i++) {
    const jobDate = daysAgo(randomInt(1, 180));
    const jobStatuses = ["open", "quoted", "accepted", "in_progress", "completed", "cancelled"];
    const weights = [0.1, 0.1, 0.1, 0.1, 0.4, 0.2];
    const roll = Math.random();
    let cum = 0;
    let jobStatus = "open";
    for (let j = 0; j < weights.length; j++) {
      cum += weights[j];
      if (roll <= cum) { jobStatus = jobStatuses[j]; break; }
    }
    const cat = pick(CATEGORIES);
    const job = await Job.create({
      customerId: pick(customerIds),
      fundiId: jobStatus !== "open" ? pick(fundiData).id : undefined,
      description: `${cat} service at ${pick(["home", "office", "shop", "school"])}`,
      category: cat,
      location: { lat: -1.28 + Math.random() * 0.04, lng: 36.81 + Math.random() * 0.04 },
      quoteAmount: randomInt(30000, 200000),
      status: jobStatus,
      address: `${randomInt(1, 100)} ${pick(["Main St", "Market Rd", "Hill Ave", "Lake Dr", "Park Ln"])}`,
      amount: randomInt(30000, 200000),
      createdAt: jobDate,
    });
    jobIds.push(job._id);
  }

  // === CREATE BOOKINGS (60 spread over 7 days for weekly trend) ===
  const bookingStatuses = ["PENDING", "ACCEPTED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "DISPUTED"];
  const bookingWeights = [0.05, 0.05, 0.05, 0.05, 0.1, 0.5, 0.1, 0.1];
  for (let i = 0; i < 60; i++) {
    const daysBack = randomInt(0, 6);
    const bDate = daysAgo(daysBack);
    bDate.setHours(randomInt(6, 22), randomInt(0, 59));

    const roll = Math.random();
    let cum = 0;
    let bStatus = "PENDING";
    for (let j = 0; j < bookingWeights.length; j++) {
      cum += bookingWeights[j];
      if (roll <= cum) { bStatus = bookingStatuses[j]; break; }
    }

    const cat = pick(CATEGORIES);
    const fundi = pick(fundiData);
    const customer = pick(customerIds);
    const price = randomInt(30000, 250000);

    const paymentStatusMap = {
      COMPLETED: "released",
      DISPUTED: "held",
      CANCELLED: "refunded",
    };
    const payStatus = paymentStatusMap[bStatus] || (Math.random() > 0.5 ? "held" : "unpaid");

    await Booking.create({
      clientId: customer,
      fundiId: fundi.id,
      category: cat,
      description: `${cat} service booking`,
      address: `${randomInt(1, 100)} ${pick(["Main St", "Market Rd", "Hill Ave"])}`,
      location: { lat: -1.28 + Math.random() * 0.04, lng: 36.81 + Math.random() * 0.04 },
      status: bStatus,
      proposedPrice: price,
      agreedPrice: bStatus !== "PENDING" && bStatus !== "CANCELLED" ? price : null,
      priceAgreed: bStatus !== "PENDING",
      paymentStatus: payStatus,
      escrowHeldAt: payStatus === "held" || payStatus === "released" ? bDate : null,
      escrowReleasedAt: payStatus === "released" ? new Date(bDate.getTime() + 3600000) : null,
      createdAt: bDate,
    });
  }

  // === CREATE TRANSACTIONS (80 spread over last 7 days) ===
  const txTypes = ["escrow_hold", "escrow_release", "escrow_refund", "platform_fee", "payment_received", "deposit", "withdrawal"];
  const txWeights = [0.2, 0.2, 0.05, 0.2, 0.15, 0.1, 0.1];
  for (let i = 0; i < 80; i++) {
    const daysBack = randomInt(0, 6);
    const txDate = daysAgo(daysBack);

    const roll = Math.random();
    let cum = 0;
    let txType = "deposit";
    for (let j = 0; j < txWeights.length; j++) {
      cum += txWeights[j];
      if (roll <= cum) { txType = txTypes[j]; break; }
    }

    const fundi = pick(fundiData);
    const customer = pick(customerIds);
    const isFundiTx = ["escrow_release", "platform_fee", "payment_received"].includes(txType);
    const userId = isFundiTx ? fundi.id : customer;

    const amount = txType === "platform_fee"
      ? randomInt(3000, 20000)
      : txType === "escrow_refund"
      ? randomInt(30000, 100000)
      : randomInt(30000, 250000);

    await Transaction.create({
      walletId: userId,
      userId,
      type: txType,
      amount,
      currency: "UGX",
      status: "completed",
      description: txType.replace(/_/g, " "),
      createdAt: txDate,
    });
  }

  // === CREATE REVIEWS (30 spread over time) ===
  for (let i = 0; i < 30; i++) {
    const fundi = pick(fundiData);
    if (fundi.status !== "verified") continue;
    const customer = pick(customerIds);
    await Review.create({
      fundiId: fundi.id,
      customerId: customer,
      rating: randomInt(3, 5),
      comment: pick(["Excellent work!", "Very professional", "Great job", "Good service", "Would recommend", "On time and quality work", "Fair price, good quality", "Satisfied with the service"]),
      createdAt: daysAgo(randomInt(1, 90)),
    });
  }

  // === PLATFORM SETTINGS ===
  await PlatformSettings.findOneAndUpdate(
    {},
    {
      adminName: "FundiLink Admin",
      adminEmail: "admin@fundilink.ug",
      commissionRate: 10,
      minJobAmount: 10000,
      serviceRadius: 20,
      notifications: { push: true, sms: true, email: false },
      paymentIntegrations: { airtel: true, mtn: true, card: false },
    },
    { upsert: true }
  );

  console.log("Seed complete:");
  console.log(`  - 20 customers`);
  console.log(`  - 15 fundis`);
  console.log(`  - 100 jobs`);
  console.log(`  - 60 bookings`);
  console.log(`  - 80 transactions`);
  console.log(`  - 30 reviews`);
};

module.exports = seed;

if (require.main === module) {
  seed().then(() => { console.log("Done"); process.exit(0); }).catch((err) => { console.error(err); process.exit(1); });
}
