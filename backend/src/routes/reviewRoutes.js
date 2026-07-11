const express = require("express");
const {
  createReview,
  updateReview,
  getReviewsByFundi,
  getMyReviews
} = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createReview);
router.get("/mine", protect, getMyReviews);
router.patch("/:id", protect, updateReview);
router.get("/:fundiId", getReviewsByFundi);

module.exports = router;
