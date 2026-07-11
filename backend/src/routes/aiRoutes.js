const express = require("express");
const { classifyIssue } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/classify", protect, classifyIssue);

module.exports = router;
