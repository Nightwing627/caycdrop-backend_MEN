// TODO: bitcoin web3 integration

module.exports = {
  getWalletInfo: async () => {
    return {
      index: null,
      address: null,
      pk: null
    };
  },

  withdraw: async (amount, address) => {
    console.log('BTC withdraw')
  }
}