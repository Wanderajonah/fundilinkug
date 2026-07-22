const express = require("express");
const {
  login,
  getHealth,
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
  getSettings,
  updateSettings,
  createUser,
} = require("../controllers/adminController");
const { protect, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", login);
router.get("/health", getHealth);

router.use(protect, requireRole("admin"));

router.get("/stats", getStats);
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/status", updateUserStatus);
router.get("/fundis", getFundis);
router.patch("/fundis/:id/verify", verifyFundi);
router.get("/jobs", getJobs);
router.get("/bookings", getBookings);
router.get("/disputes", getDisputes);
router.patch("/disputes/:id/resolve", resolveDispute);
router.get("/reviews", getReviews);
router.get("/transactions", getTransactions);
router.get("/analytics", getAnalytics);
router.post("/users", createUser);
router.get("/settings", getSettings);
router.put("/settings", updateSettings);

module.exports = router;
