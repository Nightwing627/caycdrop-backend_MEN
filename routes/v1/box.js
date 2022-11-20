const express = require('express');
const router = express.Router();
const BoxController = require('../../controller/box.controller');

router.get('/filters', BoxController.getFilterData);

router.post('/list', BoxController.getAllData);

router.get('/view/:slug', BoxController.getBoxBySlug);

router.post('/recommended', BoxController.getRecommendedBoxs);

router.get('/view/:slug/top_opening', BoxController.getBoxTopOpen);

module.exports = router;