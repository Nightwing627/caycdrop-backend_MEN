var express = require('express');
var router = express.Router();
var verifyToken = require('../middleware/auth');

const seed = require('../../seed');
const util = require('../../util');
const socket = require('../../socket');
const mongoose = require('mongoose');
const PvpRoundSchema = require('../../model/PvpRoundSchema');
const BoxOpenSchema = require('../../model/BoxOpenSchema');
const WalletExchangeSchema = require('../../model/WalletExchangeSchema');

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
  seed.init();
  res.status(200).send('success');
});

// test funcs
router.post('/testfunc', async (req, res) => {
  try {
    //// when test the battle
    // await mongoose.connection.db.dropCollection('pvpgames');
    // await mongoose.connection.db.dropCollection('pvproundbets');
    // await mongoose.connection.db.dropCollection('pvprounds');
    // await mongoose.connection.db.dropCollection('pvpgameplayers');
    // await mongoose.connection.db.dropCollection('rollhistories');
    const totalExchanged = await BoxOpenSchema.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId('637d9214ac246aab6818f27b')
        }
      },
      {
          $lookup: {
            from: 'items',
            localField: 'item',
            foreignField: '_id',
            as: 'item'
          }
        },
        { $unwind: { path: "$item" } },
        { $sort: { "item.value": -1 } },
        { $limit: 1 }
    ]).exec(); 
    res.status(200).json({ data: totalExchanged });  
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
