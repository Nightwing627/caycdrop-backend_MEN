var express = require('express');
var router = express.Router();
var verifyToken = require('../middleware/auth');

const util = require('../../util');
const walletManage = require('../../walletManage');
const seed = require('../../seed');
const BoxSchema = require('../../model/BoxSchema');
const BoxItemSchema = require('../../model/BoxItemSchema');
const mongoose = require('mongoose');
const ItemSchema = require('../../model/ItemSchema');

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
  // when test the battle
  // await mongoose.connection.db.dropCollection('pvpgames');
  // await mongoose.connection.db.dropCollection('pvproundbets');
  // await mongoose.connection.db.dropCollection('pvprounds');
  // await mongoose.connection.db.dropCollection('pvpgameplayers');
  // await mongoose.connection.db.dropCollection('rollhistories');

  const item = await ItemSchema.create({
    name: "2.50 VOUCHER",
    icon_url: "http://185.188.249.152:5000/img/items/vouchers_/2.5.png",
    description: "",
    brand: "",
    value: 2.5,
    usable: true,
    obtainable: true,
    withdrawable: true,
    rarity: "common",
    currency: "USD",
    released_at: null,
    type: "IRL",
    category: null,
    min_value: 2.5,
    max_value: 2.5,
    min_rarity: "common",
    max_rarity: "common",
    variants: [],
    market: null
  });
  await ItemSchema.findByIdAndUpdate(item._id, {
    code: util.generateCode('item', item._id)
  })
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
