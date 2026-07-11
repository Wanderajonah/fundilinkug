const express = require("express");
const { getFundis, getFundiById } = require("../controllers/fundiController");

const router = express.Router();

router.get("/", getFundis);
router.get("/:id", getFundiById);

module.exports = router;
