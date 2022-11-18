const express = require('express');
const router = express.Router();
const UserController = require('../../controller/user.controller');

/* GET users listing. */
router.post('/:code/fairness', UserController.getUserSeed);

module.exports = router;
