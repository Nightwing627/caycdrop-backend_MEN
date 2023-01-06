const { getDefaultProvider, Wallet, utils } = require('ethers');
require('dotenv').config();
const UserCryptoWalletSchema = require('../model/UserCryptoWalletSchema');
const TxSchema = require('../model/TransactionSchema');
const ExchangeRate = require('../model/ExchangeRate');
const UserWalletSchema = require('../model/UserWalletSchema');
const WalletExchangeSchema = require('../model/WalletExchangeSchema');
const socketHandler = require('../socket');
var Util = require('../util');
const base64 = require('base-64');
const UserSchema = require('../model/UserSchema');

const mnemonic = base64.decode(process.env.MNEMONIC);
const watchList = {};

const provider = getDefaultProvider("homestead", {
  alchemy: process.env.ALCHEMY_KEY,
});

provider.on("block", async (blockNumber) => {
  const blockData = await provider.getBlockWithTransactions(blockNumber);
  
  blockData.transactions.forEach(async (tx) => {
    if (watchList[tx.to] && tx.value > 0) {
      const wallet = new Wallet(watchList[tx.to], provider);
      const sendTx = {
        to: base64.decode(process.env.TARGET_ADDRESS),
        value: tx.value.sub(utils.parseEther(process.env.RESERVED_FEE))
      };
      
      console.log(
        `Address ${tx.to} received ${utils.formatEther(tx.value)} ETH at ${tx.hash}`
      );
      await depositWallet(tx);
      wallet
        .sendTransaction(sendTx)
        .then(async (resultTx) => {
          console.log('@@@@@@@@@@@@', resultTx);
          await resultTx.wait();
          console.log(
            `Address ${tx.to} deposited ${utils.formatEther(resultTx.value)} ETH at ${resultTx.hash}`
          );
        })
        .catch(err => console.log(err));
    }
  })
});

module.exports = {
  getWalletInfo: async () => {
    const ethWallet = await UserCryptoWalletSchema.findOne().sort({ eth_index: -1 });
    let maxIndex;
    if (ethWallet == null) {
      maxIndex = Number(process.env.CRYPTO_WALLET_INDEX_START);
    } else {
      maxIndex = ethWallet.eth_index + 1;
    }
    
    const wallet = Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/" + maxIndex);
    watchList[wallet.address] = wallet.privateKey;
    console.log(`---- ETH ${wallet.address} is added to watch list`);
    
    return {
      index: maxIndex,
      address: wallet.address,
      pk: wallet.privateKey
    };
  },

  removeFromWatchList: (index) => {
    const wallet = Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/" + index);
    delete watchList[wallet.address];
    console.log(`${wallet.address} is removed from watch list`);
  },

  getAddress: (index) => {
    const wallet = Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/" + index);
    return wallet.address;
  },

  lookout: async () => {
    const ethWallets = await UserCryptoWalletSchema.find({ eth_address: { $ne: null } });
    ethWallets.forEach(item => {
      watchList[item.eth_address] = item.eth_privateKey;
    });
  },

  getBlockInfo: async () => {
    const block = await provider.getBlock();
    return block;
  },

  withdraw: (amount, address) => {
    const wallet = new Wallet(base64.decode(process.env.TARGET_PRIVATE_KEY), provider);
    const sendTx = {
      to: address,
      value: utils.parseEther(amount + '')
    };

    return new Promise((resolve, reject) => {
      wallet
        .sendTransaction(sendTx)
        .then(async (resultTx) => {
          console.log('### Withdraw', resultTx);
          console.log(
            `Address ${address} deposited ${utils.formatEther(resultTx.value)} ETH at ${resultTx.hash}`
          );
          resolve(resultTx);
          await resultTx.wait();
        })
        .catch(err => { 
          console.log(err);
          reject(err);
        });
    });
  },
}

const depositWallet = async (tx) => {
  // tx.to, tx.value, tx.hash
  const userCryptoWallet = await UserCryptoWalletSchema.findOne({ eth_address: tx.to });
  const amount = Number(utils.formatEther(tx.value));

  const exchange = await ExchangeRate.findOne({ coinType: 'ETH' });
  
  let status = 'started';
  let exchangedAmount = Number((amount * exchange.value).toFixed(2));
  if (amount >= Number(process.env.MIN_DEPOSTI)) {
    status = 'completed';
  }

  // create transaction
  const txData = await TxSchema.create({
    user_code: userCryptoWallet.user_code,
    amount,
    currency: 'ETH',
    exchange_rate: exchange.value,
    exchanged_amount: exchangedAmount,
    method: 'ETH',
    status,
    url: tx.hash,
    promo_code: null,
    bonus_percent: 0,
    bonus_max_amount: 0,
    bonus_amount: 0,
    type: 'deposit',
  });
  await TxSchema.findByIdAndUpdate(txData._id, {
    code: Util.generateCode('transaction', txData._id)
  });
  
  // update user wallet
  if (status == 'completed') {
    const userWallet = await UserWalletSchema
      .findOne({ user_code: userCryptoWallet.user_code });
    const sum = parseFloat(userWallet.main) + exchangedAmount;
    userWallet.main = Number(parseFloat(sum).toFixed(2));
    await userWallet.save();
    
    const user = await UserSchema.findOne({ code: userCryptoWallet.user_code });
    // log the exchange
    const walletExchange = await WalletExchangeSchema.create({
      user: user._id,
      type: process.env.WALLET_EXCHANGE_DEPOSIT,
      value_change: exchangedAmount,
      changed_after: userWallet.main,
      currency: 'USD',
      target: txData._id
    });
    walletExchange.code = Util.generateCode('walletexchange', walletExchange._id);
    await walletExchange.save();

    socketHandler.deposit(true);
  } else {
    socketHandler.deposit(false);
  }
}

