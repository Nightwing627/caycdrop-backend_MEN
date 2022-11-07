var express = require('express');
var router = express.Router();

// define API router
router.use("/", require("./users"))

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
