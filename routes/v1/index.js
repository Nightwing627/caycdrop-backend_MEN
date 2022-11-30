var express = require('express');
var router = express.Router();
var verifyToken = require('../middleware/auth');

const util = require('../../util');
const walletManage = require('../../walletManage');
const seed = require('../../seed');

// define API router
router.use("/player", verifyToken, require("./users"));
router.use('/pvp', require('./pvp'));
router.use('/', require('./auth'));
router.use('/', require('./home'));
router.use('/box', require('./box'));   
router.use('/', require('./other'));
  
//** -- TEST functions via API -- */
// test sending email
router.post('/testEmail', function (req, res) {
  // TODO
  // util.sendEmail();
});

// test seed
router.post('/testseed', function (req, res) {
  seed();
  res.status(200).send('ss');
});

// test funcs
router.post('/testfunc', async (req, res) => {
  const data = util.getNonce(12);
  // console.log(data.hash.slice(2, data.hash.length))
  res.status(200).json({ data });                                                                                                                                                                  
});
//** -- TEST END */

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
});

module.exports = router;
