const express = require('express');
const router = express.Router();
const HomeController = require('../../controller/home.controller');

router.post('/home/featured', HomeController.index);

router.post('/home/footer', HomeController.getFooterData);

module.exports = router;