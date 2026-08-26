const express = require("express");
const { getFundis, getFundiById, getNegotiableFundis } = require("../controllers/fundiController");

const router = express.Router();

router.get("/", getFundis);
router.get("/negotiable", getNegotiableFundis);
router.get("/:id", getFundiById);

module.exports = router;
