// TODO: bitcoin cash web3 integration

module.exports = {
  getWalletInfo: async () => {
    return {
      index: null,
      address: null,
      pk: null
    };
  },

  withraw: async (amount, address) => {
    console.log('BCH withraw')
  }
}