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
const UserCartSchema = require('../model/UserCartSchema');
const BoxItemSchema = require('../model/BoxItemSchema');

module.exports = (io, socket) => {
  socket.on('box.open', async (payload, callback) => {
    console.log(io);
    try {
      if (typeof callback !== "function") {
        socket.emit('box.open.fail', { error: 'Callback error' });
        return socket.disconnect();
      }
      // Validate params and user info
      const { usercode, token, boxcode, time } = payload;
      if (!(usercode && token && boxcode && time)) {
        return callback({ error: 'Params must be filled' });
      }
      // verify user
      const userData = jwt.verify(token, process.env.TOKEN_KEY);
      if (!usercode == userData.userCode) {
        return callback({ error: 'Wrong token' });
      }

      // Get basic information - User, UserWallet, UserProgress, Box
      const user = await UserSchema.findOne({ code: usercode });
      const userWallet = await UserWalletSchema.findById(user.wallets);
      let userProgress = await UserProgressSchema.findById(user.user_progress);
      const box = await BoxSchema.findOne({ code: boxcode });

      // Compare box budget and user wallet
      if (userWallet.main < box.original_price) {
        return callback({ error: 'Tight wallet' });
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
        clientHash = Util.getHashValue('client_' + Date.now());
        serverValue = Util.getHashValue('server_' + Date.now());
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
        process.env.GAME_BOX,
        clientHash,
        serverValue,
        Util.getNonce(nonce)
      );
      
      /// *** Log all informations RollHistory, BoxOpen, Box statistic, WalletExchange
      const itemData = await Util.getItemAndXP(box.code, rollValue);
      // Roll History
      const rollHis = await RollHistorySchema.create({
        value: rollValue,
        nonce,
        game: process.env.GAME_BOX,
        server_seed: userSeed.server_seed,
        client_seed: userSeed.client_seed
      });
      rollHis.code = Util.generateCode('rollhistory', rollHis._id);
      await rollHis.save();
      
      // Default Add to User Cart
      const userCart = await UserCartSchema.create({
        user_code: user.code,
        item_code: itemData.item.code,
        status: true
      });
      userCart.code = Util.generateCode('usercart', userCart._id);
      await userCart.save();

      // Box Opening History
      let boxOpen = await BoxOpenSchema.create({
        user: user._id,
        box: box._id,
        item: itemData.item._id,
        pvp_code: null,
        user_item: userCart._id,
        cost: box.original_price,
        profit: Number(itemData.profit.toFixed(2)),
        xp_rewarded: Number(itemData.xp.toFixed(2)),
        roll_code: rollHis.code,
        status: true
      });
      boxOpen.code = Util.generateCode('boxopen', boxOpen._id);
      await boxOpen.save();

      // Wallet Exchange History
      const walletExchange = await WalletExchangeSchema.create({
        user: user._id,
        type: process.env.WALLET_EXCHANGE_BOX,
        value_change: box.original_price,
        changed_after: userWallet.main - box.original_price,
        wallet: userWallet._id,
        currency: 'USD',
        target: box._id
      });
      walletExchange.code = Util.generateCode('walletexchange', walletExchange._id);
      await walletExchange.save();

      box.opened += 1;
      await box.save();

      // update user progress
      userProgress.bet_count += 1;
      if (itemData.xp) { 
        userProgress = Util.updateUserProgress(userProgress, itemData.xp);
      }
      await userProgress.save();
      
      // Change User Wallet
      await UserWalletSchema.findByIdAndUpdate(userWallet._id, {
        main: userWallet.main - box.original_price
      });

      boxOpen = await BoxOpenSchema.findById(boxOpen._id);
      callback({ result: 'ok', data: { rollValue, BOL: boxOpen.code } });
    } catch (error) {
      console.log(error);
      if (error.message == 'jwt expired')
        callback({ error: 'Token is expired' });
      else 
        callback({ error: error.message })
    }
  });

  socket.on('box.open.picked', async (payload, callback) => {
    if (typeof callback !== "function") {
      socket.emit('box.open.fail', { error: 'Callback error' });
      return socket.disconnect();
    }
    // Validate params and user info
    const { usercode, token, bol, method, time } = payload;
    if (!(usercode && token && bol && method && time)) {
      return callback({ error: 'Params must be filled' });
    }
    // verify user
    const userData = jwt.verify(token, process.env.TOKEN_KEY);
    if (!usercode == userData.userCode) {
      return callback({ error: 'Wrong token' });
    }

    const boxOpen = await BoxOpenSchema
      .findOne({ code: bol })
      .populate('user');
    
    if (!boxOpen.status) {
      return callback({ error: 'This action already processed' });
    }
    
    if (boxOpen == null) {
      return callback({ error: 'This is fake data' });
    } else if (boxOpen.user.code !== usercode) {
      return callback({ error: 'User not match' });
    }

    const userWallet = await UserWalletSchema.findOne({ user_code: usercode });
    if (method == process.env.UNBOX_ITEM_SELL) {
      // Change user wallet ammont
      userWallet.main += Number(boxOpen.cost - boxOpen.profit);
      await userWallet.save();

      // Log the exchange
      const walletExchange = await WalletExchangeSchema.create({
        user: boxOpen.user._id,
        type: process.env.WALLET_EXCHANGE_ITEM,
        value_change: Number(boxOpen.cost - boxOpen.profit),
        changed_after: userWallet.main,
        wallet: userWallet._id,
        currency: 'USD',
        target: boxOpen.item._id
      });
      walletExchange.code = Util.generateCode('walletexchange', walletExchange._id);
      await walletExchange.save();

      // Remove the user cart item
      await UserCartSchema.findByIdAndDelete(boxOpen.user_item);

      // Modify the BoxOpen's user_item
      boxOpen.status = false;
      boxOpen.user_item = null;
      await boxOpen.save();

      callback({ result: 'success' });
    } else if (method == process.env.UNBOX_ITEM_TO_CART) {
      boxOpen.status = false;
      await boxOpen.save();
      callback({ result: 'success' });
    }
  });
}
