const express = require('express');
const router = express.Router();
const BoxController = require('../../controller/box.controller');

router.post('/filters', BoxController.getFilterData);

router.post('/list', BoxController.getAllData);

router.post('/view/:slug', BoxController.getBoxBySlug);

router.post('/recommended', BoxController.getRecommendedBoxs);

router.post('/view/:slug/top_opening', BoxController.getBoxTopOpen);

module.exports = router;