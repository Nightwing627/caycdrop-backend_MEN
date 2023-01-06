const PvpGameSchema = require('../model/PvpGameSchema');
const Util = require('../util');
const UserSchema = require('../model/UserSchema');
const PvpGamePlayerSchema = require('../model/PvpGamePlayerSchema');
const SeedSchema = require('../model/SeedSchema');
const WalletExchangeSchema = require('../model/WalletExchangeSchema');
const UserWalletSchema = require('../model/UserWalletSchema');
const PvpRoundSchema = require('../model/PvpRoundSchema');
const PvpRoundBetSchema = require('../model/PvpRoundBetSchema');
const UserCartSchema = require('../model/UserCartSchema');
const UserProgressSchema = require('../model/UserProgressSchema');
const BoxOpenSchema = require('../model/BoxOpenSchema');
const BoxSchema = require('../model/BoxSchema');
const ItemSchema = require('../model/ItemSchema');
const RollHistorySchema = require('../model/RollHistorySchema');

let socketIO, pvpIO, pvpSocket;
let battles = {};

module.exports = {
  listeners: (io, socket) => {
    socketIO = io;
    pvpIO = io.of('/pvp');
    pvpSocket = socket;

    // TODO: set the socket middleware to verify the user status with token

    // user observe the battle
    pvpSocket.on('battle:joined', async (payload, callback) => {
      const { pvpId } = payload;
      const pvpGame = await PvpGameSchema.findOne({ code: pvpId });
      if (pvpGame == null) {
        return callback({ error: 'Wrong battle id' });
      }
      let battleName = 'battle_' + pvpId;
      pvpSocket.join(battleName);
      
      const roomUsers = await pvpIO.in(battleName).allSockets();
      let liveUsers = [];
      roomUsers.forEach(rsId => liveUsers.push(rsId));
      battles[battleName] = liveUsers;

      callback({ result: 'joined' });
    });

    // user took part in battle as player
    pvpSocket.on('battle:betted', async (payload, callback) => {
      const { pvpId, userCode } = payload;

      if (!(pvpId && userCode))
        return callback({ error: 'Wrong params' });

      const pvpGame = await PvpGameSchema.findOne({ code: pvpId }).populate('box_list');
      // check battle exist
      if (pvpGame == null)
        return callback({ error: 'Wrong battle id' });
      // check the battle status
      if (pvpGame.status != process.env.PVP_GAME_CREATED)
        return callback({ error: 'This battle already started or finished' });
      
      let joiner = await UserSchema.findOne({ code: userCode })
        .populate('wallets').populate('account').populate('user_progress');
      // check user exist       
      if (joiner == null)
        return callback({ error: 'Wrong user info' });
      
      // check user data with creator
      const player = await PvpGamePlayerSchema.findOne({ pvpId: pvpGame._id });
      if (player.creator == null || player.creator.get('code') == userCode)
        return callback({ error: 'User info is same with opponent' });
      // check user wallet
      if (joiner.wallets.main < pvpGame.total_bet)
        return callback({ error: 'Too tight budget' });
      
      // update pvpgame
      pvpGame.status = process.env.PVP_GAME_STARTED;
      pvpGame.started_at = new Date();
      await pvpGame.save();

      // update pvp players
      const joinerInfo = {
        code: userCode,
        name: joiner.account.username,
        avatar: joiner.account.avatar,
        rank: joiner.account.g_rank,
        xp: parseInt(joiner.user_progress.xp),
        required_xp: joiner.user_progress.required_xp,
        next_required_xp: joiner.user_progress.next_required_xp,
        level: joiner.user_progress.level
      };
      player.joiner = joinerInfo;
      await player.save();
      
        // create joiner's roundbets and update battle rounds - joiner
      const boxList = pvpGame.box_list;
      const rounds = await PvpRoundSchema.find({ pvpId: pvpGame._id });
      for (var i = 0; i < boxList.length; i++) {
        let roundBet = await PvpRoundBetSchema.create({
          player: userCode,
          bet: boxList[i].cost,
          item: null,
          currency: boxList[i].currency,
          payout: 0,
          rewarded_xp: 0,
        });

        await PvpRoundSchema.findByIdAndUpdate(rounds[i]._id, {
          joiner_bet: roundBet._id
        });
      }

      // change joiner's wallet
      const changedAfter = Number((joiner.wallets.main - pvpGame.total_bet).toFixed(2));
      await UserWalletSchema.findByIdAndUpdate(joiner.wallets._id, {
        main: changedAfter
      });

      // log wallet exchanges
      const walletExchange = await WalletExchangeSchema.create({
        user: joiner._id,
        type: process.env.WALLET_EXCHANGE_PVP,
        value_change: pvpGame.total_bet,
        changed_after: changedAfter,
        wallet: joiner.wallets._id,
        currency: 'USD',
        target: pvpGame._id
      });
      await WalletExchangeSchema.findByIdAndUpdate(walletExchange._id, {
        code: Util.generateCode('walletexchange', walletExchange._id)
      });
      
      const creator = await Util.getUserByCode(player.creator.get('code'));
      joiner = await Util.getUserByCode(joiner.code);

      callback({ result: 'ready' });
      pvpIO.in('battle_' + pvpId).emit('battle:started', {
        data: {
          ...pvpGame.toGameJSON(),
          creator,
          joiner
        }
      });

      encounting(pvpId);
    });
    
    pvpSocket.conn.on("close", (reason) => {
      // called when the underlying connection is closed
      console.log(`${pvpSocket.id} is closed, reason is ${reason}`);
    });

    pvpSocket.on('disconnect', (data) => {
      console.log('PVP socket disconnected')
    });
  },

  broadcasting: async (pvpId) => {
    await bcasting(pvpId);
  }
};

const encounting = (pvpId) => {
  // encounting 3s
  var count = 3;
  const timeId = setInterval(() => {
    if (count != 0) { 
      pvpIO.in('battle_' + pvpId).emit('battle:counting', (count));
    } else {
      clearInterval(timeId);
      const delayTime = setTimeout(() => {
        startBattle(pvpId);
        clearTimeout(delayTime);
      }, 1000);
    }
    count --;
  }, 1000);
}

const startBattle = async (pvpId) => {
  let roundNumber = 0;
  
  // get basic infos
  const pvpGame = await PvpGameSchema
    .findOne({ code: pvpId })
    .populate('box_list')
    .populate('roll');
  const serverSeed = await SeedSchema.findById(pvpGame.roll.server_seed);
  const clientSeed = await SeedSchema.findById(pvpGame.roll.client_seed);
  const rounds = await PvpRoundSchema.find({ pvpId: pvpGame._id });
  const cNonce = pvpGame.roll.nonce;
  const jNonce = cNonce + rounds.length;
  const gamePlayers = await PvpGamePlayerSchema.findOne({ pvpId: pvpGame._id });
  const creator = await UserSchema.findOne({ code: gamePlayers.creator.get('code') });
  const joiner = await UserSchema.findOne({ code: gamePlayers.joiner.get('code') });

  const playersInfo = {
    creator: { id: creator._id, code: creator.code },
    joiner: { id: joiner._id, code: joiner.code}
  }

  roundNumber = await runningBattle(
    playersInfo, pvpGame, serverSeed, clientSeed, rounds, cNonce, jNonce, roundNumber);

  const timeId = setInterval(async () => {
    if (roundNumber < rounds.length) {
      roundNumber = await runningBattle(
        playersInfo, pvpGame, serverSeed, clientSeed, rounds, cNonce, jNonce, roundNumber);
    } else {
      // finish the battle
      finishBattle(pvpGame._id);
      clearInterval(timeId);
    }
  }, process.env.PVP_ROUND_TIME);
}

const runningBattle = async (playersInfo, pvpGame, serverSeed, clientSeed, rounds, cNonce, jNonce, roundNumber) => {
  // generate roll value - creator, joiner
  const creatorRoll = Util.Seed.getRoll(
    process.env.GAME_PVP, clientSeed.hash, serverSeed.value, cNonce + roundNumber
  );
  const joinerRoll = Util.Seed.getRoll(
    process.env.GAME_PVP, clientSeed.hash, serverSeed.value, jNonce + roundNumber
  );
  
  // store picked item each user per battle
  const creatorItem = await Util.getItemAndXP(pvpGame.box_list[roundNumber].code, creatorRoll);
  const joinerItem = await Util.getItemAndXP(pvpGame.box_list[roundNumber].code, joinerRoll);
  const round = rounds[roundNumber];
  await PvpRoundBetSchema.findByIdAndUpdate(round.creator_bet, {
    item: creatorItem.item._id,
    payout: creatorItem.item.value,
    rewarded_xp: creatorItem.xp
  });
  await PvpRoundBetSchema.findByIdAndUpdate(round.joiner_bet, {
    item: joinerItem.item._id,
    payout: joinerItem.item.value,
    rewarded_xp: joinerItem.xp
  });

  // create rollhis and log boxopening
  const creatorBoxOpen = await BoxOpenSchema.create({
    user: playersInfo.creator._id,
    box: round.box,
    item: creatorItem.item._id,
    pvp_code: pvpGame.code,
    user_item: null,
    cost: round.bet,
    profit: Number((round.bet - creatorItem.item.value).toFixed(2)),
    xp_rewarded: creatorItem.xp,
    roll_code: null,
    status: false
  });
  await BoxOpenSchema.findByIdAndUpdate(creatorBoxOpen._id, {
    code: Util.generateCode('boxopen', creatorBoxOpen._id)
  });

  const joinerBoxOpen = await BoxOpenSchema.create({
    user: playersInfo.joiner._id,
    box: round.box,
    item: joinerItem.item._id,
    pvp_code: pvpGame.code,
    user_item: null,
    cost: round.bet,
    profit: Number((round.bet - joinerItem.item.value).toFixed(2)),
    xp_rewarded: joinerItem.xp,
    roll_code: null,
    status: false
  });
  await BoxOpenSchema.findByIdAndUpdate(joinerBoxOpen._id, {
    code: Util.generateCode('boxopen', joinerBoxOpen._id)
  });
  
  // emit round roll values
  pvpIO.in('battle_' + pvpGame.code).emit('battle:picked', {
    roundNumber: roundNumber + 1,
    creatorRollValue: creatorRoll,
    joinerRollValue: joinerRoll
  });

  // increase round number
  roundNumber += 1;

  // update pvp game
  pvpGame.current_round = roundNumber;
  await pvpGame.save();

  // broadcast updated pvp game data
  await bcasting(pvpGame._id);
  return roundNumber;
}

const finishBattle = async(pvpId) => {
  const rounds = await PvpRoundSchema.find({ pvpId })
    .populate('box').populate('creator_bet').populate('joiner_bet');
  const pvpGame = await PvpGameSchema.findById(pvpId);

  // get picked items in battle
  let creatorResult = { sum: 0, items: [], xp: 0 };
  let joinerResult = { sum: 0, items: [], xp: 0 };

  rounds.forEach(round => {
    creatorResult.sum += round.creator_bet.payout;
    joinerResult.sum += round.joiner_bet.payout;
    creatorResult.items.push(round.creator_bet.item);
    joinerResult.items.push(round.joiner_bet.item);
    creatorResult.xp += round.creator_bet.rewarded_xp;
    joinerResult.xp += round.creator_bet.rewarded_xp;
  });

  // calc the sum to decide the winner
  let winner, loser;
  const gamePlayers = await PvpGamePlayerSchema.findOne({ pvpId });
  
  if (pvpGame.strategy == process.env.PVP_STRATEGY_MAX) {
    // strategy is highest sum
    if (creatorResult.sum > joinerResult.sum) {
      winner = gamePlayers.creator.get('code');
      loser = gamePlayers.joiner.get('code');
    } else if (joinerResult.sum > creatorResult.sum) {
      winner = gamePlayers.joiner.get('code');
      loser = gamePlayers.creator.get('code');
    }
  } else {
    // strategy is lowest sum
    if (creatorResult.sum > joinerResult.sum) {
      // creator's sum is greator than joiner's sum
      winner = gamePlayers.joiner.get('code');
      loser = gamePlayers.creator.get('code');
    } else if (creatorResult.sum < joinerResult.sum) {
      // creator's sum is less than joiner's sum
      winner = gamePlayers.creator.get('code');
      loser = gamePlayers.joiner.get('code');
    }
  }

  if (creatorResult.sum == joinerResult.sum) {
     if (Util.getRandomWinner()) {
        winner = gamePlayers.joiner.get('code');
        loser = gamePlayers.creator.get('code');
      } else {
        winner = gamePlayers.creator.get('code');
        loser = gamePlayers.joiner.get('code');
      }
  }

  // update usercarts and log box open
  const creator = await UserSchema.findOne({ code: gamePlayers.creator.get('code') });
  const joiner = await UserSchema.findOne({ code: gamePlayers.joiner.get('code') });

  for (var i = 0; i < creatorResult.items.length; i++) {
    // move all picked items to winner's cart
    let item = await ItemSchema.findById(creatorResult.items[i]);
    let userCart1 = await UserCartSchema.create({
      user_code: winner,
      item_code: item.code,
      status: true,
    });
    await UserCartSchema.findByIdAndUpdate(userCart1._id, {
      code: Util.generateCode('usercart', userCart1._id)
    });

    item = await ItemSchema.findById(joinerResult.items[i]);
    let userCart2 = await UserCartSchema.create({
      user_code: winner,
      item_code: item.code,
      status: true,
    });
    await UserCartSchema.findByIdAndUpdate(userCart2._id, {
      code: Util.generateCode('usercart', userCart2._id)
    });
  }

  // update the loser's xp
  let loserProgress = await UserProgressSchema.findOne({ user_code: loser });
  if (loser == gamePlayers.creator.get('code')) {
    loserProgress = Util.updateUserProgress(loserProgress, creatorResult.xp);
  } else {
    loserProgress = Util.updateUserProgress(loserProgress, joinerResult.xp);
  }
  await loserProgress.save();

  // update all boxe's popular
  rounds.forEach(async round => {
    let box = await BoxSchema.findById(round.box._id);
    box.popular += 1;
    await box.save();
  });

  // update pvpgame status and date
  pvpGame.winner = winner == gamePlayers.creator.get('code') ? creator._id : joiner._id;
  pvpGame.status = process.env.PVP_GAME_COMPLETED;
  pvpGame.finished_at = new Date();
  pvpGame.total_payout = Number((creatorResult.sum + joinerResult.sum).toFixed(2));
  await pvpGame.save();


  pvpIO.in('battle_' + pvpGame.code).emit('battle:finished', {
    ...pvpGame.toGameJSON(),
    winner
  });

  await bcasting(pvpId);
}

const bcasting = async (pvpId) => {
  // home page latest 4 battles
  console.log('Broadcasting called', pvpId);
  const battle = await PvpGameSchema.findById(pvpId);
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

  const data = {
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
  
  if (socketIO != undefined) {
    socketIO.emit('battle:updated', { data });
  }
}