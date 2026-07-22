const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const FundiProfile = require("../models/FundiProfile");
const Job = require("../models/Job");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const PlatformSettings = require("../models/PlatformSettings");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email, role: "admin" });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalFundis,
      totalJobs,
      pendingJobs,
      activeBookings,
      completedBookings,
      disputedBookings,
      totalReviews,
      totalTransactions,
      revenueResult,
      pendingVerifications,
      verifiedFundis,
    ] = await Promise.all([
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "fundi" }),
      Job.countDocuments(),
      Job.countDocuments({ status: "open" }),
      Booking.countDocuments({ status: { $in: ["ACCEPTED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS"] } }),
      Booking.countDocuments({ status: "COMPLETED" }),
      Booking.countDocuments({ status: "DISPUTED" }),
      Review.countDocuments(),
      Transaction.countDocuments(),
      Transaction.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      FundiProfile.countDocuments({ verified: false }),
      FundiProfile.countDocuments({ verified: true }),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    const recentUsers = await User.find({ role: { $ne: "admin" } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email role createdAt profilePhoto");

    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("clientId", "name")
      .populate("fundiId", "name")
      .select("description status createdAt");

    return res.json({
      totalUsers,
      totalFundis,
      totalJobs,
      pendingJobs,
      activeBookings,
      completedBookings,
      disputedBookings,
      totalReviews,
      totalTransactions,
      totalRevenue,
      pendingVerifications,
      verifiedFundis,
      recentUsers,
      recentBookings,
    });
  } catch (error) {
    return next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const query = { role: "customer" };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("-password");

    const total = await User.countDocuments(query);

    return res.json({
      users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let fundiProfile = null;
    if (user.role === "fundi") {
      fundiProfile = await FundiProfile.findOne({ userId: user._id });
    }

    const bookingCount = await Booking.countDocuments({
      $or: [{ clientId: user._id }, { fundiId: user._id }],
    });

    const transactionCount = await Transaction.countDocuments({ userId: user._id });

    return res.json({ user, fundiProfile, bookingCount, transactionCount });
  } catch (error) {
    return next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'active' or 'suspended'" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

const getFundis = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, verified } = req.query;
    const query = { role: "fundi" };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("-password");

    const total = await User.countDocuments(query);

    const fundiProfiles = await FundiProfile.find({
      userId: { $in: users.map((u) => u._id) },
    });

    const profileMap = {};
    fundiProfiles.forEach((p) => {
      profileMap[p.userId.toString()] = p;
    });

    const fundis = users.map((user) => ({
      ...user.toObject(),
      fundiProfile: profileMap[user._id.toString()] || null,
    }));

    return res.json({
      fundis,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return next(error);
  }
};

const verifyFundi = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    const profile = await FundiProfile.findOneAndUpdate(
      { userId: id },
      { verified: Boolean(verified) },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Fundi profile not found" });
    }

    return res.json({ fundiProfile: profile });
  } catch (error) {
    return next(error);
  }
};

const getJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status: jobStatus } = req.query;
    const query = {};
    if (jobStatus) query.status = jobStatus;

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("customerId", "name email phone")
      .populate("fundiId", "name email phone");

    const total = await Job.countDocuments(query);

    return res.json({
      jobs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return next(error);
  }
};

const getBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status: bookingStatus } = req.query;
    const query = {};
    if (bookingStatus) query.status = bookingStatus;

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("clientId", "name email phone")
      .populate("fundiId", "name email phone");

    const total = await Booking.countDocuments(query);

    return res.json({
      bookings,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return next(error);
  }
};

const getDisputes = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const bookings = await Booking.find({ status: "DISPUTED" })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("clientId", "name email phone")
      .populate("fundiId", "name email phone");

    const total = await Booking.countDocuments({ status: "DISPUTED" });

    return res.json({
      disputes: bookings,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return next(error);
  }
};

const resolveDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    if (!resolution || !["refund_client", "release_fundi", "cancelled"].includes(resolution)) {
      return res.status(400).json({
        message: "Resolution must be 'refund_client', 'release_fundi', or 'cancelled'",
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status: resolution === "cancelled" ? "CANCELLED" : "COMPLETED", disputeReason: null },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.json({ booking });
  } catch (error) {
    return next(error);
  }
};

const getReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("fundiId", "name")
      .populate("customerId", "name");

    const total = await Review.countDocuments();

    return res.json({
      reviews,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("userId", "name email");

    const total = await Transaction.countDocuments();

    const revenueAgg = await Transaction.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    return res.json({
      transactions,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      totalRevenue: revenueAgg.length > 0 ? revenueAgg[0].total : 0,
    });
  } catch (error) {
    return next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

    const [monthlyGrowth, serviceDistribution, bookingStatusDist, avgRating, jobCompletion, weeklyJobs, weeklyRevenue] =
      await Promise.all([
        User.aggregate([
          { $match: { role: { $ne: "admin" }, createdAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              users: { $sum: { $cond: [{ $eq: ["$role", "customer"] }, 1, 0] } },
              fundis: { $sum: { $cond: [{ $eq: ["$role", "fundi"] }, 1, 0] } },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Job.aggregate([
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Booking.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Review.aggregate([
          { $group: { _id: null, avg: { $avg: "$rating" }, total: { $sum: 1 } } },
        ]),
        Booking.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } },
              cancelled: { $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] } },
              disputed: { $sum: { $cond: [{ $eq: ["$status", "DISPUTED"] }, 1, 0] } },
            },
          },
        ]),
        Booking.aggregate([
          { $match: { createdAt: { $gte: sevenDaysAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Transaction.aggregate([
          { $match: { status: "completed", createdAt: { $gte: sevenDaysAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              amount: { $sum: "$amount" },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyMap = {};
    weeklyJobs.forEach((d) => { weeklyMap[d._id] = d.count; });
    const revenueMap = {};
    weeklyRevenue.forEach((d) => { revenueMap[d._id] = d.amount; });

    const weeklyData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
      const key = d.toISOString().split("T")[0];
      weeklyData.push({
        name: dayNames[d.getDay()],
        jobs: weeklyMap[key] || 0,
        revenue: revenueMap[key] || 0,
      });
    }

    const serviceDist = serviceDistribution.map((s) => ({
      name: s._id,
      count: s.count,
    }));

    const bookingStatuses = bookingStatusDist.reduce(
      (acc, s) => {
        acc[s._id] = s.count;
        return acc;
      },
      {},
    );

    const completionRate =
      jobCompletion.length > 0 && jobCompletion[0].total > 0
        ? Math.round((jobCompletion[0].completed / jobCompletion[0].total) * 100)
        : 0;

    const avgRatingVal = avgRating.length > 0 ? avgRating[0].avg : 0;
    const totalReviews = avgRating.length > 0 ? avgRating[0].total : 0;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const growthMap = {};
    monthlyGrowth.forEach((m) => {
      growthMap[m._id] = { users: m.users, fundis: m.fundis };
    });

    const growthData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = monthNames[d.getMonth()];
      const entry = growthMap[key] || { users: 0, fundis: 0 };
      growthData.push({
        month: monthLabel,
        users: entry.users,
        fundis: entry.fundis,
      });
    }

    return res.json({
      weeklyData,
      growthData,
      serviceDistribution: serviceDist,
      bookingStatuses,
      avgRating: avgRatingVal,
      totalReviews,
      completionRate,
    });
  } catch (error) {
    return next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User with this email already exists" });
    }
    const user = await User.create({ name, email, phone, password, role });
    if (role === "fundi") {
      await FundiProfile.create({ userId: user._id });
    }
    return res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    return next(error);
  }
};

const getHealth = async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? "connected" : "disconnected";
  return res.json({
    status: dbState === 1 ? "healthy" : "degraded",
    api: "running",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
};

const getSettings = async (req, res, next) => {
  try {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({});
    }
    return res.json(settings);
  } catch (error) {
    return next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = new PlatformSettings();
    }
    Object.assign(settings, req.body);
    await settings.save();
    return res.json(settings);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
  getStats,
  getUsers,
  getUserById,
  updateUserStatus,
  getFundis,
  verifyFundi,
  getJobs,
  getBookings,
  getDisputes,
  resolveDispute,
  getReviews,
  getTransactions,
  getAnalytics,
  getHealth,
  getSettings,
  updateSettings,
  createUser,
};
