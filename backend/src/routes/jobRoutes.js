const express = require("express");
const {
  createJob,
  getJobsByUser,
  getJobById,
  respondQuote,
  updateJobStatus
} = require("../controllers/jobController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createJob);
router.get("/detail/:id", protect, getJobById);
router.patch("/detail/:id/quote", protect, respondQuote);
router.patch("/detail/:id/status", protect, updateJobStatus);
router.get("/:userId", protect, getJobsByUser);

module.exports = router;
