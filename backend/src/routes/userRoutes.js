const express = require("express");
const {
  getProfile,
  updateProfile,
  updateLocation,
  uploadProfilePicture,
  uploadCoverPhoto,
  uploadPortfolioImages,
  deletePortfolioImage,
  requestVerification,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { uploadProfile, uploadPortfolio, uploadVerification } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/update", protect, updateProfile);
router.put("/location", protect, updateLocation);
router.post(
  "/profile-picture",
  protect,
  uploadProfile.single("profilePicture"),
  uploadProfilePicture,
);
router.post(
  "/cover-picture",
  protect,
  uploadProfile.single("coverPicture"),
  uploadCoverPhoto,
);
router.post(
  "/portfolio/upload",
  protect,
  uploadPortfolio.array("images", 10),
  uploadPortfolioImages,
);
router.delete(
  "/portfolio/image",
  protect,
  deletePortfolioImage,
);
router.post(
  "/verification-request",
  protect,
  uploadVerification.array("documents", 5),
  requestVerification,
);

module.exports = router;
