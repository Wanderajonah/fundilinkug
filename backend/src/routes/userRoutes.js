const express = require("express");
const {
  getProfile,
  updateProfile,
  updateLocation,
  uploadProfilePicture,
  uploadCoverPhoto,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { uploadProfile } = require("../middleware/uploadMiddleware");

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

module.exports = router;
