const express = require('express');
const router = express.Router();
const UserController = require('../../controller/user.controller');

/* GET users listing. */
router.get('/current_user', UserController.getCurrentUser);

router.post('/update/main', UserController.changeUserBasic);

router.post('/update/shipping', UserController.changeUserShipping);

router.post('/cart', UserController.getUserCart);

router.get('/cart/filters', UserController.getCartFilters);

router.post('/cart/sell', UserController.sellUserItem);

router.get('/wallet', UserController.getUserCryptoWallet);

router.post('/generate/wallet', UserController.generateWallet);

// router.post('/wallet/withdraw', UserController.withdrawItem);

router.get('/statistic/:code', UserController.getStatistic);

router.post('/document', UserController.saveDocument);

router.get('/fairness', UserController.getUserSeed);

router.post('/fairness/change', UserController.changeUserSeed);

router.post('/fairness/reval', UserController.revalUserSeed);

router.post('/history/pvp', UserController.getGameHistory);

router.post('/history/box', UserController.getUnboxingHistory);

router.get('/history/txs/filters', UserController.getTxHisFilters);

router.post('/history/txs', UserController.getTxHistory);

router.post('/history/topups', UserController.getTopUpsHistory);

module.exports = router;