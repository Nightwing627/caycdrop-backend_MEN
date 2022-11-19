const express = require('express');
const router = express.Router();
const HomeController = require('../../controller/home.controller');

router.get('/home/featured', HomeController.index);

router.get('/home/footer', HomeController.getFooterData);

module.exports = router;