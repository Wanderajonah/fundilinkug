require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");
const FundiProfile = require("../models/FundiProfile");
const Review = require("../models/Review");
const Wallet = require("../models/Wallet");

const seed = async () => {
  await connectDB();
  await Promise.all([User.deleteMany({}), FundiProfile.deleteMany({}), Review.deleteMany({}), Wallet.deleteMany({})]);

  const password = await bcrypt.hash("password123", 10);

  const customer = await User.create({
    name: "Amina Customer",
    email: "amina@example.com",
    phone: "256700100001",
    password,
    role: "customer",
    phoneVerified: true,
    location: { lat: -1.286389, lng: 36.817223 }
  });

  const fundiUsers = await User.insertMany([
    {
      name: "Peter Plumber",
      email: "peter@fundi.com",
      phone: "256700100002",
      password,
      role: "fundi",
      phoneVerified: true,
      location: { lat: -1.292066, lng: 36.821945 }
    },
    {
      name: "Esther Electrician",
      email: "esther@fundi.com",
      phone: "256700100003",
      password,
      role: "fundi",
      phoneVerified: true,
      location: { lat: -1.2801, lng: 36.8155 }
    },
    {
      name: "Carlos Carpenter",
      email: "carlos@fundi.com",
      phone: "256700100004",
      password,
      role: "fundi",
      phoneVerified: true,
      location: { lat: -1.3004, lng: 36.8071 }
    }
  ]);

  await FundiProfile.insertMany([
    {
      userId: fundiUsers[0]._id,
      skills: ["plumbing"],
      experience: 6,
      rating: 4.7,
      verified: true,
      portfolioImages: ["https://picsum.photos/300/200?1"]
    },
    {
      userId: fundiUsers[1]._id,
      skills: ["electrical"],
      experience: 5,
      rating: 4.5,
      verified: true,
      portfolioImages: ["https://picsum.photos/300/200?2"]
    },
    {
      userId: fundiUsers[2]._id,
      skills: ["carpentry", "masonry"],
      experience: 8,
      rating: 4.8,
      verified: true,
      portfolioImages: ["https://picsum.photos/300/200?3"]
    }
  ]);

  await Review.create({
    fundiId: fundiUsers[0]._id,
    customerId: customer._id,
    rating: 5,
    comment: "Solved my pipe leak quickly."
  });

  await Wallet.insertMany([
    { userId: customer._id, balance: 100000, currency: "UGX" },
    { userId: fundiUsers[0]._id, balance: 50000, currency: "UGX" },
    { userId: fundiUsers[1]._id, balance: 75000, currency: "UGX" },
    { userId: fundiUsers[2]._id, balance: 60000, currency: "UGX" },
  ]);

  console.log("Seed complete");
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
