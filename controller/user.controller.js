const UserSchema = require('../model/UserSchema');
const AccountSchema = require('../model/AccountSchema');
const UserCartSchema = require('../model/UserCartSchema');
const UserDocumentSchema = require('../model/UserDocumentSchema');
const UserProgressSchema = require('../model/UserProgressSchema');
const UserSeedSchema = require('../model/UserSeedSchema');
const UserShippingInfoSchema = require('../model/UserShippingInfoSchema');
const UserTagSchema = require('../model/UserTagSchema');
const UserWalletSchema = require('../model/UserWalletSchema');
const CountrySchema = require('../model/CountrySchema');
const Util = require('../util');
const UserCryptoWalletSchema = require('../model/UserCryptoWalletSchema');
const Wallet = require('../walletManage');
const ExchangeRateSchema = require('../model/ExchangeRate');
const UserVerifySchema = require('../model/UserVerifySchema');
const BoxOpenSchema = require('../model/BoxOpenSchema');
const WalletExchangeSchema = require('../model/WalletExchangeSchema');
const BoxSchema = require('../model/BoxSchema');
const ItemSchema = require('../model/ItemSchema');

const UserController = {
  getUserSeed: async (req, res) => {
    let data;
    const userCode = req.params.code;

    const user = await UserSchema.findOne({ code: userCode });
    const seeds = await UserSeedSchema
      .findOne({ userId: user._id })
      .populate('client_seed', '-_id -__v')
      .populate('old_client_seed', '-_id -__v')
      .populate('server_seed', '-_id -__v')
      .populate('next_server_seed', '-_id -__v')
      .populate('old_server_seed', '-_id -__v')
      .exec();
    
    res.status(200).json({ data });
  },

  getCurrentUser: async (req, res) => {
    const { userCode } = req.body;
    
    try {
      const user = await Util.getUserByCode(userCode);
      
      if (user == null) {
        return res.status(400).json({ error: "user not found" });  
      }
      res.status(200).json({ data: user });
    } catch (error) {
      res.status(400).json({ error: "user not found" });
    }
  },

  changeUserBasic: async (req, res) => { 
    const { userCode, username, email } = req.body;

    try {
      if (!(username && email)) {
        return res.status(400).json({ error: "please send the user information" });
      }

      const user = await UserSchema.findOne({ code: userCode });
      if (user == null) {
        return res.status(400).json({ error: "user not found" });
      }
      const account = await AccountSchema.findOne({ user_code: userCode });
      account.username = username;
      await account.save();

      if (email != user.email) {
        const userVerify = await UserVerifySchema.create({
          user_code: userCode,
          token: Util.getRandomToken()
        });

        Util.sendEmail('emailChange', { userCode, token: userVerify.token });
      }

      res.status(200).json({ result: 'success', data: await Util.getUserByCode(userCode) });
    } catch (error) {
      res.status(400).json({ error: "user not found" })
    }
  },

  changeUserShipping: async (req, res) => {
    const { userCode, firstName, lastName, address1, address2,
      zipCode, state, city, country, phone } = req.body;

    if (!(firstName && lastName && address1 && zipCode && state && city && country && phone)) {
      return res.status(400).json({ error: "Please input all informations" });
    }

    try {
      const user = await UserSchema.findOne({ code: userCode });
      const shippingInfo = await UserShippingInfoSchema.findOne({ user_code: userCode });

      if (user == null || shippingInfo == null) {
        return res.status(400).json({ error: "wrong parameter" });
      }
      const countryItem = await CountrySchema.findOne({ code: country });

      shippingInfo.first_name = firstName;
      shippingInfo.last_name = lastName;
      shippingInfo.address = address1;
      shippingInfo.address2 = shippingInfo.address2 || address2;
      shippingInfo.zipcode = zipCode;
      shippingInfo.state = state;
      shippingInfo.city = city;
      shippingInfo.country = countryItem.id;
      shippingInfo.phone = phone;
      // shippingInfo.birthday =

      await shippingInfo.save();

      res.status(200).json({ result: 'success', data: await Util.getUserByCode(userCode) });
    } catch (error) {
      return res.status(400).json({ error: "wrong parameter" });
    }
  },

  getAllCountries: async (req, res) => {
    return res.status(200).json({ data: await CountrySchema.find() })
  },

  getUserCart: async (req, res) => {
    const { userCode } = req.body;

    try {
      const user = await UserSchema.findOne({ code: userCode });

      if (user == null) {
        return res.status(400).json({ error: "user not found" });
      }
      const userCarts = await UserCartSchema.aggregate([
        {
          $match: { user_code: userCode }
        },
        {
          $lookup: {
            from: 'items',
            localField: 'item_code',
            foreignField: 'code',
            pipeline: [
              {
                $project: { _id: 0, __v: 0, created_at: 0, updated_at: 0, category: 0 }
              }
            ],
            as: 'item'
          }
        },
        {
          $unwind: "$item"
        },
        {
          $project: { _id: 0, user_code: 1, item: 1, }
        },
        {
          $sort: { "item.value": 1 }
        }
      ]);
      
      res.status(200).json({ data: userCarts });
    } catch (error) {
      res.status(400).json({ error: "cart item not found" });
    } 
  },

  getUserCryptoWallet: async (req, res) => {
    const { userCode } = req.body;
    const data = await UserCryptoWalletSchema.findOne({ user_code: userCode });
    const rates = await ExchangeRateSchema.find();

    let txLimit = [];
    const depositMin = Number(process.env.DEPOSIT_MIN);
    const withrawMin = Number(process.env.WITHRAW_MIN);
    rates.forEach(rate => {

      var _dMin = Number((depositMin / rate.value).toFixed(4));
      var _wMin = Number((withrawMin / rate.value).toFixed(4));
      txLimit.push({ coin: rate.coinType, depositMin: _dMin, withrawMin: _wMin });
    });
    if (data == null)
      res.status(400).json({ error: 'wrong user code' });
    else
      res.status(200).json({ data: { ...data.toGetJSON(), txLimit } });
  },

  withrawItem: async (req, res) => {
    const { userCode, items, method, address } = req.body;

    // verify user info
    const user = await UserSchema.findOne({ code: userCode });
    if (user == null)
      return res.status(400).json({ error: 'wrong user info ' });
    
    // validate items
    if (!Array.isArray(items))
      return res.status(400).json({ error: 'wrong items formart' });
    if (items.length == 0)
      return res.status(200).json({ error: 'no item data' });

    // match the user info and items
    const cart = await UserCartSchema.find({ user_code: userCode });
    if (cart == null)
      return res.status(200).json({ error: 'no user cart data' });
    
    // get user cart items and calc the total amount
    const userCarts = await UserCartSchema.aggregate([
      {
        $match: { code: { $in: items }, user_code: userCode }
      },
      {
        $lookup: {
          from: 'items',
          localField: 'item_code',
          foreignField: 'code',
          as: 'item'
        }
      },
      { $unwind: { path: "$item" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$item.value" }
        }
      }
    ]).exec();
    console.log(userCarts[0]);
    // get exchange rate and calc the coin value
    const rate = await ExchangeRateSchema.findOne({ coinType: method });
    if (rate == null)
      return res.status(400).json({ error: `${method} is not supported` });
    
    if (userCarts[0].total < Number(process.env.WITHRAW_MIN))
      return res.status(400).json({ error: 'Withraw amount must be greater than Minimum' });
    
    const withrawAmount = Number((userCarts[0].total / rate.value).toFixed(4));  
  
    // withraw amount
    Wallet.withraw(withrawAmount, address, method)
      .then(async response => {
        console.log('Wallet Withraw Result:', response);
        if (response && response.hash) { 
          // success withraw & remove item user cart
          await UserCartSchema.deleteMany({ code: { $in: items }, user_code: userCode });
          return res.status(200).json({ result: 'success' });
        } else {
          // fail withraw
          return res.status(400).json({ error: 'transaction failed' });
        }
      })
      .catch(error => {
        console.log('Wallet Withraw Error:', error);
        res.status(400).json({ error });
      });
  },

  getStatistic: async (req, res) => {
    const { userCode } = req.body;
    const { code } = req.params;

    try {
      let user;
      if (userCode != code) {
        user = await UserSchema.findOne({ code }).populate('account');
        if (user.account.is_hide_stats) {
          return res.status(200).json({ data: null });
        }
      } else {
        user = await UserSchema.findOne({ code: userCode }).populate('account');
      }
      
      if (user == null) {
        res.status(400).json({ error: 'user not found'});
      }
      
      // get total unboxed value
      const unboxedData = await BoxOpenSchema.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: null,
            totalValue: { $sum: "$cost" }
        }}
      ]);
      let unboxedValue = 0;
      if (unboxedData.length > 0) {
        unboxedValue = unboxedData[0].totalValue;
      }

      // get most favorite box - best opened
      const favoriteBoxInfo = await BoxOpenSchema.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: "$box",
            totalCount: { $sum: 1 }
          }
        },
        { $sort: { "totalCount": -1 } },
        { $limit: 1 }
      ]);
      let favoBox = null;
      if (favoriteBoxInfo.length > 0) {
        favoBox = await BoxSchema.findById(favoriteBoxInfo[0]._id);
        favoBox = favoBox.toGetOneJSON();
        favoBox.openTimes = favoriteBoxInfo[0].totalCount;
        delete favoBox.tags;
      }

      // get best unboxied item
      const itemId = await BoxOpenSchema.aggregate([
        { $match: { user: user._id } },
        {
          $lookup: {
            from: 'items',
            localField: 'item',
            foreignField: '_id',
            as: 'item'
          }
        },
        { $unwind: { path: "$item" } },
        { $sort: { "item.value": -1 } },
        { $limit: 1 }
      ]);
      
      let bestItem = null
      if (itemId.length > 0) {
        const box = await BoxSchema.findById(itemId[0].box);
        bestItem = {
          box: box.code,
          item: {
            code: itemId[0].item.code,
            name: itemId[0].item.name,
            iconUrl: itemId[0].item.icon_url,
            value: itemId[0].item.value,
            rarity: itemId[0].item.rarity
          }
        }
      }

      // get total items exchanged
      const totalExchangedData = await WalletExchangeSchema.aggregate([
        { $match: { user: user._id, type: process.env.WALLET_EXCHANGE_ITEM } },
        {
          $group: {
            _id: null,
            totalValue: { $sum: '$value_change' }
          }
        }
      ]);
      let totalExchanged = 0;
      if (totalExchangedData.length > 0) {
        totalExchanged = totalExchangedData[0].totalValue;
      }


      // get luckiest box - max total picked / open times
      const luckiestBox = await BoxOpenSchema.aggregate([
        { $match: { user: user._id } },
        {
          $lookup: {
            from: 'items',
            localField: 'item',
            foreignField: '_id',
            as: 'item'
          }
        },
        { $unwind: { path: "$item" } },
        {
          $group: {
            _id: "$box",
            totalSum: { $sum: "$item.value" },
            totalCount: { $sum: 1 }
        
          }
        },
        { $sort: { "totalCount": -1 } },
        { $set: { luckBox: { $divide: ["$totalSum", "$totalCount"] } } },
        { $sort: { "luckBox": -1 } },
        { $limit: 1 }
      ]);
      let luckBox = null;
      if (luckiestBox.length > 0) {
        luckBox = await BoxSchema.findById(luckiestBox[0]._id);
        luckBox = luckBox.toGetOneJSON();
        luckBox.openTimes = luckiestBox[0].totalCount;
        delete luckBox.tags;
      }

      res.status(200).json({
        data: {
          totalUnboxedValue: unboxedValue,
          mostFavoriteBox: favoBox,
          bestUnboxedItem: bestItem,
          totalItemExchanged: totalExchanged,
          luckiestBox: luckBox
      }})

    } catch (error) {
      console.log('User get statistic: ', error);
      res.status(400).json({ error: 'user not found'});
    }
  }
};


module.exports = UserController;