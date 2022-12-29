const UserCryptoWalletSchema = require('../model/UserCryptoWalletSchema');
const etherWallet = require('./ether');
const btcWallet = require('./bitcoin');
const bchWallet = require('./bitcoincash');
const ltcWallet = require('./litecoin');

module.exports = {
  walletCreate: async (userCode) => {
    // create eth wallet
    const ethData = await etherWallet.getWalletInfo();
    // create btc wallet
    const btcData = await btcWallet.getWalletInfo();
    // create bch wallet
    const bchData = await bchWallet.getWalletInfo();
    // create ltc wallet
    const ltcData = await ltcWallet.getWalletInfo();

    await UserCryptoWalletSchema.create({
      user_code: userCode,
      eth_address: ethData.address,
      eth_privateKey: ethData.pk,
      eth_index: ethData.index,
      eth_status: true,

      btc_address: btcData.address,
      btc_privateKey: btcData.pk,
      btc_index: btcData.index,
      btc_status: true,

      bch_address: bchData.address,
      bch_privateKey: bchData.pk,
      bch_index: bchData.index,
      bch_status: true,

      ltc_address: ltcData.address,
      ltc_privateKey: ltcData.pk,
      ltc_index: ltcData.index,
      ltc_status: true
    });
  },

  lookOut: async () => {
    await etherWallet.lookout();
  },

  getBlockInfo: async () => {
    return await etherWallet.getBlockInfo();
  },

  withdraw: async (amount, address, method) => {
    if (method == 'ETH')
      return etherWallet.withdraw(amount, address);
    if (method == 'BTC')
      return await btcWallet.withdraw(amount, address);
    if (method == 'LTC')
      return await ltcWallet.withdraw(amount, address);
    if (method == 'BCH')
      return await bchWallet.withdraw(amount, address);
  },

  generateWallet: async (method) => {
    if (method == 'ETH')
      return await etherWallet.getWalletInfo();
    if (method == 'BTC')
      return await btcWallet.getWalletInfo();
    if (method == 'LTC')
      return await ltcWallet.getWalletInfo();
    if (method == 'BCH')
      return await bchWallet.getWalletInfo();
  }
}