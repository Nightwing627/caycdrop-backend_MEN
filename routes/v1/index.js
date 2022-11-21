var express = require('express');
var router = express.Router();
var verifyToken = require('../middleware/auth');

const mongoose = require('mongoose');
const util = require('../../util');
const seed = require('../../seed');

// define API router
router.use("/player", /* verifyToken, */ require("./users"));
router.use('/', require('./auth'));
router.use('/', require('./home'));
router.use('/box', require('./box'));

//** -- TEST functions via API --
// test sending email
router.post('/testEmail', function (req, res) {
  util.sendEmail(
    process.env.EMAIL_VERIFY,
    {
      userCode: 'code',
      email: 'webdev0627@gmail.com',
      token: '123123123'
    }
  );
});

// test seed
router.post('/testseed', function (req, res) {
  seed();
  res.status(200).send('ss');
});

// test funcs
router.post('/testfunc', function (req, res) { 
  
  res.status(200).json(util.getLevelXps(1));
})

router.use(function (err, req, res, next) { 
  // validations for API request
  if (err.name == "ValidationError") { 
    return res.status(422).json({
      errors: Object.keys(err.errors).reduce(function (errors, key) {
        errors[key] = err.errors[key].message;
        return errors;
      }, {}),
    });
  }
  return next(err);
})

module.exports = router;
