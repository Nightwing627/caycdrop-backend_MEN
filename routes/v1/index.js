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
const PvpGamePlayerSchema = require('../../model/PvpGamePlayerSchema');
const PvpGameSchema = require('../../model/PvpGameSchema');
const BoxSchema = require('../../model/BoxSchema');
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
    const battle = await PvpGameSchema.findOne({ code: 'VG560a9fb2615c665c51ce' });
    
   const players = await PvpGamePlayerSchema
      .findOne({ pvpId: battle._id }, { _id: 0, __v: 0, pvpId: 0 });
    const roundsPayout = await PvpRoundSchema.aggregate([
      { $match: { pvpId: battle._id } },
      {
        $lookup: {
          from: 'pvproundbets',
          localField: 'creator_bet',
          foreignField: '_id',
          as: 'creator_bet'
        }
      },
      {
        $lookup: {
          from: 'pvproundbets',
          localField: 'joiner_bet',
          foreignField: '_id',
          as: 'joiner_bet'
        }
      },
      { $unwind: { path: '$creator_bet' } },
      { $unwind: { path: '$joiner_bet' } },
      {
        $set: {
          "roundCurPayout": { $add: ["$creator_bet.payout", "$joiner_bet.payout"] }
        }
      },
      {
        $group: {
          _id: null,
          "currentPayout": {
            $sum: "$roundCurPayout"
          }
      }}
    ]);
    
    let currentPayout = 0;
    if (roundsPayout.length != 0) {
      currentPayout =  Number((roundsPayout[0].currentPayout).toFixed(2));
    }
    
    const rounds = await PvpRoundSchema
      .find({ pvpId: battle._id })
      .populate('creator_bet', '-_id -__v')
      .populate('joiner_bet', '-_id -__v')
      .populate('box', '-_id code name cost currency icon_path slug')
      .select('-_id -__v -pvpId');
      
    let roundData = [];
    for (var item of rounds) {
      var roundItem = item.toJSON();

      if (roundItem.creator_bet) {
        const creatorItem = await ItemSchema.findById(item.creator_bet.item);
        roundItem.creator_bet.item = creatorItem ? creatorItem.code : null;
      }
      if (roundItem.joiner_bet) {
        const joinerItem = await ItemSchema.findById(item.joiner_bet.item);
        roundItem.joiner_bet.item = joinerItem ? joinerItem.code : null;
      }

      roundData.push(roundItem);
    }

    let boxList = [];
    for (var boxId of battle.box_list) {
      const box = await BoxSchema
        .findById(boxId)
        .select('-_id code name cost currency icon_path slug');
      boxList.push(box);
    }

    var result = {
      code: battle.code,
      isPrivate: battle.is_private,
      botEnable: battle.bot_enable,
      strategy: battle.strategy,
      rounds: roundData,
      currentRound: battle.current_round,
      totalBet: battle.total_bet,
      status: battle.status,
      totalPayout: battle.total_payout,
      boxList,
      currentPayout,
      players
    };
    res.status(200).json({ data: result });  
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
