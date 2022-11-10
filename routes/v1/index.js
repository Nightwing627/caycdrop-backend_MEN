var express = require('express');
var router = express.Router();

const mongoose = require('mongoose');
const util = require('../../util')

// define API router
router.use("/", require("./users"));
router.use('/', require('./auth'));

router.post('/test', function (req, res) {
  util.sendEmail(
        process.env.EMAIL_VERIFY,
        {
          userCode: 'code',
          email: 'webdev0627@gmail.com',
          token: '123123123'
        }
      );
});

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
