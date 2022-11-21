const express = require('express');
const router = express.Router();
const OtherController = require('../../controller/other.controller');

router.get('/country', OtherController.getAllCountries);

module.exports = router;