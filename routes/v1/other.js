const express = require('express');
const router = express.Router();
const OtherController = require('../../controller/other.controller');
const AffliateController = require('../../controller/affliate.controller');

router.get('/country', OtherController.getAllCountries);

router.get('/tiers', AffliateController.getTiers);

module.exports = router;