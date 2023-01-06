var express = require('express');
var router = express.Router();
var verifyToken = require('../middleware/auth');

const seed = require('../../seed');
const util = require('../../util');
const UserSchema = require('../../model/UserSchema');
const TierSchema = require('../../model/TierSchema');
const UserAffliateSchema = require('../../model/UserAffliateSchema');

// define API router
router.use("/player", verifyToken, require("./users"));
router.use('/affliate', verifyToken, require('./affliate'));
router.use('/pvp', require('./pvp'));
router.use('/', require('./auth'));
router.use('/', require('./home'));
router.use('/box', require('./box'));   
router.use('/', require('./other'));

// encrypt key
router.post('/encrypt_key', (req, res) => {
  try {
    const { value } = req.body;
    if (!value) {
      return res.status(400).json({ error: 'Value must be filled' });
    }
    console.log('value is :', value);
    const encData = util.encryption(value);
    res.status(200).json({ data: encData });
  } catch (error) {
    console.log(error)
    res.status(400).json({ error: "Encryption is failed, please try again" });
  }
});

// decrypt key
router.post('/decrypt_key', (req, res) => {
  try {
    const { hashed } = req.body;
    if (!hashed) {
      return res.status(400).json({ error: 'Hashed must be filled' });
    }
    const decData = util.decryption(hashed);
    res.status(200).json({ data: decData });
  } catch (error) {
    console.log(error)
    res.status(400).json({ error: "Encryption is failed, please try again" });
  }
});

//** -- TEST functions via API -- */
// test sending email
router.post('/testEmail', function (req, res) {
  // TODO
  // util.sendEmail();
});

// test seed
router.post('/testseed', function (req, res) {
  seed.init();
  res.status(200).send('success');
});

// test funcs
router.post('/testfunc', async (req, res) => {
  try {    
    // TODO: test codes

    res.status(200).json({ result: 'success' });
  } catch (error) {
    console.log(error)
    res.status(400).json({ error });
  }
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
