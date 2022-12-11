const express = require('express');
const router = express.Router();
const UserController = require('../../controller/user.controller');

/* GET users listing. */
router.get('/current_user', UserController.getCurrentUser);

router.post('/update/main', UserController.changeUserBasic);

router.post('/update/shipping', UserController.changeUserShipping);

router.get('/cart', UserController.getUserCart);

router.get('/cart/filters', UserController.getCartFilters);

router.post('/cart/sell', UserController.sellUserItem);

router.get('/wallet', UserController.getUserCryptoWallet);

// router.post('/wallet/withraw', UserController.withrawItem);

router.get('/statistic/:code', UserController.getStatistic);

router.post('/document', UserController.saveDocument);

router.get('/fairness', UserController.getUserSeed);

router.post('/fairness/change', UserController.changeUserSeed);

router.post('/fairness/reval', UserController.revalUserSeed);



module.exports = router;