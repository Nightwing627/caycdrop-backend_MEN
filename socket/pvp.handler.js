const BoxSchema = require('../model/BoxSchema');
const BoxItemSchema = require('../model/BoxItemSchema');
const PvpGameSchema = require('../model/PvpGameSchema');
const Util = require('../util');
const UserSchema = require('../model/UserSchema');
const PvpGamePlayerSchema = require('../model/PvpGamePlayerSchema');
const SeedSchema = require('../model/SeedSchema');
const WalletExchangeSchema = require('../model/WalletExchangeSchema');
const UserWalletSchema = require('../model/UserWalletSchema');
const PvpRoundSchema = require('../model/PvpRoundSchema');
const PvpRoundBetSchema = require('../model/PvpRoundBetSchema');

var pvpIO;
let battles = {};

module.exports = (io, pvpSocket) => {
  pvpIO = io.of('/pvp');
  // TODO: set the socket middleware to verify the user status with token
  
  // user observe the battle
  pvpSocket.on('battle:joined', async (payload, callback) => {
    const { pvpId } = payload;
    const pvpGame = await PvpGameSchema.findOne({ code: pvpId });
    if (pvpGame == null) {
      return callback({ error: 'wrong battle id' });
    }
    let battleName = 'battle_' + pvpId;
    pvpSocket.join(battleName);
   
    const roomUsers = await pvpIO.in(battleName).allSockets();
    let liveUsers = [];
    roomUsers.forEach(rsId => liveUsers.push(rsId));
    battles[battleName] = liveUsers;

    // sendBattleData(pvpSocket, pvpId, battleName);
    callback({ result: 'joined' });
  });

  // user took part in battle as player
  pvpSocket.on('battle:betted', async (payload, callback) => {
    const { pvpId, userCode } = payload;

    if (!(pvpId && userCode))
      return callback({ error: 'wrong params' });

    const pvpGame = await PvpGameSchema.findOne({ code: pvpId }).populate('box_list');
    // check battle exist
    if (pvpGame == null)
      return callback({ error: 'wrong battle id' });
    // check the battle status
    if (pvpGame.status != process.env.PVP_GAME_CREATED)
      return callback({ error: 'this battle already finished' });
     
    const joiner = await UserSchema.findOne({ code: userCode })
      .populate('wallets').populate('account').populate('user_progress');
    // check user exist       
    if (joiner == null)
      return callback({ error: 'wrong user info' });
    
    // check user data with creator
    const player = await PvpGamePlayerSchema.findOne({ pvpId: pvpGame._id });
    if (player.creator && player.creator.code == userCode)
      return callback({ error: 'user info is same with opponent' });
    // check user wallet
    if (joiner.wallets.main < pvpGame.total_bet)
      return callback({ error: 'too tight budget' });
    
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

    pvpIO.in('battle_' + pvpId).emit('started');

    // encounting 3s
    var count = 0;
    const timeId = setInterval(() => {
      if (count != 3)
        pvpIO.in('battle_' + pvpId).emit('battle:counting', (count + 1));
      else
        clearInterval(timeId);
      count ++;
    }, 1000);
  });

  pvpSocket.conn.on("close", (reason) => {
    // called when the underlying connection is closed
    console.log(`${pvpSocket.id} is closed, reason is ${reason}`);
  });

  pvpSocket.on('disconnect', (data) => {
    console.log('PVP socket disconnected')
  });
};

const sendBattleData = async (pvpSocket, pvpId, battle) => {
  console.log('called sendbattledata function')
  const pvpGame = await PvpGameSchema.findOne({ code: pvpId });
  const boxList = await BoxSchema.find(
    { _id: { $in: pvpGame.box_list } }
  );
  
  let boxData = [];
  
  for (var i = 0; i < boxList.length; i ++) {
    const item = boxList[i];

    let boxItems = await BoxItemSchema.aggregate([
      { $match: { box_code: item.code } },
      {
        $project: {
          _id: 0, __v: 0, created_at: 0, updated_at: 0
        }
      },
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
      }
    ]);
    boxItems = Util.setBoxItemRolls(boxItems);
    boxData.push({ ...item.toGetOneJSON(), slots: boxItems })
  }
  
  pvpSocket.emit('battle:data', boxData);
}