const CoinGecko = require('coingecko-api');
const ExchangeRateSchema = require('../model/ExchangeRate');
  
module.exports = async () => {
  const timeId = setInterval(() => {
    setExchangeRate(timeId);
  }, Number(process.env.EXCHANGE_RATE_RECYCLE));
}

const setExchangeRate = async (timeId) => {
  console.log('called setExchangeRate!!!!')
  try {
    const coinGeckoClient = new CoinGecko();
    let data = await coinGeckoClient.exchanges.fetchTickers('bitfinex', {
      coin_ids: ['bitcoin', 'ethereum', 'ripple', 'litecoin']
    });

    var _coinList = {};
    var _datacc = data.data.tickers.filter(t => t.target == 'USD');

    ['BTC', 'ETH', 'XRP', 'LTC'].forEach(i => {
      var _temp = _datacc.filter(t => t.base == i);
      var _res = _temp.length == 0 ? [] : _temp[0];
      _coinList[i] = _res.last;
    });

    const dbData = await ExchangeRateSchema.find();
    if (dbData != null && dbData.length > 0) {
      ['BTC', 'ETH', 'XRP', 'LTC'].forEach(async coinType => {
        const rateItem = await ExchangeRateSchema.findOne({ coinType });
        if (rateItem != null) {
          rateItem.value = _coinList[coinType];
          await rateItem.save();
        } else {
          await ExchangeRateSchema.create({
            coinType,
            rateType: 'USD',
            value: _coinList[coinType]
          });
        }
      });
    } else {
      let rateData = [];
      Object.keys(_coinList).forEach(key => {
        rateData.push({
          coinType: key,
          rateType: 'USD',
          value: _coinList[key]
        });
      });
      console.log(rateData);
      await ExchangeRateSchema.insertMany(rateData);
    }  
  } catch (error) {
    console.log(error);
    clearInterval(timeId);
  } 
}