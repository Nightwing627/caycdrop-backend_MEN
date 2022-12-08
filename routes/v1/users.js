const express = require('express');
const router = express.Router();
const UserController = require('../../controller/user.controller');

/* GET users listing. */
router.get('/:code/fairness', UserController.getUserSeed);

router.get('/current_user', UserController.getCurrentUser);

router.post('/update/main', UserController.changeUserBasic);

router.post('/update/shipping', UserController.changeUserShipping);

router.get('/cart', UserController.getUserCart);

router.get('/cart/filters', UserController.getCartFilters);

router.post('/cart/sell', UserController.sellUserItem);

router.get('/wallet', UserController.getUserCryptoWallet);

router.post('/wallet/withraw', UserController.withrawItem);

router.get('/statistic/:code', UserController.getStatistic);

router.post('/document', UserController.saveDocument);

module.exports = router;