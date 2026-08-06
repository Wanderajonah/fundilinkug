const Review = require("../models/Review");
const FundiProfile = require("../models/FundiProfile");

const refreshFundiRating = async (fundiId) => {
  const reviews = await Review.find({ fundiId });
  if (!reviews.length) return;
  const avg = reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length;
  await FundiProfile.findOneAndUpdate({ userId: fundiId }, { rating: Number(avg.toFixed(2)) });
};

const createReview = async (req, res, next) => {
  try {
    const { fundiId, rating, comment, jobId, photoUrls, service, amount } = req.body;
    if (!fundiId || !rating) {
      return res.status(400).json({ message: "fundiId and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "rating must be between 1 and 5" });
    }

    if (jobId) {
      const existing = await Review.findOne({ jobId, customerId: req.user._id });
      if (existing) {
        return res.status(400).json({ message: "You already reviewed this job. Use edit instead." });
      }
    }

    const review = await Review.create({
      fundiId,
      customerId: req.user._id,
      rating,
      comment: comment || "",
      jobId: jobId || undefined,
      photoUrls: Array.isArray(photoUrls) ? photoUrls : [],
      service: service || "",
      amount: amount || 0
    });

    await refreshFundiRating(fundiId);
    return res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You already reviewed this job" });
    }
    return next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const { rating, comment, photoUrls } = req.body;
    const review = await Review.findOne({ _id: req.params.id, customerId: req.user._id });
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (rating != null) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "rating must be between 1 and 5" });
      }
      review.rating = rating;
    }
    if (comment != null) review.comment = comment;
    if (Array.isArray(photoUrls)) review.photoUrls = photoUrls;

    await review.save();
    await refreshFundiRating(review.fundiId);
    return res.json(review);
  } catch (error) {
    return next(error);
  }
};

const getReviewsByFundi = async (req, res, next) => {
  try {
    const reviews = await Review.find({ fundiId: req.params.fundiId })
      .populate("customerId", "name profilePhoto avatarUrl")
      .sort({ createdAt: -1 });
    return res.json(reviews);
  } catch (error) {
    return next(error);
  }
};

const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ customerId: req.user._id })
      .populate("fundiId", "name")
      .sort({ createdAt: -1 });
    return res.json(reviews);
  } catch (error) {
    return next(error);
  }
};

module.exports = { createReview, updateReview, getReviewsByFundi, getMyReviews };
