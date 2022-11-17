const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserSchema = require('../model/UserSchema');
const BoxSchema = require('../model/BoxSchema');
const UserSeedSchema = require('../model/UserSeedSchema');
const Util = require('../util');
const RollHistorySchema = require('../model/RollHistorySchema');
const UserProgressSchema = require('../model/UserProgressSchema');
const SeedSchema = require('../model/SeedSchema');
const BoxOpenSchema = require('../model/BoxOpenSchema');
const UserWalletSchema = require('../model/UserWalletSchema');
const WalletExchangeSchema = require('../model/WalletExchangeSchema');

module.exports = (io, socket) => {
  socket.on('box.open', async (payload, callback) => {
    try {
      if (typeof callback !== "function") {
        console.log('callback is not a function');
        socket.emit('box.open.fail', {
          error: 'callback error'
        });
        
        return socket.disconnect();
      }
      
      const { usercode, token, boxcode, time } = payload;
      if (!(usercode && token && boxcode && time)) {
        return callback({
          error: 'params must be filled'
        })
      }

      // verify user
      const userData = jwt.verify(token, process.env.TOKEN_KEY);
      if (!usercode == userData.userCode) {
        return callback({
          error: 'wrong token'
        });
      }

      // Get user and box information
      const user = await UserSchema.findOne({ code: usercode });
      const userWallet = await UserWalletSchema.findById(user.wallets);
      const userProgress = await UserProgressSchema.findById(user.user_progress);
      const box = await BoxSchema.findOne({ code: boxcode });

      // compare box budget and user wallet
      if (userWallet.main < box.original_price) {
        return callback({ error: 'tight wallet' });
      }

      // Get user client and server seed
      const userSeed = await UserSeedSchema
        .findOne({ userId: user._id })
        .populate('client_seed')
        .populate('server_seed');

      let clientHash, serverValue;
      if (userSeed.client_seed != null && userSeed.server_seed != null) {
        clientHash = userSeed.client_seed.hash;
        serverValue = userSeed.server_seed.value;
      } else {
        clientHash = Util.getHashValue('client');
        serverValue = Util.getHashValue('server');
        updateUserSeed(userSeed, clientHash, serverValue);
      }

      // Get user nonce and update it when this is first experience
      let nonce;
      if (userProgress.bet_count) { 
        nonce = userProgress.bet_count + 1;
      } else {
        nonce = 1;
        userProgress.bet_count = nonce;
        await userProgress.save();
      }

      // Generate roll value
      const rollValue = Util.Seed.getRoll(
        process.env.COMBINE_SEED_BOX,
        clientHash,
        serverValue,
        nonce
      );

      /// *** Log all informations RollHistory, BoxOpen, Box statistic, WalletExchange
      // Roll History
      const rollHis = new RollHistorySchema({
        value: rollValue,
        nonce,
        game: 'BOX',
        server_seed: userSeed.server_seed,
        client_seed: userSeed.client_seed
      });
      await rollHis.save();
      await RollHistorySchema.findByIdAndUpdate(rollHis._id, {
        code: Util.generateCode('rollhistory', rollHis._id)
      });

      // Box Opening History
      const boxOpen = new BoxOpenSchema({
        user: user._id,
        box: box._id,
        item: null,
        pvp_code: null,
        user_item: null,
        cost: box.original_price,
        profit: null,
        xp_rewarded: null,
        roll_code: rollHis.code
      });
      await boxOpen.save();
      await BoxOpenSchema.findByIdAndUpdate(boxOpen._id, {
        code: Util.generateCode('boxopen', boxOpen._id)
      });

      // Wallet Exchange History
      const walletExchange = new WalletExchangeSchema({
        user: user._id,
        type: process.env.WALLET_EXCHANGE_BOX,
        value_change: box.original_price,
        changed_after: userWallet.main - box.original_price,
        wallet: userWallet._id,
        currency: 'USD',
        target: box._id
      });
      await walletExchange.save();
      await WalletExchangeSchema.findByIdAndUpdate(walletExchange._id, {
        code: Util.generateCode('wallexchange', walletExchange._id)
      });

      box.opened += 1;
      await box.save();
      userProgress.bet_count += 1;
      await userProgress.save();
      
      // Change User Wallet
      await UserWalletSchema.findByIdAndUpdate(userWallet._id, {
        main: userWallet.main - box.original_price
      });

      callback({ result: 'ok', data: { rollValue } });  
    } catch (error) {
      console.log(error);
      if (error.message == 'jwt expired')
        callback({ error: 'token expired' });
      else 
        callback({ error: error.message })
    }

  });
}

// Insert seed info to Seed, and update User seed
const updateUserSeed = async (userSeed, clientValue, serverValue) => { 
  const clientSeed = new SeedSchema({
    type: process.env.SEED_TYPE_CLIENT,
    future: false,
    value: '',
    hash: clientValue
  });
  await clientSeed.save();
  await SeedSchema.findByIdAndUpdate(clientSeed._id,
    { code: Util.generateCode('seed', clientSeed._id) });
  
  const serverSeed = new SeedSchema({
    type: process.env.SEED_TYPE_SERVER,
    future: false,
    value: serverValue,
    hash: crypto.createHash('sha3-256').update(serverValue).digest('hex')
  });
  await serverSeed.save();
  await SeedSchema.findByIdAndUpdate(serverSeed._id,
    { code: Util.generateCode('seed', serverSeed._id) });
  
  userSeed.client_seed = clientSeed._id;
  userSeed.server_seed = serverSeed._id;

  await userSeed.save();
}