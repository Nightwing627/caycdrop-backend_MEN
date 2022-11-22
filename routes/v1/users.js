const express = require('express');
const router = express.Router();
const UserController = require('../../controller/user.controller');

/* GET users listing. */
router.get('/:code/fairness', UserController.getUserSeed);

router.get('/current_user', UserController.getCurrentUser);

router.post('/update/main', UserController.changeUserBasic);

router.post('/update/shipping', UserController.changeUserShipping);

router.get('/cart', UserController.getUserCart);

module.exports = router;
