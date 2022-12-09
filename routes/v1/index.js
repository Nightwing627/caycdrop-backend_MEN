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
    const battle = await PvpGameSchema.findOne({ code: 'VG96489179ae479c851e13' });
    

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
