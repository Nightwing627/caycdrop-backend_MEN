var express = require('express');
var router = express.Router();
var verifyToken = require('../middleware/auth');

const util = require('../../util');
const walletManage = require('../../walletManage');
const seed = require('../../seed');
const BoxSchema = require('../../model/BoxSchema');
const BoxItemSchema = require('../../model/BoxItemSchema');
const mongoose = require('mongoose');

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

  const allbox = await BoxSchema.find();
  const data = [];
  for (var i = 0; i < allbox.length; i++) {
    let boxItems = await BoxItemSchema.aggregate([
      { $match: { box_code: allbox[i].code } },
      {
        $lookup: {
          from: 'items',
          localField: 'item',
          foreignField: '_id',
          as: 'item',
        },
      },
      { $unwind: { path: "$item"} },
      {
        $sort: { "item.value": -1 }
      },
      {
        $group: {
          _id: "$box_code",
          totalRate: { $sum: "$rate"}
        }
      }
    ]);
    data.push({
      boxName: allbox[i].name,
      slots: boxItems
    })
  }
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
