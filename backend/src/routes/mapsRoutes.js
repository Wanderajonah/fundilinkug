const express = require("express");
const { geocode, reverse, nearbyFundis, routePreview } = require("../controllers/mapsController");

const router = express.Router();

router.get("/geocode", geocode);
router.get("/reverse", reverse);
router.get("/nearby-fundis", nearbyFundis);
router.get("/route", routePreview);

module.exports = router;
