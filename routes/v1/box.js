const express = require('express');
const router = express.Router();
const BoxController = require('../../controller/box.controller');

router.get('/filters', BoxController.getFilterData);

router.get('/list', BoxController.getAllData);

router.get('/view/:slug', BoxController.getBoxBySlug);

router.get('/recommended', BoxController.getRecommendedBoxs);

module.exports = router;